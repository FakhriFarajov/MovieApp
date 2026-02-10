namespace MovieAuthApi.Core.DTOs.ClientDtos.Request;

public record ForgotPasswordRequestDTO
{
    public string Email { get; set; } = default!;
}