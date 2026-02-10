using Microsoft.AspNetCore.Mvc;
using MovieAdminFeaturesApi.Application.Services.Admin.Interfaces;
using MovieAdminFeaturesApi.Core.DTOs.TheatreDtos.Request;
using MovieAdminFeaturesApi.Core.DTOs.TheatreDtos.Response;
using MovieAdminFeaturesApi.Core.Models;

namespace MovieAdminFeaturesApi.Presentation.Controllers.AdminControllers;

[ApiController]
[Route("api/Admin/[controller]")]
public class TheatresController : ControllerBase
{
    private readonly ITheatreService _service;

    public TheatresController(ITheatreService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _service.GetAllResponseAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var t = await _service.GetByIdResponseAsync(id);
        if (t == null) return NotFound();
        return Ok(t);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TheatreCreateRequestDTO dto)
    {
        var theatre = new Theatre { Name = dto.Name, Address = dto.Address, Latitude = dto.Latitude, Longitude = dto.Longitude };
        var created = await _service.CreateAsync(theatre);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] TheatreUpdateRequestDTO dto)
    {
        var ok = await _service.UpdateAsync(id, new Theatre { Name = dto.Name, Address = dto.Address, Latitude = dto.Latitude, Longitude = dto.Longitude });
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var ok = await _service.DeleteAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }
}
