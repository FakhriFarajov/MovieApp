namespace MovieClientFeaturesApi.Core.DTOs.BookingDtos.Request;

public class BookingCreateRequestDTO
{
    public string ShowTimeId { get; set; } = string.Empty;
    public string MovieId { get; set; } = string.Empty;
    public List<string> SeatIds { get; set; } = new();
    // placeholder for payment method or token
    public string PaymentMethod { get; set; } = "Card";
}

