using FluentValidation;
using MovieAdminFeaturesApi.Core.DTOs.MovieDtos.Request;
using System;

namespace MovieAdminFeaturesApi.Application.Validators;

public class MovieUpdateRequestValidator : AbstractValidator<MovieUpdateRequestDTO>
{
    public MovieUpdateRequestValidator()
    {
        RuleFor(x => x.OriginalTitle)
            .NotEmpty().WithMessage("OriginalTitle is required.")
            .MaximumLength(500);

        RuleFor(x => x.Overview)
            .NotEmpty().WithMessage("Overview is required.");

        RuleFor(x => x.GenreIds)
            .NotNull().WithMessage("At least one genre is required.")
            .Must(g => g.Any()).WithMessage("At least one genre is required.");

        RuleForEach(x => x.GenreIds).NotEmpty().WithMessage("GenreId cannot be empty.");

        RuleFor(x => x.Duration)
            .GreaterThan(TimeSpan.Zero).WithMessage("Duration must be provided and greater than zero.");

        RuleFor(x => x.PosterPath).NotEmpty().WithMessage("PosterPath is required.");

        RuleFor(x => x.AgeRestriction).NotEmpty().WithMessage("AgeRestriction is required.");

        RuleFor(x => x.AverageRating).GreaterThanOrEqualTo(0m).LessThanOrEqualTo(10m).WithMessage("AverageRating must be between 0 and 10.");
        RuleFor(x => x.Revenue).GreaterThanOrEqualTo(0L).WithMessage("Revenue must be zero or positive.");
        RuleFor(x => x.Budget).GreaterThanOrEqualTo(0L).WithMessage("Budget must be zero or positive.");
        RuleFor(x => x.HomePageUrl).Must(u => string.IsNullOrWhiteSpace(u) || Uri.IsWellFormedUriString(u, UriKind.Absolute)).WithMessage("HomePageUrl must be a valid absolute URL if provided.");
        RuleFor(x => x.Status).NotNull();
        RuleFor(x => x.TagLine).NotNull();
    }
}
