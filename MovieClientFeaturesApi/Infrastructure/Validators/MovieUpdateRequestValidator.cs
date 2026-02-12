using FluentValidation;
using MovieClientFeaturesApi.Core.DTOs.MovieDtos.Request;

namespace MovieClientFeaturesApi.Infrastructure.Validators;

public class MovieUpdateRequestValidator : AbstractValidator<MovieUpdateRequestDTO>
{
    public MovieUpdateRequestValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Id is required");
        RuleFor(x => x.OriginalTitle).NotEmpty().WithMessage("OriginalTitle is required");
        RuleFor(x => x.Overview).NotEmpty().WithMessage("Overview is required");
        RuleFor(x => x.GenreIds).NotNull().WithMessage("At least one genreId is required").Must(g => g.Any()).WithMessage("At least one genreId is required");
        RuleFor(x => x.Duration).NotEmpty().WithMessage("Duration is required").Must(BeValidTimeSpan).WithMessage("Duration must be a valid timespan in format hh:mm:ss");
        RuleFor(x => x.ReleaseDate).NotNull().WithMessage("ReleaseDate is required");
        RuleFor(x => x.AgeRestriction).GreaterThanOrEqualTo(0).When(x => x.AgeRestriction.HasValue);
        RuleFor(x => x.VideoUrl).Must(url => string.IsNullOrWhiteSpace(url) || Uri.IsWellFormedUriString(url, UriKind.Absolute)).WithMessage("VideoUrl must be a valid URL");
        RuleFor(x => x.HomePageUrl).Must(url => string.IsNullOrWhiteSpace(url) || Uri.IsWellFormedUriString(url, UriKind.Absolute)).WithMessage("HomePageUrl must be a valid URL");
    }

    private bool BeValidTimeSpan(string s)
    {
        return TimeSpan.TryParse(s, out var _);
    }
}

