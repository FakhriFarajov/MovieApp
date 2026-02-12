namespace MovieClientFeaturesApi.Core.DTOs.ClientDtos.Request;

public class ClientProfileUpdateRequestDTO
{
    public string? Name { get; set; }
    public string? Surname { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? ProfileImageObjectName { get; set; } // set by controller after uploading file
}
