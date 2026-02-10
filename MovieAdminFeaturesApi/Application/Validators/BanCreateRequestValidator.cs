using FluentValidation;
using MovieAdminFeaturesApi.Core.DTOs.BanDtos.Request;

namespace MovieAdminFeaturesApi.Application.Validators;

public class BanCreateRequestValidator : AbstractValidator<BanCreateRequestDTO>
{
    public BanCreateRequestValidator()
    {
        RuleFor(x => x.ClientProfileId).NotEmpty();
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.ExpiresAt).GreaterThan(DateTime.UtcNow).When(x => x.ExpiresAt.HasValue);
    }
}
