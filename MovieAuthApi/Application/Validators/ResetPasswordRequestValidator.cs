using System.Text.RegularExpressions;
using FluentValidation;
using MovieAuthApi.Core.DTOs.ClientDtos.Request;

namespace MovieAuthApi.Application.Validators
{
    public class ResetPasswordRequestDTOValidator : AbstractValidator<ResetPasswordRequestDTO>
    {
        private static readonly Regex PasswordRegex = new Regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&_]+$", RegexOptions.Compiled);

        public ResetPasswordRequestDTOValidator()
        {
            RuleFor(x => x.Token)
                .NotEmpty().WithMessage("Token is required.");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("New password is required.")
                .MinimumLength(6).WithMessage("Password must be at least 8 characters long.")
                .Matches(PasswordRegex).WithMessage("Password must contain at least one uppercase letter, one lowercase letter and one digit.");

            RuleFor(x => x.ConfirmNewPassword)
                .Equal(x => x.NewPassword).WithMessage("Passwords do not match.");
        }
    }
}

