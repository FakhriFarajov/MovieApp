using System.Net.Mime;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Minio;
using Minio.DataModel.Args;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using MovieClientFeaturesApi.Application.Services.Interfaces;
using MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response;

namespace MovieClientFeaturesApi.Application.Services.Classes;

public class MinioImageService : IImageService
{
    private readonly IMinioClient _minioClient;
    private readonly string _bucketName;

    public MinioImageService(IConfiguration configuration)
    {
        _minioClient = new MinioClient()
            .WithEndpoint(configuration["MINIO__HOST"] ?? configuration["Minio:Host"])
            .WithCredentials(configuration["MINIO__ACCESSKEY"] ?? configuration["Minio:AccessKey"], configuration["MINIO__SECRETKEY"] ?? configuration["Minio:SecretKey"]).Build();
        _bucketName = configuration["MINIO__BUCKETNAME"] ?? configuration["Minio:BucketName"] ?? throw new ArgumentNullException("BucketName is not configured");
    }

    public async Task<TypedResult<object>> UploadImageAsync(IFormFile file)
    {
        try
        {
            var beArgs = new BucketExistsArgs().WithBucket(_bucketName);
            bool found = await _minioClient.BucketExistsAsync(beArgs);
            if (!found)
            {
                var mbArgs = new MakeBucketArgs().WithBucket(_bucketName);
                await _minioClient.MakeBucketAsync(mbArgs);
            }

            using var imageStream = file.OpenReadStream();
            using var image = await Image.LoadAsync(imageStream);
            var encoder = new WebpEncoder { Quality = 75 };

            var objectName = $"{Guid.NewGuid()}.webp";
            using var outputStream = new MemoryStream();
            await image.SaveAsync(outputStream, encoder);
            outputStream.Position = 0;

            var putObjectArgs = new PutObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(objectName)
                .WithStreamData(outputStream)
                .WithObjectSize(outputStream.Length)
                .WithContentType(MediaTypeNames.Image.Webp);

            await _minioClient.PutObjectAsync(putObjectArgs);
            return TypedResult<object>.Success(new { ObjectName = objectName }, "Image uploaded successfully");
        }
        catch (Exception ex)
        {
            return TypedResult<object>.Error($"Image upload failed: {ex.Message}", 500);
        }
    }

    public async Task<string> GetImageUrlAsync(string objectName, int expirySeconds = 3600)
    {
        var getUrl = await _minioClient.PresignedGetObjectAsync(
            new PresignedGetObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(objectName)
                .WithExpiry(expirySeconds)
        );
        return getUrl;
    }
}
