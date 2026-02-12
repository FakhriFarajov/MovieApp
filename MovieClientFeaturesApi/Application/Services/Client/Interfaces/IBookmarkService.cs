using MovieClientFeaturesApi.Core.DTOs.WatchlistDtos.Response;

namespace MovieClientFeaturesApi.Application.Services.Client.Interfaces;

public interface IBookmarkService
{
    Task<bool> AddAsync(string clientId, string movieId);
    Task<bool> RemoveAsync(string clientId, string movieId);
    Task<IEnumerable<BookmarkResponseDTO>> GetForClientAsync(string clientId);
}
