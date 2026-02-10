using System.ComponentModel.DataAnnotations;

namespace MovieAdminFeaturesApi.Core.Models
{
    public enum BookingStatus
    {
        Pending,
        Paid,
        Cancelled
    }

    public class Booking
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // FK to Client
        public string ClientId { get; set; } = string.Empty;
        public Client Client { get; set; } = null!;

        // FK to ShowTime
        public string ShowTimeId { get; set; } = string.Empty;
        public ShowTime ShowTime { get; set; } = null!;

        public DateTime BookingTime { get; set; } = DateTime.UtcNow;

        public decimal TotalPrice { get; set; }

        public BookingStatus Status { get; set; } = BookingStatus.Pending;

        // Tickets related to this booking
        public List<Ticket> Tickets { get; set; } = new();

        // Payments related to this booking (a booking can have multiple payment attempts)
        public List<Payment> Payments { get; set; } = new();
    }
}
