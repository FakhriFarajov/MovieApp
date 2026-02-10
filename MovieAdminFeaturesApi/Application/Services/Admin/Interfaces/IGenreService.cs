using MovieAdminFeaturesApi.Core.DTOs.GenreDtos.Response;
using MovieAdminFeaturesApi.Core.Models;

namespace MovieAdminFeaturesApi.Application.Services.Admin.Interfaces;

public interface IGenreService
{
    Task<IEnumerable<Genre>> GetAllAsync();
    Task<Genre?> GetByIdAsync(string id);
    Task<Genre> CreateAsync(Genre genre);
    Task<bool> UpdateAsync(string id, Genre genre);
    Task<bool> DeleteAsync(string id);

    // Language-aware retrieval
    Task<IEnumerable<GenreResponseDTO>> GetAllTranslatedAsync(string lang);
    Task<GenreResponseDTO?> GetByIdTranslatedAsync(string id, string lang);
}
