namespace MovieAdminFeaturesApi.Core.DTOs.HallDtos.Request;

public record HallCreateRequestDTO(
    string TheatreId,
    string Name,
    string Type,
    int Rows,
    int Columns
);
