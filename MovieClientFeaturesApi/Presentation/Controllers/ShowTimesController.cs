using Microsoft.AspNetCore.Mvc;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;

namespace MovieClientFeaturesApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ShowTimesController : ControllerBase
{
    private readonly IShowTimeService _showTimeService;
    public ShowTimesController(IShowTimeService showTimeService)
    {
        _showTimeService = showTimeService;
    }

    [HttpGet("theatre/{theatreId}")]
    public async Task<IActionResult> GetByTheatre(string theatreId)
    {
        var items = await _showTimeService.GetShowTimesForTheatreAsync(theatreId);
        return Ok(items);
    }
    

    [HttpGet("movie/{movieId}")]
    public async Task<IActionResult> GetByMovie(string movieId)
    {
        var items = await _showTimeService.GetShowTimesForMovieAsync(movieId);
        return Ok(items);
    }

    [HttpGet("{showTimeId}/seats")]
    public async Task<IActionResult> GetSeatsForShow(string showTimeId)
    {
        var items = await _showTimeService.GetSeatAvailabilityForShowAsync(showTimeId);
        return Ok(items);
    }
}
