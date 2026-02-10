using Microsoft.EntityFrameworkCore;
using MovieAdminFeaturesApi.Application.Services.Admin.Interfaces;
using MovieAdminFeaturesApi.Core.DTOs.TheatreDtos.Response;
using MovieAdminFeaturesApi.Core.Models;
using MovieAdminFeaturesApi.Infrastructure.Context;

namespace MovieAdminFeaturesApi.Application.Services.Admin.Classes;

public class TheatreService : ITheatreService
{
    private readonly MovieApiDbContext _db;

    public TheatreService(MovieApiDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Theatre>> GetAllAsync()
    {
        return await _db.Theatres.AsNoTracking().ToListAsync();
    }

    public async Task<Theatre?> GetByIdAsync(string id)
    {
        return await _db.Theatres.FindAsync(id);
    }

    public async Task<Theatre> CreateAsync(Theatre theatre)
    {
        _db.Theatres.Add(theatre);
        await _db.SaveChangesAsync();
        return theatre;
    }

    public async Task<bool> UpdateAsync(string id, Theatre theatre)
    {
        var existing = await _db.Theatres.FindAsync(id);
        if (existing == null) return false;
        existing.Name = theatre.Name;
        existing.Address = theatre.Address;
        existing.Latitude = theatre.Latitude;
        existing.Longitude = theatre.Longitude;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var existing = await _db.Theatres.FindAsync(id);
        if (existing == null) return false;
        _db.Theatres.Remove(existing);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<TheatreResponseDTO>> GetAllResponseAsync()
    {
        var all = await _db.Theatres.AsNoTracking().ToListAsync();
        return all.Select(t => new TheatreResponseDTO(t.Id, t.Name, t.Address, t.Latitude, t.Longitude));
    }

    public async Task<TheatreResponseDTO?> GetByIdResponseAsync(string id)
    {
        var t = await _db.Theatres.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return null;
        return new TheatreResponseDTO(t.Id, t.Name, t.Address, t.Latitude, t.Longitude);
    }
}
