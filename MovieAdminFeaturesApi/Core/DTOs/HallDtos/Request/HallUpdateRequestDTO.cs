namespace MovieAdminFeaturesApi.Core.DTOs.HallDtos.Request;

public record HallUpdateRequestDTO(
    string Name,
    string Type,
    int Rows,
    int Columns
);
