using MovieAdminFeaturesApi.Core.DTOs.ShowTimeDtos.Response;
using MovieAdminFeaturesApi.Core.Models;

namespace MovieAdminFeaturesApi.Application.Services.Admin.Interfaces;

public interface IShowTimeService
{
    Task<IEnumerable<ShowTime>> GetAllAsync();
    Task<ShowTime?> GetByIdAsync(string id);
    Task<ShowTime> CreateAsync(ShowTime showTime);
    Task<bool> UpdateAsync(string id, ShowTime showTime);
    Task<bool> DeleteAsync(string id);

    // response DTO helpers
    Task<IEnumerable<ShowTimeResponseDTO>> GetAllResponseAsync();
    Task<ShowTimeResponseDTO?> GetByIdResponseAsync(string id);

    // showtimes for a theatre (by theatre id)
    Task<IEnumerable<ShowTimeResponseDTO>> GetByTheatreIdResponseAsync(string theatreId);
}
