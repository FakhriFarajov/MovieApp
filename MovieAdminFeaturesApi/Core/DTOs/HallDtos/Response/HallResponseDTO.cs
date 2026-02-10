namespace MovieAdminFeaturesApi.Core.DTOs.HallDtos.Response;

public record HallResponseDTO(
    string Id,
    string TheatreId,
    string Name,
    string Type,
    int Rows,
    int Columns
);

