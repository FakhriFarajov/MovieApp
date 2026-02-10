namespace MovieAdminFeaturesApi.Core.DTOs.BanDtos.Response;

public record BanResponseDTO(
    string Id,
    string ClientProfileId,
    string? AdminProfileId,
    string Reason,
    DateTime CreatedAt,
    DateTime? ExpiresAt,
    bool IsActive
);
