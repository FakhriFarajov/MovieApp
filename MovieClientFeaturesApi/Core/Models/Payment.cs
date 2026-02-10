using System.ComponentModel.DataAnnotations;
using MovieClientFeaturesApi.Core.Enums;

namespace MovieClientFeaturesApi.Core.Models
{
    public class Payment
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // FK to Booking
        public string BookingId { get; set; } = string.Empty;
        public Booking Booking { get; set; } = null!;

        public decimal Amount { get; set; }

        public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Card;

        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

        public DateTime PaymentTime { get; set; } = DateTime.UtcNow;

        public string TransactionId { get; set; } = string.Empty;
    }
}
