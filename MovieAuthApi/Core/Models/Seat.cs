using System.ComponentModel.DataAnnotations;

namespace MovieAuthApi.Core.Models
{
    public class Seat
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // FK to Hall
        public string HallId { get; set; } = string.Empty;
        public Hall Hall { get; set; } = null!;

        // Seat coordinates
        public int RowNumber { get; set; }
        public int ColumnNumber { get; set; }

        // Optional human-readable label like "A1"
        public string Label { get; set; } = string.Empty;

        // Availability or other status
        public bool IsAvailable { get; set; } = true;

        // Tickets assigned to this seat over time
        public List<Ticket> Tickets { get; set; } = new();
    }
}
