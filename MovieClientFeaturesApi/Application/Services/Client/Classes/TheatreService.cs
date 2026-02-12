using Microsoft.EntityFrameworkCore;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;
using MovieClientFeaturesApi.Core.DTOs.TheatreDtos.Response;
using MovieClientFeaturesApi.Infrastructure.Context;

namespace MovieClientFeaturesApi.Application.Services.Client.Classes;

public class TheatreService : ITheatreService
{
    private readonly MovieApiDbContext _db;

    public TheatreService(MovieApiDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<TheatreWithHallsResponseDTO>> GetAllTheatresAsync()
    {
        var theatres = await _db.Theatres.AsNoTracking().ToListAsync();
        var halls = await _db.Halls.AsNoTracking().Where(h => theatres.Select(t => t.Id).Contains(h.TheatreId)).ToListAsync();

        var results = new List<TheatreWithHallsResponseDTO>();
        foreach (var t in theatres)
        {
            var relatedHalls = halls.Where(h => h.TheatreId == t.Id).Select(h => new HallSimpleDTO(h.Id, h.Name, h.Rows, h.Columns));
            results.Add(new TheatreWithHallsResponseDTO(t.Id, t.Name, t.Address, t.Latitude, t.Longitude, relatedHalls));
        }
        return results;
    }
}

