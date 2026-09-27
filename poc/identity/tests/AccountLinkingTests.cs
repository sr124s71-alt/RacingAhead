using System.Net;
using System.Text.Json;

namespace SportSeek.Identity.Tests;

/// <summary>Acceptance tests for F3 account linking (TA §6.1). Each test uses its own phone numbers.</summary>
public class AccountLinkingTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly Api _api = factory.Api();

    [Fact]
    public async Task Existing_UserApp_phone_registers_on_PartnerApp__same_identity_role_added_no_duplicate()
    {
        var player = await _api.SignInWithOtpAsync("user-app", "9811100001", "+919811100001", name: "Asha Kumar");
        Assert.True(player.Ok);
        Assert.Equal("Created", player.Outcome);

        var start = await _api.RequestOtpAsync("partner-app", "9811100001");
        Assert.Equal("link", start.Scenario);
        var partner = await _api.OtpTokenAsync("partner-app", start.ChallengeId, await _api.LatestCodeAsync("+919811100001"));

        Assert.True(partner.Ok, partner.Error);
        Assert.Equal(player.Sub, partner.Sub);                 // same identity
        Assert.Equal("Linked", partner.Outcome);
        Assert.Equal(["FacilityPartner"], partner.Roles);       // role added

        var admin = await _api.AdminSignInAsync();
        var (_, identities) = await _api.SendAsync(HttpMethod.Get, "/api/admin/identities", admin.AccessToken);
        var holders = identities.EnumerateArray().Where(i => i.GetProperty("contacts").EnumerateArray()
            .Any(c => c.GetProperty("value").GetString() == "+919811100001")).ToList();
        Assert.Single(holders);                                // no duplicate
        Assert.Equal(["Player", "FacilityPartner"],
            holders[0].GetProperty("roles").EnumerateArray().Select(r => r.GetProperty("role").GetString()));
    }

    [Fact]
    public async Task Different_phone_formats_resolve_to_the_same_identity()
    {
        var a = await _api.SignInWithOtpAsync("user-app", "098111 00002", "+919811100002");
        var b = await _api.SignInWithOtpAsync("partner-app", "+91-98111-00002", "+919811100002");
        Assert.Equal(a.Sub, b.Sub);
    }

    [Fact]
    public async Task Wrong_otp_never_links__and_the_number_locks_after_five_failures()
    {
        var owner = await _api.SignInWithOtpAsync("user-app", "9811100003", "+919811100003");

        var start = await _api.RequestOtpAsync("partner-app", "9811100003");
        TokenResult attempt = null!;
        for (var i = 1; i <= 5; i++)
        {
            attempt = await _api.OtpTokenAsync("partner-app", start.ChallengeId, "000000");
            Assert.False(attempt.Ok);
        }
        Assert.Contains("Locked until", attempt.Error);

        // Even the right code for a fresh challenge is refused while locked.
        var again = await _api.RequestOtpAsync("partner-app", "9811100003");
        Assert.Equal((HttpStatusCode)423, again.Status);

        // The identity is untouched: still only the Player role.
        var (_, me) = await _api.SendAsync(HttpMethod.Get, "/api/me", owner.AccessToken);
        Assert.Equal(["Player"], me.GetProperty("roles").EnumerateArray().Select(r => r.GetProperty("role").GetString()));
    }

    [Fact]
    public async Task Tokens_are_app_scoped__each_carries_only_its_own_apps_roles()
    {
        var user = await _api.SignInWithOtpAsync("user-app", "9811100004", "+919811100004");
        var partner = await _api.SignInWithOtpAsync("partner-app", "9811100004", "+919811100004", role: "Coach");

        Assert.Equal(["Player"], user.Roles);
        Assert.Equal(["Coach"], partner.Roles);

        // A partner-app token cannot reach admin endpoints; neither can a user-app one.
        var (status, _) = await _api.SendAsync(HttpMethod.Get, "/api/admin/identities", partner.AccessToken);
        Assert.Equal(HttpStatusCode.Forbidden, status);
    }

    [Fact]
    public async Task Kyc_submitted_in_PartnerApp_is_visible_in_UserApp()
    {
        var partner = await _api.SignInWithOtpAsync("partner-app", "9811100005", "+919811100005");
        var (status, _) = await _api.SendAsync(HttpMethod.Post, "/api/me/kyc", partner.AccessToken, new { docType = "PAN", docNumber = "ABCDE1234F" });
        Assert.Equal(HttpStatusCode.OK, status);

        var user = await _api.SignInWithOtpAsync("user-app", "9811100005", "+919811100005");
        var (_, me) = await _api.SendAsync(HttpMethod.Get, "/api/me", user.AccessToken);
        Assert.Equal("Submitted", me.GetProperty("kyc").GetProperty("status").GetString());
        Assert.Equal("partner-app", me.GetProperty("kyc").GetProperty("submittedVia").GetString());
        Assert.Equal("••••••234F", me.GetProperty("kyc").GetProperty("docRefMasked").GetString());
    }

    [Fact]
    public async Task One_credential_works_in_every_linked_app__but_a_password_never_links()
    {
        var user = await _api.SignInWithOtpAsync("user-app", "9811100006", "+919811100006");
        var (status, _) = await _api.SendAsync(HttpMethod.Post, "/api/me/password", user.AccessToken, new { newPassword = "Sport2026!" });
        Assert.Equal(HttpStatusCode.OK, status);

        var refused = await _api.PasswordTokenAsync("partner-app", "9811100006", "Sport2026!");
        Assert.False(refused.Ok);
        Assert.Contains("no_role_for_app", refused.Error);

        await _api.SignInWithOtpAsync("partner-app", "9811100006", "+919811100006"); // link by OTP
        var partner = await _api.PasswordTokenAsync("partner-app", "9811100006", "Sport2026!");
        Assert.True(partner.Ok, partner.Error);
        Assert.Equal(user.Sub, partner.Sub);
    }

    [Fact]
    public async Task Refresh_picks_up_a_role_linked_in_another_app_scope()
    {
        var user = await _api.SignInWithOtpAsync("user-app", "9811100007", "+919811100007");
        await _api.SignInWithOtpAsync("user-app", "9811100007", "+919811100007", role: "EventOrganiser");
        var refreshed = await _api.RefreshAsync("user-app", user.Body.GetProperty("refresh_token").GetString()!);
        Assert.True(refreshed.Ok, refreshed.Error);
        Assert.Equal(["EventOrganiser", "Player"], refreshed.Roles);
    }

    [Fact]
    public async Task Admin_portal_never_self_grants_admin()
    {
        var result = await _api.SignInWithOtpAsync("admin-portal", "9811100008", "+919811100008");
        Assert.False(result.Ok);
        Assert.Equal("access_denied", result.Body.GetProperty("error").GetString());
    }

    [Fact]
    public async Task Otp_requests_are_rate_limited_per_number()
    {
        for (var i = 0; i < 5; i++) Assert.Equal(HttpStatusCode.OK, (await _api.RequestOtpAsync("user-app", "9811100009")).Status);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await _api.RequestOtpAsync("user-app", "9811100009")).Status);
    }

    [Fact]
    public async Task Every_linking_decision_is_audited()
    {
        var user = await _api.SignInWithOtpAsync("user-app", "9811100010", "+919811100010");
        await _api.SignInWithOtpAsync("partner-app", "9811100010", "+919811100010");

        var admin = await _api.AdminSignInAsync();
        var (_, audit) = await _api.SendAsync(HttpMethod.Get, "/api/admin/audit?take=500", admin.AccessToken);
        var mine = audit.EnumerateArray().Where(a => a.GetProperty("identityId").ValueKind == JsonValueKind.String
            && a.GetProperty("identityId").GetString() == user.Sub).Select(a => a.GetProperty("action").GetString()).ToList();
        Assert.Contains("IDENTITY_CREATED", mine);
        Assert.Contains("ROLE_LINKED", mine);
    }
}
