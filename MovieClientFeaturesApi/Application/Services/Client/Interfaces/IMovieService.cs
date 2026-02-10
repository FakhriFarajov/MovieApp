using System.Collections.Generic;
using System.Threading.Tasks;
using MovieClientFeaturesApi.Core.DTOs.MovieDtos.Response;
using MovieClientFeaturesApi.Core.DTOs.Pagination;

namespace MovieClientFeaturesApi.Application.Services.Client.Interfaces;

public interface IMovieService
{
    Task<MovieClientFeaturesApi.Core.DTOs.Pagination.PaginatedResult<MovieClientFeaturesApi.Core.DTOs.MovieDtos.Response.MovieResponseDTO>> GetPopularAsync(int page, int pageSize, string? lang = null, string? genreId = null, string? userId = null);
    Task<MovieClientFeaturesApi.Core.DTOs.Pagination.PaginatedResult<MovieClientFeaturesApi.Core.DTOs.MovieDtos.Response.MovieResponseDTO>> SearchAsync(int page, int pageSize, string? lang = null, string? query = null, string? genreId = null, string? userId = null);
    Task<MovieClientFeaturesApi.Core.DTOs.MovieDtos.Response.MovieResponseDTO?> GetByIdAsync(string id, string? lang = null, string? userId = null);
    Task<IEnumerable<MovieClientFeaturesApi.Core.DTOs.TheatreDtos.Response.TheatreWithHallsResponseDTO>> GetTheatresForMovieAsync(string movieId, string? lang = null);

    // Genres: get all genres or specific genres by ids
    Task<IEnumerable<MovieClientFeaturesApi.Core.DTOs.GenreDtos.Response.GenreResponseDTO>> GetAllGenresAsync(string? lang = null);
    Task<IEnumerable<MovieClientFeaturesApi.Core.DTOs.GenreDtos.Response.GenreResponseDTO>> GetGenresByIdsAsync(IEnumerable<string> ids, string? lang = null);

    // ShowTimes: get all showtimes for a theatre, a hall, or a movie
    Task<IEnumerable<MovieClientFeaturesApi.Core.DTOs.ShowTimeDtos.Response.ShowTimeResponseDTO>> GetShowTimesForTheatreAsync(string theatreId);
    Task<IEnumerable<MovieClientFeaturesApi.Core.DTOs.ShowTimeDtos.Response.ShowTimeResponseDTO>> GetShowTimesForHallAsync(string hallId);
    Task<IEnumerable<MovieClientFeaturesApi.Core.DTOs.ShowTimeDtos.Response.ShowTimeResponseDTO>> GetShowTimesForMovieAsync(string movieId);

    // Theatres
    Task<IEnumerable<MovieClientFeaturesApi.Core.DTOs.TheatreDtos.Response.TheatreWithHallsResponseDTO>> GetAllTheatresAsync();
}
