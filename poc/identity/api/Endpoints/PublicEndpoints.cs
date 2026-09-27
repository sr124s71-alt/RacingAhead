using SportSeek.Identity.Api.Data;
using SportSeek.Identity.Api.Domain;

namespace SportSeek.Identity.Api.Endpoints;

public sealed record OtpRequestBody(string Client, string Identifier, string? Role);

public sealed record Phase1LoginBody(string Client, string Identifier, string Password);

public static class PublicEndpoints
{
    public static void MapPublicEndpoints(this WebApplication app)
    {
        app.MapGet("/api/config", async (FeatureFlags flags, IHostEnvironment env) => new
        {
            sharedIdentityEnabled = await flags.SharedIdentityEnabledAsync(),
            minAppVersion = await flags.MinAppVersionAsync(),
            devOtpInbox = env.IsDevelopment(),
            apps = Apps.All.Select(a => new { a.ClientId, a.DisplayName, a.DefaultRole, a.AllowedRoles }),
        });

        // Step 1 of sign-in / registration / linking: normalise, look up, send an OTP.
        app.MapPost("/api/otp/request", async (OtpRequestBody body, HttpContext ctx, FeatureFlags flags,
            OtpService otp, LinkingService linking) =>
        {
            var client = Apps.Find(body.Client);
            if (client is null) return Problem(400, "unknown_client", "Unknown app.");
            if (client.GatedByF3 && !await flags.SharedIdentityEnabledAsync())
                return Problem(409, "f3_disabled", "Shared Identity is switched off. Use the Phase 1 login.");

            var id = Identifiers.TryNormalise(body.Identifier);
            if (id is null) return Problem(400, "invalid_identifier", "Enter a valid Indian mobile number or email address.");

            var (challenge, error, lockedUntil) = await otp.RequestAsync(client, id, ctx.Connection.RemoteIpAddress?.ToString());
            if (error == OtpError.LockedOut)
                return Problem(423, "locked_out", $"Too many incorrect codes for this number. Try again after {lockedUntil:HH:mm} UTC.");
            if (error == OtpError.RateLimited)
                return Problem(429, "rate_limited", "Too many codes requested for this number. Please wait and try again.");

            var lookup = await linking.LookupAsync(client, id);
            var role = body.Role is not null && client.AllowedRoles.Contains(body.Role) ? body.Role : client.DefaultRole;
            var label = id.Type == "phone" ? "number" : "email";
            string scenario, message;
            if (!lookup.IdentityExists)
            {
                scenario = "register";
                message = $"New to SportSeek. Enter the code sent to {id.Masked} to create your account.";
            }
            else if (lookup.HasRoleForThisApp)
            {
                scenario = "sign-in";
                message = $"Welcome back. Enter the code sent to {id.Masked} to sign in.";
            }
            else
            {
                scenario = "link";
                message = $"This {label} already has a SportSeek account. Enter the code sent to {id.Masked} to prove it's yours, " +
                          $"and we'll add {role} to that same account. No new account is created.";
            }

            return Results.Ok(new
            {
                challengeId = challenge!.Id,
                channel = id.Type,
                maskedDestination = id.Masked,
                expiresAt = challenge.ExpiresAt,
                scenario,
                fromPhase1 = lookup.FromPhase1,
                message,
            });
        }).RequireRateLimiting("otp");

        // Fallback: the Phase 1 login, used by the apps while F3 is switched off.
        app.MapPost("/api/phase1/login", async (Phase1LoginBody body, Phase1Store phase1, AuditLog audit, IdentityDb db) =>
        {
            var id = Identifiers.TryNormalise(body.Identifier);
            var hash = Seeder.Sha256(body.Password ?? "");
            var account = id is null ? null : (await phase1.AllAsync()).FirstOrDefault(a =>
                a.App == body.Client && a.PasswordSha256 == hash &&
                (Identifiers.TryNormalise(a.Mobile)?.Value == id.Value || Identifiers.TryNormalise(a.Email)?.Value == id.Value));
            if (account is null) return Problem(401, "invalid_credentials", "Mobile/email or password is incorrect.");

            audit.Add(AuditActions.LegacyLogin, client: body.Client, detail: new { legacyId = account.Id });
            await db.SaveChangesAsync();
            return Results.Ok(new
            {
                mode = "phase1",
                account.App, legacyId = account.Id, account.Name, account.BusinessName, account.PartnerType, account.KycStatus,
            });
        });

        if (app.Environment.IsDevelopment())
            app.MapGet("/api/dev/otp-inbox", (DevOtpInbox inbox) => inbox.Latest());
    }

    public static IResult Problem(int status, string error, string message) =>
        Results.Json(new { error, message }, statusCode: status);
}
