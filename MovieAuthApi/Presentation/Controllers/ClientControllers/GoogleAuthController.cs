using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MovieAuthApi.Application.Services.Client.Interfaces;
using MovieAuthApi.Core.DTOs.ClientDtos.Request;
using MovieAuthApi.Core.DTOs.ClientDtos.Response;
using MovieAuthApi.Infrastructure.Context;

namespace MovieAuthApi.Presentation.Controllers.ClientControllers;

[ApiController]
[Route("api/Client/[controller]")]
public class GoogleAuthController : ControllerBase
{
    private readonly IGoogleAuthService _google;
    private readonly MovieApiDbContext _db;

    public GoogleAuthController(IGoogleAuthService google, MovieApiDbContext db)
    {
        _google = google;
        _db = db;
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleAuthDto dto)
    {
        var res = await _google.LoginAsync(dto);
        if (!res.IsSuccess)
        {
            if (res.StatusCode == 403)
            {
                // find user by email to get clientProfileId
                var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.Trim().ToLowerInvariant());
                if (user != null && !string.IsNullOrWhiteSpace(user.ClientProfileId))
                {
                    var ban = await _db.BannedUsers.AsNoTracking().Where(b => b.ClientProfileId == user.ClientProfileId).OrderByDescending(b => b.CreatedAt).FirstOrDefaultAsync();
                    if (ban != null && (!ban.ExpiresAt.HasValue || ban.ExpiresAt.Value > DateTime.UtcNow))
                    {
                        var banDto = new BanInfoDto
                        {
                            Reason = string.IsNullOrWhiteSpace(ban.Reason) ? "Your account is banned." : ban.Reason,
                            ExpiresAt = ban.ExpiresAt,
                            DurationSeconds = ban.ExpiresAt.HasValue ? (ban.ExpiresAt.Value - DateTime.UtcNow).TotalSeconds : (double?)null
                        };
                        return StatusCode(403, new { isSuccess = false, message = res.Message, data = banDto });
                    }
                }
            }

            return StatusCode(res.StatusCode, new { isSuccess = false, message = res.Message });
        }

        return Ok(new { isSuccess = true, data = res.Data });
    }
}
