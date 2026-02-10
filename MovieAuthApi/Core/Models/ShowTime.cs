using System.ComponentModel.DataAnnotations;

namespace MovieAuthApi.Core.Models
{
    public class ShowTime
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // FK to Movie
        public string MovieId { get; set; } = string.Empty;
        public Movie Movie { get; set; } = null!;

        // FK to Hall
        public string HallId { get; set; } = string.Empty;
        public Hall Hall { get; set; } = null!;

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }

        public decimal BasePrice { get; set; }

        // Bookings for this showtime
        public List<Booking> Bookings { get; set; } = new();
    }
}
