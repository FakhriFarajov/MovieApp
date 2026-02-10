using System.ComponentModel.DataAnnotations;
using MovieAdminFeaturesApi.Core.Enums;

namespace MovieAdminFeaturesApi.Core.Models
{
    public class User
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
    
        public string ProfileImage { get; set; } = string.Empty;

        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string Surname { get; set; } = string.Empty;
        
        public string PhoneNumber { get; set; } = string.Empty;

        public Role Role { get; set; } = Role.Client;

        public string? Email { get; set; }
        
        public string? PasswordHash { get; set; }
        
        public string? RefreshToken { get; set; }
        
        public DateTime? RefreshTokenExpiryTime { get; set; }
        
        public string AdminProfileId { get; set; } = string.Empty;
        public Admin ? AdminProfile { get; set;  }
        
        
        public string ClientProfileId { get; set; } = string.Empty;
        public Client ? ClientProfile { get; set;  }
        
        
        
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
