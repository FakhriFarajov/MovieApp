using Microsoft.EntityFrameworkCore;
using MovieAdminFeaturesApi.Application.Services.Admin.Interfaces;
using MovieAdminFeaturesApi.Application.Services.Interfaces;
using MovieAdminFeaturesApi.Core.DTOs.MovieDtos.Response;
using MovieAdminFeaturesApi.Core.DTOs.Pagination;
using MovieAdminFeaturesApi.Core.Models;
using MovieAdminFeaturesApi.Infrastructure.Context;

namespace MovieAdminFeaturesApi.Application.Services.Admin.Classes;

public partial class MovieService : IMovieService
{
    private readonly MovieApiDbContext _db;
    private readonly ILibreTranslateService _translator;
    private readonly IImageService _imageService;
    private readonly string[] _langs = new[] { "en", "ru", "az" };

    public MovieService(MovieApiDbContext db, ILibreTranslateService translator, IImageService imageService)
    {
        _db = db;
        _translator = translator;
        _imageService = imageService;
    }

    public async Task<IEnumerable<Movie>> GetAllAsync()
    {
        return await _db.Movies.AsNoTracking().ToListAsync();
    }

    public async Task<Movie?> GetByIdAsync(string id)
    {
        return await _db.Movies.FindAsync(id);
    }

    public async Task<Movie> CreateAsync(Movie movie)
    {
        // Normalize poster/backdrop: if client sent a full URL (presigned), extract object name
        if (!string.IsNullOrWhiteSpace(movie.PosterPath) && IsAbsoluteUrl(movie.PosterPath))
        {
            try
            {
                var u = new Uri(movie.PosterPath);
                var seg = u.LocalPath.Split('/', StringSplitOptions.RemoveEmptyEntries);
                if (seg.Length > 0) movie.PosterPath = seg.Last();
            }
            catch
            {
                // ignore, keep original
            }
        }
        if (!string.IsNullOrWhiteSpace(movie.BackdropPath) && IsAbsoluteUrl(movie.BackdropPath))
        {
            try
            {
                var u = new Uri(movie.BackdropPath);
                var seg = u.LocalPath.Split('/', StringSplitOptions.RemoveEmptyEntries);
                if (seg.Length > 0) movie.BackdropPath = seg.Last();
            }
            catch
            {
                // ignore
            }
        }

        // create translations for title and overview
        var titleTranslations = await _translator.TranslateMultipleAsync(movie.OriginalTitle, _langs, "auto");
        var overviewTranslations = await _translator.TranslateMultipleAsync(movie.Overview, _langs, "auto");

        foreach (var lang in _langs)
        {
            var tTitle = titleTranslations.ContainsKey(lang) ? titleTranslations[lang] : string.Empty;
            var tOverview = overviewTranslations.ContainsKey(lang) ? overviewTranslations[lang] : string.Empty;
            if (!string.IsNullOrWhiteSpace(tTitle) || !string.IsNullOrWhiteSpace(tOverview))
            {
                movie.Translations.Add(new MovieTranslation
                {
                    Language = lang,
                    Title = tTitle,
                    Overview = tOverview
                });
            }
        }

        _db.Movies.Add(movie);
        await _db.SaveChangesAsync();
        return movie;
    }

