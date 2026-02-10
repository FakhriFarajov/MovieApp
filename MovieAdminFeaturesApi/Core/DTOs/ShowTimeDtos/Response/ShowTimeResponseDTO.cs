namespace MovieAdminFeaturesApi.Core.DTOs.ShowTimeDtos.Response;

public record ShowTimeResponseDTO(
    string Id,
    string MovieId,
    string HallId,
    DateTime StartTime,
    DateTime EndTime,
    decimal BasePrice
);

