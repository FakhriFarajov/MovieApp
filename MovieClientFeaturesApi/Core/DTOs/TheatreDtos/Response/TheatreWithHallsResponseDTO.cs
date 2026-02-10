namespace MovieClientFeaturesApi.Core.DTOs.TheatreDtos.Response;

public record HallSimpleDTO(string Id, string Name, int Rows, int Columns);

public record TheatreWithHallsResponseDTO(string Id, string Name, string Address, string Latitude, string Longitude, IEnumerable<HallSimpleDTO> Halls);

