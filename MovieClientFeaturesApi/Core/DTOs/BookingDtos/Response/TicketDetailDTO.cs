namespace MovieClientFeaturesApi.Core.DTOs.BookingDtos.Response;

public class TicketDetailDTO
{
    public string TicketId { get; set; } = string.Empty;
    public string BookingId { get; set; } = string.Empty;
    public string ShowTimeId { get; set; } = string.Empty;
    public string MovieId { get; set; } = string.Empty;
    public string MovieTitle { get; set; } = string.Empty;
    public string HallId { get; set; } = string.Empty;
    public string HallName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string SeatId { get; set; } = string.Empty;
    public string SeatLabel { get; set; } = string.Empty;
    public int RowNumber { get; set; }
    public int ColumnNumber { get; set; }
    public decimal Price { get; set; }
    public string Status { get; set; } = string.Empty;
    public string QRCode { get; set; } = string.Empty;
    public DateTime BookingTime { get; set; }
}

