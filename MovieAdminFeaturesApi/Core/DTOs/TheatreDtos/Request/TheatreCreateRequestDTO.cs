namespace MovieAdminFeaturesApi.Core.DTOs.TheatreDtos.Request;

public record TheatreCreateRequestDTO(
    string Name,
    string Address,
    string Latitude,
    string Longitude
);
