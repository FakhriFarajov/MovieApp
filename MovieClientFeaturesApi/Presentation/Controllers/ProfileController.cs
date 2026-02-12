using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;
using MovieClientFeaturesApi.Core.DTOs.ClientDtos.Request;
using MovieClientFeaturesApi.Application.Services.Interfaces;

namespace MovieClientFeaturesApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "ClientPolicy")]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;
    private readonly IImageService _imageService;

    public ProfileController(IProfileService profileService, IImageService imageService)
    {
        _profileService = profileService;
        _imageService = imageService;
    }

    private string GetClientIdFromClaims()
    {
        var id = User.Claims.FirstOrDefault(c => c.Type == "client_profile_id")?.Value;
        if (string.IsNullOrWhiteSpace(id)) throw new InvalidOperationException("User id not found in token claims");
        return id;
    }

    [HttpGet("getProfile")]
    public async Task<IActionResult> Get()
    {
        var clientId = GetClientIdFromClaims();
        var res = await _profileService.GetProfile(clientId);
        if (!res.IsSuccess) return StatusCode(res.StatusCode, res);
        return Ok(res);
    }

    // Accept multipart/form-data with fields matching ClientProfileUpdateRequestDTO and optional file with name "profileImage"
    [HttpPut("editProfile")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Update([FromForm] ClientProfileUpdateRequestDTO dto, [FromForm] IFormFile? profileImage)
    {
        var clientId = GetClientIdFromClaims();

        if (profileImage != null)
        {
            var uploadRes = await _imageService.UploadImageAsync(profileImage);
            if (!uploadRes.IsSuccess) return StatusCode(uploadRes.StatusCode, uploadRes);
            // uploadRes.Data expected to contain { ObjectName = "..." }
            if (uploadRes.Data is System.Text.Json.JsonElement je && je.ValueKind == System.Text.Json.JsonValueKind.Object && je.TryGetProperty("ObjectName", out var on))
            {
                dto.ProfileImageObjectName = on.GetString();
            }
            else if (uploadRes.Data != null)
            {
                // try reflection on anonymous/object with ObjectName property
                try
                {
                    var prop = uploadRes.Data.GetType().GetProperty("ObjectName");
                    if (prop != null)
                    {
                        var val = prop.GetValue(uploadRes.Data);
                        if (val != null) dto.ProfileImageObjectName = val.ToString();
                    }
                }
                catch
                {
                    // ignore
                }
            }
        }

        var res = await _profileService.UpdateProfile(clientId, dto);
        if (!res.IsSuccess) return StatusCode(res.StatusCode, res);
        return Ok(res);
    }
}
