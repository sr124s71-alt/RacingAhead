using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SportSeek.Identity.Api.Data;
using SportSeek.Identity.Api.Domain;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace SportSeek.Identity.Api.Endpoints;

public sealed record KycBody(string DocType, string DocNumber);
public sealed record PasswordBody(string NewPassword);
public sealed record ProfileBody(string DisplayName);

/// <summary>The signed-in person's profile. The same identity is visible from every app (SOW §9.1).</summary>
public static class MeEndpoints
{
    public static void MapMeEndpoints(this WebApplication app)
    {
        var me = app.MapGroup("/api/me").RequireAuthorization();

        me.MapGet("", async (ClaimsPrincipal user, LinkingService linking) =>
        {
            var identity = await Load(user, linking);
            return identity is null ? Results.Unauthorized() : Results.Ok(Profile(identity, user.FindFirstValue("app")));
        });

        me.MapPut("/profile", async (ProfileBody body, ClaimsPrincipal user, LinkingService linking, AuditLog audit, IdentityDb db) =>
        {
            var identity = await Load(user, linking);
            if (identity is null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(body.DisplayName)) return PublicEndpoints.Problem(400, "invalid_name", "Name is required.");
            identity.DisplayName = body.DisplayName.Trim();
            audit.Add(AuditActions.ProfileUpdated, identity.Id, user.FindFirstValue("app"));
            await db.SaveChangesAsync();
            return Results.Ok(Profile(identity, user.FindFirstValue("app")));
        });

        // KYC is captured once on the identity and reused by every role and app (SOW §7.4).
        me.MapPost("/kyc", async (KycBody body, ClaimsPrincipal user, LinkingService linking, AuditLog audit, IdentityDb db) =>
        {
            var identity = await Load(user, linking);
            if (identity is null) return Results.Unauthorized();
            var number = new string((body.DocNumber ?? "").Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();
            if (number.Length < 6) return PublicEndpoints.Problem(400, "invalid_document", "Enter a valid document number.");
            if (identity.Kyc?.Status == "Verified") return PublicEndpoints.Problem(409, "kyc_verified", "KYC is already verified.");

            identity.Kyc ??= new Kyc { IdentityId = identity.Id };
            identity.Kyc.Status = "Submitted";
            identity.Kyc.DocType = body.DocType;
            identity.Kyc.DocRefMasked = new string('•', number.Length - 4) + number[^4..];
            identity.Kyc.SubmittedVia = user.FindFirstValue("app");
            identity.Kyc.SubmittedAt = DateTimeOffset.UtcNow;
            audit.Add(AuditActions.KycSubmitted, identity.Id, identity.Kyc.SubmittedVia, new { body.DocType, doc = identity.Kyc.DocRefMasked });
            await db.SaveChangesAsync();
            return Results.Ok(Profile(identity, user.FindFirstValue("app")));
        });

        // One credential set: a password set in one app works in every app the person has a role in.
        me.MapPost("/password", async (PasswordBody body, ClaimsPrincipal user, LinkingService linking,
            UserManager<AppIdentity> users, AuditLog audit, IdentityDb db) =>
        {
            var identity = await Load(user, linking);
            if (identity is null) return Results.Unauthorized();
            if (await users.HasPasswordAsync(identity)) await users.RemovePasswordAsync(identity);
            var result = await users.AddPasswordAsync(identity, body.NewPassword ?? "");
            if (!result.Succeeded)
                return PublicEndpoints.Problem(400, "weak_password", string.Join(" ", result.Errors.Select(e => e.Description)));
            audit.Add(AuditActions.PasswordSet, identity.Id, user.FindFirstValue("app"));
            await db.SaveChangesAsync();
            return Results.Ok(Profile(identity, user.FindFirstValue("app")));
        });
    }

    private static async Task<AppIdentity?> Load(ClaimsPrincipal user, LinkingService linking) =>
        Guid.TryParse(user.FindFirstValue(Claims.Subject), out var id)
            ? await linking.WithGraph().FirstOrDefaultAsync(i => i.Id == id)
            : null;

    public static object Profile(AppIdentity i, string? currentApp)
    {
        var appRoles = Apps.Find(currentApp)?.AllowedRoles ?? [];
        return new
        {
            identityId = i.Id,
            i.DisplayName,
            i.Source,
            i.CreatedVia,
            i.CreatedAt,
            hasPassword = i.PasswordHash is not null,
            contacts = i.Contacts.OrderBy(c => c.Type).Select(c => new { c.Type, c.Value, c.Verified, c.VerifiedAt }),
            roles = i.Roles.OrderBy(r => r.GrantedAt).Select(r => new
            {
                r.Role,
                r.GrantedVia,
                r.GrantedAt,
                inThisApp = appRoles.Contains(r.Role),
                app = Apps.All.FirstOrDefault(a => a.AllowedRoles.Contains(r.Role))?.ClientId,
            }),
            kyc = new
            {
                status = i.Kyc?.Status ?? "NotStarted",
                i.Kyc?.DocType,
                i.Kyc?.DocRefMasked,
                i.Kyc?.SubmittedVia,
                i.Kyc?.SubmittedAt,
                i.Kyc?.VerifiedAt,
            },
        };
    }
}
