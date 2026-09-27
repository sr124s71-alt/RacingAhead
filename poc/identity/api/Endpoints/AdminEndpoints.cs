using System.Security.Claims;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SportSeek.Identity.Api.Data;
using SportSeek.Identity.Api.Domain;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace SportSeek.Identity.Api.Endpoints;

public sealed record FlagsBody(bool? SharedIdentityEnabled, string? MinAppVersion);

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this WebApplication app)
    {
        var admin = app.MapGroup("/api/admin").RequireAuthorization("Admin");

        admin.MapGet("/identities", async (LinkingService linking) =>
        {
            var list = await linking.WithGraph().OrderByDescending(i => i.CreatedAt).ToListAsync();
            return list.Select(i => MeEndpoints.Profile(i, null));
        });

        admin.MapPost("/identities/{id:guid}/kyc/verify", async (Guid id, ClaimsPrincipal user, IdentityDb db, AuditLog audit) =>
        {
            var kyc = await db.Kyc.FindAsync(id);
            if (kyc is null || kyc.Status != "Submitted") return PublicEndpoints.Problem(409, "not_submitted", "KYC has not been submitted.");
            kyc.Status = "Verified";
            kyc.VerifiedAt = DateTimeOffset.UtcNow;
            audit.Add(AuditActions.KycVerified, id, Apps.AdminPortal, new { by = user.FindFirstValue(Claims.Name) });
            await db.SaveChangesAsync();
            return Results.Ok(new { kyc.Status });
        });

        admin.MapGet("/audit", async (IdentityDb db, int? take) =>
        {
            var rows = await db.Audit.OrderByDescending(a => a.Id).Take(Math.Clamp(take ?? 100, 1, 500)).ToListAsync();
            var names = await db.Users.Where(u => rows.Select(r => r.IdentityId).Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.DisplayName);
            return rows.Select(a => new
            {
                a.Id, a.At, a.Action, a.Client, a.IdentityId, a.Ip,
                identityName = a.IdentityId is { } iid && names.TryGetValue(iid, out var n) ? n : null,
                detail = a.Detail is null ? (JsonElement?)null : JsonDocument.Parse(a.Detail).RootElement,
            });
        });

        admin.MapGet("/flags", async (FeatureFlags flags) => new
        {
            sharedIdentityEnabled = await flags.SharedIdentityEnabledAsync(),
            minAppVersion = await flags.MinAppVersionAsync(),
        });

        admin.MapPut("/flags", async (FlagsBody body, IdentityDb db, AuditLog audit, FeatureFlags flags) =>
        {
            if (body.SharedIdentityEnabled is { } on)
            {
                var f = await db.FeatureFlags.FindAsync(FeatureFlags.SharedIdentity);
                f!.Enabled = on;
                f.UpdatedAt = DateTimeOffset.UtcNow;
                audit.Add(AuditActions.FlagChanged, client: Apps.AdminPortal, detail: new { flag = FeatureFlags.SharedIdentity, enabled = on });
            }
            if (body.MinAppVersion is { } v)
            {
                if (!Version.TryParse(v, out _)) return PublicEndpoints.Problem(400, "invalid_version", "Use a version like 1.2.0.");
                var f = await db.FeatureFlags.FindAsync(FeatureFlags.MinAppVersion);
                f!.Value = v;
                f.UpdatedAt = DateTimeOffset.UtcNow;
                audit.Add(AuditActions.FlagChanged, client: Apps.AdminPortal, detail: new { flag = FeatureFlags.MinAppVersion, value = v });
            }
            await db.SaveChangesAsync();
            return Results.Ok(new { sharedIdentityEnabled = await flags.SharedIdentityEnabledAsync(), minAppVersion = await flags.MinAppVersionAsync() });
        });

        admin.MapGet("/phase1", async (Phase1Store phase1, IdentityDb db) =>
        {
            var map = await db.LegacyIdMap.ToListAsync();
            return (await phase1.AllAsync()).Select(a => new
            {
                a.App, a.Id, a.Name, a.BusinessName, a.Mobile, a.Email, a.PartnerType, a.KycStatus, a.CreatedAt,
                identityId = map.FirstOrDefault(m => m.LegacyApp == a.App && m.LegacyId == a.Id)?.IdentityId,
            });
        });

        admin.MapPost("/bootstrap", (BootstrapService bootstrap) => bootstrap.RunAsync());
        admin.MapGet("/duplicates", (BootstrapService bootstrap) => bootstrap.DuplicatesAsync());

        admin.MapPost("/reset-demo", async (IdentityDb db, DevOtpInbox inbox, AuditLog audit) =>
        {
            await Seeder.ResetAsync(db);
            inbox.Clear();
            audit.Add(AuditActions.DemoReset, client: Apps.AdminPortal);
            await db.SaveChangesAsync();
            return Results.Ok(new { reset = true, note = "Sign in to the Admin Portal again: all tokens were revoked." });
        });
    }
}
