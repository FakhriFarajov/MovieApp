using Microsoft.AspNetCore.Mvc;
using MovieAdminFeaturesApi.Application.Services.Admin.Interfaces;
using MovieAdminFeaturesApi.Core.DTOs.ShowTimeDtos.Request;
using MovieAdminFeaturesApi.Core.DTOs.ShowTimeDtos.Response;
using MovieAdminFeaturesApi.Core.Models;

namespace MovieAdminFeaturesApi.Presentation.Controllers.AdminControllers;

[ApiController]
[Route("api/Admin/[controller]")]
public class ShowTimesController : ControllerBase
{
    private readonly IShowTimeService _service;

    public ShowTimesController(IShowTimeService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? movieId = null, [FromQuery] string? hallId = null)
    {
        var list = await _service.GetAllAsync();
        if (!string.IsNullOrWhiteSpace(movieId)) list = list.Where(s => s.MovieId == movieId).ToList();
        if (!string.IsNullOrWhiteSpace(hallId)) list = list.Where(s => s.HallId == hallId).ToList();
        var dto = list.Select(s => new ShowTimeResponseDTO(s.Id, s.MovieId, s.HallId, s.StartTime, s.EndTime, s.BasePrice));
        return Ok(dto);
    }

    [HttpGet("by-theatre/{theatreId}")]
    public async Task<IActionResult> GetByTheatre(string theatreId)
    {
        var list = await _service.GetByTheatreIdResponseAsync(theatreId);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var s = await _service.GetByIdResponseAsync(id);
        if (s == null) return NotFound();
        return Ok(s);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ShowTimeCreateRequestDTO dto)
    {
        // Basic validation
        if (dto.EndTime <= dto.StartTime) return BadRequest("EndTime must be after StartTime.");

        var st = new ShowTime
        {
            MovieId = dto.MovieId,
            HallId = dto.HallId,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            BasePrice = dto.BasePrice
        };

        var created = await _service.CreateAsync(st);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, new ShowTimeResponseDTO(created.Id, created.MovieId, created.HallId, created.StartTime, created.EndTime, created.BasePrice));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] ShowTimeUpdateRequestDTO dto)
    {
        if (dto.EndTime <= dto.StartTime) return BadRequest("EndTime must be after StartTime.");

        var st = new ShowTime
        {
            MovieId = dto.MovieId,
            HallId = dto.HallId,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            BasePrice = dto.BasePrice
        };

        var ok = await _service.UpdateAsync(id, st);
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
