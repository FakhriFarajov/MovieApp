namespace MovieAdminFeaturesApi.Core.DTOs.ShowTimeDtos.Request;

public record ShowTimeUpdateRequestDTO(
    string MovieId,
    string HallId,
    DateTime StartTime,
    DateTime EndTime,
    decimal BasePrice
);

