using MovieClientFeaturesApi.Core.DTOs.BookingDtos.Request;
using MovieClientFeaturesApi.Core.DTOs.BookingDtos.Response;
using MovieClientFeaturesApi.Core.Models;

namespace MovieClientFeaturesApi.Application.Services.Client.Interfaces;

public interface IBookingService
{
    Task<BookingResponseDTO> CreateBookingAsync(string clientClaimId, BookingCreateRequestDTO dto);
    Task<IEnumerable<TicketDetailDTO>> GetTicketsForClientAsync(string clientClaimId);

    // Support scanning: fetch ticket by id (including Booking relation)
    Task<Ticket?> GetTicketByIdAsync(string ticketId);
    Task<ShowTime?> GetShowTimeByIdAsync(string showTimeId);
    Task<bool> MarkTicketUsedAsync(string ticketId);

    // Fetch all bookings for a client (resolved from claim id or client id)
    Task<IEnumerable<BookingResponseDTO>> GetBookingsForClientAsync(string clientClaimId);
}
