using Microsoft.EntityFrameworkCore;
using MovieAdminFeaturesApi.Application.Services.Admin.Interfaces;
using MovieAdminFeaturesApi.Core.DTOs.ShowTimeDtos.Response;
using MovieAdminFeaturesApi.Core.Models;
using MovieAdminFeaturesApi.Infrastructure.Context;

namespace MovieAdminFeaturesApi.Application.Services.Admin.Classes;

public class ShowTimeService : IShowTimeService
{
    private readonly MovieApiDbContext _db;

    public ShowTimeService(MovieApiDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ShowTime>> GetAllAsync()
    {
        return await _db.ShowTimes.AsNoTracking().ToListAsync();
    }

    public async Task<ShowTime?> GetByIdAsync(string id)
    {
        return await _db.ShowTimes.FindAsync(id);
    }

    public async Task<ShowTime> CreateAsync(ShowTime showTime)
    {
        _db.ShowTimes.Add(showTime);
        await _db.SaveChangesAsync();
        return showTime;
    }

    public async Task<bool> UpdateAsync(string id, ShowTime showTime)
    {
        var existing = await _db.ShowTimes.FindAsync(id);
        if (existing == null) return false;

        existing.MovieId = showTime.MovieId;
        existing.HallId = showTime.HallId;
        existing.StartTime = showTime.StartTime;
        existing.EndTime = showTime.EndTime;
        existing.BasePrice = showTime.BasePrice;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var existing = await _db.ShowTimes.FindAsync(id);
        if (existing == null) return false;
        _db.ShowTimes.Remove(existing);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<ShowTimeResponseDTO>> GetAllResponseAsync()
    {
        var all = await _db.ShowTimes.AsNoTracking().ToListAsync();
        return all.Select(s => new ShowTimeResponseDTO(s.Id, s.MovieId, s.HallId, s.StartTime, s.EndTime, s.BasePrice));
    }

    public async Task<ShowTimeResponseDTO?> GetByIdResponseAsync(string id)
    {
        var s = await _db.ShowTimes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return null;
        return new ShowTimeResponseDTO(s.Id, s.MovieId, s.HallId, s.StartTime, s.EndTime, s.BasePrice);
    }

    public async Task<IEnumerable<ShowTimeResponseDTO>> GetByTheatreIdResponseAsync(string theatreId)
    {
        // Join ShowTimes -> Halls and filter by Hall.TheatreId == theatreId
        var query = from st in _db.ShowTimes.AsNoTracking()
                    join h in _db.Halls.AsNoTracking() on st.HallId equals h.Id
                    where h.TheatreId == theatreId
                    select new ShowTimeResponseDTO(st.Id, st.MovieId, st.HallId, st.StartTime, st.EndTime, st.BasePrice);

        return await query.ToListAsync();
    }
}
