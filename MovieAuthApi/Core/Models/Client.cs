using System.ComponentModel.DataAnnotations;
using MovieAuthApi.Core.Enums;

namespace MovieAuthApi.Core.Models
{
    public class Client
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string UserId { get; set; } = null!;
        public User User { get; set; } = null!;

        public bool IsEmailVerified { get; set; } = false;

        // Date of birth for the client
        public DateTime DateOfBirth { get; set; }

        public List<WatchlistItem> Watchlist { get; set; } = new();

        // Client bookings
        public List<Booking> Bookings { get; set; } = new();
    }
}
