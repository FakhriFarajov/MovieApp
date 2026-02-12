using Microsoft.AspNetCore.Http;
using MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response;

namespace MovieClientFeaturesApi.Application.Services.Interfaces;

public interface IImageService
{
    Task<TypedResult<object>> UploadImageAsync(IFormFile file);
    Task<string> GetImageUrlAsync(string objectName, int expirySeconds = 3600, string? bucketName = null);
    Task<TypedResult<object>> UploadBytesAsync(byte[] data, string objectName, string contentType = "image/png", string? bucketName = null);
}
