using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MovieClientFeaturesApi.Application.Services.Client.Interfaces;
using MovieClientFeaturesApi.Core.DTOs.BookingDtos.Request;
using MovieClientFeaturesApi.Core.DTOs.BookingDtos.Response;
using MovieClientFeaturesApi.Core.Models;
using MovieClientFeaturesApi.Infrastructure.Context;
using QRCoder;
using MovieClientFeaturesApi.Application.Services.Interfaces;
using MovieClientFeaturesApi.Core.Enums;

namespace MovieClientFeaturesApi.Application.Services.Client.Classes;

public class BookingService : IBookingService
{
    private readonly MovieApiDbContext _db;
    private readonly IImageService _imageService;
    private readonly string _qrBucket;

    public BookingService(MovieApiDbContext db, IImageService imageService, IConfiguration config)
    {
        _db = db;
        _imageService = imageService;
        _qrBucket = config["MINIO__QRCODESBUCKETNAME"] ?? config["Minio:QRCodesBucketName"] ?? "qr-codes";
    }

    public async Task<BookingResponseDTO> CreateBookingAsync(string clientClaimId, BookingCreateRequestDTO dto)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));
        if (dto.SeatIds == null || !dto.SeatIds.Any()) throw new ArgumentException("SeatIds required");

        // Resolve client profile id (accept token claim variants)
        var client = await _db.Clients.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == clientClaimId);
        if (client == null) throw new KeyNotFoundException("Client not found");

        // Validate showtime
        var showtime = await _db.ShowTimes.Include(s => s.Hall).FirstOrDefaultAsync(s => s.Id == dto.ShowTimeId);
        if (showtime == null) throw new KeyNotFoundException("ShowTime not found");

        // Validate seats belong to the hall and are available
        var seats = await _db.Seats.Where(s => dto.SeatIds.Contains(s.Id)).ToListAsync();
        if (seats.Count != dto.SeatIds.Count)
            throw new KeyNotFoundException("One or more seats not found");
        if (seats.Any(s => s.HallId != showtime.HallId))
            throw new InvalidOperationException("One or more seats do not belong to the showtime hall");

        // Check if seats are already taken for this showtime (any ticket exists for these seats for that showtime)
        var conflictingTicket = await _db.Tickets.AsNoTracking().Include(t => t.Booking).Where(t => dto.SeatIds.Contains(t.SeatId) && t.Booking.ShowTimeId == dto.ShowTimeId).FirstOrDefaultAsync();
        if (conflictingTicket != null) throw new InvalidOperationException("One or more seats already booked for this showtime");

        // Compute total price (use showtime.BasePrice * number of seats)
        var totalPrice = showtime.BasePrice * dto.SeatIds.Count;

        // Create booking and tickets inside a transaction
        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var booking = new Booking
            {
                ClientId = client.Id,
                ShowTimeId = showtime.Id,
                TotalPrice = totalPrice,
                Status = BookingStatus.Pending
            };
            _db.Bookings.Add(booking);
            await _db.SaveChangesAsync();

            var tickets = new List<Ticket>();
            foreach (var seat in seats)
            {
                var ticket = new Ticket
                {
                    BookingId = booking.Id,
                    SeatId = seat.Id,
                    Price = showtime.BasePrice,
                    Status = TicketStatus.Reserved
                };
                tickets.Add(ticket);
            }

            _db.Tickets.AddRange(tickets);
            await _db.SaveChangesAsync();

            // Generate QR codes for tickets and upload to minio (in the configured QR bucket)
            foreach (var t in tickets)
            {
                try
                {
                    // Use ticket.Id as payload (server will validate ticket.Id on scan)
                    using var qrGen = new QRCodeGenerator();
                    using var qrData = qrGen.CreateQrCode(t.Id, QRCodeGenerator.ECCLevel.Q);
                    var png = new PngByteQRCode(qrData);
                    var qrBytes = png.GetGraphic(20);

                    var objectName = $"{t.Id}.png";
                    var uploadRes = await _imageService.UploadBytesAsync(qrBytes, objectName, "image/png", _qrBucket);
                    if (uploadRes.IsSuccess)
                    {
                        // store object name in Ticket.QRCode
                        t.QRCode = objectName;
                    }
                    // else ignore upload failure for now (ticket still reserved)
                }
                catch
                {
                    // swallow per-ticket QR generation/upload errors (ticket still exists)
                }
            }

            await _db.SaveChangesAsync();

            // Simulate payment processing: create a Payment record and mark booking/tickets as Paid
            var payment = new Payment
            {
                BookingId = booking.Id,
                Amount = totalPrice,
                PaymentMethod = PaymentMethod.Card,
                Status = PaymentStatus.Paid,
                TransactionId = Guid.NewGuid().ToString(),
                PaymentTime = DateTime.UtcNow
            };
            _db.Payments.Add(payment);

            // Update statuses
            booking.Status = BookingStatus.Paid;
            foreach (var t in tickets)
            {
                t.Status = TicketStatus.Paid;
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            // Build response DTO
            var response = new BookingResponseDTO
            {
                Id = booking.Id,
                ClientId = booking.ClientId,
                ShowTimeId = booking.ShowTimeId,
                TotalPrice = booking.TotalPrice,
                Status = booking.Status.ToString(),
                Tickets = tickets.Select(t => new TicketInfoDTO { TicketId = t.Id, SeatId = t.SeatId, Label = seats.First(s => s.Id == t.SeatId).Label, Price = t.Price, QRCode = t.QRCode }).ToList()
            };

            // For each ticket try to resolve presigned URL for the QR image (best-effort)
            for (int i = 0; i < response.Tickets.Count; i++)
            {
                var ti = response.Tickets[i];
                if (!string.IsNullOrWhiteSpace(ti.QRCode))
                {
                    try
                    {
                        var url = await _imageService.GetImageUrlAsync(ti.QRCode);
                        ti.QRCode = url;
                    }
                    catch
                    {
                        // ignore
                    }
                }
            }

            return response;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task<IEnumerable<TicketDetailDTO>> GetTicketsForClientAsync(string clientClaimId)
    {
        var client = await _db.Clients.FindAsync(clientClaimId);
        if (client == null) throw new KeyNotFoundException("Client not found");

        var tickets = await _db.Tickets
            .AsNoTracking()
            .Include(t => t.Booking)
            .Include(t => t.Seat)
            .Where(t => t.Booking.ClientId == clientClaimId)
            .ToListAsync();

        // eager load showtimes and movies for the booking's showtime ids
        var showTimeIds = tickets.Select(t => t.Booking.ShowTimeId).Distinct().ToList();
        var showtimes = await _db.ShowTimes.AsNoTracking().Where(s => showTimeIds.Contains(s.Id)).Include(s => s.Movie).Include(s => s.Hall).ToListAsync();

        var results = new List<TicketDetailDTO>();
        foreach (var t in tickets)
        {
            var show = showtimes.FirstOrDefault(s => s.Id == t.Booking.ShowTimeId);
            var dto = new TicketDetailDTO
            {
                TicketId = t.Id,
                BookingId = t.BookingId,
                ShowTimeId = t.Booking.ShowTimeId,
                MovieId = show?.MovieId ?? string.Empty,
                MovieTitle = show?.Movie?.OriginalTitle ?? string.Empty,
                HallId = show?.HallId ?? string.Empty,
                HallName = show?.Hall?.Name ?? string.Empty,
                StartTime = show?.StartTime ?? DateTime.MinValue,
                EndTime = show?.EndTime ?? DateTime.MinValue,
                SeatId = t.SeatId,
                SeatLabel = t.Seat?.Label ?? string.Empty,
                RowNumber = t.Seat?.RowNumber ?? 0,
                ColumnNumber = t.Seat?.ColumnNumber ?? 0,
                Price = t.Price,
                Status = t.Status.ToString(),
                QRCode = t.QRCode,
                BookingTime = t.Booking.BookingTime
            };
            results.Add(dto);
        }

        // Resolve QR code object names to presigned URLs (best-effort)
        for (int i = 0; i < results.Count; i++)
        {
            var r = results[i];
            if (!string.IsNullOrWhiteSpace(r.QRCode))
            {
                try
                {
                    var url = await _imageService.GetImageUrlAsync(r.QRCode, 3600, _qrBucket);
                    r.QRCode = url;
                }
                catch
                {
                    // ignore, keep object name
                }
            }
        }

        return results;
    }

    public async Task<Ticket?> GetTicketByIdAsync(string ticketId)
    {
        return await _db.Tickets.Include(t => t.Booking).Include(t => t.Seat).FirstOrDefaultAsync(t => t.Id == ticketId);
    }

    public async Task<ShowTime?> GetShowTimeByIdAsync(string showTimeId)
    {
        return await _db.ShowTimes.FirstOrDefaultAsync(s => s.Id == showTimeId);
    }

    public async Task<bool> MarkTicketUsedAsync(string ticketId)
    {
        var ticket = await _db.Tickets.FirstOrDefaultAsync(t => t.Id == ticketId);
        if (ticket == null) return false;
        if (ticket.Status == TicketStatus.Used) return false;
        ticket.Status = TicketStatus.Used;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<BookingResponseDTO>> GetBookingsForClientAsync(string clientClaimId)
    {
        var client = await _db.Clients.FindAsync(clientClaimId);
        if (client == null) throw new KeyNotFoundException("Client not found");

        var bookings = await _db.Bookings.AsNoTracking()
            .Where(b => b.ClientId == clientClaimId)
            .Include(b => b.Tickets)
            .ToListAsync();

        var seatIds = bookings.SelectMany(b => b.Tickets.Select(t => t.SeatId)).Distinct().ToList();
        var seats = await _db.Seats.AsNoTracking().Where(s => seatIds.Contains(s.Id)).ToListAsync();

        var results = new List<BookingResponseDTO>();
        foreach (var b in bookings)
        {
            var dto = new BookingResponseDTO
            {
                Id = b.Id,
                ClientId = b.ClientId,
                ShowTimeId = b.ShowTimeId,
                TotalPrice = b.TotalPrice,
                Status = b.Status.ToString(),
                Tickets = b.Tickets.Select(t => new TicketInfoDTO { TicketId = t.Id, SeatId = t.SeatId, Label = seats.FirstOrDefault(s => s.Id == t.SeatId)?.Label ?? string.Empty, Price = t.Price, QRCode = t.QRCode }).ToList()
            };

            // resolve QR urls
            for (int i = 0; i < dto.Tickets.Count; i++)
            {
                var ti = dto.Tickets[i];
                if (!string.IsNullOrWhiteSpace(ti.QRCode))
                {
                    try
                    {
                        var url = await _imageService.GetImageUrlAsync(ti.QRCode, 3600, _qrBucket);
                        ti.QRCode = url;
                    }
                    catch
                    {
                        // ignore
                    }
                }
            }

            results.Add(dto);
        }

        return results;
    }
}
