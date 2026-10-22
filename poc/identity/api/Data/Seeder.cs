using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using SportSeek.Identity.Api.Domain;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace SportSeek.Identity.Api.Data;

/// <summary>
/// Creates the database, registers one OIDC client per app, seeds the admin identity and flags,
/// and creates the simulated Phase 1 tables (<c>legacy</c> schema) with deliberate duplicates.
/// </summary>
public static class Seeder
{
    public const string AdminPhone = "+919000000001";
    public const string LegacyDemoPassword = "demo1234";
    public const string OtpGrantType = "urn:sportseek:grant-type:otp";
    public const string Phase1SessionGrantType = "urn:sportseek:grant-type:phase1-session";

    // Ready-made demo identity: one person who already holds roles in both apps (seeded on start and on reset).
    public const string DemoPhone = "+919000000002";
    public const string DemoPassword = "Demo@2026";
    public const string AdminPassword = "Admin@2026";

    public static async Task InitialiseAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDb>();
        await db.Database.EnsureCreatedAsync();
        await UpgradeSchemaAsync(db);
        await CreateLegacySchemaAsync(db);
        await SeedClientsAsync(scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>());
        await SeedCoreAsync(db);
    }

    /// <summary>Returns the database to its freshly seeded state, for demo rehearsals.</summary>
    public static async Task ResetAsync(IdentityDb db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            TRUNCATE identity.audit_log, identity.otp_challenges, identity.otp_lockouts, identity.legacy_id_map,
                     identity.kyc, identity.role_assignments, identity.contacts, identity.identity_claims,
                     identity.identity_logins, identity.identity_tokens, identity.identities,
                     identity.feature_flags, identity.oidc_tokens, identity.oidc_authorizations,
                     identity.device_sessions CASCADE;
            """);
        await SeedCoreAsync(db);
    }

    private static async Task SeedCoreAsync(IdentityDb db)
    {
        if (!await db.FeatureFlags.AnyAsync())
        {
            db.FeatureFlags.Add(new FeatureFlag { Key = FeatureFlags.SharedIdentity, Enabled = true });
            db.FeatureFlags.Add(new FeatureFlag { Key = FeatureFlags.MinAppVersion, Enabled = true, Value = "1.0.0" });
        }

        if (!await db.Contacts.AnyAsync(c => c.Value == AdminPhone))
        {
            var admin = new AppIdentity
            {
                Id = Guid.NewGuid(), DisplayName = "SportSeek Ops Admin", CreatedVia = "seed",
                SecurityStamp = Guid.NewGuid().ToString("N"),
            };
            admin.UserName = admin.Id.ToString("N");
            admin.NormalizedUserName = admin.UserName.ToUpperInvariant();
            admin.Contacts.Add(new Contact { Type = "phone", Value = AdminPhone, Verified = true, VerifiedAt = DateTimeOffset.UtcNow, Source = "seed" });
            admin.Roles.Add(new RoleAssignment { Role = Roles.Admin, GrantedVia = "seed" });
            admin.Kyc = new Kyc();
            admin.PasswordHash = new PasswordHasher<AppIdentity>().HashPassword(admin, AdminPassword);
            db.Users.Add(admin);
        }

        // An admin seeded by an earlier build has no password yet.
        var existingAdmin = await db.Users.FirstOrDefaultAsync(u => u.PasswordHash == null && db.Contacts.Any(c => c.IdentityId == u.Id && c.Value == AdminPhone));
        if (existingAdmin is not null) existingAdmin.PasswordHash = new PasswordHasher<AppIdentity>().HashPassword(existingAdmin, AdminPassword);

        if (!await db.Contacts.AnyAsync(c => c.Value == DemoPhone))
        {
            // Kavya plays on the User App and coaches on the Partner App: one identity, two app roles,
            // KYC verified once, one password. Lets a demo show Shared Identity without registering first.
            var now = DateTimeOffset.UtcNow;
            var kavya = new AppIdentity
            {
                Id = Guid.NewGuid(), DisplayName = "Kavya Reddy", CreatedVia = Apps.UserApp, CreatedAt = now.AddDays(-40),
                SecurityStamp = Guid.NewGuid().ToString("N"),
            };
            kavya.UserName = kavya.Id.ToString("N");
            kavya.NormalizedUserName = kavya.UserName.ToUpperInvariant();
            kavya.Contacts.Add(new Contact { Type = "phone", Value = DemoPhone, Verified = true, VerifiedAt = now.AddDays(-40), Source = "seed" });
            kavya.Contacts.Add(new Contact { Type = "email", Value = "kavya.reddy@example.com", Verified = true, VerifiedAt = now.AddDays(-40), Source = "seed" });
            kavya.Roles.Add(new RoleAssignment { Role = Roles.Player, GrantedVia = Apps.UserApp, GrantedAt = now.AddDays(-40) });
            kavya.Roles.Add(new RoleAssignment { Role = Roles.Coach, GrantedVia = Apps.PartnerApp, GrantedAt = now.AddDays(-12) });
            kavya.Kyc = new Kyc
            {
                Status = "Verified", DocType = "PAN", DocRefMasked = "••••••567K", SubmittedVia = Apps.PartnerApp,
                SubmittedAt = now.AddDays(-12), VerifiedAt = now.AddDays(-11),
            };
            kavya.PasswordHash = new PasswordHasher<AppIdentity>().HashPassword(kavya, DemoPassword);
            db.Users.Add(kavya);
        }
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Brings a database created by an earlier POC build up to date. EnsureCreated only acts on an
    /// empty database, so additive changes are applied here and are safe to run on every start.
    /// </summary>
    private static async Task UpgradeSchemaAsync(IdentityDb db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            ALTER TABLE identity.otp_challenges ADD COLUMN IF NOT EXISTS device_id text;
            ALTER TABLE identity.kyc ADD COLUMN IF NOT EXISTS rejected_reason text;
            ALTER TABLE identity.kyc ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone;
            CREATE TABLE IF NOT EXISTS identity.device_sessions (
                id uuid PRIMARY KEY,
                identity_id uuid NOT NULL REFERENCES identity.identities (id) ON DELETE CASCADE,
                client text NOT NULL, device_id text NOT NULL, device_name text NOT NULL, sign_in_method text NOT NULL,
                created_at timestamp with time zone NOT NULL, last_seen_at timestamp with time zone NOT NULL,
                revoked_at timestamp with time zone NULL, revoked_by text NULL);
            CREATE INDEX IF NOT EXISTS ix_device_sessions_identity_id ON identity.device_sessions (identity_id);
            """);
    }

    private static async Task SeedClientsAsync(IOpenIddictApplicationManager manager)
    {
        foreach (var app in Apps.All)
        {
            var existing = await manager.FindByClientIdAsync(app.ClientId);
            if (existing is not null)
            {
                // Clients registered by an earlier build get grant types added since.
                var current = new OpenIddictApplicationDescriptor();
                await manager.PopulateAsync(current, existing);
                if (current.Permissions.Add(Permissions.Prefixes.GrantType + Phase1SessionGrantType))
                    await manager.UpdateAsync(existing, current);
                continue;
            }
            var descriptor = new OpenIddictApplicationDescriptor
            {
                ClientId = app.ClientId,
                DisplayName = app.DisplayName,
                ClientType = ClientTypes.Public,
                Permissions =
                {
                    Permissions.Endpoints.Token,
                    Permissions.GrantTypes.Password,
                    Permissions.GrantTypes.RefreshToken,
                    Permissions.Prefixes.GrantType + OtpGrantType,
                    Permissions.Prefixes.GrantType + Phase1SessionGrantType,
                    Permissions.Scopes.Profile,
                    Permissions.Scopes.Roles,
                },
            };
            await manager.CreateAsync(descriptor);
        }
    }

    private static async Task CreateLegacySchemaAsync(IdentityDb db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE SCHEMA IF NOT EXISTS legacy;
            CREATE TABLE IF NOT EXISTS legacy.user_app_users (
                id serial PRIMARY KEY, full_name text NOT NULL, mobile text, email text,
                password_sha256 text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
            CREATE TABLE IF NOT EXISTS legacy.partner_app_users (
                id serial PRIMARY KEY, business_name text NOT NULL, owner_name text NOT NULL, mobile text, email text,
                partner_type text NOT NULL, kyc_status text NOT NULL DEFAULT 'pending',
                password_sha256 text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
            """);

        var hasRows = await db.Database.SqlQueryRaw<int>("SELECT count(*)::int AS \"Value\" FROM legacy.user_app_users").SingleAsync();
        if (hasRows > 0) return;

        // Phase 1 stored numbers as typed, so the same person appears in different formats.
        var pw = Sha256(LegacyDemoPassword); // constant hex digest, not user input
#pragma warning disable EF1002
        await db.Database.ExecuteSqlRawAsync($"""
            INSERT INTO legacy.user_app_users (full_name, mobile, email, password_sha256, created_at) VALUES
              ('Arjun Mehta',  '98765 43210',     'arjun.mehta@example.com',  '{pw}', '2025-11-02'),
              ('Priya Nair',   '9123456780',      'priya.nair@example.com',   '{pw}', '2025-12-14'),
              ('Rahul Verma',  '+91 99887 76655', 'Rahul.Verma@Example.com',  '{pw}', '2026-01-09'),
              ('Sneha Iyer',   '9812345678',      'sneha.iyer@example.com',   '{pw}', '2026-02-21'),
              ('Karan Singh',  '090011 22334',    NULL,                       '{pw}', '2026-03-30'),
              ('Ananya Rao',   '9445566778',      'ananya.rao@example.com',   '{pw}', '2026-05-18');
            INSERT INTO legacy.partner_app_users (business_name, owner_name, mobile, email, partner_type, kyc_status, password_sha256, created_at) VALUES
              ('Arjun''s Turf Arena',   'Arjun Mehta',  '+91-9876543210', 'turf@arjunsarena.in',     'facility',     'verified', '{pw}', '2026-01-15'),
              ('Priya Tennis Coaching', 'Priya Nair',   '09123456780',    'coach.priya@example.com', 'coach',        'pending',  '{pw}', '2026-03-03'),
              ('Verma Sports Physio',   'Rahul Verma',  '9988776600',     'rahul.verma@example.com', 'physio',       'verified', '{pw}', '2026-04-11'),
              ('Smash Badminton Hub',   'Vikram Patel', '9876501234',     'hello@smashhub.in',       'facility',     'verified', '{pw}', '2026-04-27'),
              ('FitFuel Nutrition',     'Meera Joshi',  '9765432109',     'meera@fitfuel.in',        'nutritionist', 'pending',  '{pw}', '2026-06-05');
            """);
#pragma warning restore EF1002
    }

    public static string Sha256(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
}
