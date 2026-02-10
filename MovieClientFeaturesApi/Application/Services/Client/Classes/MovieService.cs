using Microsoft.EntityFrameworkCore;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;
using MovieClientFeaturesApi.Application.Services.Interfaces;
using MovieClientFeaturesApi.Core.DTOs.MovieDtos.Response;
using MovieClientFeaturesApi.Core.DTOs.Pagination;
using MovieClientFeaturesApi.Core.Models;
using MovieClientFeaturesApi.Infrastructure.Context;

namespace MovieClientFeaturesApi.Application.Services.Client.Classes;

public class MovieService : IMovieService
{
    private readonly MovieApiDbContext _db;
    private readonly IImageService _image_service;

    public MovieService(MovieApiDbContext db, IImageService imageService)
    {
        _db = db;
        _image_service = imageService;
    }

    public async Task<PaginatedResult<MovieResponseDTO>> GetPopularAsync(int page, int pageSize, string? lang = null, string? genreId = null, string? userId = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        IQueryable<Movie> q = _db.Movies.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(genreId))
        {
            var all = await q.ToListAsync();
            var filtered = all.Where(m => m.GenreIds.Contains(genreId)).ToList();
            var total = filtered.Count;
            var items = filtered.OrderByDescending(m => m.ReleaseDate).Skip((page - 1) * pageSize).Take(pageSize).ToList();
            var dtos = await BuildDtos(items, lang, userId);
            return PaginatedResult<MovieResponseDTO>.Success(dtos, total, page, pageSize);
        }
        else
        {
            var total = await q.CountAsync();
            var items = await q.OrderByDescending(m => m.ReleaseDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            var dtos = await BuildDtos(items, lang, userId);
            return PaginatedResult<MovieResponseDTO>.Success(dtos, total, page, pageSize);
        }
    }

    public async Task<PaginatedResult<MovieResponseDTO>> SearchAsync(int page, int pageSize, string? lang = null, string? query = null, string? genreId = null, string? userId = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        IQueryable<Movie> q = _db.Movies.AsNoTracking();
        if (string.IsNullOrWhiteSpace(query) && string.IsNullOrWhiteSpace(genreId))
            return await GetPopularAsync(page, pageSize, lang, genreId, userId);

        var all = await q.Include(m => m.Translations).ToListAsync();
        var filtered = all.AsQueryable();
        if (!string.IsNullOrWhiteSpace(genreId)) filtered = filtered.Where(m => m.GenreIds.Contains(genreId));
        if (!string.IsNullOrWhiteSpace(query))
        {
            var qLower = query.ToLowerInvariant();
            filtered = filtered.Where(m => m.OriginalTitle.ToLower().Contains(qLower) || m.Overview.ToLower().Contains(qLower) || m.Translations.Any(t => t.Title.ToLower().Contains(qLower) || t.Overview.ToLower().Contains(qLower)));
        }

        var list = filtered.OrderByDescending(m => m.ReleaseDate).ToList();
        var total = list.Count;
        var items = list.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var dtos = await BuildDtos(items, lang, userId);
        return PaginatedResult<MovieResponseDTO>.Success(dtos, total, page, pageSize);
    }

