using SportSeek.Identity.Api.Domain;

namespace SportSeek.Identity.Api.Endpoints;

/// <summary>
/// Minimum-version enforcement (plan task 2.10). The User and Partner apps send X-App-Client and
/// X-App-Version; versions below the configured minimum get 426 Upgrade Required, so old builds in
/// the field cannot keep calling APIs that have changed. Config and the dev inbox stay reachable.
/// </summary>
public class MinimumVersionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx, FeatureFlags flags)
    {
        var client = ctx.Request.Headers["X-App-Client"].ToString();
        var version = ctx.Request.Headers["X-App-Version"].ToString();
        var path = ctx.Request.Path;

        if (version.Length > 0 && client is Apps.UserApp or Apps.PartnerApp
            && !path.StartsWithSegments("/api/config") && !path.StartsWithSegments("/api/dev"))
        {
            var min = await flags.MinAppVersionAsync();
            if (FeatureFlags.IsBelow(version, min))
            {
                ctx.Response.StatusCode = StatusCodes.Status426UpgradeRequired;
                await ctx.Response.WriteAsJsonAsync(new { error = "upgrade_required", minAppVersion = min, yourVersion = version });
                return;
            }
        }
        await next(ctx);
    }
}
