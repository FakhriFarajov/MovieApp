using Microsoft.AspNetCore.Mvc;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;

namespace MovieClientFeaturesApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ShowTimesController : ControllerBase
{
    private readonly IMovieService _movieService;
    public ShowTimesController(IMovieService movieService)
    {
        _movieService = movieService;
    }

    [HttpGet("theatre/{theatreId}")]
    public async Task<IActionResult> GetByTheatre(string theatreId)
    {
        var items = await _movieService.GetShowTimesForTheatreAsync(theatreId);
        return Ok(items);
    }

    [HttpGet("hall/{hallId}")]
    public async Task<IActionResult> GetByHall(string hallId)
    {
        var items = await _movieService.GetShowTimesForHallAsync(hallId);
        return Ok(items);
    }

    [HttpGet("movie/{movieId}")]
    public async Task<IActionResult> GetByMovie(string movieId)
    {
        var items = await _movieService.GetShowTimesForMovieAsync(movieId);
        return Ok(items);
    }
}
