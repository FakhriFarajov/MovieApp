using System.IdentityModel.Tokens.Jwt;
using System.Security.Authentication;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using MovieAuthApi.Application.Services.Admin.Interfaces;
using MovieAuthApi.Application.Services.Utils;
using MovieAuthApi.Core.DTOs.AdminDtos.Request;
using MovieAuthApi.Core.DTOs.AdminDtos.Response;
using MovieAuthApi.Infrastructure.Context;
using static BCrypt.Net.BCrypt;

namespace MovieAuthApi.Application.Services.Admin.Classes;

public class AuthService : IAuthService 
{
    private readonly MovieApiDbContext _context;
    private readonly TokenManager _tokenService;

    public AuthService(MovieApiDbContext context, TokenManager tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    
    public async Task<TypedResult<object>> LoginAsync(AdminLoginRequestDTO request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || Verify(request.Password, user.PasswordHash) == false)
        {
            throw new InvalidCredentialException("Invalid Credentials or no such user exists");
        }

        if (string.IsNullOrEmpty(user.AdminProfileId))
        {
            return TypedResult<object>.Error("User is not a admin.", 403);
        }

        var accessToken = await _tokenService.CreateTokenAsync(user);
        string refreshToken;
        var now = DateTime.UtcNow;
        if (!string.IsNullOrEmpty(user.RefreshToken) && user.RefreshTokenExpiryTime.HasValue &&
            user.RefreshTokenExpiryTime > now)
        {
            refreshToken = user.RefreshToken;
        }
        else
        {
            refreshToken = await _tokenService.CreateRefreshTokenAsync(user);
        }

        return TypedResult<object>.Success(new
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,

        }, "Successfully logged in");

    }

    public async Task<TypedResult<object>> LogoutAsync(string token)
    {
        if (string.IsNullOrEmpty(token))
            return TypedResult<object>.Error("Access token is required", 400);

        DateTime blacklistExpiry = DateTime.UtcNow.AddMinutes(3); // fallback short expiry
        string? userId = null;

        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(token);

            if (jwt.Payload.Exp.HasValue)
            {
                blacklistExpiry = DateTimeOffset.FromUnixTimeSeconds((long)jwt.Payload.Exp.Value).UtcDateTime;
            }

            userId = jwt.Claims.FirstOrDefault(c =>
                c.Type == ClaimTypes.NameIdentifier || c.Type == "sub" || c.Type == "id")?.Value;
        }
        catch
        {
            // invalid token -> still blacklist short time as fallback
        }

        await _tokenService.BlacklistTokenAsync(token, blacklistExpiry);

        if (!string.IsNullOrEmpty(userId))
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;
                _context.Users.Update(user);
                await _context.SaveChangesAsync();
            }
        }

        return TypedResult<object>.Success(null, "Successfully logged out");
    }

    //Auth
    public async Task<TypedResult<object>> RefreshTokenAsync(RefreshRequest request)
    {
        if (string.IsNullOrEmpty(request.RefreshToken))
            return TypedResult<object>.Error("Refresh token is required", 400);

        var result = await _tokenService.RefreshTokenAsync(request.RefreshToken, request.OldAccessToken);

        if (!result.IsSuccess)
            return TypedResult<object>.Error(result.Message, 401);

        return TypedResult<object>.Success(new
        {
            accessToken = result.Data.AccessToken,
            refreshToken = result.Data.RefreshToken
        });
    }
}
