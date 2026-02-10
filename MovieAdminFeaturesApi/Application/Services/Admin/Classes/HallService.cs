using Microsoft.EntityFrameworkCore;
using MovieAdminFeaturesApi.Application.Services.Admin.Interfaces;
using MovieAdminFeaturesApi.Core.Models;
using MovieAdminFeaturesApi.Infrastructure.Context;

namespace MovieAdminFeaturesApi.Application.Services.Admin.Classes;

public class HallService : IHallService
{
    private readonly MovieApiDbContext _db;

    public HallService(MovieApiDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Hall>> GetAllAsync()
    {
        return await _db.Halls.AsNoTracking().ToListAsync();
    }

    public async Task<Hall?> GetByIdAsync(string id)
    {
        return await _db.Halls.FindAsync(id);
    }

    public async Task<Hall> CreateAsync(Hall hall)
    {
        // ensure theatre exists
        var theatre = await _db.Theatres.FindAsync(hall.TheatreId);
        if (theatre == null) throw new InvalidOperationException("Parent theatre not found");

        // add hall first so FK relationships are consistent
        _db.Halls.Add(hall);

        // create seats based on rows and columns
        var seats = new List<Seat>();
        for (int r = 1; r <= hall.Rows; r++)
        {
            // row label as letter(s): 1->A, 27->AA
            int rowIndex = r - 1;
            string rowLabel = string.Empty;
            while (rowIndex >= 0)
            {
                rowLabel = (char)('A' + (rowIndex % 26)) + rowLabel;
                rowIndex = rowIndex / 26 - 1;
            }

            for (int c = 1; c <= hall.Columns; c++)
            {
                var seat = new Seat
                {
                    Hall = hall,
                    HallId = hall.Id,
                    RowNumber = r,
                    ColumnNumber = c,
                    Label = $"{rowLabel}{c}",
                    IsAvailable = true
                };
                seats.Add(seat);
            }
        }

        _db.Seats.AddRange(seats);

        await _db.SaveChangesAsync();
        return hall;
    }

    public async Task<bool> UpdateAsync(string id, Hall hall)
    {
        var existing = await _db.Halls.FindAsync(id);
        if (existing == null) return false;
        existing.Name = hall.Name;
        existing.Type = hall.Type;
        existing.Rows = hall.Rows;
        existing.Columns = hall.Columns;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var existing = await _db.Halls.FindAsync(id);
        if (existing == null) return false;
        _db.Halls.Remove(existing);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<Hall>> GetByTheatreIdAsync(string theatreId)
    {
        return await _db.Halls.AsNoTracking().Where(h => h.TheatreId == theatreId).ToListAsync();
    }
}
