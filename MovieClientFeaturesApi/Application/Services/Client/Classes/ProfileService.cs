using Microsoft.EntityFrameworkCore;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;
using MovieClientFeaturesApi.Core.DTOs.ClientDtos.Request;
using MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response;
using MovieClientFeaturesApi.Core.DTOs.WatchlistDtos.Request;
using MovieClientFeaturesApi.Core.DTOs.WatchlistDtos.Response;
using MovieClientFeaturesApi.Infrastructure.Context;
using MovieClientFeaturesApi.Application.Services.Interfaces;

namespace MovieClientFeaturesApi.Application.Services.Client.Classes;

public class ProfileService : IProfileService
{
    private readonly MovieApiDbContext _db;
    private readonly IImageService _imageService;

    public ProfileService(MovieApiDbContext db, IImageService imageService)
    {
        _db = db;
        _imageService = imageService;
    }


    public async Task<TypedResult<ClientProfileResponseDTO>> GetProfile(string clientId)
    {
        // Ensure User navigation is loaded to avoid null refs
        var client = await _db.Clients.AsNoTracking().Include(c => c.User).FirstOrDefaultAsync(c => c.Id == clientId);
        if (client == null) return TypedResult<ClientProfileResponseDTO>.Error("Client not found", 404);
        if (client.User == null) return TypedResult<ClientProfileResponseDTO>.Error("Linked user not found for client", 500);

        var profile = new ClientProfileResponseDTO
        {
            Id = client.Id,
            Name = client.User.Name ?? string.Empty,
            Surname = client.User.Surname ?? string.Empty,
            PhoneNumber = client.User.PhoneNumber ?? string.Empty,
            Email = client.User.Email ?? string.Empty,
            DateOfBirth = client.DateOfBirth == DateTime.MinValue ? null : client.DateOfBirth,
            ProfileImage = string.IsNullOrWhiteSpace(client.User.ProfileImage) ? string.Empty : await _imageService.GetImageUrlAsync(client.User.ProfileImage)
        };

        return TypedResult<ClientProfileResponseDTO>.Success(profile, "Profile fetched");
    }

    public async Task<TypedResult<ClientProfileResponseDTO>> UpdateProfile(string clientId, ClientProfileUpdateRequestDTO dto)
    {
        // Load user navigation so we can update user fields
        var client = await _db.Clients.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == clientId);
        if (client == null) return TypedResult<ClientProfileResponseDTO>.Error("Client not found", 404);
        if (client.User == null) return TypedResult<ClientProfileResponseDTO>.Error("Linked user not found for client", 500);

        // Update allowed fields on underlying User and Client profile
        if (!string.IsNullOrWhiteSpace(dto.Name)) client.User.Name = dto.Name;
        if (!string.IsNullOrWhiteSpace(dto.Surname)) client.User.Surname = dto.Surname;
        if (!string.IsNullOrWhiteSpace(dto.PhoneNumber)) client.User.PhoneNumber = dto.PhoneNumber;
        if (!string.IsNullOrWhiteSpace(dto.Email)) client.User.Email = dto.Email;
        if (dto.DateOfBirth.HasValue) client.DateOfBirth = dto.DateOfBirth.Value;

        // If DTO contains ProfileImageObjectName, set it on user
        if (!string.IsNullOrWhiteSpace(dto.ProfileImageObjectName))
        {
            client.User.ProfileImage = dto.ProfileImageObjectName;
        }

        await _db.SaveChangesAsync();

        var profile = new ClientProfileResponseDTO
        {
            Id = client.Id,
            Name = client.User.Name ?? string.Empty,
            Surname = client.User.Surname ?? string.Empty,
            PhoneNumber = client.User.PhoneNumber ?? string.Empty,
            Email = client.User.Email ?? string.Empty,
            DateOfBirth = client.DateOfBirth == DateTime.MinValue ? null : client.DateOfBirth,
            ProfileImage = string.IsNullOrWhiteSpace(client.User.ProfileImage) ? string.Empty : await _imageService.GetImageUrlAsync(client.User.ProfileImage)
        };

        return TypedResult<ClientProfileResponseDTO>.Success(profile, "Profile updated");
    }
}
