using Microsoft.AspNetCore.Mvc;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;
using MovieClientFeaturesApi.Core.DTOs.WatchlistDtos.Request;

namespace MovieClientFeaturesApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookmarksController : ControllerBase
{
    private readonly IBookmarkService _bookmarkService;

    public BookmarksController(IBookmarkService bookmarkService)
    {
        _bookmarkService = bookmarkService;
    }

    // POST: accept typed DTO with ClientId
    [HttpPost]
    public async Task<IActionResult> Add([FromBody] BookmarkCreateRequestDTO? dto)
    {
        // Simple validation: ensure body was provided and required fields are present
        if (dto == null)
        {
            var errors = new Dictionary<string, string[]>
            {
                ["$"] = new[] { "The request body is required and must be valid JSON." },
                ["dto"] = new[] { "The dto field is required." }
            };
            return BadRequest(new { isSuccess = false, message = "Validation failed", data = errors });
        }

        if (string.IsNullOrWhiteSpace(dto.ClientId) || string.IsNullOrWhiteSpace(dto.MovieId))
        {
            var errors = new Dictionary<string, string[]> { ["movieId"] = new[] { "MovieId and ClientId are required." } };
            return BadRequest(new { isSuccess = false, message = "Validation failed", data = errors });
        }

        try
        {
            var res = await _bookmarkService.AddAsync(dto.ClientId, dto);
            return CreatedAtAction(nameof(GetAll), new { id = res.Id }, res);
        }
        catch (KeyNotFoundException knf)
        {
            return NotFound(new { isSuccess = false, message = knf.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { isSuccess = false, message = ex.Message });
        }
    }

    [HttpDelete("{clientId}/{id}")]
    public async Task<IActionResult> Remove(string clientId, string id)
    {
        var ok = await _bookmarkService.RemoveAsync(clientId, id);
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpGet("{clientId}")]
    public async Task<IActionResult> GetAll(string clientId)
    {
        var list = await _bookmarkService.GetForClientAsync(clientId);
        return Ok(list);
    }
}
