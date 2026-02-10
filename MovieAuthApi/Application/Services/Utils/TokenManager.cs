using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MovieAuthApi.Core.DTOs.AdminDtos.Response;
using MovieAuthApi.Core.Models;
using MovieAuthApi.Infrastructure.Context;

namespace MovieAuthApi.Application.Services.Utils;

public class TokenManager
{
    private readonly MovieApiDbContext _context;

    public TokenManager(MovieApiDbContext context)
    {
        _context = context;
    }

    // Helper: read required environment var, throw helpful error if missing
    private static string GetEnvRequired(string key)
    {
        var v = Environment.GetEnvironmentVariable(key);
        if (string.IsNullOrWhiteSpace(v))
            throw new InvalidOperationException($"Environment variable '{key}' is not set.");
        return v;
    }

    // Helper: read optional environment var
    private static string? GetEnv(string key)
    {
        return Environment.GetEnvironmentVariable(key);
    }

    public async Task<string> CreateTokenAsync(User user)
    {
        // Determine email verification state from the database (prefer authoritative source)
        bool isEmailVerified = false;
        if (!string.IsNullOrWhiteSpace(user.ClientProfileId))
        {
            // Query only the IsEmailConfirmed column to avoid pulling full entity (fast and safe)
            isEmailVerified = await _context.Clients
                .Where(cp => cp.Id == user.ClientProfileId)
                .Select(cp => (bool?)cp.IsEmailVerified)
                .FirstOrDefaultAsync() ?? false;
        }
        else if (user.ClientProfile != null)
        {
            // fallback to in-memory navigation if present
            isEmailVerified = user.ClientProfile.IsEmailVerified;
        }

        var claims = new List<Claim>
        {
            new Claim("userId", user.Id ?? string.Empty),
            new Claim("name", user.Name ?? string.Empty),
            new Claim("surname", user.Surname ?? string.Empty),
            new Claim("email", user.Email ?? string.Empty),
            new Claim("is_email_verified", isEmailVerified.ToString()),
            // include avatar/profile image identifier (object name or URL stored on the user record)
            new Claim("profile_image", user.ProfileImage ?? string.Empty),
            new Claim("phone_number", user.PhoneNumber ?? string.Empty),
            new Claim("role", ((Core.Enums.Role)user.Role).ToString())
        };

        var role = (Core.Enums.Role)user.Role;

        if (role == Core.Enums.Role.Client)
        {
            claims.Add(new Claim("client_profile_id", user.ClientProfileId ?? string.Empty));
        }
        else if (role == Core.Enums.Role.Admin)
        {
            claims.Add(new Claim("admin_profile_id", user.AdminProfileId ?? string.Empty));
        }

        // Read JWT settings from environment
        var secretKey = GetEnvRequired("JWT__SECRETKEY");
        var issuer = GetEnvRequired("JWT__ISSUER");
        var audience = GetEnvRequired("JWT__AUDIENCE");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(3),
            signingCredentials: creds);

        return await Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
    }

    public async Task<string> CreateEmailTokenAsync(ClaimsPrincipal client)
    {
        // collect email claims from provided principal
        var emailClaims = client.Claims.Where(c => c.Type == ClaimTypes.Email);

        var emailKey = GetEnvRequired("JWT__EMAILKEY");

        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(emailKey)
        );
        var signingCred = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256Signature);

        // Email token expiry configurable (minutes). Default to 60 minutes if not set.
        var expiryMinutes = 60;
        var expiryEnv = GetEnv("JWT__EMAILEXPIRYMINUTES");
        if (!string.IsNullOrWhiteSpace(expiryEnv) && int.TryParse(expiryEnv, out var cfg))
            expiryMinutes = cfg;

        var issuer = GetEnvRequired("JWT__ISSUER");
        var audience = GetEnvRequired("JWT__AUDIENCE");

        var securityToken = new JwtSecurityToken(
            claims: emailClaims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            issuer: issuer,
            audience: audience,
            signingCredentials: signingCred
        );

        return new JwtSecurityTokenHandler().WriteToken(securityToken);
    }

    public async Task<string> GetEmailFromTokenAsync(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var securityToken = tokenHandler.ReadToken(token) as JwtSecurityToken;

        if (securityToken == null)
            throw new SecurityTokenException("Invalid token");

        var emailClaim = securityToken.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Email);
        return emailClaim?.Value;
    }

    public async Task<bool> ValidateEmailTokenAsync(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();

        var emailKey = GetEnvRequired("JWT__EMAILKEY");
        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(emailKey)
        );

        var issuer = GetEnvRequired("JWT__ISSUER");
        var audience = GetEnvRequired("JWT__AUDIENCE");

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = securityKey,
            ClockSkew = TimeSpan.Zero
        };

        var principal = await tokenHandler.ValidateTokenAsync(token, validationParameters);
        return principal.IsValid;
    }

    public async Task<TypedResult<RefreshTokenResponse>> RefreshTokenAsync(string refreshToken, string oldAccessToken)
    {
        if (string.IsNullOrEmpty(refreshToken))
            return TypedResult<RefreshTokenResponse>.Error("Refresh token is required", 400);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
        if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            if (user != null)
            {
                // Clear expired refresh token
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;
                _context.Users.Update(user);
                await _context.SaveChangesAsync();
            }
            return TypedResult<RefreshTokenResponse>.Error("Invalid or expired refresh token", 401);
        }

        // If an old access token was provided, validate it belongs to the same user
        if (!string.IsNullOrEmpty(oldAccessToken))
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(oldAccessToken);
                // try common claim types for user id
                var tokenUserId = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "userId" || c.Type == "sub")?.Value;
                if (!string.IsNullOrEmpty(tokenUserId) && !string.Equals(tokenUserId, user.Id, StringComparison.OrdinalIgnoreCase))
                {
                    // Provided old token does not belong to the owner of the refresh token
                    return TypedResult<RefreshTokenResponse>.Error("Old access token does not match refresh token owner", 401);
                }

                // Blacklist the old token (even if expired) to prevent reuse
                await BlacklistTokenAsync(oldAccessToken, DateTime.UtcNow.AddMinutes(3));
            }
            catch (Exception)
            {
                // If token can't be parsed, still blacklist the raw token string to be defensive
                await BlacklistTokenAsync(oldAccessToken, DateTime.UtcNow.AddMinutes(3));
            }
        }

        var newAccessToken = await CreateTokenAsync(user);
        var newRefreshToken = await CreateRefreshTokenAsync(user);

        return TypedResult<RefreshTokenResponse>.Success(
            new RefreshTokenResponse(newAccessToken, newRefreshToken),
            "Token refreshed successfully"
        );
    }

    public async Task BlacklistTokenAsync(string token, DateTime expiry)
    {
        if (string.IsNullOrEmpty(token)) return;

        await _context.BlacklistedTokens.AddAsync(new BlacklistedToken
        {
            Token = token,
            ExpiryTime = expiry
        });

        await _context.SaveChangesAsync();
    }
    
    public async Task<string> CreateRefreshTokenAsync(User user)
    {
        var refreshToken = Guid.NewGuid().ToString();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);//Change
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        return refreshToken;
    }
}
