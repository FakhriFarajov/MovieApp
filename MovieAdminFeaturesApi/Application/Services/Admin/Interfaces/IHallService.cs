using MovieAdminFeaturesApi.Core.DTOs.HallDtos.Request;
using MovieAdminFeaturesApi.Core.Models;

namespace MovieAdminFeaturesApi.Application.Services.Admin.Interfaces;

public interface IHallService
{
    Task<IEnumerable<Hall>> GetAllAsync();
    Task<Hall?> GetByIdAsync(string id);
    Task<Hall> CreateAsync(Hall hall);
    Task<bool> UpdateAsync(string id, Hall hall);
    Task<bool> DeleteAsync(string id);

    Task<IEnumerable<Hall>> GetByTheatreIdAsync(string theatreId);
}
