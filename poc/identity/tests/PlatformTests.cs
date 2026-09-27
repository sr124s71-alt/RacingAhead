using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace SportSeek.Identity.Tests;

/// <summary>Bootstrap, remote switch and minimum version. Own database, since they change global state.</summary>
public class BootstrapTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly Api _api = factory.Api();

    [Fact]
    public async Task Bootstrap_loads_phase1_accounts_1_to_1__reports_duplicates__and_owners_claim_by_otp()
    {
        var admin = await _api.AdminSignInAsync();
        var (status, report) = await _api.SendAsync(HttpMethod.Post, "/api/admin/bootstrap", admin.AccessToken);
        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(6, report.GetProperty("phase1UserApp").GetInt32());
        Assert.Equal(5, report.GetProperty("phase1PartnerApp").GetInt32());
        Assert.Equal(11, report.GetProperty("identitiesCreated").GetInt32());

        // Arjun and Priya share a phone across apps; Rahul shares an email (different case).
        var dupes = report.GetProperty("duplicateCandidates").EnumerateArray().Select(g => g.GetProperty("value").GetString()).ToList();
        Assert.Equal(["+919123456780", "+919876543210", "rahul.verma@example.com"], dupes);

        // Idempotent.
        var (_, again) = await _api.SendAsync(HttpMethod.Post, "/api/admin/bootstrap", admin.AccessToken);
        Assert.Equal(0, again.GetProperty("identitiesCreated").GetInt32());
        Assert.Equal(11, again.GetProperty("alreadyMapped").GetInt32());

        // Arjun proves his number in the Partner App: he claims the Phase 1 partner identity (and its verified KYC).
        var start = await _api.RequestOtpAsync("partner-app", "9876543210");
        Assert.Equal("sign-in", start.Scenario);
        Assert.True(start.Body.GetProperty("fromPhase1").GetBoolean());
        var arjun = await _api.OtpTokenAsync("partner-app", start.ChallengeId, await _api.LatestCodeAsync("+919876543210"));
        Assert.Equal("ClaimedLegacy", arjun.Outcome);
        Assert.Equal(["FacilityPartner"], arjun.Roles);
        var (_, me) = await _api.SendAsync(HttpMethod.Get, "/api/me", arjun.AccessToken);
        Assert.Equal("Verified", me.GetProperty("kyc").GetProperty("status").GetString());
        Assert.Equal("legacy-partner-app", me.GetProperty("source").GetString());

        // From now on the verified number resolves to that identity in the User App too.
        // (His separate Phase 1 User App record stays a duplicate candidate for the R2 merge.)
        var userApp = await _api.SignInWithOtpAsync("user-app", "98765 43210", "+919876543210");
        Assert.Equal(arjun.Sub, userApp.Sub);
        Assert.Equal("Linked", userApp.Outcome);
    }
}

public class RemoteSwitchTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly Api _api = factory.Api();

    [Fact]
    public async Task Switching_F3_off_falls_back_to_phase1_login__and_switching_on_loses_nothing()
    {
        var asha = await _api.SignInWithOtpAsync("user-app", "9811100020", "+919811100020", name: "Asha");
        var admin = await _api.AdminSignInAsync();

        await _api.SendAsync(HttpMethod.Put, "/api/admin/flags", admin.AccessToken, new { sharedIdentityEnabled = false });

        var config = await _api.Http.GetFromJsonAsync<JsonElement>("/api/config");
        Assert.False(config.GetProperty("sharedIdentityEnabled").GetBoolean());
        Assert.Equal((HttpStatusCode)409, (await _api.RequestOtpAsync("user-app", "9811100020")).Status);

        var phase1 = await _api.Http.PostAsJsonAsync("/api/phase1/login", new { client = "user-app", identifier = "9812345678", password = "demo1234" });
        Assert.Equal(HttpStatusCode.OK, phase1.StatusCode);
        Assert.Equal("Sneha Iyer", (await phase1.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("name").GetString());

        // Admin portal is not behind the switch, so it can turn F3 back on.
        await _api.SendAsync(HttpMethod.Put, "/api/admin/flags", admin.AccessToken, new { sharedIdentityEnabled = true });
        var back = await _api.SignInWithOtpAsync("user-app", "9811100020", "+919811100020");
        Assert.Equal(asha.Sub, back.Sub);
        Assert.Equal("SignedIn", back.Outcome);
    }

    [Fact]
    public async Task Apps_below_the_minimum_version_get_426()
    {
        var admin = await _api.AdminSignInAsync();
        await _api.SendAsync(HttpMethod.Put, "/api/admin/flags", admin.AccessToken, new { minAppVersion = "1.1.0" });
        try
        {
            var user = await _api.SignInWithOtpAsync("user-app", "9811100021", "+919811100021");
            var old = new Dictionary<string, string> { ["X-App-Client"] = "user-app", ["X-App-Version"] = "1.0.0" };
            var (status, body) = await _api.SendAsync(HttpMethod.Get, "/api/me", user.AccessToken, headers: old);
            Assert.Equal(HttpStatusCode.UpgradeRequired, status);
            Assert.Equal("1.1.0", body.GetProperty("minAppVersion").GetString());

            old["X-App-Version"] = "1.1.0";
            Assert.Equal(HttpStatusCode.OK, (await _api.SendAsync(HttpMethod.Get, "/api/me", user.AccessToken, headers: old)).Status);
        }
        finally
        {
            await _api.SendAsync(HttpMethod.Put, "/api/admin/flags", admin.AccessToken, new { minAppVersion = "1.0.0" });
        }
    }
}
