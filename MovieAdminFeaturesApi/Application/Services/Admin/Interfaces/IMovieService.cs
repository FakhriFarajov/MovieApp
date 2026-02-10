using MovieAdminFeaturesApi.Core.DTOs.MovieDtos.Response;
using MovieAdminFeaturesApi.Core.DTOs.Pagination;
using MovieAdminFeaturesApi.Core.Models;

namespace MovieAdminFeaturesApi.Application.Services.Admin.Interfaces;

public interface IMovieService
{
    Task<IEnumerable<Movie>> GetAllAsync();
    Task<Movie?> GetByIdAsync(string id);
    Task<Movie> CreateAsync(Movie movie);
    Task<bool> UpdateAsync(string id, Movie movie);
    Task<bool> DeleteAsync(string id);

    // Language-aware retrieval
    Task<IEnumerable<MovieResponseDTO>> GetAllTranslatedAsync(string lang);
    Task<MovieResponseDTO?> GetByIdTranslatedAsync(string id, string lang);

    // Paginated
    Task<PaginatedResult<Movie>> GetPagedAsync(int page, int pageSize, string? genreId = null);
    Task<PaginatedResult<MovieResponseDTO>> GetPagedTranslatedAsync(int page, int pageSize, string? lang = null, string? genreId = null);
}