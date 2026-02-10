using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MovieAdminFeaturesApi.Core.DTOs.OrderDtos.Response;
using MovieAdminFeaturesApi.Infrastructure.Context;

namespace MovieAdminFeaturesApi.Presentation.Controllers.AdminControllers;

[ApiController]
[Route("api/Admin/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly MovieApiDbContext _db;

    public OrdersController(MovieApiDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? bookingId)
    {
        var q = _db.Payments.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(bookingId)) q = q.Where(p => p.BookingId == bookingId);
        var list = await q.OrderByDescending(p => p.PaymentTime).ToListAsync();
        var dto = list.Select(p => new OrderResponseDTO(p.Id, p.BookingId, p.Amount, (int)p.PaymentMethod, (int)p.Status, p.PaymentTime, p.TransactionId));
        return Ok(dto);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var p = await _db.Payments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return NotFound();
        var dto = new OrderResponseDTO(p.Id, p.BookingId, p.Amount, (int)p.PaymentMethod, (int)p.Status, p.PaymentTime, p.TransactionId);
        return Ok(dto);
    }
}
