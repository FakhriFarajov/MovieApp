using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MovieAdminFeaturesApi.Core.DTOs.BookingDtos.Response;
using MovieAdminFeaturesApi.Infrastructure.Context;

namespace MovieAdminFeaturesApi.Presentation.Controllers.AdminControllers;

[ApiController]
[Route("api/Admin/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly MovieApiDbContext _db;

    public BookingsController(MovieApiDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? clientId, [FromQuery] string? showTimeId)
    {
        var q = _db.Bookings.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(clientId)) q = q.Where(b => b.ClientId == clientId);
        if (!string.IsNullOrWhiteSpace(showTimeId)) q = q.Where(b => b.ShowTimeId == showTimeId);
        var list = await q.OrderByDescending(b => b.BookingTime).ToListAsync();
        var dto = list.Select(b => new BookingResponseDTO(b.Id, b.ClientId, b.ShowTimeId, b.BookingTime, b.TotalPrice, (int)b.Status));
        return Ok(dto);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var b = await _db.Bookings.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (b == null) return NotFound();
        var dto = new BookingResponseDTO(b.Id, b.ClientId, b.ShowTimeId, b.BookingTime, b.TotalPrice, (int)b.Status);
        return Ok(dto);
    }
}
