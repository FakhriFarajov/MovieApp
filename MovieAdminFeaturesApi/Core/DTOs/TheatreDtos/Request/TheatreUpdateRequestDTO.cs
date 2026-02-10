namespace MovieAdminFeaturesApi.Core.DTOs.TheatreDtos.Request;

public record TheatreUpdateRequestDTO(
    string Name,
    string Address,
    string Latitude,
    string Longitude
);
