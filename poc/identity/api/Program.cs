using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using OpenIddict.Validation.AspNetCore;
using SportSeek.Identity.Api.Data;
using SportSeek.Identity.Api.Domain;
using SportSeek.Identity.Api.Endpoints;
using static OpenIddict.Abstractions.OpenIddictConstants;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<IdentityDb>(o =>
{
    o.UseNpgsql(builder.Configuration.GetConnectionString("Identity"))
     .UseSnakeCaseNamingConvention();
    o.UseOpenIddict();
});

// ASP.NET Core Identity: one credential set per identity (password hashing, lockout, security stamp).
builder.Services.AddIdentityCore<AppIdentity>(o =>
    {
        o.Password.RequiredLength = 8;
        o.Password.RequireNonAlphanumeric = false;
        o.Password.RequireUppercase = false;
        o.Lockout.MaxFailedAccessAttempts = 5;
        o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    })
    .AddEntityFrameworkStores<IdentityDb>();

// OpenIddict: the OIDC server inside the .NET estate (ADR-01 leaning).
builder.Services.AddOpenIddict()
    .AddCore(o => o.UseEntityFrameworkCore().UseDbContext<IdentityDb>())
    .AddServer(o =>
    {
        o.SetTokenEndpointUris("connect/token");
        o.AllowPasswordFlow().AllowRefreshTokenFlow().AllowCustomFlow(Seeder.OtpGrantType);
        o.RegisterScopes(Scopes.Profile, Scopes.Roles, Scopes.OfflineAccess);
        o.SetAccessTokenLifetime(TimeSpan.FromMinutes(15));
        o.SetRefreshTokenLifetime(TimeSpan.FromDays(14));

        // POC keys are generated at start-up. Production uses certificates from the secrets store.
        o.AddEphemeralEncryptionKey().AddEphemeralSigningKey();
        // Plain signed JWTs so the demo can show exactly what each app's token carries.
        o.DisableAccessTokenEncryption();

        o.UseAspNetCore()
         .EnableTokenEndpointPassthrough()
         .DisableTransportSecurityRequirement(); // local HTTP demo only
    })
    .AddValidation(o =>
    {
        o.UseLocalServer();
        o.UseAspNetCore();
    });

builder.Services.AddAuthentication(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);
builder.Services.AddAuthorization(o =>
{
    o.AddPolicy("Admin", p => p.RequireClaim(Claims.Role, Roles.Admin).RequireClaim("app", Apps.AdminPortal));
});

var otpPerIpPerMinute = builder.Configuration.GetValue("RateLimits:OtpPerIpPerMinute", 30);
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("otp", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = otpPerIpPerMinute, Window = TimeSpan.FromMinutes(1) }));
});

builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddHttpContextAccessor();

builder.Services.AddSingleton<DevOtpInbox>();
builder.Services.AddScoped<AuditLog>();
builder.Services.AddScoped<FeatureFlags>();
builder.Services.AddScoped<OtpService>();
builder.Services.AddScoped<LinkingService>();
builder.Services.AddScoped<Phase1Store>();
builder.Services.AddScoped<BootstrapService>();

var app = builder.Build();

try
{
    await Seeder.InitialiseAsync(app.Services);
}
catch (Exception e) when (e is NpgsqlException || e.InnerException is NpgsqlException)
{
    // Say plainly what's wrong instead of a stack trace: this is the first thing people hit.
    var cs = new NpgsqlConnectionStringBuilder(builder.Configuration.GetConnectionString("Identity"));
    var reason = (e as NpgsqlException ?? (NpgsqlException)e.InnerException!).Message;
    var hint = e is PostgresException { SqlState: "28P01" } || reason.Contains("password", StringComparison.OrdinalIgnoreCase)
        ? "The PostgreSQL password is wrong or missing. Run SportSeek-POC.bat /config and enter the password you chose when installing PostgreSQL."
        : $"Check that PostgreSQL is running and listening on {cs.Host}:{cs.Port} (Windows: services.msc, service 'postgresql...').";
    Console.Error.WriteLine();
    Console.Error.WriteLine("============================================================================");
    Console.Error.WriteLine($" Can't connect to PostgreSQL as user '{cs.Username}' on {cs.Host}:{cs.Port}.");
    Console.Error.WriteLine($" Reason: {reason}");
    Console.Error.WriteLine($" Fix:    {hint}");
    Console.Error.WriteLine("============================================================================");
    Console.Error.WriteLine();
    Environment.ExitCode = 3;
    return;
}

app.UseCors();
app.UseMiddleware<MinimumVersionMiddleware>();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Redirect("/api/config"));
app.MapTokenEndpoint();
app.MapPublicEndpoints();
app.MapMeEndpoints();
app.MapAdminEndpoints();

app.Run();

public partial class Program;
