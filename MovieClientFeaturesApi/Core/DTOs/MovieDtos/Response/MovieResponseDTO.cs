namespace MovieClientFeaturesApi.Core.DTOs.MovieDtos.Response;

public record MovieTranslationResponseDTO(string Language, string Title, string Overview);

public record MovieResponseDTO(
    string Id,
    string Title,
    string Overview,
    string BackdropPath,
    string PosterPath,
    DateTime? ReleaseDate,
    TimeSpan Duration,
    string AgeRestriction,
    IEnumerable<string> GenreIds,
    bool Video,
    string VideoUrl,
    bool IsInBookmark,
    bool IsForAdult,
    string OriginalLanguage,
    IEnumerable<string> Languages,
    IEnumerable<string> Actors,
    string Director,
    string HomePageUrl,
    decimal AverageRating,
    long Revenue,
    long Budget,
    string Status,
    string TagLine,
    IEnumerable<MovieTranslationResponseDTO> Translations
);
