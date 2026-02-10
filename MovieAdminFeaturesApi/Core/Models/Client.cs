using System.ComponentModel.DataAnnotations;

namespace MovieAdminFeaturesApi.Core.Models
{
    public class Client
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string UserId { get; set; } = null!;
        public User User { get; set; } = null!;
        
        public bool IsEmailVerified { get; set; } = false;

        public DateTime DateOfBirth { get; set; }

        public List<WatchlistItem> Watchlist { get; set; } = new();

        // Client bookings
        public List<Booking> Bookings { get; set; } = new();
    }
}
