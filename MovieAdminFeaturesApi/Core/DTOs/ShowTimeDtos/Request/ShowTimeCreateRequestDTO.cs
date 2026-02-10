namespace MovieAdminFeaturesApi.Core.DTOs.ShowTimeDtos.Request;

public record ShowTimeCreateRequestDTO(
    string MovieId,
    string HallId,
    DateTime StartTime,
    DateTime EndTime,
    decimal BasePrice
);

