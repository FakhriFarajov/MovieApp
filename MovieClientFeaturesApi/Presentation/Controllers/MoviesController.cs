using Microsoft.AspNetCore.Mvc;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;

namespace MovieClientFeaturesApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class MoviesController : ControllerBase
{
    private readonly IMovieService _movieService;

    public MoviesController(IMovieService service)
    {
        _movieService = service;
    }

    // Read client id from access token claims when available; return null if unauthenticated
    private string? GetClientIdFromClaims()
    {
        var user = User;
        if (user?.Identity?.IsAuthenticated != true) return null;
        var id = user.FindFirst("client_profile_id")?.Value;
        return string.IsNullOrWhiteSpace(id) ? null : id;
    }

    [HttpGet("getPopular")]
    public async Task<IActionResult> GetPopular([FromQuery] string? lang, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? genreId = null)
    {
        var clientId = GetClientIdFromClaims();
        var paged = await _movieService.GetPopularAsync(page, pageSize, lang, genreId, clientId);
        return Ok(paged);
    }

    [HttpGet("searchByNameOrGenre")]
    public async Task<IActionResult> Search([FromQuery] string? lang, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? query = null, [FromQuery] string? genreId = null)
    {
        var clientId = GetClientIdFromClaims();
        var paged = await _movieService.SearchAsync(page, pageSize, lang, query, genreId, clientId);
        return Ok(paged);
    }

    [HttpGet("getDetails/{id}")]
    public async Task<IActionResult> Get(string id, [FromQuery] string? lang)
    {
        var clientId = GetClientIdFromClaims();
        var m = await _movieService.GetByIdAsync(id, lang, clientId);
        if (m == null) return NotFound();
        return Ok(m);
    }
}
