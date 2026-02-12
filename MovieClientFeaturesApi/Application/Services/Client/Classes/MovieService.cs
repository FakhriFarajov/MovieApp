using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
    private readonly IImageService _imageService;

    public MovieService(MovieApiDbContext db, IImageService imageService)
    {
        _db = db;
        _imageService = imageService;
    }

    public async Task<PaginatedResult<MovieResponseDTO>> GetPopularAsync(int page, int pageSize, string? lang = null, string? genreId = null, string? clientId = null)
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
            var dtos = await BuildDtos(items, lang, clientId);
            return PaginatedResult<MovieResponseDTO>.Success(dtos, total, page, pageSize);
        }
        else
        {
            var total = await q.CountAsync();
            var items = await q.OrderByDescending(m => m.ReleaseDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            var dtos = await BuildDtos(items, lang, clientId);
            return PaginatedResult<MovieResponseDTO>.Success(dtos, total, page, pageSize);
        }
    }

    public async Task<PaginatedResult<MovieResponseDTO>> SearchAsync(int page, int pageSize, string? lang = null, string? query = null, string? genreId = null, string? clientId = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        IQueryable<Movie> q = _db.Movies.AsNoTracking();
        if (string.IsNullOrWhiteSpace(query) && string.IsNullOrWhiteSpace(genreId))
            return await GetPopularAsync(page, pageSize, lang, genreId, clientId);

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
        var dtos = await BuildDtos(items, lang, clientId);
        return PaginatedResult<MovieResponseDTO>.Success(dtos, total, page, pageSize);
    }

    public async Task<MovieResponseDTO?> GetByIdAsync(string id, string? lang = null, string? clientId = null)
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
        var posterUrl = string.IsNullOrWhiteSpace(m.PosterPath) ? string.Empty : await _imageService.GetImageUrlAsync(m.PosterPath);
        var backdropUrl = string.IsNullOrWhiteSpace(m.BackdropPath) ? string.Empty : await _imageService.GetImageUrlAsync(m.BackdropPath);

        var translations = m.Translations.Select(tr => new MovieTranslationResponseDTO(tr.Language, tr.Title, tr.Overview));
        var isInBookmark = false;
        if (!string.IsNullOrWhiteSpace(clientId))
        {
            // clientId is expected to be the client_profile_id supplied by caller
            isInBookmark = await _db.WatchlistItems.AsNoTracking().AnyAsync(w => w.ClientId == clientId && w.MovieId == m.Id);
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
    
    // Helper: build response DTOs for a list of movies (resolves images and bookmark flags)
    private async Task<List<MovieResponseDTO>> BuildDtos(IEnumerable<Movie> items, string? lang, string? clientId = null)
    {
        var list = new List<MovieResponseDTO>();
        HashSet<string> bookmarked = new();
        var movies = items.ToList();
        if (!string.IsNullOrWhiteSpace(clientId) && movies.Any())
        {
            var ids = movies.Select(i => i.Id).ToList();
            var watch = await _db.WatchlistItems.AsNoTracking().Where(w => w.ClientId == clientId && ids.Contains(w.MovieId)).Select(w => w.MovieId).ToListAsync();
            bookmarked = watch.ToHashSet();
        }

        foreach (var m in movies)
        {
            var title = m.OriginalTitle;
            var overview = m.Overview;
            if (!string.IsNullOrWhiteSpace(lang))
            {
                var t = m.Translations?.FirstOrDefault(tr => string.Equals(tr.Language, lang, StringComparison.OrdinalIgnoreCase));
                if (t != null)
                {
                    if (!string.IsNullOrWhiteSpace(t.Title)) title = t.Title;
                    if (!string.IsNullOrWhiteSpace(t.Overview)) overview = t.Overview;
                }
            }

            var posterUrl = string.IsNullOrWhiteSpace(m.PosterPath) ? string.Empty : await _imageService.GetImageUrlAsync(m.PosterPath);
            var backdropUrl = string.IsNullOrWhiteSpace(m.BackdropPath) ? string.Empty : await _imageService.GetImageUrlAsync(m.BackdropPath);
            var translations = m.Translations?.Select(tr => new MovieTranslationResponseDTO(tr.Language, tr.Title, tr.Overview)) ?? Enumerable.Empty<MovieTranslationResponseDTO>();
            var isInBookmark = !string.IsNullOrWhiteSpace(clientId) && bookmarked.Contains(m.Id);

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
