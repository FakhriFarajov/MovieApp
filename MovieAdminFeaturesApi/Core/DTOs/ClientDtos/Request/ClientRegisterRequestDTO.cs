namespace MovieAdminFeaturesApi.Core.DTOs.ClientDtos.Request;

public record ClientRegisterRequestDTO(
    string Name,
    string Surname,
    string Email,
    string Password,
    string ConfirmPassword,
    string PhoneNumber,
    DateTime DateOfBirth
);
