using Microsoft.EntityFrameworkCore;
using SportSeek.Identity.Api.Data;

namespace SportSeek.Identity.Api.Domain;

/// <summary>
/// The remote switch for F3 (plan task 2.10). When it is off, the User and Partner apps fall back to
/// the Phase 1 login and the new token flows refuse them. Identity data is additive, so switching
/// off loses nothing.
/// </summary>
public class FeatureFlags(IdentityDb db)
{
    public const string SharedIdentity = "f3.shared_identity";
    public const string MinAppVersion = "app.min_version";

    public async Task<bool> SharedIdentityEnabledAsync() =>
        await db.FeatureFlags.Where(f => f.Key == SharedIdentity).Select(f => f.Enabled).FirstOrDefaultAsync();

    public async Task<string> MinAppVersionAsync() =>
        await db.FeatureFlags.Where(f => f.Key == MinAppVersion).Select(f => f.Value).FirstOrDefaultAsync() ?? "1.0.0";

    public static bool IsBelow(string version, string minimum) =>
        Version.TryParse(version, out var v) && Version.TryParse(minimum, out var m) && v < m;
}
