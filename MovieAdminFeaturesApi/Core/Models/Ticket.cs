using System.ComponentModel.DataAnnotations;

namespace MovieAdminFeaturesApi.Core.Models
{
    public enum TicketStatus
    {
        Reserved,
        Paid,
        Used
    }

    public class Ticket
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // FK to Booking
        public string BookingId { get; set; } = string.Empty;
        public Booking Booking { get; set; } = null!;

        // FK to Seat
        public string SeatId { get; set; } = string.Empty;
        public Seat Seat { get; set; } = null!;
        public decimal Price { get; set; }
        // QR code data (GUID)
        public string QRCode{ get; set; } = Guid.NewGuid().ToString();

        public TicketStatus Status { get; set; } = TicketStatus.Reserved;
    }
}
