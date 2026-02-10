namespace MovieAdminFeaturesApi.Core.DTOs.TheatreDtos.Response;

public record TheatreResponseDTO(
    string Id,
    string Name,
    string Address,
    string Latitude,
    string Longitude
);
