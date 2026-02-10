namespace MovieAuthApi.Core.DTOs.ClientDtos.Request;

public record ResetPasswordRequestDTO
{
    public string Token { get; set; } = default!;
    public string NewPassword { get; set; } = default!;
    public string ConfirmNewPassword { get; set; } = default!;
}

