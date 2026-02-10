using System.Text.RegularExpressions;
using FluentValidation;
using MovieAuthApi.Core.DTOs.ClientDtos.Request;

namespace MovieAuthApi.Application.Validators
{
    public class ChangePasswordRequestDTOValidator : AbstractValidator<ChangePasswordRequestDTO>
    {
        private static readonly Regex PasswordRegex = new Regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&_]+$", RegexOptions.Compiled);

        public ChangePasswordRequestDTOValidator()
        {
            RuleFor(x => x.userId)
                .NotEmpty().WithMessage("userId is required.");

            RuleFor(x => x.OldPassword)
                .NotEmpty().WithMessage("Old password is required.");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("New password is required.")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters long.")
                .Matches(PasswordRegex).WithMessage("Password must contain at least one uppercase letter, one lowercase letter and one digit.")
                .NotEqual(x => x.OldPassword).WithMessage("New password must be different from the old password.");

            RuleFor(x => x.ConfirmNewPassword)
                .NotEmpty().WithMessage("Please confirm new password.")
                .Equal(x => x.NewPassword).WithMessage("Passwords do not match.");
        }
    }
}
