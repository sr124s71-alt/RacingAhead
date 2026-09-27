using Microsoft.EntityFrameworkCore;
using Npgsql;
using SportSeek.Identity.Api.Data;

namespace SportSeek.Identity.Api.Domain;

public sealed record LegacyAccount(string App, int Id, string Name, string? BusinessName, string? Mobile, string? Email,
    string? PartnerType, string? KycStatus, string PasswordSha256, DateTimeOffset CreatedAt);

/// <summary>Read-only access to the simulated Phase 1 tables (legacy schema). Nothing here writes to them.</summary>
public class Phase1Store(IdentityDb db)
{
    public async Task<List<LegacyAccount>> AllAsync()
    {
        var list = new List<LegacyAccount>();
        var conn = (NpgsqlConnection)db.Database.GetDbConnection();
        var opened = conn.State != System.Data.ConnectionState.Open;
        if (opened) await conn.OpenAsync();
        try
        {
            await using var cmd = new NpgsqlCommand("""
                SELECT 'user-app', id, full_name, NULL, mobile, email, NULL, NULL, password_sha256, created_at FROM legacy.user_app_users
                UNION ALL
                SELECT 'partner-app', id, owner_name, business_name, mobile, email, partner_type, kyc_status, password_sha256, created_at FROM legacy.partner_app_users
                ORDER BY 1 DESC, 2
                """, conn);
            await using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                string? S(int i) => r.IsDBNull(i) ? null : r.GetString(i);
                list.Add(new LegacyAccount(r.GetString(0), r.GetInt32(1), r.GetString(2), S(3), S(4), S(5), S(6), S(7),
                    r.GetString(8), r.GetFieldValue<DateTimeOffset>(9)));
            }
        }
        finally
        {
            if (opened) await conn.CloseAsync();
        }
        return list;
    }
}

public sealed record BootstrapReport(int Phase1UserApp, int Phase1PartnerApp, int IdentitiesCreated, int AlreadyMapped,
    int InvalidIdentifiers, List<DuplicateGroup> DuplicateCandidates);

public sealed record DuplicateGroup(string Type, string Value, List<DuplicateMember> Identities);

public sealed record DuplicateMember(Guid IdentityId, string DisplayName, string Source, string[] Roles, bool Verified);

/// <summary>
/// Plan task 2.9: load every existing User and Partner account 1:1 into the identity store.
/// Duplicates are NOT merged in R1 (that needs SportSeek-approved merge rules, R2); they are reported.
/// Bootstrapped contacts are unverified until the person proves ownership by OTP.
/// </summary>
public class BootstrapService(IdentityDb db, Phase1Store phase1, AuditLog audit)
{
    public async Task<BootstrapReport> RunAsync()
    {
        var accounts = await phase1.AllAsync();
        var mapped = (await db.LegacyIdMap.Select(m => new { m.LegacyApp, m.LegacyId }).ToListAsync())
            .Select(m => (m.LegacyApp, m.LegacyId)).ToHashSet();

        int created = 0, skipped = 0, invalid = 0;
        foreach (var a in accounts)
        {
            if (mapped.Contains((a.App, a.Id))) { skipped++; continue; }

            var fromPartner = a.App == Apps.PartnerApp;
            var identity = new AppIdentity
            {
                Id = Guid.NewGuid(),
                DisplayName = a.Name,
                Source = fromPartner ? IdentitySources.LegacyPartnerApp : IdentitySources.LegacyUserApp,
                CreatedVia = "bootstrap",
                CreatedAt = a.CreatedAt,
                SecurityStamp = Guid.NewGuid().ToString("N"),
            };
            identity.UserName = identity.Id.ToString("N");
            identity.NormalizedUserName = identity.UserName.ToUpperInvariant();

            foreach (var raw in new[] { a.Mobile, a.Email })
            {
                if (raw is null) continue;
                var id = Identifiers.TryNormalise(raw);
                if (id is null) { invalid++; continue; }
                identity.Contacts.Add(new Contact { Type = id.Type, Value = id.Value, Verified = false, Source = "legacy-bootstrap" });
            }

            identity.Roles.Add(new RoleAssignment
            {
                Role = fromPartner ? PartnerRole(a.PartnerType) : Roles.Player,
                GrantedVia = "bootstrap",
                GrantedAt = a.CreatedAt,
            });
            identity.Kyc = a.KycStatus == "verified"
                ? new Kyc { Status = "Verified", DocType = "Phase 1 record", SubmittedVia = a.App, VerifiedAt = a.CreatedAt }
                : new Kyc();

            db.Users.Add(identity);
            db.LegacyIdMap.Add(new LegacyIdMap { LegacyApp = a.App, LegacyId = a.Id, IdentityId = identity.Id });
            created++;
        }

        await db.SaveChangesAsync();
        var duplicates = await DuplicatesAsync();
        var report = new BootstrapReport(accounts.Count(a => a.App == Apps.UserApp), accounts.Count(a => a.App == Apps.PartnerApp),
            created, skipped, invalid, duplicates);
        audit.Add(AuditActions.BootstrapRun, detail: new { created, skipped, invalid, duplicateGroups = duplicates.Count });
        await db.SaveChangesAsync();
        return report;
    }

    /// <summary>Same normalised phone or email held by more than one identity: candidates for the R2 merge.</summary>
    public async Task<List<DuplicateGroup>> DuplicatesAsync()
    {
        var contacts = await db.Contacts.Include(c => c.Identity).ThenInclude(i => i!.Roles).ToListAsync();
        return contacts
            .GroupBy(c => (c.Type, c.Value))
            .Where(g => g.Select(c => c.IdentityId).Distinct().Count() > 1)
            .Select(g => new DuplicateGroup(g.Key.Type, g.Key.Value, g
                .Select(c => new DuplicateMember(c.IdentityId, c.Identity!.DisplayName, c.Identity.Source,
                    c.Identity.Roles.Select(r => r.Role).ToArray(), c.Verified))
                .ToList()))
            .OrderBy(g => g.Value)
            .ToList();
    }

    private static string PartnerRole(string? type) => type switch
    {
        "coach" => Roles.Coach,
        "physio" => Roles.Physio,
        "nutritionist" => Roles.Nutritionist,
        _ => Roles.FacilityPartner,
    };
}
