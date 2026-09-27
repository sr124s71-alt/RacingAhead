using System.Collections.Immutable;
using System.Security.Claims;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
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

    private static async Task<IResult> HandleAsync(HttpContext ctx, FeatureFlags flags, OtpService otp,
        LinkingService linking, UserManager<AppIdentity> users, AuditLog audit, IdentityDb db)
    {
        var request = ctx.GetOpenIddictServerRequest() ?? throw new InvalidOperationException("Not an OIDC request.");
        // OpenIddict has already authenticated the client_id and checked the grant-type permission.
        var client = Apps.Find(request.ClientId)!;

        if (client.GatedByF3 && !await flags.SharedIdentityEnabledAsync())
            return Fail(Errors.AccessDenied, "f3_disabled: Shared Identity is switched off. Use the Phase 1 login.");

        if (request.GrantType == Seeder.OtpGrantType)
        {
            if (!Guid.TryParse((string?)request["challenge_id"], out var challengeId))
                return Fail(Errors.InvalidRequest, "challenge_id is required.");

            var check = await otp.VerifyAsync(challengeId, (string?)request["otp"], client.ClientId);
            if (!check.Ok) return Fail(Errors.InvalidGrant, OtpMessage(check));

            var result = await linking.CompleteOtpSignInAsync(client, check.Identifier!, (string?)request["role"], (string?)request["name"]);
            if (result.Outcome == LinkOutcome.Refused)
                return Fail(Errors.AccessDenied, "This account does not have access to the Admin Portal.");

            return SignIn(result.Identity!, client, request, result.Outcome.ToString(), result.RoleAdded);
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
            return SignIn(identity, client, request, "SignedIn", null);
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
            // Roles and name are re-read, so a role added in another app shows up on refresh.
            return SignIn(identity, client, request, "Refreshed", null);
        }

        return Fail(Errors.UnsupportedGrantType, "Grant type not supported.");
    }

    /// <summary>Tokens are app-scoped: they carry only the roles that belong to the requesting app.</summary>
    private static IResult SignIn(AppIdentity identity, AppClient client, OpenIddictRequest request, string outcome, string? roleAdded)
    {
        var claims = new ClaimsIdentity(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme, Claims.Name, Claims.Role);
        claims.SetClaim(Claims.Subject, identity.Id.ToString())
              .SetClaim(Claims.Name, identity.DisplayName)
              .SetClaim("app", client.ClientId)
              .SetClaim("link_outcome", outcome)
              .SetClaims(Claims.Role, identity.Roles.Select(r => r.Role).Where(client.AllowedRoles.Contains).Order().ToImmutableArray());
        if (roleAdded is not null) claims.SetClaim("role_added", roleAdded);

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
