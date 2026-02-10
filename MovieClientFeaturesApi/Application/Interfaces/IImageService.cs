using Microsoft.AspNetCore.Http;
using MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response;

namespace MovieClientFeaturesApi.Application.Services.Interfaces;

public interface IImageService
{
    Task<TypedResult<object>> UploadImageAsync(IFormFile file);
    Task<string> GetImageUrlAsync(string objectName, int expirySeconds = 3600);
}
