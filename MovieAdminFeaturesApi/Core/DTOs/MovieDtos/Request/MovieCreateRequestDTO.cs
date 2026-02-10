using System.Collections.Generic;
using System;

namespace MovieAdminFeaturesApi.Core.DTOs.MovieDtos.Request;

public record MovieCreateRequestDTO(
    bool IsForAdult,
    string BackdropPath,
    IEnumerable<string> GenreIds,
    string OriginalLanguage,
    IEnumerable<string> Languages,
    string OriginalTitle,
    string Overview,
    string PosterPath,
    TimeSpan Duration,
    string AgeRestriction,
    DateTime? ReleaseDate,
    bool Video,
    string VideoUrl,
    IEnumerable<string> Actors,
    string Director,
    string HomePageUrl,
    decimal AverageRating,
    long Revenue,
    long Budget,
    string Status,
    string TagLine
);
