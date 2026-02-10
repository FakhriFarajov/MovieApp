namespace MovieAuthApi.Core.DTOs.UserDtos.Request;
public record UserRegisterRequestDTO(
    string Name,
    string Surname,
    string PhoneNumber,
    string Email,
    string Password,
    string ConfirmPassword
);
