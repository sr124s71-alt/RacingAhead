using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace SportSeek.Identity.Tests;

/// <summary>
/// Acceptance criteria from the Product Backlog (SRV-SPS-2A-BLG-004) that the first tests didn't cover:
/// F3-S01 per-device limit, F3-S03 per-device sign-out, F3-S04 reconciliation, F3-S05 transparent
/// migration, F3-S06 KYC reject with reason, and the seeded demo identity.
/// </summary>
public class BacklogTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly Api _api = factory.Api();

    private Task<TokenResult> PasswordOnDevice(string client, string user, string password, string deviceId, string deviceName) =>
        _api.TokenAsync(new()
        {
            ["grant_type"] = "password", ["client_id"] = client, ["username"] = user, ["password"] = password,
            ["scope"] = "offline_access profile roles", ["device_id"] = deviceId, ["device_name"] = deviceName,
        });

    [Fact]
    public async Task Demo_identity_signs_in_to_both_apps_with_one_password__app_scoped_roles_and_shared_kyc()
    {
        var user = await PasswordOnDevice("user-app", "+91 90000 00002", "Demo@2026", "d-user", "Pixel 8");
        var partner = await PasswordOnDevice("partner-app", "kavya.reddy@example.com", "Demo@2026", "d-partner", "iPhone 15");
        Assert.True(user.Ok, user.Error);
        Assert.True(partner.Ok, partner.Error);
        Assert.Equal(user.Sub, partner.Sub);
        Assert.Equal(["Player"], user.Roles);
        Assert.Equal(["Coach"], partner.Roles);

        var (_, me) = await _api.SendAsync(HttpMethod.Get, "/api/me", user.AccessToken);
        Assert.Equal("Verified", me.GetProperty("kyc").GetProperty("status").GetString());

        // F3-S03: the Admin Portal takes the same kind of credential.
        var admin = await PasswordOnDevice("admin-portal", "+919000000001", "Admin@2026", "d-admin", "Chrome");
        Assert.True(admin.Ok, admin.Error);
    }

    [Fact]
    public async Task Signing_out_one_device_leaves_the_other_devices_signed_in()
    {
        var phone = await _api.SignInWithOtpAsync("user-app", "9811100031", "+919811100031");
        var partnerA = await _api.OtpTokenAsync("partner-app", (await _api.RequestOtpAsync("partner-app", "9811100031")).ChallengeId,
            await _api.LatestCodeAsync("+919811100031"));
        Assert.True(partnerA.Ok, partnerA.Error);

        var (_, sessions) = await _api.SendAsync(HttpMethod.Get, "/api/me/sessions", phone.AccessToken);
        var partnerSession = sessions.EnumerateArray().Single(s => s.GetProperty("client").GetString() == "partner-app");
        Assert.Equal(2, sessions.GetArrayLength());

        var (status, _) = await _api.SendAsync(HttpMethod.Post, $"/api/me/sessions/{partnerSession.GetProperty("sessionId").GetGuid()}/revoke", phone.AccessToken);
        Assert.Equal(HttpStatusCode.OK, status);

        // The revoked device is out at once: its access token and its refresh token stop working...
        Assert.Equal(HttpStatusCode.Unauthorized, (await _api.SendAsync(HttpMethod.Get, "/api/me", partnerA.AccessToken)).Status);
        var refresh = await _api.RefreshAsync("partner-app", partnerA.Body.GetProperty("refresh_token").GetString()!);
        Assert.False(refresh.Ok);
        Assert.Contains("device_signed_out", refresh.Error);

        // ...and the other device carries on, including refreshing.
        Assert.Equal(HttpStatusCode.OK, (await _api.SendAsync(HttpMethod.Get, "/api/me", phone.AccessToken)).Status);
        Assert.True((await _api.RefreshAsync("user-app", phone.Body.GetProperty("refresh_token").GetString()!)).Ok);
    }

    [Fact]
    public async Task Admin_rejects_kyc_with_a_reason__the_person_sees_it_and_can_resubmit()
    {
        var partner = await _api.SignInWithOtpAsync("partner-app", "9811100032", "+919811100032");
        await _api.SendAsync(HttpMethod.Post, "/api/me/kyc", partner.AccessToken, new { docType = "PAN", docNumber = "ABCDE1234F" });
        var admin = await _api.AdminSignInAsync();

        var (_, identities) = await _api.SendAsync(HttpMethod.Get, "/api/admin/identities", admin.AccessToken);
        var id = identities.EnumerateArray().First(i => i.GetProperty("identityId").GetString() == partner.Sub).GetProperty("identityId").GetString();

        var (noReason, _) = await _api.SendAsync(HttpMethod.Post, $"/api/admin/identities/{id}/kyc/reject", admin.AccessToken, new { reason = "" });
        Assert.Equal(HttpStatusCode.BadRequest, noReason);
        var (rejected, _) = await _api.SendAsync(HttpMethod.Post, $"/api/admin/identities/{id}/kyc/reject", admin.AccessToken,
            new { reason = "PAN image is blurred" });
        Assert.Equal(HttpStatusCode.OK, rejected);

        var (_, me) = await _api.SendAsync(HttpMethod.Get, "/api/me", partner.AccessToken);
        Assert.Equal("Rejected", me.GetProperty("kyc").GetProperty("status").GetString());
        Assert.Equal("PAN image is blurred", me.GetProperty("kyc").GetProperty("rejectedReason").GetString());

        var (resubmit, again) = await _api.SendAsync(HttpMethod.Post, "/api/me/kyc", partner.AccessToken, new { docType = "PAN", docNumber = "ABCDE9999F" });
        Assert.Equal(HttpStatusCode.OK, resubmit);
        Assert.Equal("Submitted", again.GetProperty("kyc").GetProperty("status").GetString());
    }

    [Fact]
    public async Task Otp_requests_are_limited_per_device_across_numbers()
    {
        HttpStatusCode last = HttpStatusCode.OK;
        for (var i = 0; i < 11; i++)
        {
            var req = new HttpRequestMessage(HttpMethod.Post, "/api/otp/request")
            {
                Content = JsonContent.Create(new { client = "user-app", identifier = $"98111002{i:00}" }),
            };
            req.Headers.Add("X-Device-Id", "one-busy-phone");
            last = (await _api.Http.SendAsync(req)).StatusCode;
            if (i < 10) Assert.Equal(HttpStatusCode.OK, last);
        }
        Assert.Equal(HttpStatusCode.TooManyRequests, last);
    }
}

