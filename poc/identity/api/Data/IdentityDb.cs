using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OpenIddict.EntityFrameworkCore.Models;

namespace SportSeek.Identity.Api.Data;

/// <summary>
/// The Identity domain's DbContext. Everything it owns lives in the <c>identity</c> schema
/// (one schema per domain, TA §4). The simulated Phase 1 tables live in <c>legacy</c> and are
/// only ever read with SQL by the bootstrap and the fallback login.
/// </summary>
public class IdentityDb(DbContextOptions<IdentityDb> options) : IdentityUserContext<AppIdentity, Guid>(options)
{
    public const string Schema = "identity";

    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<RoleAssignment> RoleAssignments => Set<RoleAssignment>();
    public DbSet<Kyc> Kyc => Set<Kyc>();
    public DbSet<OtpChallenge> OtpChallenges => Set<OtpChallenge>();
    public DbSet<OtpLockout> OtpLockouts => Set<OtpLockout>();
    public DbSet<AuditEntry> Audit => Set<AuditEntry>();
    public DbSet<FeatureFlag> FeatureFlags => Set<FeatureFlag>();
    public DbSet<LegacyIdMap> LegacyIdMap => Set<LegacyIdMap>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.HasDefaultSchema(Schema);

        b.Entity<AppIdentity>().ToTable("identities");
        b.Entity<IdentityUserClaim<Guid>>().ToTable("identity_claims");
        b.Entity<IdentityUserLogin<Guid>>().ToTable("identity_logins");
        b.Entity<IdentityUserToken<Guid>>().ToTable("identity_tokens");

        b.Entity<OpenIddictEntityFrameworkCoreApplication>().ToTable("oidc_applications");
        b.Entity<OpenIddictEntityFrameworkCoreAuthorization>().ToTable("oidc_authorizations");
        b.Entity<OpenIddictEntityFrameworkCoreScope>().ToTable("oidc_scopes");
        b.Entity<OpenIddictEntityFrameworkCoreToken>().ToTable("oidc_tokens");

        b.Entity<Contact>(e =>
        {
            e.ToTable("contacts");
            e.Property(c => c.Id).ValueGeneratedNever();
            e.HasOne(c => c.Identity).WithMany(i => i.Contacts).HasForeignKey(c => c.IdentityId);
            // The rule that prevents duplicates: a verified phone/email belongs to exactly one identity.
            e.HasIndex(c => new { c.Type, c.Value }).IsUnique().HasFilter("verified = true")
             .HasDatabaseName("ux_contacts_verified_value");
            e.HasIndex(c => c.Value);
        });

        b.Entity<RoleAssignment>(e =>
        {
            e.ToTable("role_assignments");
            e.Property(r => r.Id).ValueGeneratedNever();
            e.HasOne(r => r.Identity).WithMany(i => i.Roles).HasForeignKey(r => r.IdentityId);
            e.HasIndex(r => new { r.IdentityId, r.Role }).IsUnique();
        });

        b.Entity<Kyc>(e =>
        {
            e.ToTable("kyc");
            e.HasKey(k => k.IdentityId);
            e.HasOne(k => k.Identity).WithOne(i => i.Kyc).HasForeignKey<Kyc>(k => k.IdentityId);
        });

        b.Entity<OtpChallenge>(e =>
        {
            e.ToTable("otp_challenges");
            e.Property(o => o.Id).ValueGeneratedNever();
            e.HasIndex(o => new { o.Destination, o.CreatedAt });
        });

        b.Entity<OtpLockout>(e => { e.ToTable("otp_lockouts"); e.HasKey(l => l.Destination); });

        b.Entity<AuditEntry>(e =>
        {
            e.ToTable("audit_log");
            e.Property(a => a.Detail).HasColumnType("jsonb");
            e.HasIndex(a => a.At);
        });

        b.Entity<FeatureFlag>(e => { e.ToTable("feature_flags"); e.HasKey(f => f.Key); });

        b.Entity<LegacyIdMap>(e =>
        {
            e.ToTable("legacy_id_map");
            e.HasIndex(m => new { m.LegacyApp, m.LegacyId }).IsUnique();
        });
    }
}
