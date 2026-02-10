using FluentValidation;
using MovieAdminFeaturesApi.Core.DTOs.HallDtos.Request;

namespace MovieAdminFeaturesApi.Application.Validators;

public class HallCreateRequestValidator : AbstractValidator<HallCreateRequestDTO>
{
    public HallCreateRequestValidator()
    {
        RuleFor(x => x.TheatreId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Type).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Rows).GreaterThan(0);
        RuleFor(x => x.Columns).GreaterThan(0);
    }
}
