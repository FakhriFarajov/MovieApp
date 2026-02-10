using MovieClientFeaturesApi.Core.DTOs.WatchlistDtos.Request;
using MovieClientFeaturesApi.Core.DTOs.WatchlistDtos.Response;

namespace MovieClientFeaturesApi.Application.Services.Client.Interfaces;

public interface IBookmarkService
{
    Task<BookmarkResponseDTO> AddAsync(string clientId, BookmarkCreateRequestDTO dto);
    Task<bool> RemoveAsync(string clientId, string bookmarkId);
    Task<IEnumerable<BookmarkResponseDTO>> GetForClientAsync(string clientId);
}
