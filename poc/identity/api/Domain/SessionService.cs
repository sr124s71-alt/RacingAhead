using Microsoft.EntityFrameworkCore;
using SportSeek.Identity.Api.Data;

namespace SportSeek.Identity.Api.Domain;

/// <summary>
/// Signed-in devices (backlog F3-S03): every sign-in belongs to one device and one app, and tokens
/// carry the session id as "sid". Revoking a session ends that device's access and refresh at once,
/// and leaves the person's other devices signed in.
/// </summary>
public class SessionService(IdentityDb db, AuditLog audit)
{
    public const string SessionClaim = "sid";

    public async Task<DeviceSession> StartAsync(Guid identityId, string client, string? deviceId, string? deviceName, string method)
    {
        deviceId = string.IsNullOrWhiteSpace(deviceId) ? Guid.NewGuid().ToString("N") : deviceId.Trim()[..Math.Min(deviceId.Trim().Length, 100)];
        deviceName = string.IsNullOrWhiteSpace(deviceName) ? "Unknown device" : deviceName.Trim()[..Math.Min(deviceName.Trim().Length, 100)];

        // Signing in again on the same device for the same app reuses its session.
        var session = await db.DeviceSessions.FirstOrDefaultAsync(s =>
            s.IdentityId == identityId && s.Client == client && s.DeviceId == deviceId && s.RevokedAt == null);
        if (session is null)
        {
            session = new DeviceSession { IdentityId = identityId, Client = client, DeviceId = deviceId };
            db.DeviceSessions.Add(session);
        }
        session.DeviceName = deviceName;
        session.SignInMethod = method;
        session.LastSeenAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return session;
    }

    public Task<DeviceSession?> FindActiveAsync(Guid sessionId) =>
        db.DeviceSessions.FirstOrDefaultAsync(s => s.Id == sessionId && s.RevokedAt == null);

    public async Task TouchAsync(DeviceSession session)
    {
        if (session.LastSeenAt > DateTimeOffset.UtcNow.AddSeconds(-30)) return;
        session.LastSeenAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
    }

    public Task<List<DeviceSession>> ListAsync(Guid identityId) =>
        db.DeviceSessions.Where(s => s.IdentityId == identityId)
            .OrderBy(s => s.RevokedAt != null).ThenByDescending(s => s.LastSeenAt).Take(20).ToListAsync();

    /// <returns>false when the session doesn't exist, isn't this identity's, or is already signed out.</returns>
    public async Task<bool> RevokeAsync(Guid identityId, Guid sessionId, string revokedBy)
    {
        var session = await db.DeviceSessions.FirstOrDefaultAsync(s => s.Id == sessionId && s.IdentityId == identityId && s.RevokedAt == null);
        if (session is null) return false;
        session.RevokedAt = DateTimeOffset.UtcNow;
        session.RevokedBy = revokedBy;
        audit.Add(AuditActions.DeviceSignedOut, identityId, session.Client,
            new { device = session.DeviceName, by = revokedBy, reason = "Signed out on this device only; other devices stay signed in" });
        await db.SaveChangesAsync();
        return true;
    }

    public static object View(DeviceSession s, Guid? currentSessionId) => new
    {
        sessionId = s.Id,
        s.Client,
        s.DeviceName,
        s.SignInMethod,
        s.CreatedAt,
        s.LastSeenAt,
        s.RevokedAt,
        active = s.RevokedAt == null,
        current = s.Id == currentSessionId,
    };
}
