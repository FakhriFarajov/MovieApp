using System.IO;
using Microsoft.EntityFrameworkCore;
using MovieAuthApi.Infrastructure.Context;
using MovieAuthApi.Presentation.Extensions;
using MovieAuthApi.Core.Models;
using MovieAuthApi.Core.Enums;

// Load .env if present (search up the directory tree)
static void LoadDotEnvIfPresent()
{
    string? FindEnvFile()
    {
        var dir = AppContext.BaseDirectory;
        for (int i = 0; i < 6; i++)
        {
            var candidate = Path.Combine(dir, ".env");
            if (File.Exists(candidate)) return candidate;
            var parent = Path.GetDirectoryName(dir);
            if (string.IsNullOrEmpty(parent) || parent == dir) break;
            dir = parent;
        }
        // Also check current working directory as a fallback
        var cwdCandidate = Path.Combine(Directory.GetCurrentDirectory(), ".env");
        if (File.Exists(cwdCandidate)) return cwdCandidate;
        return null;
    }

    var envPath = FindEnvFile();
    if (envPath == null) return;

    foreach (var raw in File.ReadAllLines(envPath))
    {
        var line = raw.Trim();
        if (string.IsNullOrWhiteSpace(line)) continue;
        if (line.StartsWith("#")) continue;
        var idx = line.IndexOf('=');
        if (idx <= 0) continue;
        var key = line.Substring(0, idx).Trim();
        var value = line.Substring(idx + 1).Trim();
        // remove optional surrounding quotes
        if ((value.StartsWith("\"") && value.EndsWith("\"")) || (value.StartsWith("'") && value.EndsWith("'")))
        {
            value = value.Substring(1, value.Length - 2);
        }

        // Set only if not already present in environment
        if (Environment.GetEnvironmentVariable(key) == null)
        {
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}

LoadDotEnvIfPresent();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddApplicationServices();

builder.Services.AddControllers();

var app = builder.Build();

// Apply migrations and ensure admin seed
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var db = services.GetRequiredService<MovieApiDbContext>();
        var logger = services.GetRequiredService<ILogger<Program>>();

        // apply any pending migrations
        db.Database.Migrate();

        // --- Seed admin user/profile if none exists ---
        // Read admin credentials from environment
        var adminEmail = Environment.GetEnvironmentVariable("ADMIN__EMAIL") ?? "admin@localhost";
        var adminPassword = Environment.GetEnvironmentVariable("ADMIN__PASSWORD") ?? "Admin123!";
        var adminName = Environment.GetEnvironmentVariable("ADMIN__NAME") ?? "Admin";
        var adminSurname = Environment.GetEnvironmentVariable("ADMIN__SURNAME") ?? "User";

        var existingAdmin = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Role == Role.Admin || (u.Email != null && u.Email.ToLower() == adminEmail.ToLower()));
        if (existingAdmin == null)
        {
            logger.LogInformation("No admin found; seeding default admin account ({email})", adminEmail);

            var user = new User
            {
                Email = adminEmail,
                Name = adminName,
                Surname = adminSurname,
                PhoneNumber = string.Empty,
                ProfileImage = string.Empty,
                Role = Role.Admin,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                CreatedAt = DateTime.UtcNow
            };

            var admin = new Admin
            {
                UserId = user.Id,
                User = user
            };

            // keep the linking field consistent
            user.AdminProfileId = admin.Id;

            db.Users.Add(user);
            db.Admins.Add(admin);
            await db.SaveChangesAsync();

            logger.LogInformation("Seeded admin user: {email}", adminEmail);
        }
        else
        {
            logger.LogInformation("Admin user/profile already exists; skipping seed");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating or initializing the database.");
    }
}

app.UseCors("AllowAll");
app.UseApplicationMiddleware();
await app.RunAsync();

