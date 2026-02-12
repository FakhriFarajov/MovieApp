using MovieClientFeaturesApi.Core.DTOs.TheatreDtos.Response;

namespace MovieClientFeaturesApi.Application.Services.Client.Interfaces;

public interface ITheatreService
{
    Task<IEnumerable<TheatreWithHallsResponseDTO>> GetAllTheatresAsync();
}

