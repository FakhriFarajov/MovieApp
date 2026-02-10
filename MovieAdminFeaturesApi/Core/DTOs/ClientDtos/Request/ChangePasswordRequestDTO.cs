namespace MovieAdminFeaturesApi.Core.DTOs.ClientDtos.Request;

public record ChangePasswordRequestDTO
{
    public string userId { get; set; } = default!;
    public string OldPassword { get; set; } = default!;
    public string NewPassword { get; set; } = default!;
    public string ConfirmNewPassword { get; set; } = default!;
}
