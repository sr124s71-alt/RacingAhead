using System.Collections.Immutable;
using System.Security.Claims;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using SportSeek.Identity.Api.Data;
using SportSeek.Identity.Api.Domain;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace SportSeek.Identity.Api.Endpoints;

public static class TokenEndpoint
{
    public static void MapTokenEndpoint(this WebApplication app) =>
        app.MapPost("/connect/token", HandleAsync).DisableAntiforgery();

    /// <summary>Purpose string for the Phase 1 session hand-over token (see PublicEndpoints, phase1/login).</summary>
    public const string Phase1SessionPurpose = "SportSeek.Phase1Session.v1";

    private static async Task<IResult> HandleAsync(HttpContext ctx, FeatureFlags flags, OtpService otp,
        LinkingService linking, UserManager<AppIdentity> users, AuditLog audit, IdentityDb db,
        SessionService sessions, BootstrapService bootstrap, IDataProtectionProvider protection)
    {
        var request = ctx.GetOpenIddictServerRequest() ?? throw new InvalidOperationException("Not an OIDC request.");
        // OpenIddict has already authenticated the client_id and checked the grant-type permission.
        var client = Apps.Find(request.ClientId)!;

        if (client.GatedByF3 && !await flags.SharedIdentityEnabledAsync())
            return Fail(Errors.AccessDenied, "f3_disabled: Shared Identity is switched off. Use the Phase 1 login.");

        var deviceId = (string?)request["device_id"];
        var deviceName = (string?)request["device_name"];
        async Task<IResult> Issue(AppIdentity identity, string method, string outcome, string? roleAdded)
        {
            var session = await sessions.StartAsync(identity.Id, client.ClientId, deviceId, deviceName, method);
            return SignIn(identity, client, request, outcome, roleAdded, session.Id);
        }

        if (request.GrantType == Seeder.OtpGrantType)
        {
            if (!Guid.TryParse((string?)request["challenge_id"], out var challengeId))
                return Fail(Errors.InvalidRequest, "challenge_id is required.");

            var check = await otp.VerifyAsync(challengeId, (string?)request["otp"], client.ClientId);
            if (!check.Ok) return Fail(Errors.InvalidGrant, OtpMessage(check));

            var result = await linking.CompleteOtpSignInAsync(client, check.Identifier!, (string?)request["role"], (string?)request["name"]);
            if (result.Outcome == LinkOutcome.Refused)
                return Fail(Errors.AccessDenied, "This account does not have access to the Admin Portal.");

            return await Issue(result.Identity!, "otp", result.Outcome.ToString(), result.RoleAdded);
        }

        if (request.IsPasswordGrantType())
        {
            var id = Identifiers.TryNormalise(request.Username);
            var identity = id is null ? null : await linking.FindByVerifiedContactAsync(id);
            if (identity is null || await users.IsLockedOutAsync(identity) || !await users.CheckPasswordAsync(identity, request.Password ?? ""))
            {
                if (identity is not null) await users.AccessFailedAsync(identity);
                return Fail(Errors.InvalidGrant, "Phone/email or password is incorrect.");
            }
            await users.ResetAccessFailedCountAsync(identity);

            // One credential, but no silent linking: a password never adds a role to a new app.
            if (identity.Roles.All(r => !client.AllowedRoles.Contains(r.Role)))
            {
                audit.Add(AuditActions.PasswordRefused, identity.Id, client.ClientId, new { reason = "No role for this app; linking requires OTP" });
                await db.SaveChangesAsync();
                return Fail(Errors.AccessDenied, "no_role_for_app: Your SportSeek account is not set up for this app yet. Continue with OTP to add it.");
            }
            audit.Add(AuditActions.PasswordSignIn, identity.Id, client.ClientId);
            await db.SaveChangesAsync();
            return await Issue(identity, "password", "SignedIn", null);
        }

        if (request.IsRefreshTokenGrantType())
        {
            var auth = await ctx.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            var sub = auth.Principal?.GetClaim(Claims.Subject);
            var identity = Guid.TryParse(sub, out var identityId)
                ? await linking.WithGraph().FirstOrDefaultAsync(i => i.Id == identityId)
                : null;
            if (identity is null || identity.Roles.All(r => !client.AllowedRoles.Contains(r.Role)))
                return Fail(Errors.InvalidGrant, "The refresh token is no longer valid.");

            // A device that was signed out can't refresh, whatever the token's own lifetime (F3-S03).
            var sid = auth.Principal?.GetClaim(SessionService.SessionClaim);
            var session = Guid.TryParse(sid, out var sessionId) ? await sessions.FindActiveAsync(sessionId) : null;
            if (session is null) return Fail(Errors.InvalidGrant, "device_signed_out: This device was signed out. Sign in again.");
            await sessions.TouchAsync(session);

            // Roles and name are re-read, so a role added in another app shows up on refresh.
            return SignIn(identity, client, request, "Refreshed", null, session.Id);
        }

        if (request.GrantType == Seeder.Phase1SessionGrantType)
        {
            // F3-S05: someone signed in with the Phase 1 login while F3 was off moves onto Shared Identity
            // when it is switched on, without signing in again. The hand-over token was issued by the Phase 1 login.
            string? payload;
            try
            {
                payload = protection.CreateProtector(Phase1SessionPurpose).ToTimeLimitedDataProtector()
                    .Unprotect((string?)request["phase1_session"] ?? "");
            }
            catch (System.Security.Cryptography.CryptographicException)
            {
                payload = null;
            }
            var parts = payload?.Split('|');
            if (parts is not { Length: 2 } || parts[0] != client.ClientId || !int.TryParse(parts[1], out var legacyId))
                return Fail(Errors.InvalidGrant, "The Phase 1 session can't be moved. Sign in again.");

            var identity = await bootstrap.EnsureAccountAsync(parts[0], legacyId);
            if (identity is null || identity.Roles.All(r => !client.AllowedRoles.Contains(r.Role)))
                return Fail(Errors.InvalidGrant, "The Phase 1 account was not found. Sign in again.");
            audit.Add(AuditActions.Phase1SessionMigrated, identity.Id, client.ClientId,
                new { legacyId, reason = "Shared Identity switched on: Phase 1 session moved without signing in again" });
            await db.SaveChangesAsync();
            return await Issue(identity, "phase1-migration", "Migrated", null);
        }

        return Fail(Errors.UnsupportedGrantType, "Grant type not supported.");
    }

