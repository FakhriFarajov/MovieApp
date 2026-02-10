using Microsoft.AspNetCore.Mvc;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;

namespace MovieClientFeaturesApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TheatresController : ControllerBase
{
    private readonly IMovieService _movieService;

    public TheatresController(IMovieService movieService)
    {
        _movieService = movieService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var theatres = await _movieService.GetAllTheatresAsync();
        return Ok(theatres);
    }
}

