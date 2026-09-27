using Microsoft.EntityFrameworkCore;
using SportSeek.Identity.Api.Data;

namespace SportSeek.Identity.Api.Domain;

public enum LinkOutcome
{
    /// <summary>No identity held this identifier: a new identity was created with the app's role.</summary>
    Created,
    /// <summary>The identity already held a role for this app: a normal sign-in.</summary>
    SignedIn,
    /// <summary>The identity existed (from another app) and this app's role was added to it. No duplicate.</summary>
    Linked,
    /// <summary>A bootstrapped Phase 1 account was claimed by proving ownership of its contact.</summary>
    ClaimedLegacy,
    /// <summary>Admin portal: identity has no Admin role. Admin roles are never self-granted.</summary>
    Refused,
}

public sealed record LinkResult(LinkOutcome Outcome, AppIdentity? Identity, string? RoleAdded = null);

public sealed record IdentifierLookup(bool IdentityExists, bool HasRoleForThisApp, bool FromPhase1);

/// <summary>
/// The account-linking flow of TA §6.1 "Account linking":
/// the identifier is normalised, verified contacts are looked up, and a match is only ever linked
/// AFTER the caller has proved ownership by OTP. Linking adds a role to the existing identity; it
/// never creates a second record.
/// </summary>
public class LinkingService(IdentityDb db, AuditLog audit)
{
    /// <summary>Pre-OTP lookup so the app can explain what will happen. It changes nothing.</summary>
    public async Task<IdentifierLookup> LookupAsync(AppClient client, NormalisedIdentifier id)
    {
        var identity = await FindOwnerAsync(client, id);
        if (identity is null) return new(false, false, false);
        var hasRole = identity.Roles.Any(r => client.AllowedRoles.Contains(r.Role));
        var verified = identity.Contacts.Any(c => c.Type == id.Type && c.Value == id.Value && c.Verified);
        return new(true, hasRole, !verified);
    }

    /// <summary>Call only after <see cref="OtpService.VerifyAsync"/> succeeded for <paramref name="id"/>.</summary>
    public async Task<LinkResult> CompleteOtpSignInAsync(AppClient client, NormalisedIdentifier id, string? requestedRole, string? displayName)
    {
        var role = requestedRole is not null && client.AllowedRoles.Contains(requestedRole) ? requestedRole : client.DefaultRole;
        var identity = await FindOwnerAsync(client, id);
        var outcome = LinkOutcome.SignedIn;

        if (client.ClientId == Apps.AdminPortal)
        {
            // Admin access is granted by SportSeek, never through self-registration.
            if (identity is null || identity.Roles.All(r => r.Role != Roles.Admin)) return new(LinkOutcome.Refused, identity);
            VerifyContact(identity, id);
            audit.Add(AuditActions.SignedIn, identity.Id, client.ClientId, new { via = "otp" });
            await db.SaveChangesAsync();
            return new(LinkOutcome.SignedIn, identity);
        }

        if (identity is null)
        {
            identity = new AppIdentity
            {
                Id = Guid.NewGuid(),
                UserName = null,
                DisplayName = string.IsNullOrWhiteSpace(displayName) ? "SportSeek member" : displayName.Trim(),
                CreatedVia = client.ClientId,
                SecurityStamp = Guid.NewGuid().ToString("N"),
            };
            identity.UserName = identity.Id.ToString("N");
            identity.NormalizedUserName = identity.UserName.ToUpperInvariant();
            identity.Contacts.Add(new Contact { Type = id.Type, Value = id.Value, Verified = true, VerifiedAt = DateTimeOffset.UtcNow });
            identity.Roles.Add(new RoleAssignment { Role = role, GrantedVia = client.ClientId });
            identity.Kyc = new Kyc();
            db.Users.Add(identity);
            audit.Add(AuditActions.IdentityCreated, identity.Id, client.ClientId,
                new { identifier = id.Masked, role, reason = "No identity holds this verified identifier" });
            await db.SaveChangesAsync();
            return new(LinkOutcome.Created, identity, role);
        }

        if (VerifyContact(identity, id))
        {
            outcome = LinkOutcome.ClaimedLegacy;
            audit.Add(AuditActions.LegacyIdentityClaimed, identity.Id, client.ClientId,
                new { identifier = id.Masked, source = identity.Source, reason = "Ownership of Phase 1 contact proved by OTP" });
        }

        string? added = null;
        var hasAppRole = identity.Roles.Any(r => client.AllowedRoles.Contains(r.Role));
        if (!hasAppRole || (requestedRole is not null && role == requestedRole && identity.Roles.All(r => r.Role != role)))
        {
            identity.Roles.Add(new RoleAssignment { IdentityId = identity.Id, Role = role, GrantedVia = client.ClientId });
            added = role;
            if (outcome != LinkOutcome.ClaimedLegacy) outcome = LinkOutcome.Linked;
            audit.Add(AuditActions.RoleLinked, identity.Id, client.ClientId, new
            {
                identifier = id.Masked,
                role,
                existingRoles = identity.Roles.Where(r => r.Role != role).Select(r => r.Role).ToArray(),
                reason = "Existing identity matched on verified identifier; ownership proved by OTP; role added, no new record",
            });
        }

        audit.Add(AuditActions.SignedIn, identity.Id, client.ClientId, new { via = "otp", outcome = outcome.ToString() });
        await db.SaveChangesAsync();
        return new(outcome, identity, added);
    }

