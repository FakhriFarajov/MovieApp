using FluentValidation;
using MovieAuthApi.Core.DTOs.AdminDtos.Request;

namespace MovieAuthApi.Application.Validators;

public class AdminRegisterRequestDTOValidator : AbstractValidator<AdminRegisterRequestDTO>
{
    public AdminRegisterRequestDTOValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
        RuleFor(x => x.Surname).NotEmpty().WithMessage("Surname is required.");
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email must be a valid email address.");
        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Phone is required.")
            .Matches(@"^\+994\s\d{2}\s\d{3}\s\d{2}\s\d{2}$").WithMessage("Phone must follow the format: +994 55 555 55 55");
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters long.")
            .Matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&_]+$").WithMessage("Password must contain at least one uppercase letter, one lowercase letter, and one digit.");
        RuleFor(x => x.ConfirmPassword).Equal(x => x.Password).WithMessage("Passwords do not match.");
    }
}
