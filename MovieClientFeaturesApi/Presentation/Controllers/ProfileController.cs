using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;
using MovieClientFeaturesApi.Core.DTOs.ClientDtos.Request;

namespace MovieClientFeaturesApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "ClientPolicy")]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;

    public ProfileController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    private string GetUserIdFromClaims()
    {
        var id = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value
                 ?? User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value
                 ?? User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value
                 ?? User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
        if (string.IsNullOrWhiteSpace(id)) throw new InvalidOperationException("User id not found in token claims");
        return id;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var clientId = GetUserIdFromClaims();
        var res = await _profileService.GetProfile(clientId);
        if (!res.IsSuccess) return StatusCode(res.StatusCode, res);
        return Ok(res);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] ClientProfileUpdateRequestDTO dto)
    {
        var clientId = GetUserIdFromClaims();
        var res = await _profileService.UpdateProfile(clientId, dto);
        if (!res.IsSuccess) return StatusCode(res.StatusCode, res);
        return Ok(res);
    }
}

