using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MovieAuthApi.Application.Services.Client.Interfaces;
using MovieAuthApi.Core.DTOs.ClientDtos.Request;
using MovieAuthApi.Core.DTOs.ClientDtos.Response;
using MovieAuthApi.Infrastructure.Context;

namespace MovieAuthApi.Presentation.Controllers.ClientControllers;


[ApiController]
[Route("api/Client/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly MovieApiDbContext _db;

    public AuthController(IAuthService authService, MovieApiDbContext db)
    {
        _authService = authService;
        _db = db;
    }

    [HttpPost("Login")]
    public async Task<IActionResult> LoginAsync(ClientLoginRequestDTO request)
    {
        var res = await _authService.LoginAsync(request);
        if (!res.IsSuccess)
        {
            if (res.StatusCode == 403)
            {
                var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.Trim().ToLowerInvariant());
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
    
    [HttpPost("RefreshToken")]
    public async Task<IActionResult> RefreshTokenAsync([FromBody] RefreshRequest request)
    {
        if (request == null || string.IsNullOrEmpty(request.RefreshToken))
            return BadRequest("Refresh token is required");

        var oldAccessToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

        var result = await _authService.RefreshTokenAsync(new RefreshRequest
        {
            RefreshToken = request.RefreshToken,
            OldAccessToken = oldAccessToken
        });

        if (!result.IsSuccess)
            return Unauthorized(result.Message);

        return Ok(result.Data); // Return new accessToken & refreshToken
    }



    [Authorize(Policy = "ClientPolicy")] // Require Bearer token
    [HttpPost("Logout")]
    public async Task<IActionResult> Logout()
    {
        // Extract the Bearer token from the Authorization header
        var authHeader = Request.Headers["Authorization"].ToString();
        var token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : authHeader;

        if (string.IsNullOrEmpty(token))
        {
            return BadRequest(new 
            { 
                isSuccess = false, 
                message = "No access token provided" 
            });
        }

        // Call the AuthService to logout (blacklist the token)
        var result = await _authService.LogoutAsync(token);

        return Ok(result); // result already contains success info
    }

}