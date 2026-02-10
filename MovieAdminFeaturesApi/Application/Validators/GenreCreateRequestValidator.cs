using FluentValidation;
using MovieAdminFeaturesApi.Core.DTOs.GenreDtos.Request;

namespace MovieAdminFeaturesApi.Application.Validators;

public class GenreCreateRequestValidator : AbstractValidator<GenreCreateRequestDTO>
{
    public GenreCreateRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must be at most 200 characters.");
    }
}