    /// <summary>
    /// Password sign-in uses the one credential set on the identity (SOW §7.4). It never links:
    /// an identity without a role for this app must add it through the OTP flow first.
    /// </summary>
    public async Task<AppIdentity?> FindByVerifiedContactAsync(NormalisedIdentifier id) =>
        await WithGraph().FirstOrDefaultAsync(i => i.Contacts.Any(c => c.Type == id.Type && c.Value == id.Value && c.Verified));

    public IQueryable<AppIdentity> WithGraph() =>
        db.Users.Include(i => i.Contacts).Include(i => i.Roles).Include(i => i.Kyc).AsSplitQuery();

    /// <summary>
    /// Who owns this identifier? 1) the identity holding it as a VERIFIED contact; otherwise
    /// 2) a bootstrapped Phase 1 identity holding it unverified, preferring the one that came from
    /// this app (the other becomes a duplicate candidate for the R2 merge).
    /// </summary>
    private async Task<AppIdentity?> FindOwnerAsync(AppClient client, NormalisedIdentifier id)
    {
        var verified = await FindByVerifiedContactAsync(id);
        if (verified is not null) return verified;

        var legacySource = client.ClientId == Apps.PartnerApp ? IdentitySources.LegacyPartnerApp : IdentitySources.LegacyUserApp;
        var candidates = await WithGraph()
            .Where(i => i.Source != IdentitySources.Native && i.Contacts.Any(c => c.Type == id.Type && c.Value == id.Value))
            .OrderBy(i => i.CreatedAt)
            .ToListAsync();
        return candidates.FirstOrDefault(i => i.Source == legacySource) ?? candidates.FirstOrDefault();
    }

    /// <returns>true when an unverified (Phase 1) contact was verified now.</returns>
    private static bool VerifyContact(AppIdentity identity, NormalisedIdentifier id)
    {
        var contact = identity.Contacts.FirstOrDefault(c => c.Type == id.Type && c.Value == id.Value);
        if (contact is null)
        {
            identity.Contacts.Add(new Contact { IdentityId = identity.Id, Type = id.Type, Value = id.Value, Verified = true, VerifiedAt = DateTimeOffset.UtcNow });
            return false;
        }
        if (contact.Verified) return false;
        contact.Verified = true;
        contact.VerifiedAt = DateTimeOffset.UtcNow;
        return true;
    }
}