    public async Task<bool> UpdateAsync(string id, Movie movie)
    {
        var existing = await _db.Movies.Include(m => m.Translations).FirstOrDefaultAsync(m => m.Id == id);
        if (existing == null) return false;

        existing.IsForAdult = movie.IsForAdult;

        // Only update BackdropPath if the incoming value is not an absolute URL.
        // This prevents the UI from sending resolved image URLs (http/https) and overwriting stored object names.
        if (!string.IsNullOrWhiteSpace(movie.BackdropPath))
        {
            if (!IsAbsoluteUrl(movie.BackdropPath))
            {
                existing.BackdropPath = movie.BackdropPath;
            }
            // else: incoming value is a resolved URL; ignore to keep stored object name
        }

        existing.GenreIds = movie.GenreIds;
        existing.OriginalLanguage = movie.OriginalLanguage;
        existing.Languages = movie.Languages;
        existing.OriginalTitle = movie.OriginalTitle;
        existing.Overview = movie.Overview;

        // Only update PosterPath if the incoming value is not an absolute URL.
        if (!string.IsNullOrWhiteSpace(movie.PosterPath))
        {
            if (!IsAbsoluteUrl(movie.PosterPath))
            {
                existing.PosterPath = movie.PosterPath;
            }
            // else: ignore
        }

        existing.Duration = movie.Duration;
        existing.AgeRestriction = movie.AgeRestriction;
        existing.ReleaseDate = movie.ReleaseDate;
        existing.Video = movie.Video;
        existing.VideoUrl = movie.VideoUrl;
        existing.Actors = movie.Actors;
        existing.Director = movie.Director;

        // Persist new fields
        existing.HomePageUrl = movie.HomePageUrl;
        existing.AverageRating = movie.AverageRating;
        existing.Revenue = movie.Revenue;
        existing.Budget = movie.Budget;
        existing.Status = movie.Status;
        existing.TagLine = movie.TagLine;

        var titleTranslations = await _translator.TranslateMultipleAsync(movie.OriginalTitle, _langs, "auto");
        var overviewTranslations = await _translator.TranslateMultipleAsync(movie.Overview, _langs, "auto");

        foreach (var lang in _langs)
        {
            var tTitle = titleTranslations.ContainsKey(lang) ? titleTranslations[lang] : null;
            var tOverview = overviewTranslations.ContainsKey(lang) ? overviewTranslations[lang] : null;

            var found = existing.Translations.FirstOrDefault(t => t.Language == lang);
            if (found != null)
            {
                found.Title = tTitle ?? found.Title;
                found.Overview = tOverview ?? found.Overview;
            }
            else if (!string.IsNullOrWhiteSpace(tTitle) || !string.IsNullOrWhiteSpace(tOverview))
            {
                existing.Translations.Add(new MovieTranslation { Language = lang, Title = tTitle ?? string.Empty, Overview = tOverview ?? string.Empty });
            }
        }

        await _db.SaveChangesAsync();
        return true;
    }

