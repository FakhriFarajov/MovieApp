using Microsoft.EntityFrameworkCore;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;
using MovieClientFeaturesApi.Core.DTOs.ShowTimeDtos.Response;
using MovieClientFeaturesApi.Core.DTOs.SeatDtos.Response;
using MovieClientFeaturesApi.Infrastructure.Context;

namespace MovieClientFeaturesApi.Application.Services.Client.Classes;

public class ShowTimeService : IShowTimeService
{
    private readonly MovieApiDbContext _db;

    public ShowTimeService(MovieApiDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ShowTimeResponseDTO>> GetShowTimesForTheatreAsync(string theatreId)
    {
        var halls = await _db.Halls.AsNoTracking().Where(h => h.TheatreId == theatreId).ToListAsync();
        var hallIds = halls.Select(h => h.Id).ToList();
        var showtimes = await _db.ShowTimes.AsNoTracking().Where(s => hallIds.Contains(s.HallId)).ToListAsync();
        return showtimes.Select(s => new ShowTimeResponseDTO(s.Id, s.MovieId, s.HallId, s.StartTime, s.EndTime, s.BasePrice));
    }

    public async Task<IEnumerable<ShowTimeResponseDTO>> GetShowTimesForHallAsync(string hallId)
    {
        var showtimes = await _db.ShowTimes.AsNoTracking().Where(s => s.HallId == hallId).ToListAsync();
        return showtimes.Select(s => new ShowTimeResponseDTO(s.Id, s.MovieId, s.HallId, s.StartTime, s.EndTime, s.BasePrice));
    }

    public async Task<IEnumerable<ShowTimeResponseDTO>> GetShowTimesForMovieAsync(string movieId)
    {
        var showtimes = await _db.ShowTimes.AsNoTracking().Where(s => s.MovieId == movieId).ToListAsync();
        return showtimes.Select(s => new ShowTimeResponseDTO(s.Id, s.MovieId, s.HallId, s.StartTime, s.EndTime, s.BasePrice));
    }

    public async Task<IEnumerable<SeatAvailabilityDTO>> GetSeatAvailabilityForShowAsync(string showTimeId)
    {
        var show = await _db.ShowTimes.AsNoTracking().FirstOrDefaultAsync(s => s.Id == showTimeId);
        if (show == null) return new List<SeatAvailabilityDTO>();

        var hallSeats = await _db.Seats.AsNoTracking().Where(s => s.HallId == show.HallId).ToListAsync();
        var seatIds = hallSeats.Select(s => s.Id).ToList();

        var tickets = await _db.Tickets.AsNoTracking().Include(t => t.Booking).Where(t => seatIds.Contains(t.SeatId) && t.Booking.ShowTimeId == showTimeId).ToListAsync();

        var list = new List<SeatAvailabilityDTO>();
        foreach (var seat in hallSeats)
        {
            var tk = tickets.FirstOrDefault(t => t.SeatId == seat.Id);
            var isTaken = tk != null;
            list.Add(new SeatAvailabilityDTO(seat.Id, seat.RowNumber, seat.ColumnNumber, seat.Label, isTaken, tk?.Id, tk?.Status.ToString()));
        }

        return list;
    }
}

