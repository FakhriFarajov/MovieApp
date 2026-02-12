using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;
using MovieClientFeaturesApi.Core.DTOs.BookingDtos.Request;

namespace MovieClientFeaturesApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "ClientPolicy")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingsController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    private string GetClientIdFromClaims()
    {
        // prefer explicit client_profile_id claim
        var id = User.FindFirst("client_profile_id")?.Value;
        if (string.IsNullOrWhiteSpace(id)) throw new InvalidOperationException("client_profile_id claim not found in token claims");
        return id;
    }

    [HttpPost("book")]
    public async Task<IActionResult> Create([FromBody] BookingCreateRequestDTO dto)
    {
        if (dto == null) return BadRequest(new { isSuccess = false, message = "Validation failed", data = new { dto = new[] { "The dto field is required." } } });
        if (dto.SeatIds == null || !dto.SeatIds.Any()) return BadRequest(new { isSuccess = false, message = "Validation failed", data = new { seatIds = new[] { "At least one seat must be selected." } } });

        var clientClaim = GetClientIdFromClaims();
        try
        {
            var res = await _bookingService.CreateBookingAsync(clientClaim, dto);
            // Return the created booking directly. We don't expose a booking-by-id endpoint yet,
            // so return 201 with the resource in the body for now.
            return StatusCode(201, res);
        }
        catch (KeyNotFoundException knf)
        {
            return NotFound(new { isSuccess = false, message = knf.Message });
        }
        catch (InvalidOperationException ioe)
        {
            return BadRequest(new { isSuccess = false, message = ioe.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { isSuccess = false, message = ex.Message });
        }
    }

    [HttpGet("getBooking")]
    public async Task<IActionResult> Get()
    {
        var clientClaim = GetClientIdFromClaims();
        try
        {
            var bookings = await _bookingService.GetBookingsForClientAsync(clientClaim);
            return Ok(bookings);
        }
        catch (KeyNotFoundException knf)
        {
            return NotFound(new { isSuccess = false, message = knf.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { isSuccess = false, message = ex.Message });
        }
    }

    [HttpGet("tickets")]
    public async Task<IActionResult> GetTickets()
    {
        var clientClaim = GetClientIdFromClaims();
        try
        {
            var tickets = await _bookingService.GetTicketsForClientAsync(clientClaim);
            return Ok(tickets);
        }
        catch (KeyNotFoundException knf)
        {
            return NotFound(new { isSuccess = false, message = knf.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { isSuccess = false, message = ex.Message });
        }
    }

    public class TicketScanRequest
    {
        public string TicketId { get; set; } = string.Empty;
    }

    [HttpPost("scan")]
    [AllowAnonymous]
    public async Task<IActionResult> Scan([FromBody] TicketScanRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.TicketId))
            return BadRequest(new { isSuccess = false, message = "TicketId is required" });

        try
        {
            // locate ticket
            var ticket = await _bookingService.GetTicketByIdAsync(req.TicketId);
            if (ticket == null) return NotFound(new { isSuccess = false, message = "Ticket not found" });

            // validation: booking must be Paid
            if (ticket.Booking == null || ticket.Booking.Status != MovieClientFeaturesApi.Core.Models.BookingStatus.Paid)
                return BadRequest(new { isSuccess = false, message = "Booking is not paid" });

            // ticket must be Paid and not Used
            if (ticket.Status != MovieClientFeaturesApi.Core.Models.TicketStatus.Paid)
                return BadRequest(new { isSuccess = false, message = "Ticket is not valid for use" });
            if (ticket.Status == MovieClientFeaturesApi.Core.Models.TicketStatus.Used)
                return BadRequest(new { isSuccess = false, message = "Ticket already used" });

            // check showtime expiry (cannot be used after show end)
            var show = await _bookingService.GetShowTimeByIdAsync(ticket.Booking.ShowTimeId);
            if (show == null) return BadRequest(new { isSuccess = false, message = "Show not found" });
            if (DateTime.UtcNow > show.EndTime)
                return BadRequest(new { isSuccess = false, message = "Ticket expired" });

            // mark ticket as used
            var ok = await _bookingService.MarkTicketUsedAsync(ticket.Id);
            if (!ok) return BadRequest(new { isSuccess = false, message = "Unable to mark ticket used" });

            return Ok(new { isSuccess = true, message = "Ticket validated" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { isSuccess = false, message = ex.Message });
        }
    }
}
