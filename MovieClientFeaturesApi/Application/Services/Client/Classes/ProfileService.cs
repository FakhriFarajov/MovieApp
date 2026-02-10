using Microsoft.EntityFrameworkCore;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;
using MovieClientFeaturesApi.Core.DTOs.ClientDtos.Request;
using MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response;
using MovieClientFeaturesApi.Core.DTOs.WatchlistDtos.Request;
using MovieClientFeaturesApi.Core.DTOs.WatchlistDtos.Response;
using MovieClientFeaturesApi.Infrastructure.Context;

namespace MovieClientFeaturesApi.Application.Services.Client.Classes;

public class ProfileService : IProfileService
{
    private readonly MovieApiDbContext _db;

    public ProfileService(MovieApiDbContext db)
    {
        _db = db;
    }

    public async Task<MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response.TypedResult<ClientProfileResponseDTO>> GetProfile(string clientId)
    {
        var client = await _db.Clients.Include(c => c.User).AsNoTracking().FirstOrDefaultAsync(c => c.Id == clientId);
        if (client == null) return MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response.TypedResult<ClientProfileResponseDTO>.Error("Client not found", 404);

        var profile = new ClientProfileResponseDTO
        {
            Id = client.Id,
            Name = client.User.Name,
            Surname = client.User.Surname,
            PhoneNumber = client.User.PhoneNumber,
            Email = client.User.Email,
            DateOfBirth = client.DateOfBirth
        };

        return MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response.TypedResult<ClientProfileResponseDTO>.Success(profile, "Profile fetched");
    }

    public async Task<MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response.TypedResult<ClientProfileResponseDTO>> UpdateProfile(string clientId, ClientProfileUpdateRequestDTO dto)
    {
        var client = await _db.Clients.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == clientId);
        if (client == null) return MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response.TypedResult<ClientProfileResponseDTO>.Error("Client not found", 404);

        // Update allowed fields on underlying User and Client profile
        if (!string.IsNullOrWhiteSpace(dto.Name)) client.User.Name = dto.Name;
        if (!string.IsNullOrWhiteSpace(dto.Surname)) client.User.Surname = dto.Surname;
        if (!string.IsNullOrWhiteSpace(dto.PhoneNumber)) client.User.PhoneNumber = dto.PhoneNumber;
        if (!string.IsNullOrWhiteSpace(dto.Email)) client.User.Email = dto.Email;
        if (dto.DateOfBirth.HasValue) client.DateOfBirth = dto.DateOfBirth.Value;

        await _db.SaveChangesAsync();

        var profile = new ClientProfileResponseDTO
        {
            Id = client.Id,
            Name = client.User.Name,
            Surname = client.User.Surname,
            PhoneNumber = client.User.PhoneNumber,
            Email = client.User.Email,
            DateOfBirth = client.DateOfBirth
        };

        return MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response.TypedResult<ClientProfileResponseDTO>.Success(profile, "Profile updated");
    }

    public async Task<MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response.TypedResult<IEnumerable<BookmarkResponseDTO>>> GetForClientAsync(string clientId)
    {
        var client = await _db.Clients.FindAsync(clientId);
        if (client == null) return MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response.TypedResult<IEnumerable<BookmarkResponseDTO>>.Error("Client not found", 404, null);

        var items = await _db.WatchlistItems.AsNoTracking().Where(w => w.ClientId == clientId).ToListAsync();
        var list = items.Select(i => new BookmarkResponseDTO(i.Id, i.MovieId, i.ClientId));
        return MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response.TypedResult<IEnumerable<BookmarkResponseDTO>>.Success(list, "Bookmarks fetched");
    }
}