    private static bool IsAbsoluteUrl(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        if (Uri.TryCreate(value, UriKind.Absolute, out var uri))
        {
            return uri.Scheme.Equals("http", StringComparison.OrdinalIgnoreCase) || uri.Scheme.Equals("https", StringComparison.OrdinalIgnoreCase);
        }
        return false;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var existing = await _db.Movies.FindAsync(id);
        if (existing == null) return false;
        _db.Movies.Remove(existing);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<MovieResponseDTO>> GetAllTranslatedAsync(string lang)
    {
        var movies = await _db.Movies.Include(m => m.Translations).Include(m => m.Watchlist).AsNoTracking().ToListAsync();
        var list = new List<MovieResponseDTO>();
        foreach (var m in movies)
        {
            var title = m.OriginalTitle;
            var overview = m.Overview;
            var t = m.Translations.FirstOrDefault(tr => string.Equals(tr.Language, lang, StringComparison.OrdinalIgnoreCase));
            if (t != null)
            {
                if (!string.IsNullOrWhiteSpace(t.Title)) title = t.Title;
                if (!string.IsNullOrWhiteSpace(t.Overview)) overview = t.Overview;
            }
            // Resolve poster/backdrop URLs and use translated title/overview
            var posterUrl = string.IsNullOrWhiteSpace(m.PosterPath) ? string.Empty : await _imageService.GetImageUrlAsync(m.PosterPath);
            var backdropUrl = string.IsNullOrWhiteSpace(m.BackdropPath) ? string.Empty : await _imageService.GetImageUrlAsync(m.BackdropPath);
            list.Add(new MovieResponseDTO(
                m.Id,
                title,
                overview,
                backdropUrl.Length > 0 ? backdropUrl : m.BackdropPath,
                posterUrl.Length > 0 ? posterUrl : m.PosterPath,
                m.ReleaseDate,
                m.Duration,
                m.AgeRestriction,
                m.GenreIds,
                m.Video,
                m.VideoUrl,
                m.IsForAdult,
                m.OriginalLanguage,
                m.Languages,
                m.Actors,
                m.Director,
                m.HomePageUrl,
                m.AverageRating,
                m.Revenue,
                m.Budget,
                m.Status,
                m.TagLine,
                m.Translations.Select(tr => new MovieTranslationResponseDTO(tr.Language, tr.Title, tr.Overview))
            ));
        }
        return list;
    }

    public async Task<MovieResponseDTO?> GetByIdTranslatedAsync(string id, string lang)
    {
        var m = await _db.Movies.Include(x => x.Translations).Include(x => x.Watchlist).AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (m == null) return null;
        var title = m.OriginalTitle;
        var overview = m.Overview;
        var t = m.Translations.FirstOrDefault(tr => string.Equals(tr.Language, lang, StringComparison.OrdinalIgnoreCase));
        if (t != null)
        {
            if (!string.IsNullOrWhiteSpace(t.Title)) title = t.Title;
            if (!string.IsNullOrWhiteSpace(t.Overview)) overview = t.Overview;
        }
        var posterUrl = string.IsNullOrWhiteSpace(m.PosterPath) ? string.Empty : await _imageService.GetImageUrlAsync(m.PosterPath);
        var backdropUrl = string.IsNullOrWhiteSpace(m.BackdropPath) ? string.Empty : await _imageService.GetImageUrlAsync(m.BackdropPath);
        return new MovieResponseDTO(
            m.Id,
            title,
            overview,
            backdropUrl.Length > 0 ? backdropUrl : m.BackdropPath,
            posterUrl.Length > 0 ? posterUrl : m.PosterPath,
            m.ReleaseDate,
            m.Duration,
            m.AgeRestriction,
            m.GenreIds,
            m.Video,
            m.VideoUrl,
            m.IsForAdult,
            m.OriginalLanguage,
            m.Languages,
            m.Actors,
            m.Director,
            m.HomePageUrl,
            m.AverageRating,
            m.Revenue,
            m.Budget,
            m.Status,
            m.TagLine,
            m.Translations.Select(tr => new MovieTranslationResponseDTO(tr.Language, tr.Title, tr.Overview))
        );
    }

    public async Task<PaginatedResult<Movie>> GetPagedAsync(int page, int pageSize, string? genreId = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        IQueryable<Movie> q = _db.Movies.AsNoTracking();

        if (string.IsNullOrWhiteSpace(genreId))
        {
            var total = await q.CountAsync();
            var items = await q.OrderByDescending(m => m.ReleaseDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            return PaginatedResult<Movie>.Success(items, total, page, pageSize);
        }
        else
        {
            // Fallback: load all and filter in-memory by GenreIds
            var all = await q.ToListAsync();
            var filtered = all.Where(m => m.GenreIds.Contains(genreId)).ToList();
            var total = filtered.Count;
            var items = filtered.OrderByDescending(m => m.ReleaseDate).Skip((page - 1) * pageSize).Take(pageSize).ToList();
            return PaginatedResult<Movie>.Success(items, total, page, pageSize);
        }
    }

    public async Task<PaginatedResult<MovieResponseDTO>> GetPagedTranslatedAsync(int page, int pageSize, string? lang = null, string? genreId = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        IQueryable<Movie> q = _db.Movies.AsNoTracking().Include(m => m.Translations).Include(m => m.Watchlist);

        if (string.IsNullOrWhiteSpace(genreId))
        {
            var total = await q.CountAsync();
            var items = await q.OrderByDescending(m => m.ReleaseDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            var results = new List<MovieResponseDTO>();
            foreach (var m in items)
            {
                var title = m.OriginalTitle;
                var overview = m.Overview;
                if (!string.IsNullOrWhiteSpace(lang))
                {
                    var t = m.Translations.FirstOrDefault(tr => string.Equals(tr.Language, lang, StringComparison.OrdinalIgnoreCase));
                    if (t != null)
                    {
                        if (!string.IsNullOrWhiteSpace(t.Title)) title = t.Title;
                        if (!string.IsNullOrWhiteSpace(t.Overview)) overview = t.Overview;
                    }
                }
                var posterUrl = string.IsNullOrWhiteSpace(m.PosterPath) ? string.Empty : await _imageService.GetImageUrlAsync(m.PosterPath);
                var backdropUrl = string.IsNullOrWhiteSpace(m.BackdropPath) ? string.Empty : await _imageService.GetImageUrlAsync(m.BackdropPath);
                results.Add(new MovieResponseDTO(
                    m.Id,
                    title,
                    overview,
                    backdropUrl.Length > 0 ? backdropUrl : m.BackdropPath,
                    posterUrl.Length > 0 ? posterUrl : m.PosterPath,
                    m.ReleaseDate,
                    m.Duration,
                    m.AgeRestriction,
                    m.GenreIds,
                    m.Video,
                    m.VideoUrl,
                    m.IsForAdult,
                    m.OriginalLanguage,
                    m.Languages,
                    m.Actors,
                    m.Director,
                    m.HomePageUrl,
                    m.AverageRating,
                    m.Revenue,
                    m.Budget,
                    m.Status,
                    m.TagLine,
                    m.Translations.Select(tr => new MovieTranslationResponseDTO(tr.Language, tr.Title, tr.Overview))
                 ));
            }

             return PaginatedResult<MovieResponseDTO>.Success(results, total, page, pageSize);
         }
         else
         {
             // Load all, filter in-memory, then page
             var all = await q.ToListAsync();
             var filtered = all.Where(m => m.GenreIds.Contains(genreId)).ToList();
             var total = filtered.Count;
             var items = filtered.OrderByDescending(m => m.ReleaseDate).Skip((page - 1) * pageSize).Take(pageSize).ToList();

             var results2 = new List<MovieResponseDTO>();
             foreach (var m in items)
             {
                 var title = m.OriginalTitle;
                 var overview = m.Overview;
                 if (!string.IsNullOrWhiteSpace(lang))
                 {
                     var t = m.Translations.FirstOrDefault(tr => string.Equals(tr.Language, lang, StringComparison.OrdinalIgnoreCase));
                     if (t != null)
                     {
                         if (!string.IsNullOrWhiteSpace(t.Title)) title = t.Title;
                         if (!string.IsNullOrWhiteSpace(t.Overview)) overview = t.Overview;
                     }
                 }
                 var posterUrl = string.IsNullOrWhiteSpace(m.PosterPath) ? string.Empty : await _imageService.GetImageUrlAsync(m.PosterPath);
                 var backdropUrl = string.IsNullOrWhiteSpace(m.BackdropPath) ? string.Empty : await _imageService.GetImageUrlAsync(m.BackdropPath);
                 results2.Add(new MovieResponseDTO(
                    m.Id,
                    title,
                    overview,
                    backdropUrl.Length > 0 ? backdropUrl : m.BackdropPath,
                    posterUrl.Length > 0 ? posterUrl : m.PosterPath,
                    m.ReleaseDate,
                    m.Duration,
                    m.AgeRestriction,
                    m.GenreIds,
                    m.Video,
                    m.VideoUrl,
                    m.IsForAdult,
                    m.OriginalLanguage,
                    m.Languages,
                    m.Actors,
                    m.Director,
                    m.HomePageUrl,
                    m.AverageRating,
                    m.Revenue,
                    m.Budget,
                    m.Status,
                    m.TagLine,
                    m.Translations.Select(tr => new MovieTranslationResponseDTO(tr.Language, tr.Title, tr.Overview))
                ));
             }

             return PaginatedResult<MovieResponseDTO>.Success(results2, total, page, pageSize);
         }
    }
}
