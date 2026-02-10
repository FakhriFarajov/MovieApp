namespace MovieAdminFeaturesApi.Core.DTOs.BanDtos.Response;

public record ClientListDTO(
    string ClientId,
    string Email,
    string Name,
    string Surname,
    string PhoneNumber,
    DateTime DateOfBirth,
    bool IsBanned,
    string? ActiveBanId
);