    /// <summary>Tokens are app-scoped: they carry only the roles that belong to the requesting app.</summary>
    private static IResult SignIn(AppIdentity identity, AppClient client, OpenIddictRequest request, string outcome, string? roleAdded,
        Guid sessionId)
    {
        var claims = new ClaimsIdentity(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme, Claims.Name, Claims.Role);
        claims.SetClaim(Claims.Subject, identity.Id.ToString())
              .SetClaim(Claims.Name, identity.DisplayName)
              .SetClaim("app", client.ClientId)
              .SetClaim("link_outcome", outcome)
              .SetClaims(Claims.Role, identity.Roles.Select(r => r.Role).Where(client.AllowedRoles.Contains).Order().ToImmutableArray());
        if (roleAdded is not null) claims.SetClaim("role_added", roleAdded);
        claims.SetClaim(SessionService.SessionClaim, sessionId.ToString());

        claims.SetScopes(request.GetScopes().Intersect([Scopes.Profile, Scopes.Roles, Scopes.OfflineAccess]));
        claims.SetDestinations(_ => [Destinations.AccessToken]);
        return Results.SignIn(new ClaimsPrincipal(claims), authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    private static IResult Fail(string error, string description) => Results.Forbid(
        new AuthenticationProperties(new Dictionary<string, string?>
        {
            [OpenIddictServerAspNetCoreConstants.Properties.Error] = error,
            [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = description,
        }),
        [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme]);

    private static string OtpMessage(OtpVerification v) => v.Error switch
    {
        OtpError.WrongCode => $"Incorrect code. {v.AttemptsLeft} attempt(s) left.",
        OtpError.Expired => "The code has expired. Request a new one.",
        OtpError.TooManyAttempts => "Too many incorrect attempts for this code. Request a new one.",
        OtpError.LockedOut => $"Too many incorrect codes for this number. Locked until {v.LockedUntil:HH:mm} UTC.",
        _ => "This code is no longer valid. Request a new one.",
    };
}
