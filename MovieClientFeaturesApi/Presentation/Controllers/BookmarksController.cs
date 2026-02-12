using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;
using MovieClientFeaturesApi.Core.DTOs.WatchlistDtos.Response;

namespace MovieClientFeaturesApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "ClientPolicy")]
public class BookmarksController : ControllerBase
{
    private readonly IBookmarkService _bookmarkService;

    public BookmarksController(IBookmarkService bookmarkService)
    {
        _bookmarkService = bookmarkService;
    }

    private string GetClientIdFromClaims()
    {
        var id = User?.FindFirst("client_profile_id")?.Value;
        if (string.IsNullOrWhiteSpace(id)) throw new InvalidOperationException("client_profile_id claim not found in token");
        return id;
    }

    // POST: add bookmark (movieId in body, clientId from token)
    [HttpPost("add/{movieId}")]
    public async Task<IActionResult> Add(string movieId)
    {
        if (string.IsNullOrWhiteSpace(movieId))
        {
            return Ok(new { isSuccess = false, message = "Validation failed" });
        }
        var clientId = GetClientIdFromClaims();
        var success = await _bookmarkService.AddAsync(clientId, movieId);
        if (success)
            return Ok(new { isSuccess = true });
        else
            return Ok(new { isSuccess = false, message = "Failed to add bookmark" });
    }

    // DELETE: bookmark by id (clientId from token)
    [HttpDelete("remove/{id}")]
    public async Task<IActionResult> Remove(string id)
    {
        if(string.IsNullOrWhiteSpace(id))
            return Ok(new { isSuccess = false, message = "Validation failed" });
        var clientId = GetClientIdFromClaims();
        var ok = await _bookmarkService.RemoveAsync(clientId, id);
        if (!ok) return NotFound();
        return Ok(new { isSuccess = true });
    }

    // GET: list bookmarks for client from token
    [HttpGet("get")]
    public async Task<IActionResult> GetAll()
    {
        var clientId = GetClientIdFromClaims();
        var list = await _bookmarkService.GetForClientAsync(clientId);
        return Ok(list);
    }
}
