using FluentValidation;
using MovieAuthApi.Core.DTOs.ClientDtos.Request;

namespace MovieAuthApi.Application.Validators
{
    public class ClientRegisterRequestDTOValidator : AbstractValidator<ClientRegisterRequestDTO>
    {
        public ClientRegisterRequestDTOValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required.")
                .Matches("^[A-Za-z]+$").WithMessage("Name must contain only letters.");
            RuleFor(x => x.Surname)
                .NotEmpty().WithMessage("Surname is required.")
                .Matches("^[A-Za-z]+$").WithMessage("Surname must contain only letters.");
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required.")
                .EmailAddress().WithMessage("Email must be a valid email address.");
            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required.")
                .MinimumLength(6).WithMessage("Password must be at least 6 characters long.")
                .Matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&_]+$")
                .WithMessage("Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.");
            RuleFor(x => x.ConfirmPassword)
                .Equal(x => x.Password).WithMessage("Passwords do not match.");
            RuleFor(x => x.PhoneNumber)
                .NotEmpty().WithMessage("Phone is required.")
                .Matches(@"^\+994\s\d{2}\s\d{3}\s\d{2}\s\d{2}$").WithMessage("Phone must follow the format: +994 55 555 55 55");

            // Date of birth rules
            RuleFor(x => x.DateOfBirth)
                .NotEmpty().WithMessage("Date of birth is required.")
                .LessThanOrEqualTo(DateTime.UtcNow.Date).WithMessage("Date of birth cannot be in the future.")
                .Must(BeAtLeast13YearsOld).WithMessage("You must be at least 13 years old to register.");
        }

        private bool BeAtLeast13YearsOld(DateTime dob)
        {
            var today = DateTime.UtcNow.Date;
            var age = today.Year - dob.Year;
            if (dob.Date > today.AddYears(-age)) age--;
            return age >= 13;
        }
    }
}