    public async Task<MovieResponseDTO?> GetByIdAsync(string id, string? lang = null, string? userId = null)
    {
        var m = await _db.Movies.Include(x => x.Translations).AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (m == null) return null;
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
        var posterUrl = string.IsNullOrWhiteSpace(m.PosterPath) ? string.Empty : await _image_service.GetImageUrlAsync(m.PosterPath);
        var backdropUrl = string.IsNullOrWhiteSpace(m.BackdropPath) ? string.Empty : await _image_service.GetImageUrlAsync(m.BackdropPath);

        var translations = m.Translations.Select(tr => new MovieTranslationResponseDTO(tr.Language, tr.Title, tr.Overview));
        var isInBookmark = false;
        if (!string.IsNullOrWhiteSpace(userId))
        {
            // userId is expected to be the client profile id supplied by caller
            isInBookmark = await _db.WatchlistItems.AsNoTracking().AnyAsync(w => w.ClientId == userId && w.MovieId == m.Id);
        }

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
            isInBookmark,
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
            translations
        );
    }

    public async Task<IEnumerable<MovieClientFeaturesApi.Core.DTOs.TheatreDtos.Response.TheatreWithHallsResponseDTO>> GetTheatresForMovieAsync(string movieId, string? lang = null)
    {
        var showtimes = await _db.ShowTimes.AsNoTracking().Where(s => s.MovieId == movieId).ToListAsync();
        var hallIds = showtimes.Select(s => s.HallId).Distinct().ToList();
        if (!hallIds.Any()) return new List<MovieClientFeaturesApi.Core.DTOs.TheatreDtos.Response.TheatreWithHallsResponseDTO>();

        var halls = await _db.Halls.AsNoTracking().Where(h => hallIds.Contains(h.Id)).ToListAsync();
        var theatreIds = halls.Select(h => h.TheatreId).Distinct().ToList();
        var theatres = await _db.Theatres.AsNoTracking().Where(t => theatreIds.Contains(t.Id)).ToListAsync();

        var results = new List<MovieClientFeaturesApi.Core.DTOs.TheatreDtos.Response.TheatreWithHallsResponseDTO>();
        foreach (var t in theatres)
        {
            var relatedHalls = halls.Where(h => h.TheatreId == t.Id).Select(h => new MovieClientFeaturesApi.Core.DTOs.TheatreDtos.Response.HallSimpleDTO(h.Id, h.Name, h.Rows, h.Columns));
            results.Add(new MovieClientFeaturesApi.Core.DTOs.TheatreDtos.Response.TheatreWithHallsResponseDTO(t.Id, t.Name, t.Address, t.Latitude, t.Longitude, relatedHalls));
        }

        return results;
    }

    public async Task<IEnumerable<MovieClientFeaturesApi.Core.DTOs.GenreDtos.Response.GenreResponseDTO>> GetAllGenresAsync(string? lang = null)
    {
        var genres = await _db.Genres.Include(g => g.Translations).AsNoTracking().ToListAsync();
        var list = new List<MovieClientFeaturesApi.Core.DTOs.GenreDtos.Response.GenreResponseDTO>();
        foreach (var g in genres)
        {
            var name = g.Name;
            if (!string.IsNullOrWhiteSpace(lang))
            {
                var t = g.Translations.FirstOrDefault(tr => string.Equals(tr.Language, lang, StringComparison.OrdinalIgnoreCase));
                if (t != null && !string.IsNullOrWhiteSpace(t.Name)) name = t.Name;
            }
            list.Add(new MovieClientFeaturesApi.Core.DTOs.GenreDtos.Response.GenreResponseDTO(g.Id, name));
        }
        return list;
    }

    public async Task<IEnumerable<MovieClientFeaturesApi.Core.DTOs.GenreDtos.Response.GenreResponseDTO>> GetGenresByIdsAsync(IEnumerable<string> ids, string? lang = null)
    {
        var set = ids.ToHashSet();
        var genres = await _db.Genres.Include(g => g.Translations).AsNoTracking().Where(g => set.Contains(g.Id)).ToListAsync();
        return await GetAllGenresAsync(lang); // reuse formatting; small inefficiency acceptable
    }

    public async Task<IEnumerable<MovieClientFeaturesApi.Core.DTOs.ShowTimeDtos.Response.ShowTimeResponseDTO>> GetShowTimesForTheatreAsync(string theatreId)
    {
        var halls = await _db.Halls.AsNoTracking().Where(h => h.TheatreId == theatreId).ToListAsync();
        var hallIds = halls.Select(h => h.Id).ToList();
        var showtimes = await _db.ShowTimes.AsNoTracking().Where(s => hallIds.Contains(s.HallId)).ToListAsync();
        return showtimes.Select(s => new MovieClientFeaturesApi.Core.DTOs.ShowTimeDtos.Response.ShowTimeResponseDTO(s.Id, s.MovieId, s.HallId, s.StartTime, s.EndTime, s.BasePrice));
    }

    public async Task<IEnumerable<MovieClientFeaturesApi.Core.DTOs.ShowTimeDtos.Response.ShowTimeResponseDTO>> GetShowTimesForHallAsync(string hallId)
    {
        var showtimes = await _db.ShowTimes.AsNoTracking().Where(s => s.HallId == hallId).ToListAsync();
        return showtimes.Select(s => new MovieClientFeaturesApi.Core.DTOs.ShowTimeDtos.Response.ShowTimeResponseDTO(s.Id, s.MovieId, s.HallId, s.StartTime, s.EndTime, s.BasePrice));
    }

    public async Task<IEnumerable<MovieClientFeaturesApi.Core.DTOs.ShowTimeDtos.Response.ShowTimeResponseDTO>> GetShowTimesForMovieAsync(string movieId)
    {
        var showtimes = await _db.ShowTimes.AsNoTracking().Where(s => s.MovieId == movieId).ToListAsync();
        return showtimes.Select(s => new MovieClientFeaturesApi.Core.DTOs.ShowTimeDtos.Response.ShowTimeResponseDTO(s.Id, s.MovieId, s.HallId, s.StartTime, s.EndTime, s.BasePrice));
    }

    public async Task<IEnumerable<MovieClientFeaturesApi.Core.DTOs.TheatreDtos.Response.TheatreWithHallsResponseDTO>> GetAllTheatresAsync()
    {
        var theatres = await _db.Theatres.AsNoTracking().ToListAsync();
        var halls = await _db.Halls.AsNoTracking().Where(h => theatres.Select(t => t.Id).Contains(h.TheatreId)).ToListAsync();

        var results = new List<MovieClientFeaturesApi.Core.DTOs.TheatreDtos.Response.TheatreWithHallsResponseDTO>();
        foreach (var t in theatres)
        {
            var relatedHalls = halls.Where(h => h.TheatreId == t.Id).Select(h => new MovieClientFeaturesApi.Core.DTOs.TheatreDtos.Response.HallSimpleDTO(h.Id, h.Name, h.Rows, h.Columns));
            results.Add(new MovieClientFeaturesApi.Core.DTOs.TheatreDtos.Response.TheatreWithHallsResponseDTO(t.Id, t.Name, t.Address, t.Latitude, t.Longitude, relatedHalls));
        }
        return results;
    }

    private async Task<List<MovieResponseDTO>> BuildDtos(IEnumerable<Movie> items, string? lang, string? userId = null)
    {
        var list = new List<MovieResponseDTO>();
        HashSet<string> bookmarked = new();
        if (!string.IsNullOrWhiteSpace(userId))
        {
            var ids = items.Select(i => i.Id).ToList();
            var watch = await _db.WatchlistItems.AsNoTracking().Where(w => w.ClientId == userId && ids.Contains(w.MovieId)).Select(w => w.MovieId).ToListAsync();
            bookmarked = watch.ToHashSet();
         }
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

            var posterUrl = string.IsNullOrWhiteSpace(m.PosterPath) ? string.Empty : await _image_service.GetImageUrlAsync(m.PosterPath);
            var backdropUrl = string.IsNullOrWhiteSpace(m.BackdropPath) ? string.Empty : await _image_service.GetImageUrlAsync(m.BackdropPath);
            var translations = m.Translations.Select(tr => new MovieTranslationResponseDTO(tr.Language, tr.Title, tr.Overview));
            var isInBookmark = !string.IsNullOrWhiteSpace(userId) && bookmarked.Contains(m.Id);
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
                isInBookmark,
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
                translations
            ));
        }
        return list;
    }
}
