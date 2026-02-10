using Microsoft.AspNetCore.Mvc;
using MovieAdminFeaturesApi.Application.Services.Interfaces;

namespace MovieAdminFeaturesApi.Presentation.Controllers.AdminControllers;

[ApiController]
[Route("api/Admin/[controller]")]
public class ImagesController : ControllerBase
{
    private readonly IImageService _imageService;

    public ImagesController(IImageService imageService)
    {
        _imageService = imageService;
    }

    [HttpPost("UploadImage")]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
    {
        var result = await _imageService.UploadImageAsync(file);
        return Ok(result);
    }

    [HttpGet("GetImage")]
    public async Task<IActionResult> GetImageUrlAsync(string objectName)
    {
        var result = await _imageService.GetImageUrlAsync(objectName);
        return Ok(result);
    }
}
