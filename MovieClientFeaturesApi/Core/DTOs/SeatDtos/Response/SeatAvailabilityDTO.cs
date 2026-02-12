namespace MovieClientFeaturesApi.Core.DTOs.SeatDtos.Response;

public record SeatAvailabilityDTO(string SeatId, int RowNumber, int ColumnNumber, string Label, bool IsTaken, string? TicketId = null, string? TicketStatus = null);

