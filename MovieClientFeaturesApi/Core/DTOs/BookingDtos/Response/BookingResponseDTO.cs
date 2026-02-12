namespace MovieClientFeaturesApi.Core.DTOs.BookingDtos.Response;

public class TicketInfoDTO
{
    public string TicketId { get; set; } = string.Empty;
    public string SeatId { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string QRCode { get; set; } = string.Empty;
}

public class BookingResponseDTO
{
    public string Id { get; set; } = string.Empty;
    public string ShowTimeId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<TicketInfoDTO> Tickets { get; set; } = new();
}

