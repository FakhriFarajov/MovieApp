using MovieAdminFeaturesApi.Core.Enums;

namespace MovieAdminFeaturesApi.Core.DTOs.UserDtos.Response
{
    public record UserDto(
        string Id,
        string Name,
        string? Surname,
        string PhoneNumber,
        string? Email,
        string ProfileImage,
        Role Role
    );
}
