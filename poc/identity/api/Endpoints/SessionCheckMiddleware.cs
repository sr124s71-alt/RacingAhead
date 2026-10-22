using System.Security.Claims;
using SportSeek.Identity.Api.Domain;

namespace SportSeek.Identity.Api.Endpoints;

/// <summary>
/// Access tokens are self-contained and live 15 minutes, so a signed-out device is checked on every
/// API call too: its next request gets 401 straight away instead of when the token expires (F3-S03).
/// </summary>
public class SessionCheckMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx, SessionService sessions)
    {
        var path = ctx.Request.Path;
        if (ctx.User.Identity?.IsAuthenticated == true && (path.StartsWithSegments("/api/me") || path.StartsWithSegments("/api/admin"))
            && Guid.TryParse(ctx.User.FindFirstValue(SessionService.SessionClaim), out var sid))
        {
            var session = await sessions.FindActiveAsync(sid);
            if (session is null)
            {
                ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await ctx.Response.WriteAsJsonAsync(new { error = "device_signed_out", message = "This device was signed out. Sign in again." });
                return;
            }
            await sessions.TouchAsync(session);
        }
        await next(ctx);
    }
}
