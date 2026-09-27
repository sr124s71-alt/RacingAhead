using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using SportSeek.Identity.Api.Data;

namespace SportSeek.Identity.Api.Domain;

public class OtpOptions
{
    public int Length { get; set; } = 6;
    public int TtlMinutes { get; set; } = 5;
    public int MaxAttemptsPerChallenge { get; set; } = 5;
    public int MaxFailuresPerIdentifier { get; set; } = 5;
    public int LockoutMinutes { get; set; } = 15;
    public int MaxRequestsPerIdentifierPerWindow { get; set; } = 5;
    public int RequestWindowMinutes { get; set; } = 15;
}

public enum OtpError { None, RateLimited, LockedOut, NotFound, Expired, WrongCode, TooManyAttempts }

public sealed record OtpVerification(OtpError Error, NormalisedIdentifier? Identifier = null, int AttemptsLeft = 0, DateTimeOffset? LockedUntil = null)
{
    public bool Ok => Error == OtpError.None;
}

/// <summary>
/// OTP issue and check. Codes are stored only as a salted hash, expire quickly, and are capped per
/// challenge and per identifier (with lockout) to resist brute force and SMS pumping (TA §6.1).
/// </summary>
public class OtpService(IdentityDb db, AuditLog audit, DevOtpInbox inbox, IConfiguration config,
    IHostEnvironment env, ILogger<OtpService> log)
{
    private readonly OtpOptions _o = config.GetSection("Otp").Get<OtpOptions>() ?? new OtpOptions();

    public async Task<(OtpChallenge? Challenge, OtpError Error, DateTimeOffset? LockedUntil)> RequestAsync(
        AppClient client, NormalisedIdentifier id, string? ip)
    {
        var now = DateTimeOffset.UtcNow;

        var lockout = await db.OtpLockouts.FindAsync(id.Value);
        if (lockout?.LockedUntil > now) return (null, OtpError.LockedOut, lockout.LockedUntil);

        var windowStart = now.AddMinutes(-_o.RequestWindowMinutes);
        var recent = await db.OtpChallenges.CountAsync(c => c.Destination == id.Value && c.CreatedAt > windowStart);
        if (recent >= _o.MaxRequestsPerIdentifierPerWindow) return (null, OtpError.RateLimited, null);

        var code = RandomNumberGenerator.GetInt32(0, (int)Math.Pow(10, _o.Length)).ToString().PadLeft(_o.Length, '0');
        var challenge = new OtpChallenge
        {
            Client = client.ClientId,
            Channel = id.Type,
            Destination = id.Value,
            ExpiresAt = now.AddMinutes(_o.TtlMinutes),
            RequestIp = ip,
        };
        challenge.CodeHash = Hash(challenge.Id, code);
        db.OtpChallenges.Add(challenge);
        audit.Add(AuditActions.OtpRequested, client: client.ClientId, detail: new { channel = id.Type, to = id.Masked });
        await db.SaveChangesAsync();

        if (env.IsDevelopment())
        {
            var text = $"{code} is your SportSeek verification code for {client.DisplayName}. It expires in {_o.TtlMinutes} min. Do not share it.";
            inbox.Add(new DevOtpMessage(now, id.Type, id.Value, client.ClientId, code, text));
            log.LogInformation("[DEV {Channel}] to {To}: {Text}", id.Type.ToUpperInvariant(), id.Value, text);
        }

        return (challenge, OtpError.None, null);
    }

    /// <summary>Checks the code and consumes the challenge on success. Changes are saved before returning.</summary>
    public async Task<OtpVerification> VerifyAsync(Guid challengeId, string? code, string clientId)
    {
        var now = DateTimeOffset.UtcNow;
        var challenge = await db.OtpChallenges.FirstOrDefaultAsync(c => c.Id == challengeId && c.Client == clientId);
        if (challenge is null || challenge.ConsumedAt is not null) return new(OtpError.NotFound);

        var lockout = await db.OtpLockouts.FindAsync(challenge.Destination);
        if (lockout?.LockedUntil > now) return new(OtpError.LockedOut, LockedUntil: lockout.LockedUntil);
        if (challenge.ExpiresAt < now) return new(OtpError.Expired);

        var id = new NormalisedIdentifier(challenge.Channel, challenge.Destination);
        var expected = Convert.FromHexString(challenge.CodeHash);
        var actual = Convert.FromHexString(Hash(challenge.Id, code ?? ""));
        if (CryptographicOperations.FixedTimeEquals(expected, actual))
        {
            challenge.ConsumedAt = now;
            if (lockout is not null) db.OtpLockouts.Remove(lockout);
            await db.SaveChangesAsync();
            return new(OtpError.None, id);
        }

        challenge.Attempts++;
        if (lockout is null)
        {
            lockout = new OtpLockout { Destination = challenge.Destination, WindowStart = now };
            db.OtpLockouts.Add(lockout);
        }
        if (lockout.WindowStart < now.AddMinutes(-_o.LockoutMinutes))
        {
            lockout.WindowStart = now;
            lockout.FailedCount = 0;
        }
        lockout.FailedCount++;

        audit.Add(AuditActions.OtpFailed, client: clientId, detail: new { to = id.Masked, attempt = challenge.Attempts });

        if (lockout.FailedCount >= _o.MaxFailuresPerIdentifier)
        {
            lockout.LockedUntil = now.AddMinutes(_o.LockoutMinutes);
            challenge.ConsumedAt = now;
            audit.Add(AuditActions.OtpLockout, client: clientId, detail: new { to = id.Masked, until = lockout.LockedUntil });
            await db.SaveChangesAsync();
            return new(OtpError.LockedOut, id, LockedUntil: lockout.LockedUntil);
        }
        if (challenge.Attempts >= _o.MaxAttemptsPerChallenge)
        {
            challenge.ConsumedAt = now;
            await db.SaveChangesAsync();
            return new(OtpError.TooManyAttempts, id);
        }

        await db.SaveChangesAsync();
        var left = Math.Min(_o.MaxAttemptsPerChallenge - challenge.Attempts, _o.MaxFailuresPerIdentifier - lockout.FailedCount);
        return new(OtpError.WrongCode, id, left);
    }

    private static string Hash(Guid challengeId, string code) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{challengeId:N}:{code}")));
}
