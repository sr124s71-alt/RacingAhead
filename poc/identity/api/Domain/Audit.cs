using System.Text.Json;
using SportSeek.Identity.Api.Data;

namespace SportSeek.Identity.Api.Domain;

public static class AuditActions
{
    public const string OtpRequested = "OTP_REQUESTED";
    public const string OtpFailed = "OTP_FAILED";
    public const string OtpLockout = "OTP_LOCKOUT";
    public const string IdentityCreated = "IDENTITY_CREATED";
    public const string LegacyIdentityClaimed = "LEGACY_IDENTITY_CLAIMED";
    public const string RoleLinked = "ROLE_LINKED";
    public const string SignedIn = "SIGNED_IN";
    public const string PasswordSet = "PASSWORD_SET";
    public const string PasswordSignIn = "PASSWORD_SIGN_IN";
    public const string PasswordRefused = "PASSWORD_SIGN_IN_REFUSED";
    public const string ProfileUpdated = "PROFILE_UPDATED";
    public const string KycSubmitted = "KYC_SUBMITTED";
    public const string KycVerified = "KYC_VERIFIED";
    public const string BootstrapRun = "BOOTSTRAP_RUN";
    public const string FlagChanged = "FLAG_CHANGED";
    public const string LegacyLogin = "PHASE1_LOGIN";
    public const string DemoReset = "DEMO_RESET";
}

/// <summary>Every identity and linking decision is written to identity.audit_log (TA §6.1 step 6).</summary>
public class AuditLog(IdentityDb db, IHttpContextAccessor http)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public void Add(string action, Guid? identityId = null, string? client = null, object? detail = null)
    {
        db.Audit.Add(new AuditEntry
        {
            Action = action,
            IdentityId = identityId,
            Client = client,
            Detail = detail is null ? null : JsonSerializer.Serialize(detail, Json),
            Ip = http.HttpContext?.Connection.RemoteIpAddress?.ToString(),
        });
    }
}
