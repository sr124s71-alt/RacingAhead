using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Npgsql;

namespace SportSeek.Identity.Tests;

/// <summary>
/// Runs the real API in-process against a real PostgreSQL database, created per test class and
/// dropped afterwards. Point it at a server with IDENTITY_TEST_PG (defaults to local postgres/postgres).
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private static readonly string Server = Environment.GetEnvironmentVariable("IDENTITY_TEST_PG")
        ?? "Host=localhost;Port=5432;Username=postgres;Password=postgres";

    private readonly string _database = $"sportseek_identity_test_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development"); // enables the dev OTP inbox the tests read codes from
        builder.UseSetting("ConnectionStrings:Identity", $"{Server};Database={_database}");
        builder.UseSetting("RateLimits:OtpPerIpPerMinute", "1000");
    }

    public Task InitializeAsync() => Task.CompletedTask;

    async Task IAsyncLifetime.DisposeAsync()
    {
        await base.DisposeAsync();
        NpgsqlConnection.ClearAllPools();
        await using var conn = new NpgsqlConnection(Server);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand($"DROP DATABASE IF EXISTS {_database} WITH (FORCE)", conn);
        await cmd.ExecuteNonQueryAsync();
    }

    public Api Api() => new(CreateClient());
}

public sealed record OtpStart(HttpStatusCode Status, JsonElement Body)
{
    public Guid ChallengeId => Body.GetProperty("challengeId").GetGuid();
    public string Scenario => Body.GetProperty("scenario").GetString()!;
}

public sealed record TokenResult(HttpStatusCode Status, JsonElement Body)
{
    public bool Ok => Status == HttpStatusCode.OK;
    public string AccessToken => Body.GetProperty("access_token").GetString()!;
    public string? Error => Body.TryGetProperty("error_description", out var d) ? d.GetString() : null;

    /// <summary>The decoded access-token payload (signed JWT; encryption is disabled for the POC).</summary>
    public JsonElement Claims
    {
        get
        {
            var part = AccessToken.Split('.')[1].Replace('-', '+').Replace('_', '/');
            part = part.PadRight(part.Length + (4 - part.Length % 4) % 4, '=');
            return JsonDocument.Parse(Encoding.UTF8.GetString(Convert.FromBase64String(part))).RootElement;
        }
    }

    public string Sub => Claims.GetProperty("sub").GetString()!;

    public string[] Roles => Claims.TryGetProperty("role", out var r)
        ? r.ValueKind == JsonValueKind.Array ? r.EnumerateArray().Select(x => x.GetString()!).ToArray() : [r.GetString()!]
        : [];

    public string Outcome => Claims.GetProperty("link_outcome").GetString()!;
}

/// <summary>Drives the API the way the apps do.</summary>
public class Api(HttpClient http)
{
    public const string AdminPhone = "+919000000001";
    public HttpClient Http => http;

    public async Task<OtpStart> RequestOtpAsync(string client, string identifier, string? role = null)
    {
        var res = await http.PostAsJsonAsync("/api/otp/request", new { client, identifier, role });
        return new(res.StatusCode, await res.Content.ReadFromJsonAsync<JsonElement>());
    }

    public async Task<string> LatestCodeAsync(string normalisedTo)
    {
        var inbox = await http.GetFromJsonAsync<JsonElement>("/api/dev/otp-inbox");
        return inbox.EnumerateArray().First(m => m.GetProperty("to").GetString() == normalisedTo).GetProperty("code").GetString()!;
    }

    public Task<TokenResult> OtpTokenAsync(string client, Guid challengeId, string code, string? name = null, string? role = null)
    {
        var form = new Dictionary<string, string>
        {
            ["grant_type"] = "urn:sportseek:grant-type:otp",
            ["client_id"] = client,
            ["challenge_id"] = challengeId.ToString(),
            ["otp"] = code,
            ["scope"] = "offline_access profile roles",
        };
        if (name is not null) form["name"] = name;
        if (role is not null) form["role"] = role;
        return TokenAsync(form);
    }

    public Task<TokenResult> PasswordTokenAsync(string client, string username, string password) => TokenAsync(new()
    {
        ["grant_type"] = "password", ["client_id"] = client, ["username"] = username, ["password"] = password,
        ["scope"] = "offline_access profile roles",
    });

    public Task<TokenResult> RefreshAsync(string client, string refreshToken) => TokenAsync(new()
    {
        ["grant_type"] = "refresh_token", ["client_id"] = client, ["refresh_token"] = refreshToken,
    });

    private async Task<TokenResult> TokenAsync(Dictionary<string, string> form)
    {
        var res = await http.PostAsync("/connect/token", new FormUrlEncodedContent(form));
        return new(res.StatusCode, await res.Content.ReadFromJsonAsync<JsonElement>());
    }

    /// <summary>Full OTP sign-in: request, read the code from the dev inbox, exchange it for tokens.</summary>
    public async Task<TokenResult> SignInWithOtpAsync(string client, string identifier, string normalised, string? name = null, string? role = null)
    {
        var start = await RequestOtpAsync(client, identifier, role);
        Assert.Equal(HttpStatusCode.OK, start.Status);
        return await OtpTokenAsync(client, start.ChallengeId, await LatestCodeAsync(normalised), name, role);
    }

    public Task<TokenResult> AdminSignInAsync() => SignInWithOtpAsync("admin-portal", AdminPhone, AdminPhone);

    public async Task<(HttpStatusCode Status, JsonElement Body)> SendAsync(HttpMethod method, string url, string token, object? body = null,
        Dictionary<string, string>? headers = null)
    {
        var req = new HttpRequestMessage(method, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        if (body is not null) req.Content = JsonContent.Create(body);
        foreach (var (k, v) in headers ?? []) req.Headers.Add(k, v);
        var res = await http.SendAsync(req);
        var text = await res.Content.ReadAsStringAsync();
        return (res.StatusCode, text.Length == 0 ? default : JsonDocument.Parse(text).RootElement);
    }
}
