using Microsoft.AspNetCore.Mvc;
using MovieAdminFeaturesApi.Application.Services.Admin.Interfaces;
using MovieAdminFeaturesApi.Core.Models;
using MovieAdminFeaturesApi.Core.DTOs.MovieDtos.Request;
using System.Text.Json;
using System.Linq;

namespace MovieAdminFeaturesApi.Presentation.Controllers.AdminControllers;

[ApiController]
[Route("api/Admin/[controller]")]
public class MoviesController : ControllerBase
{
    private readonly IMovieService _movieService;

    public MoviesController(IMovieService movieService)
    {
        _movieService = movieService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? lang, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? genreId = null)
    {
        var pagedLocalized = await _movieService.GetPagedTranslatedAsync(page, pageSize, lang ?? string.Empty, genreId);
        return Ok(pagedLocalized);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, [FromQuery] string? lang)
    {
        var localized = await _movieService.GetByIdTranslatedAsync(id, lang ?? string.Empty);
        if (localized == null) return NotFound();
        return Ok(localized);
    }

    private IDictionary<string, string[]> GetModelErrors()
    {
        var dict = new Dictionary<string, string[]>();
        foreach (var kv in ModelState)
        {
            var errors = kv.Value?.Errors?.Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? e.Exception?.Message ?? string.Empty : e.ErrorMessage).Where(s => !string.IsNullOrWhiteSpace(s)).ToArray() ?? Array.Empty<string>();
            if (errors.Length > 0)
            {
                dict[kv.Key] = errors;
            }
        }
        return dict;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MovieCreateRequestDTO dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = GetModelErrors();
            return BadRequest(new { isSuccess = false, message = "Validation failed", data = errors });
        }

        var movie = new Movie
        {
            IsForAdult = dto.IsForAdult,
            BackdropPath = dto.BackdropPath,
            GenreIds = dto.GenreIds.ToList(),
            OriginalLanguage = dto.OriginalLanguage,
            Languages = dto.Languages.ToList(),
            OriginalTitle = dto.OriginalTitle,
            Overview = dto.Overview,
            PosterPath = dto.PosterPath,
            Duration = dto.Duration,
            AgeRestriction = dto.AgeRestriction,
            ReleaseDate = dto.ReleaseDate,
            Video = dto.Video,
            VideoUrl = dto.VideoUrl,
            Actors = dto.Actors.ToList(),
            Director = dto.Director,
            HomePageUrl = dto.HomePageUrl,
            AverageRating = dto.AverageRating,
            Revenue = dto.Revenue,
            Budget = dto.Budget,
            Status = dto.Status,
            TagLine = dto.TagLine
        };

        var created = await _movieService.CreateAsync(movie);
        // Return the translated DTO so client gets the same shape as Get endpoints (resolved image URLs etc.)
        var createdDto = await _movieService.GetByIdTranslatedAsync(created.Id, string.Empty);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, createdDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] MovieUpdateRequestDTO dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = GetModelErrors();
            return BadRequest(new { isSuccess = false, message = "Validation failed", data = errors });
        }

        var movie = new Movie
        {
            IsForAdult = dto.IsForAdult,
            BackdropPath = dto.BackdropPath,
            GenreIds = dto.GenreIds.ToList(),
            OriginalLanguage = dto.OriginalLanguage,
            Languages = dto.Languages.ToList(),
            OriginalTitle = dto.OriginalTitle,
            Overview = dto.Overview,
            PosterPath = dto.PosterPath,
            Duration = dto.Duration,
            AgeRestriction = dto.AgeRestriction,
            ReleaseDate = dto.ReleaseDate,
            Video = dto.Video,
            VideoUrl = dto.VideoUrl,
            Actors = dto.Actors.ToList(),
            Director = dto.Director,
            HomePageUrl = dto.HomePageUrl,
            AverageRating = dto.AverageRating,
            Revenue = dto.Revenue,
            Budget = dto.Budget,
            Status = dto.Status,
            TagLine = dto.TagLine
        };

        var ok = await _movieService.UpdateAsync(id, movie);
        if (!ok) return NotFound();
        // Return the updated translated DTO so client can show updated values
        var updatedDto = await _movieService.GetByIdTranslatedAsync(id, string.Empty);
        return Ok(updatedDto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var ok = await _movieService.DeleteAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }
}