using Microsoft.AspNetCore.Mvc;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;

namespace MovieClientFeaturesApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TheatresController : ControllerBase
{
    private readonly ITheatreService _theatreService;

    public TheatresController(ITheatreService theatreService)
    {
        _theatreService = theatreService;
    }

    [HttpGet("getAll")]
    public async Task<IActionResult> GetAll()
    {
        var theatres = await _theatreService.GetAllTheatresAsync();
        return Ok(theatres);
    }
}