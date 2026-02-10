using Microsoft.EntityFrameworkCore;
using MovieAuthApi.Application.Services.Client.Interfaces;
using MovieAuthApi.Application.Services.Utils;
using MovieAuthApi.Core.DTOs.ClientDtos.Response;
using MovieAuthApi.Core.DTOs.ClientDtos.Request;
using MovieAuthApi.Core.Models;
using MovieAuthApi.Infrastructure.Context;

namespace MovieAuthApi.Application.Services.Client.Classes;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly MovieApiDbContext _context;
    private readonly TokenManager _tokenManager;

    public GoogleAuthService(MovieApiDbContext context, TokenManager tokenManager)
    {
        _context = context;
        _tokenManager = tokenManager;
    }

    public async Task<TypedResult<object>> LoginAsync(GoogleAuthDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.GoogleId))
            return TypedResult<object>.Error("Invalid payload", 400);

        var normalized = dto.Email.Trim().ToLowerInvariant();

        // First try to find mapping by GoogleId
        var mapping = await _context.GoogleAuthedUsers.FirstOrDefaultAsync(g => g.GoogleId == dto.GoogleId);
        User user = null;
        if (mapping != null)
        {
            user = await _context.Users.FirstOrDefaultAsync(u => u.Id == mapping.UserId);
            if (user == null)
            {
                // If mapping exists but user missing, remove mapping and treat as not found
                _context.GoogleAuthedUsers.Remove(mapping);
                await _context.SaveChangesAsync();
                mapping = null;
            }
        }

        // If no mapping, try to find by email
        if (mapping == null)
        {
            user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalized);
            if (user == null)
            {
                return TypedResult<object>.Error("User not found", 404);
            }

            // Create mapping between existing user and GoogleId
            var newMap = new Core.Models.GoogleAuthedUser
            {
                UserId = user.Id,
                GoogleId = dto.GoogleId,
                CreatedAt = DateTime.UtcNow
            };
            _context.GoogleAuthedUsers.Add(newMap);
            await _context.SaveChangesAsync();
        }

        // At this point we must have a user
        if (user == null)
            return TypedResult<object>.Error("User not found", 404);

        // Check banned status for the user's client profile (if any)
        if (!string.IsNullOrWhiteSpace(user.ClientProfileId))
        {
            var ban = await _context.BannedUsers
                .AsNoTracking()
                .Where(b => b.ClientProfileId == user.ClientProfileId)
                .OrderByDescending(b => b.CreatedAt)
                .FirstOrDefaultAsync();

            if (ban != null && (!ban.ExpiresAt.HasValue || ban.ExpiresAt.Value > DateTime.UtcNow))
            {
                // Return 403 and do not issue tokens
                return TypedResult<object>.Error("Your account is banned.", 403);
            }
        }

        // NOTE: DTO no longer contains profile fields (picture/fullname). We only authenticate via mapping.

        var token = await _tokenManager.CreateTokenAsync(user);
        var refresh = await _tokenManager.CreateRefreshTokenAsync(user);

        var result = new { token, refreshToken = refresh, isProfileCompleted = user.ClientProfileId != null };
        return TypedResult<object>.Success(result, "OK");
    }

    public async Task<TypedResult<object>> CompleteProfileAsync(string userId, CompleteProfileDto dto)
    {
        if (string.IsNullOrWhiteSpace(userId)) return TypedResult<object>.Error("Missing user id", 400);

        var user = await _context.Users.Include(u => u.ClientProfile).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return TypedResult<object>.Error("User not found", 404);

        user.PhoneNumber = dto.PhoneNumber ?? user.PhoneNumber;

        // If client profile does not exist, create one
        if (user.ClientProfile == null)
        {
            var profile = new Core.Models.Client()
            {
                UserId = user.Id,
                IsEmailVerified = true
            };
            user.ClientProfile = profile;
            user.ClientProfileId = profile.Id;
            _context.Clients.Add(profile);
        }
        
        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        return TypedResult<object>.Success(null, "Profile completed");
    }
}
