using Microsoft.AspNetCore.Mvc;

namespace MovieClientFeaturesApi.Presentation.Extensions;

public static class ValidationExtensions
{
    public static IServiceCollection AddCustomValidationResponse(this IServiceCollection services)
    {
        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                var errors = context.ModelState
                    .Where(kvp => kvp.Value != null && kvp.Value.Errors != null && kvp.Value.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value.Errors.Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? (e.Exception?.Message ?? "Invalid value") : e.ErrorMessage).ToArray()
                    );

                var payload = new
                {
                    isSuccess = false,
                    message = "Validation failed",
                    data = errors
                };

                return new BadRequestObjectResult(payload);
            };
        });

        return services;
    }
}
