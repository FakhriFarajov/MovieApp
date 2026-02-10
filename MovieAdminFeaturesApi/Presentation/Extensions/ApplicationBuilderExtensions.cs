using Microsoft.EntityFrameworkCore;
using MovieAdminFeaturesApi.Infrastructure.Context;
using Scalar.AspNetCore;

namespace MovieAdminFeaturesApi.Presentation.Extensions;

public static class ApplicationBuilderExtensions
{
    public static WebApplication UseApplicationMiddleware(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }
        
        app.UseCors("DefaultCors");
        
        // COOP / COEP headers for cross-origin isolation - iNeed it for the google OAuth to work properly
        app.Use(async (context, next) =>
        {
            context.Response.Headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups";
            context.Response.Headers["Cross-Origin-Embedder-Policy"] = "unsafe-none";
            await next();
        });
        
        // 2. Security / request processing
        
        app.UseHttpsRedirection();

        // 3. Authentication / Authorization BEFORE controllers
        app.UseAuthentication();
        app.UseAuthorization();

        // Middleware that blocks banned client profiles from accessing endpoints
        app.Use(async (context, next) =>
        {
            try
            {
                if (context.User?.Identity == null || !context.User.Identity.IsAuthenticated)
                {
                    await next();
                    return;
                }

                var clientProfileId = context.User.Claims.FirstOrDefault(c => c.Type == "client_profile_id")?.Value;
                if (string.IsNullOrWhiteSpace(clientProfileId))
                {
                    await next();
                    return;
                }

                var db = context.RequestServices.GetRequiredService<MovieApiDbContext>();
                var ban = await db.BannedUsers
                    .AsNoTracking()
                    .Where(b => b.ClientProfileId == clientProfileId)
                    .OrderByDescending(b => b.CreatedAt)
                    .FirstOrDefaultAsync();

                if (ban != null && (!ban.ExpiresAt.HasValue || ban.ExpiresAt.Value > DateTime.UtcNow))
                {
                    context.Response.StatusCode = 403;
                    context.Response.ContentType = "application/json";
                    var res = MovieAdminFeaturesApi.Core.DTOs.ClientDtos.Response.TypedResult<string>.Error("Your account is banned.");
                    await context.Response.WriteAsync(Newtonsoft.Json.JsonConvert.SerializeObject(res));
                    return;
                }

                await next();
            }
            catch
            {
                // In case of unexpected errors in ban-check, allow the request to proceed to avoid locking out users inadvertently
                await next();
            }
        });

        // 4. Controllers / endpoints
        app.MapControllers();
        

        // 5. Extra mappings (Scalar, health checks, etc.)
        app.MapScalarApiReference();

        return app;

    }
}