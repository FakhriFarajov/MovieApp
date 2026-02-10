using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using MovieAuthApi.Core.DTOs.AdminDtos.Response;
using MovieAuthApi.Infrastructure.Context;
using Newtonsoft.Json;

namespace MovieAuthApi.Infrastructure.Middlewares
{
    // Presentation-level middleware wrapper that performs the same ban check as the Infrastructure middleware.
    public class BannedUserMiddleware : IMiddleware
    {
        private readonly MovieApiDbContext _db;

        public BannedUserMiddleware(MovieApiDbContext db)
        {
            _db = db;
        }

        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            if (context.User?.Identity == null || !context.User.Identity.IsAuthenticated)
            {
                await next(context);
                return;
            }

            var clientProfileId = context.User.Claims.FirstOrDefault(c => c.Type == "client_profile_id")?.Value;
            if (string.IsNullOrWhiteSpace(clientProfileId))
            {
                await next(context);
                return;
            }

            var ban = await _db.BannedUsers
                .AsNoTracking()
                .Where(b => b.ClientProfileId == clientProfileId)
                .OrderByDescending(b => b.CreatedAt)
                .FirstOrDefaultAsync();

            if (ban != null && (!ban.ExpiresAt.HasValue || ban.ExpiresAt.Value > DateTime.UtcNow))
            {
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                var res = TypedResult<string>.Error("Your account is banned.");
                await context.Response.WriteAsync(JsonConvert.SerializeObject(res));
                return;
            }

            await next(context);
        }
    }
}

