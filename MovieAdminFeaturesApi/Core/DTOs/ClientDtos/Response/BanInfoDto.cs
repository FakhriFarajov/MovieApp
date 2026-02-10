namespace MovieAdminFeaturesApi.Core.DTOs.ClientDtos.Response;

public class BanInfoDto
{
    public string Reason { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
    public double? DurationSeconds { get; set; }
}
