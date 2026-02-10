using Microsoft.AspNetCore.Mvc;
using MovieAdminFeaturesApi.Application.Services.Admin.Interfaces;
using MovieAdminFeaturesApi.Core.DTOs.HallDtos.Request;
using MovieAdminFeaturesApi.Core.DTOs.HallDtos.Response;
using MovieAdminFeaturesApi.Core.Models;

namespace MovieAdminFeaturesApi.Presentation.Controllers.AdminControllers;

[ApiController]
[Route("api/Admin/[controller]")]
[Produces("application/json")]
public class HallsController : ControllerBase
{
    private readonly IHallService _service;

    public HallsController(IHallService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _service.GetAllAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var h = await _service.GetByIdAsync(id);
        if (h == null) return NotFound();
        return Ok(h);
    }

    [HttpGet("by-theatre/{theatreId}")]
    public async Task<IActionResult> GetByTheatre(string theatreId)
    {
        var halls = await _service.GetByTheatreIdAsync(theatreId);
        return Ok(halls);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] HallCreateRequestDTO dto)
    {
        var hall = new Hall { TheatreId = dto.TheatreId, Name = dto.Name, Type = dto.Type, Rows = dto.Rows, Columns = dto.Columns };
        var created = await _service.CreateAsync(hall);
        var response = new HallResponseDTO(created.Id, created.TheatreId, created.Name, created.Type, created.Rows, created.Columns);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, response);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] HallUpdateRequestDTO dto)
    {
        var ok = await _service.UpdateAsync(id, new Hall { Name = dto.Name, Type = dto.Type, Rows = dto.Rows, Columns = dto.Columns });
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