/// <summary>Own database: switches F3 off and on, and runs the bootstrap.</summary>
public class BacklogSwitchTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly Api _api = factory.Api();

    [Fact]
    public async Task Phase1_session_moves_onto_shared_identity_when_F3_is_switched_on_without_signing_in_again()
    {
        var admin = await _api.AdminSignInAsync();
        await _api.SendAsync(HttpMethod.Put, "/api/admin/flags", admin.AccessToken, new { sharedIdentityEnabled = false });

        var login = await _api.Http.PostAsJsonAsync("/api/phase1/login", new { client = "user-app", identifier = "9812345678", password = "demo1234" });
        var phase1 = await login.Content.ReadFromJsonAsync<JsonElement>();
        var handover = phase1.GetProperty("migrationToken").GetString()!;

        // While F3 is off the hand-over is refused; the app keeps its Phase 1 session.
        var tooEarly = await _api.TokenAsync(new()
        {
            ["grant_type"] = "urn:sportseek:grant-type:phase1-session", ["client_id"] = "user-app", ["phase1_session"] = handover,
        });
        Assert.False(tooEarly.Ok);

        await _api.SendAsync(HttpMethod.Put, "/api/admin/flags", admin.AccessToken, new { sharedIdentityEnabled = true });
        var moved = await _api.TokenAsync(new()
        {
            ["grant_type"] = "urn:sportseek:grant-type:phase1-session", ["client_id"] = "user-app", ["phase1_session"] = handover,
            ["scope"] = "offline_access profile roles", ["device_id"] = "sneha-phone", ["device_name"] = "Sneha's phone",
        });
        Assert.True(moved.Ok, moved.Error);
        Assert.Equal("Migrated", moved.Outcome);
        Assert.Equal(["Player"], moved.Roles);
        var (_, me) = await _api.SendAsync(HttpMethod.Get, "/api/me", moved.AccessToken);
        Assert.Equal("Sneha Iyer", me.GetProperty("displayName").GetString());
        Assert.Equal("legacy-user-app", me.GetProperty("source").GetString());

        // A hand-over token for one app can't be used by another.
        var wrongApp = await _api.TokenAsync(new()
        {
            ["grant_type"] = "urn:sportseek:grant-type:phase1-session", ["client_id"] = "partner-app", ["phase1_session"] = handover,
        });
        Assert.False(wrongApp.Ok);

        // The later full bootstrap reuses the identity created for Sneha: still 1:1 and reconciled.
        var (_, report) = await _api.SendAsync(HttpMethod.Post, "/api/admin/bootstrap", admin.AccessToken);
        Assert.Equal(10, report.GetProperty("identitiesCreated").GetInt32());
        var rec = report.GetProperty("reconciliation");
        Assert.Equal(11, rec.GetProperty("phase1Accounts").GetInt32());
        Assert.Equal(11, rec.GetProperty("mappedIdentities").GetInt32());
        Assert.True(rec.GetProperty("matches").GetBoolean());
    }
}
