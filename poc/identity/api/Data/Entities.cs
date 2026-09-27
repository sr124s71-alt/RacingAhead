using Microsoft.AspNetCore.Identity;

namespace SportSeek.Identity.Api.Data;

/// <summary>One record per person: the anchor for contacts, roles, KYC and credentials (TA §6.1).</summary>
public class AppIdentity : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    /// <summary>native | legacy-user-app | legacy-partner-app</summary>
    public string Source { get; set; } = IdentitySources.Native;
    /// <summary>The client (app) the identity was first created from.</summary>
    public string CreatedVia { get; set; } = "";

    public List<Contact> Contacts { get; set; } = new();
    public List<RoleAssignment> Roles { get; set; } = new();
    public Kyc? Kyc { get; set; }
}

public static class IdentitySources
{
    public const string Native = "native";
    public const string LegacyUserApp = "legacy-user-app";
    public const string LegacyPartnerApp = "legacy-partner-app";
}

/// <summary>A phone (E.164) or email (lower-case), normalised. Verified values are unique across identities.</summary>
public class Contact
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid IdentityId { get; set; }
    public AppIdentity? Identity { get; set; }
    /// <summary>phone | email</summary>
    public string Type { get; set; } = "";
    public string Value { get; set; } = "";
    public bool Verified { get; set; }
    public DateTimeOffset? VerifiedAt { get; set; }
    /// <summary>otp | legacy-bootstrap</summary>
    public string Source { get; set; } = "otp";
}

public class RoleAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid IdentityId { get; set; }
    public AppIdentity? Identity { get; set; }
    public string Role { get; set; } = "";
    /// <summary>The client (app) through which the role was granted.</summary>
    public string GrantedVia { get; set; } = "";
    public DateTimeOffset GrantedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>KYC lives on the identity and is reused by every role and app (SOW §7.4).</summary>
public class Kyc
{
    public Guid IdentityId { get; set; }
    public AppIdentity? Identity { get; set; }
    /// <summary>NotStarted | Submitted | Verified | Rejected</summary>
    public string Status { get; set; } = "NotStarted";
    public string? DocType { get; set; }
    /// <summary>Masked document reference only. Real evidence goes to restricted storage.</summary>
    public string? DocRefMasked { get; set; }
    public string? SubmittedVia { get; set; }
    public DateTimeOffset? SubmittedAt { get; set; }
    public DateTimeOffset? VerifiedAt { get; set; }
}

public class OtpChallenge
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Client { get; set; } = "";
    public string Channel { get; set; } = "";      // phone | email
    public string Destination { get; set; } = "";  // normalised identifier
    public string CodeHash { get; set; } = "";     // SHA-256(challengeId:code); the code itself is never stored
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAt { get; set; }
    public int Attempts { get; set; }
    public DateTimeOffset? ConsumedAt { get; set; }
    public string? RequestIp { get; set; }
}

/// <summary>Failure counter and lockout per identifier, to resist brute force across challenges.</summary>
public class OtpLockout
{
    public string Destination { get; set; } = "";
    public int FailedCount { get; set; }
    public DateTimeOffset WindowStart { get; set; }
    public DateTimeOffset? LockedUntil { get; set; }
}

public class AuditEntry
{
    public long Id { get; set; }
    public DateTimeOffset At { get; set; } = DateTimeOffset.UtcNow;
    public Guid? IdentityId { get; set; }
    public string Action { get; set; } = "";
    public string? Client { get; set; }
    public string? Detail { get; set; }
    public string? Ip { get; set; }
}

public class FeatureFlag
{
    public string Key { get; set; } = "";
    public bool Enabled { get; set; }
    public string? Value { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>Audit mapping from a Phase 1 account to its identity (bootstrap R1, merge R2).</summary>
public class LegacyIdMap
{
    public long Id { get; set; }
    public string LegacyApp { get; set; } = "";   // user-app | partner-app
    public int LegacyId { get; set; }
    public Guid IdentityId { get; set; }
    public DateTimeOffset BootstrappedAt { get; set; } = DateTimeOffset.UtcNow;
}
