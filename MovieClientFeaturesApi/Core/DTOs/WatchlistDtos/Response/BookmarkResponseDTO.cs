namespace MovieClientFeaturesApi.Core.DTOs.WatchlistDtos.Response;

public record BookmarkResponseDTO(string Id, string MovieId, string ClientId, MovieClientFeaturesApi.Core.DTOs.MovieDtos.Response.MovieResponseDTO? Movie = null);
