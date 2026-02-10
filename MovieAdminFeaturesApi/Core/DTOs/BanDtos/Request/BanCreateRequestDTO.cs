namespace MovieAdminFeaturesApi.Core.DTOs.BanDtos.Request;

public record BanCreateRequestDTO(
    string ClientProfileId,
    string? AdminProfileId,
    string Reason,
    DateTime? ExpiresAt
);
