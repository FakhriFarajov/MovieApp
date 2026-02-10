namespace MovieAdminFeaturesApi.Core.DTOs.BookingDtos.Response;

public record BookingResponseDTO(
    string Id,
    string ClientId,
    string ShowTimeId,
    DateTime BookingTime,
    decimal TotalPrice,
    int Status
);
