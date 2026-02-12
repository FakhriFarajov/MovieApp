using Microsoft.AspNetCore.Mvc;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;

namespace MovieClientFeaturesApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class GenresController : ControllerBase
{
    private readonly IGenreService _genreService;
    private readonly IMovieService _movieService;

    public GenresController(IGenreService genreService, IMovieService movieService)
    {
        _genreService = genreService;
        _movieService = movieService;
    }

    [HttpGet("getAllGenres")]
    public async Task<IActionResult> GetAll([FromQuery] string? lang = null)
    {
        var genres = await _genreService.GetAllGenresAsync(lang);
        return Ok(genres);
    }

    //
    // //Must be in Movie Controller because it needs to return paged movies, and the logic is in MovieService
    // [HttpGet("getMovieByGenreId/{id}/")]
    // public async Task<IActionResult> GetMoviesByGenre(string id, [FromQuery] string? lang = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    // {
    //     var paged = await _movieService.SearchAsync(page, pageSize, lang, null, id);
    //     return Ok(paged);
    // }
}
