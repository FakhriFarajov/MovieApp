namespace MovieAdminFeaturesApi.Core.DTOs.OrderDtos.Response;

public record OrderResponseDTO(
    string Id,
    string BookingId,
    decimal Amount,
    int PaymentMethod,
    int Status,
    DateTime PaymentTime,
    string TransactionId
);
