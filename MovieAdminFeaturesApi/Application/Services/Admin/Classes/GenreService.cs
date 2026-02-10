using Microsoft.EntityFrameworkCore;
using MovieAdminFeaturesApi.Application.Services.Admin.Interfaces;
using MovieAdminFeaturesApi.Application.Services.Interfaces;
using MovieAdminFeaturesApi.Core.DTOs.GenreDtos.Response;
using MovieAdminFeaturesApi.Core.Models;
using MovieAdminFeaturesApi.Infrastructure.Context;

namespace MovieAdminFeaturesApi.Application.Services.Admin.Classes;

public partial class GenreService : IGenreService
{
    private readonly MovieApiDbContext _db;
    private readonly ILibreTranslateService _translator;
    private readonly string[] _langs = new[] { "en", "ru", "az" };

    public GenreService(MovieApiDbContext db, ILibreTranslateService translator)
    {
        _db = db;
        _translator = translator;
    }

    public async Task<IEnumerable<Genre>> GetAllAsync()
    {
        return await _db.Genres.AsNoTracking().ToListAsync();
    }

    public async Task<Genre?> GetByIdAsync(string id)
    {
        return await _db.Genres.FindAsync(id);
    }

    public async Task<Genre> CreateAsync(Genre genre)
    {
        // create translations using LibreTranslate
        var translations = await _translator.TranslateMultipleAsync(genre.Name, _langs, "auto");
        foreach (var kv in translations)
        {
            genre.Translations.Add(new GenreTranslation
            {
                Language = kv.Key,
                Name = kv.Value
            });
        }

        _db.Genres.Add(genre);
        await _db.SaveChangesAsync();
        return genre;
    }

    public async Task<bool> UpdateAsync(string id, Genre genre)
    {
        var existing = await _db.Genres.Include(g => g.Translations).FirstOrDefaultAsync(g => g.Id == id);
        if (existing == null) return false;
        existing.Name = genre.Name;

        var translations = await _translator.TranslateMultipleAsync(genre.Name, _langs, "auto");

        // upsert translations
        foreach (var lang in _langs)
        {
            var txt = translations.ContainsKey(lang) ? translations[lang] : null;
            var found = existing.Translations.FirstOrDefault(t => t.Language == lang);
            if (found != null)
            {
                found.Name = txt ?? found.Name;
            }
            else if (!string.IsNullOrWhiteSpace(txt))
            {
                existing.Translations.Add(new GenreTranslation { Language = lang, Name = txt });
            }
        }

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var existing = await _db.Genres.FindAsync(id);
        if (existing == null) return false;
        _db.Genres.Remove(existing);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<GenreResponseDTO>> GetAllTranslatedAsync(string lang)
    {
        var genres = await _db.Genres.Include(g => g.Translations).AsNoTracking().ToListAsync();
        var list = new List<GenreResponseDTO>();
        foreach (var g in genres)
        {
            var name = g.Name;
            var t = g.Translations.FirstOrDefault(tr => string.Equals(tr.Language, lang, StringComparison.OrdinalIgnoreCase));
            if (t != null && !string.IsNullOrWhiteSpace(t.Name)) name = t.Name;
            list.Add(new GenreResponseDTO(g.Id, name));
        }
        return list;
    }

    public async Task<GenreResponseDTO?> GetByIdTranslatedAsync(string id, string lang)
    {
        var g = await _db.Genres.Include(x => x.Translations).AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (g == null) return null;
        var name = g.Name;
        var t = g.Translations.FirstOrDefault(tr => string.Equals(tr.Language, lang, StringComparison.OrdinalIgnoreCase));
        if (t != null && !string.IsNullOrWhiteSpace(t.Name)) name = t.Name;
        return new GenreResponseDTO(g.Id, name);
    }
}
