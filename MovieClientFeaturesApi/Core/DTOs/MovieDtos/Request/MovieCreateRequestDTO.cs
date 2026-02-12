using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace MovieClientFeaturesApi.Core.DTOs.MovieDtos.Request;

public record MovieCreateRequestDTO(
    string OriginalTitle,
    string Overview,
    IEnumerable<string> GenreIds,
    bool Video,
    string? VideoUrl,
    bool IsForAdult,
    string OriginalLanguage,
    IEnumerable<string>? Languages,
    string Duration, // expected format "hh:mm:ss"
    int? AgeRestriction,
    DateTime? ReleaseDate,
    string? PosterPath,
    string? BackdropPath,
    IEnumerable<string>? Actors,
    string? Director,
    string? HomePageUrl,
    int? AverageRating,
    long? Revenue,
    long? Budget,
    string? Status,
    string? TagLine
);

