using FluentValidation;
using MovieAdminFeaturesApi.Core.DTOs.TheatreDtos.Request;

namespace MovieAdminFeaturesApi.Application.Validators;

public class TheatreCreateRequestValidator : AbstractValidator<TheatreCreateRequestDTO>
{
    public TheatreCreateRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Latitude).NotEmpty();
        RuleFor(x => x.Longitude).NotEmpty();
    }
}
