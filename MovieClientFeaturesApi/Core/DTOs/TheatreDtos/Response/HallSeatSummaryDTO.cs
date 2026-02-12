namespace MovieClientFeaturesApi.Core.DTOs.TheatreDtos.Response;

public record SeatInfoDTO(string Id, int RowNumber, int ColumnNumber, string Label, bool IsAvailable);

public record HallSeatSummaryDTO(string HallId, string Name, int Rows, int Columns, int TotalSeats, int OpenSeatsCount, IEnumerable<SeatInfoDTO> OpenSeats);

