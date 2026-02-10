using System.ComponentModel.DataAnnotations;

namespace MovieClientFeaturesApi.Core.Models
{
    public class Hall
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // FK to Theatre
        public string TheatreId { get; set; } = string.Empty;
        public Theatre Theatre { get; set; } = null!;

        // Hall metadata
        public string Name { get; set; } = string.Empty;

        // e.g., "IMAX", "Standard"
        public string Type { get; set; } = string.Empty;

        // Rows and columns counts
        public int Rows { get; set; }
        public int Columns { get; set; }

        // Seats layout
        public List<Seat> Seats { get; set; } = new();

        // Showtimes scheduled in this hall
        public List<ShowTime> ShowTimes { get; set; } = new();
    }
}
