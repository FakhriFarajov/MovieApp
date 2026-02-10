using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using MovieAuthApi.Application.Services.Client.Interfaces;
using MovieAuthApi.Application.Services.Utils;
using MovieAuthApi.Core.DTOs.ClientDtos.Response;
using MovieAuthApi.Core.DTOs.ClientDtos.Request;
using MovieAuthApi.Infrastructure.Context;
using static BCrypt.Net.BCrypt;

namespace MovieAuthApi.Application.Services.Client.Classes;


public class AuthService : IAuthService
{
    private readonly MovieApiDbContext _context;
    private readonly TokenManager _tokenService;

    public AuthService(MovieApiDbContext context, TokenManager tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<TypedResult<object>> LoginAsync(ClientLoginRequestDTO request)
    {
        if (request == null)
            return TypedResult<object>.Error("Request body is required", 400);

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return TypedResult<object>.Error("Email and password are required", 400);

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null)
            return TypedResult<object>.Error("User not found", 404);

        // If the user has a client profile, check whether that client profile is banned.
        if (!string.IsNullOrWhiteSpace(user.ClientProfileId))
        {
            var ban = await _context.BannedUsers
                .AsNoTracking()
                .Where(b => b.ClientProfileId == user.ClientProfileId)
                .OrderByDescending(b => b.CreatedAt)
                .FirstOrDefaultAsync();

            if (ban != null && (!ban.ExpiresAt.HasValue || ban.ExpiresAt.Value > DateTime.UtcNow))
            {
                return TypedResult<object>.Error("Your account is banned.", 403);
            }
        }

        if (string.IsNullOrWhiteSpace(user.PasswordHash))
            return TypedResult<object>.Error("User has no password set", 400);

        try
        {
            if (!Verify(request.Password, user.PasswordHash))
                return TypedResult<object>.Error("Invalid credentials", 401);
        }
        catch (Exception ex)
        {
            // BCrypt or other verify errors
            return TypedResult<object>.Error($"Failed to verify credentials: {ex.Message}", 400);
        }
         
         if (string.IsNullOrEmpty(user.ClientProfileId))
         {
             return TypedResult<object>.Error("User is not a Client.", 403);
         }

        string accessToken;
        try
        {
            accessToken = await _tokenService.CreateTokenAsync(user);
        }
        catch (Exception ex)
        {
            return TypedResult<object>.Error($"Failed to create access token: {ex.Message}", 500);
        }
         string refreshToken;
         var now = DateTime.UtcNow;
         if (!string.IsNullOrEmpty(user.RefreshToken) && user.RefreshTokenExpiryTime.HasValue &&
             user.RefreshTokenExpiryTime > now)
         {
             refreshToken = user.RefreshToken;
         }
         else
         {
            try
            {
                refreshToken = await _tokenService.CreateRefreshTokenAsync(user);
            }
            catch (Exception ex)
            {
                return TypedResult<object>.Error($"Failed to create refresh token: {ex.Message}", 500);
            }
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