using Microsoft.EntityFrameworkCore;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;
using MovieClientFeaturesApi.Application.Services.Interfaces;
using MovieClientFeaturesApi.Core.DTOs.MovieDtos.Response;
using MovieClientFeaturesApi.Core.DTOs.WatchlistDtos.Response;
using MovieClientFeaturesApi.Core.Models;
using MovieClientFeaturesApi.Infrastructure.Context;

namespace MovieClientFeaturesApi.Application.Services.Client.Classes;

public class BookmarkService : IBookmarkService
{
    private readonly MovieApiDbContext _db;
    private readonly IImageService _imageService;

    public BookmarkService(MovieApiDbContext db, IImageService imageService)
    {
        _db = db;
        _imageService = imageService;
    }

    public async Task<bool> AddAsync(string clientId, string movieId)
    {
        // clientId is expected to be the client_profile_id from token
        if (string.IsNullOrWhiteSpace(clientId)) throw new ArgumentException("clientId is required");

        // ensure client exists
        var client = await _db.Clients.FindAsync(clientId);
        if (client == null) throw new KeyNotFoundException("Client not found");

        // prevent duplicate bookmarks for same movie
        var exists = await _db.WatchlistItems.AnyAsync(w => w.ClientId == clientId && w.MovieId == movieId);
        if (exists) throw new InvalidOperationException("Bookmark already exists");

        // ensure movie exists
        var movieExists = await _db.Movies.AsNoTracking().AnyAsync(m => m.Id == movieId);
        if (!movieExists) throw new KeyNotFoundException("Movie not found");

        // create bookmark
        var item = new WatchlistItem { ClientId = clientId, MovieId = movieId };
        _db.WatchlistItems.Add(item);
        await _db.SaveChangesAsync();

        return true;
    }

    public async Task<bool> RemoveAsync(string clientId, string movieId)
    {
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(movieId)) return false;
        var item = await _db.WatchlistItems.FirstOrDefaultAsync(w => w.ClientId == clientId && w.MovieId == movieId);
        if (item == null) return false;
        _db.WatchlistItems.Remove(item);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<BookmarkResponseDTO>> GetForClientAsync(string clientId)
    {
        var items = await _db.WatchlistItems.AsNoTracking().Where(w => w.ClientId == clientId).ToListAsync();
        var movieIds = items.Select(i => i.MovieId).Distinct().ToList();
        var movies = await _db.Movies.AsNoTracking().Include(m => m.Translations).Where(m => movieIds.Contains(m.Id)).ToListAsync();

        var result = new List<BookmarkResponseDTO>();
        foreach (var i in items)
        {
            var movie = movies.FirstOrDefault(m => m.Id == i.MovieId);
            MovieResponseDTO? movieDto = null;
            if (movie != null)
            {
                var posterUrl = string.IsNullOrWhiteSpace(movie.PosterPath) ? string.Empty : await _imageService.GetImageUrlAsync(movie.PosterPath);
                var backdropUrl = string.IsNullOrWhiteSpace(movie.BackdropPath) ? string.Empty : await _imageService.GetImageUrlAsync(movie.BackdropPath);
                var translations = movie.Translations.Select(tr => new MovieTranslationResponseDTO(tr.Language, tr.Title, tr.Overview));
                movieDto = new MovieResponseDTO(
                    movie.Id,
                    movie.OriginalTitle,
                    movie.Overview,
                    backdropUrl.Length > 0 ? backdropUrl : movie.BackdropPath,
                    posterUrl.Length > 0 ? posterUrl : movie.PosterPath,
                    movie.ReleaseDate,
                    movie.Duration,
                    movie.AgeRestriction,
                    movie.GenreIds,
                    movie.Video,
                    movie.VideoUrl,
                    true,
                    movie.IsForAdult,
                    movie.OriginalLanguage,
                    movie.Languages,
                    movie.Actors,
                    movie.Director,
                    movie.HomePageUrl,
                    movie.AverageRating,
                    movie.Revenue,
                    movie.Budget,
                    movie.Status,
                    movie.TagLine,
                    translations
                );
            }
            result.Add(new BookmarkResponseDTO(i.Id, i.MovieId, i.ClientId, movieDto));
        }
        return result;
    }
}
