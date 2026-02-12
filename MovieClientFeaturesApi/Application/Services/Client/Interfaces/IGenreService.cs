using MovieClientFeaturesApi.Core.DTOs.GenreDtos.Response;
using MovieClientFeaturesApi.Core.DTOs.MovieDtos.Response;

namespace MovieClientFeaturesApi.Application.Services.Client.Interfaces;

public interface IGenreService
{
    Task<IEnumerable<GenreResponseDTO>> GetAllGenresAsync(string? lang = null);
}

