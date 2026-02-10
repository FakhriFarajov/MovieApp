using Microsoft.AspNetCore.Mvc;
using MovieAdminFeaturesApi.Application.Services.Admin.Interfaces;
using MovieAdminFeaturesApi.Core.Models;
using MovieAdminFeaturesApi.Core.DTOs.GenreDtos.Request;
using MovieAdminFeaturesApi.Core.DTOs.GenreDtos.Response;

namespace MovieAdminFeaturesApi.Presentation.Controllers.AdminControllers;

[ApiController]
[Route("api/Admin/[controller]")]
public class GenresController : ControllerBase
{
    private readonly IGenreService _genreService;

    public GenresController(IGenreService genreService)
    {
        _genreService = genreService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? lang)
    {
        if (string.IsNullOrWhiteSpace(lang))
        {
            var list = await _genreService.GetAllAsync();
            return Ok(list);
        }

        var localized = await _genreService.GetAllTranslatedAsync(lang);
        return Ok(localized);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, [FromQuery] string? lang)
    {
        if (string.IsNullOrWhiteSpace(lang))
        {
            var g = await _genreService.GetByIdAsync(id);
            if (g == null) return NotFound();
            return Ok(g);
        }

        var localized = await _genreService.GetByIdTranslatedAsync(id, lang);
        if (localized == null) return NotFound();
        return Ok(localized);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] GenreCreateRequestDTO dto)
    {
        var genre = new Genre { Name = dto.Name };
        var created = await _genreService.CreateAsync(genre);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] GenreUpdateRequestDTO dto)
    {
        var ok = await _genreService.UpdateAsync(id, new Genre { Name = dto.Name });
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var ok = await _genreService.DeleteAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }
}
