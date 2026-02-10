using Microsoft.AspNetCore.Http;
using MovieAdminFeaturesApi.Core.DTOs.AdminDtos.Response;

namespace MovieAdminFeaturesApi.Application.Services.Interfaces;

public interface IImageService
{
    Task<TypedResult<object>> UploadImageAsync(IFormFile file);
    Task<string> GetImageUrlAsync(string objectName, int expirySeconds = 3600);
}
