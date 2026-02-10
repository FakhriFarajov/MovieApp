namespace MovieAuthApi.Core.Models
{
    public class BannedUser
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // The client profile that is banned
        public string ClientProfileId { get; set; } = null!;
        public Client? ClientProfile { get; set; }

        // Optional admin profile who banned (if any)
        public string? AdminProfileId { get; set; }
        public Admin? AdminProfile { get; set; }

        // Reason for ban
        public string Reason { get; set; } = string.Empty;

        // When the ban was created and optional expiry
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; }
    }
}

