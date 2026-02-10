using Microsoft.AspNetCore.Mvc;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;

namespace MovieClientFeaturesApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class GenresController : ControllerBase
{
    private readonly IMovieService _movieService;

    public GenresController(IMovieService movieService)
    {
        _movieService = movieService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? lang = null)
    {
        var genres = await _movieService.GetAllGenresAsync(lang);
        return Ok(genres);
    }

    [HttpGet("{id}/movies")]
    public async Task<IActionResult> GetMoviesByGenre(string id, [FromQuery] string? lang = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var paged = await _movieService.SearchAsync(page, pageSize, lang, null, id);
        return Ok(paged);
    }
}
