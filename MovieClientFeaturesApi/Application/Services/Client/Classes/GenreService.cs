using Microsoft.EntityFrameworkCore;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;
using MovieClientFeaturesApi.Core.DTOs.GenreDtos.Response;
using MovieClientFeaturesApi.Infrastructure.Context;

namespace MovieClientFeaturesApi.Application.Services.Client.Classes;

public class GenreService : IGenreService
{
    private readonly MovieApiDbContext _db;
    
    public GenreService(MovieApiDbContext db) { _db = db; }

    public async Task<IEnumerable<GenreResponseDTO>> GetAllGenresAsync(string? lang = null)
    {
        var genres = await _db.Genres.Include(g => g.Translations).AsNoTracking().ToListAsync();
        var list = new List<GenreResponseDTO>();
        foreach (var g in genres)
        {
            var name = g.Name;
            if (!string.IsNullOrWhiteSpace(lang))
            {
                var t = g.Translations.FirstOrDefault(tr => string.Equals(tr.Language, lang, StringComparison.OrdinalIgnoreCase));
                if (t != null && !string.IsNullOrWhiteSpace(t.Name)) name = t.Name;
            }
            list.Add(new GenreResponseDTO(g.Id, name));
        }
        return list;
    }
}

