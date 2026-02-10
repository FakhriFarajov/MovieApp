using Microsoft.AspNetCore.Mvc;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;

namespace MovieClientFeaturesApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class MoviesController : ControllerBase
{
    private readonly IMovieService _service;

    public MoviesController(IMovieService service)
    {
        _service = service;
    }

    private static string? NormalizeParam(string? v)
    {
        if (string.IsNullOrWhiteSpace(v)) return null;
        var t = v.Trim();
        if (string.Equals(t, "null", StringComparison.OrdinalIgnoreCase) || string.Equals(t, "undefined", StringComparison.OrdinalIgnoreCase)) return null;
        return t;
    }

    [HttpGet("popular")]
    public async Task<IActionResult> GetPopular([FromQuery] string? lang, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? genreId = null, [FromQuery] string? clientId = null)
    {
        var langSan = NormalizeParam(lang);
        var genreSan = NormalizeParam(genreId);
        var paged = await _service.GetPopularAsync(page, pageSize, langSan, genreSan, clientId);
        return Ok(paged);
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string? lang, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? query = null, [FromQuery] string? genreId = null, [FromQuery] string? clientId = null)
    {
        var langSan = NormalizeParam(lang);
        var querySan = NormalizeParam(query);
        var genreSan = NormalizeParam(genreId);
        var paged = await _service.SearchAsync(page, pageSize, langSan, querySan, genreSan, clientId);
        return Ok(paged);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, [FromQuery] string? lang, [FromQuery] string? clientId = null)
    {
        var langSan = NormalizeParam(lang);
        var m = await _service.GetByIdAsync(id, langSan, clientId);
        if (m == null) return NotFound();
        return Ok(m);
    }

    [HttpGet("{id}/theatres")]
    public async Task<IActionResult> GetTheatres(string id, [FromQuery] string? lang)
    {
        var langSan = NormalizeParam(lang);
        var t = await _service.GetTheatresForMovieAsync(id, langSan);
        return Ok(t);
    }
}
