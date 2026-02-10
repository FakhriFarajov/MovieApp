using MovieAdminFeaturesApi.Core.DTOs.TheatreDtos.Response;
using MovieAdminFeaturesApi.Core.Models;

namespace MovieAdminFeaturesApi.Application.Services.Admin.Interfaces;

public interface ITheatreService
{
    Task<IEnumerable<Theatre>> GetAllAsync();
    Task<Theatre?> GetByIdAsync(string id);
    Task<Theatre> CreateAsync(Theatre theatre);
    Task<bool> UpdateAsync(string id, Theatre theatre);
    Task<bool> DeleteAsync(string id);

    // localized response if needed
    Task<IEnumerable<TheatreResponseDTO>> GetAllResponseAsync();
    Task<TheatreResponseDTO?> GetByIdResponseAsync(string id);
}
