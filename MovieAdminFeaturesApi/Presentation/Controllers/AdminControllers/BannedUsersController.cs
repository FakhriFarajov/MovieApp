using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MovieAdminFeaturesApi.Core.DTOs.BanDtos.Request;
using MovieAdminFeaturesApi.Core.DTOs.BanDtos.Response;
using MovieAdminFeaturesApi.Infrastructure.Context;

namespace MovieAdminFeaturesApi.Presentation.Controllers.AdminControllers;

[ApiController]
[Route("api/Admin/[controller]")]
public class BannedUsersController : ControllerBase
{
    private readonly MovieApiDbContext _db;

    public BannedUsersController(MovieApiDbContext db)
    {
        _db = db;
    }

    // GET: api/Admin/BannedUsers/clients
    // Returns all clients with ban status (including banned ones)
    [HttpGet("clients")]
    public async Task<IActionResult> GetAllClients()
    {
        var now = DateTime.UtcNow;
        var clients = await _db.Clients.Include(c => c.User).AsNoTracking().ToListAsync();
        var bans = await _db.BannedUsers.AsNoTracking().ToListAsync();

        var clientsWithStatus = clients
            .Select(c =>
            {
                var activeBan = bans.FirstOrDefault(b => b.ClientProfileId == c.Id && (b.ExpiresAt == null || b.ExpiresAt > now));
                var isBanned = activeBan != null;
                return new ClientListDTO(
                    c.Id,
                    c.User.Email ?? string.Empty,
                    c.User.Name,
                    c.User.Surname,
                    c.User.PhoneNumber,
                    c.DateOfBirth,
                    isBanned,
                    activeBan?.Id);
            });

        return Ok(clientsWithStatus);
    }


    // POST: api/Admin/BannedUsers/ban/{clientId}
    // Ban a single client by id. Optional body may include AdminProfileId, Reason, ExpiresAt.
    [HttpPost("ban/{clientId}")]
    public async Task<IActionResult> BanByClientId(string clientId, [FromBody] BanCreateRequestDTO? request)
    {
        // Verify client exists
        var client = await _db.Clients.FindAsync(clientId);
        if (client == null) return NotFound(new { Message = "Client profile not found" });

        var now = DateTime.UtcNow;
        // Check for an existing active ban
        var existingActiveBan = await _db.BannedUsers
            .Where(b => b.ClientProfileId == clientId && (b.ExpiresAt == null || b.ExpiresAt > now))
            .OrderByDescending(b => b.CreatedAt)
            .FirstOrDefaultAsync();

        if (existingActiveBan != null)
        {
            var banActive = existingActiveBan.ExpiresAt == null || existingActiveBan.ExpiresAt > now;
            var existingDto = new BanResponseDTO(
                existingActiveBan.Id,
                existingActiveBan.ClientProfileId,
                existingActiveBan.AdminProfileId,
                existingActiveBan.Reason,
                existingActiveBan.CreatedAt,
                existingActiveBan.ExpiresAt,
                banActive);

            return Conflict(new { Message = "Client is already banned", ActiveBan = existingDto });
        }

        var ban = new MovieAdminFeaturesApi.Core.Models.BannedUser
        {
            ClientProfileId = clientId,
            AdminProfileId = request?.AdminProfileId,
            Reason = request?.Reason ?? "Banned by admin",
            CreatedAt = now,
            ExpiresAt = request?.ExpiresAt
        };

        await _db.BannedUsers.AddAsync(ban);
        await _db.SaveChangesAsync();

        var dto = new BanResponseDTO(ban.Id, ban.ClientProfileId, ban.AdminProfileId, ban.Reason, ban.CreatedAt, ban.ExpiresAt, ban.ExpiresAt == null || ban.ExpiresAt > DateTime.UtcNow);
        // Return 201 Created with the created ban payload
        return CreatedAtAction(nameof(UnbanByClientId), new { clientId = ban.ClientProfileId }, dto);
    }

    // DELETE: api/Admin/BannedUsers/ban/{clientId}
    // Unban a client by removing all ban records for that client
    [HttpDelete("unban/{clientId}")]
    public async Task<IActionResult> UnbanByClientId(string clientId)
    {
        var bans = await _db.BannedUsers.Where(b => b.ClientProfileId == clientId).ToListAsync();
        if (bans.Count == 0) return NotFound(new { Message = "No ban records found for this client" });

        _db.BannedUsers.RemoveRange(bans);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
