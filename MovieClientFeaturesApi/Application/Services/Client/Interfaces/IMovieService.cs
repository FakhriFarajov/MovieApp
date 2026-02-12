using System.Collections.Generic;
using System.Threading.Tasks;
using MovieClientFeaturesApi.Core.DTOs.MovieDtos.Response;
using MovieClientFeaturesApi.Core.DTOs.Pagination;

namespace MovieClientFeaturesApi.Application.Services.Client.Interfaces;

public interface IMovieService
{
    Task<PaginatedResult<MovieResponseDTO>> GetPopularAsync(int page, int pageSize, string? lang = null, string? genreId = null, string? clientId = null);
    Task<PaginatedResult<MovieResponseDTO>> SearchAsync(int page, int pageSize, string? lang = null, string? query = null, string? genreId = null, string? clientId = null);
    Task<MovieResponseDTO?> GetByIdAsync(string id, string? lang = null, string? clientId = null);
}
