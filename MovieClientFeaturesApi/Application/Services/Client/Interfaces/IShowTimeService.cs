using MovieClientFeaturesApi.Core.DTOs.ShowTimeDtos.Response;
using MovieClientFeaturesApi.Core.DTOs.SeatDtos.Response;

namespace MovieClientFeaturesApi.Application.Services.Client.Interfaces;

public interface IShowTimeService
{
    Task<IEnumerable<ShowTimeResponseDTO>> GetShowTimesForTheatreAsync(string theatreId);
    Task<IEnumerable<ShowTimeResponseDTO>> GetShowTimesForHallAsync(string hallId);
    Task<IEnumerable<ShowTimeResponseDTO>> GetShowTimesForMovieAsync(string movieId);
    Task<IEnumerable<SeatAvailabilityDTO>> GetSeatAvailabilityForShowAsync(string showTimeId);
}

