using System.Security.Claims;
using System.Text;
using AutoMapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MovieAuthApi.Application.Services.Client.Interfaces;
using MovieAuthApi.Application.Services.Utils;
using MovieAuthApi.Core.DTOs.ClientDtos.Response;
using MovieAuthApi.Core.DTOs.ClientDtos.Request;
using MovieAuthApi.Core.Enums;
using MovieAuthApi.Core.Models;
using MovieAuthApi.Infrastructure.Context;
using static BCrypt.Net.BCrypt;


namespace MovieAuthApi.Application.Services.Client.Classes;

public class AccountService : IAccountService
{
    private readonly MovieApiDbContext _context;
    private readonly IMapper _mapper;
    private readonly IWebHostEnvironment _env;
    private readonly EmailSender _emailSender;
    private readonly TokenManager _tokenManager;
    private readonly IConfiguration _configuration;

    public AccountService(MovieApiDbContext context, IMapper mapper, IWebHostEnvironment env, EmailSender emailSender, TokenManager tokenManager, IConfiguration configuration)
    {
        _context = context;
        _mapper = mapper;
        _env = env;
        _emailSender = emailSender;
        _tokenManager = tokenManager;
        _configuration = configuration;
    }

    // Build origin helper
    private string GetOrigin(HttpContext context)
    {
        // Use fixed frontend origin as requested
        return "http://localhost:8080";
    }

    public async Task<Result> RegisterClientAsync(ClientRegisterRequestDTO request)
    {
        // Normalize email to lowercase
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (existingUser != null)
        {
            return Result.Error("Email is already registered.", 409);
        }

        var userToAdd = _mapper.Map<User>(request);
        userToAdd.Email = normalizedEmail;
        userToAdd.PasswordHash = HashPassword(request.Password);
        userToAdd.Role = Role.Client; // Set role directly

        var clientProfile = _mapper.Map<Core.Models.Client>(request);
        clientProfile.UserId = userToAdd.Id;

        userToAdd.ClientProfileId = clientProfile.Id;

        _context.Users.Add(userToAdd);
        _context.Clients.Add(clientProfile);

        await _context.SaveChangesAsync();

        return Result.Success("Client registered successfully");
    }
    
    public async Task<Result> SendConfirmationEmailAsync(ClaimsPrincipal userClaims, string token, HttpContext context)
    {
        var email = userClaims?.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrWhiteSpace(email))
            return Result.Error("Email is required", 400);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return Result.Error("User not found", 404);

        var filePath = Path.Combine(_env.WebRootPath ?? Directory.GetCurrentDirectory(), "ConfirmMessage.html");

        var messageContent = new StringBuilder(await File.ReadAllTextAsync(filePath));

        var origin = GetOrigin(context);
        // Build an API verification link so clicking the email calls the VerifyEmailAsync endpoint directly
        var apiOrigin = $"{context.Request.Scheme}://{context.Request.Host.ToUriComponent()}";
        var link = $"{apiOrigin}/api/Client/Account/VerifyToken/{user.Id}/{Uri.EscapeDataString(token)}";

        messageContent.Replace("{User}", user.Name ?? string.Empty);
        messageContent.Replace("{Email}", user.Email ?? string.Empty);
        messageContent.Replace("{ConfirmationLink}", link);

        try
        {
            await _emailSender.SendEmailAsync(user.Email!, "Confirm your email", messageContent.ToString());
            return Result.Success("Confirmation email sent");
        }
        catch (Exception ex)
        {
            return Result.Error($"Failed to send confirmation email: {ex.Message}", 500);
        }
    }

    public async Task<Result> VerifyEmailAsync(string id, string token)
    {
        // Validate token (ensure it's a valid email token and contains the email)
        var valid = await _tokenManager.ValidateEmailTokenAsync(token);
        if (!valid) return Result.Error("Invalid or expired token", 400);

        var email = await _tokenManager.GetEmailFromTokenAsync(token);
        if (string.IsNullOrWhiteSpace(email)) return Result.Error("Invalid token payload", 400);

        var user = await _context.Users.Include(u => u.ClientProfile).FirstOrDefaultAsync(u => u.Id == id && u.Email.ToLower() == email.ToLower());
        if (user == null) return Result.Error("User not found or email mismatch", 404);
        if (user.ClientProfile == null) return Result.Error("Client profile not found", 404);

        user.ClientProfile.IsEmailVerified = true;
        await _context.SaveChangesAsync();

        return Result.Success("Email confirmed");
    }
    
    public async Task<Result> ChangePassword(ChangePasswordRequestDTO request)
    {
        var user = await _context.Users.FindAsync(request.userId);
        if (user == null)
        {
            return Result.Error("User not found", 404);
        }
    
        if (!Verify(request.OldPassword, user.PasswordHash))
        {
            return Result.Error("Old password is incorrect", 400);
        }

        if (request.NewPassword != request.ConfirmNewPassword)
        {
            return Result.Error("Passwords do not match", 400);
        }
    
        user.PasswordHash = HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();
    
        return Result.Success("Password updated successfully");
    }
    
    public async Task<Result> ForgotPasswordAsync(ForgotPasswordRequestDTO request, HttpContext context)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Email))
            return Result.Error("Email is required", 400);

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
        if (user == null)
            return Result.Error("There is no such user", 404);

        // Build a ClaimsPrincipal with email claim for token creation
        var claims = new List<Claim> { new Claim(ClaimTypes.Email, user.Email) };
        var identity = new ClaimsIdentity(claims, "password-reset");
        var principal = new ClaimsPrincipal(identity);

        var token = await _tokenManager.CreateEmailTokenAsync(principal);

        // Build reset link using request context (scheme + host) from HttpContext
        var origin = GetOrigin(context);
        var resetLink = $"{origin}/forgot-password?userId={user.Id}&token={Uri.EscapeDataString(token)}";

        // Send password reset email
        await _emailSender.SendPasswordResetEmailAsync(user.Email, user.Name ?? string.Empty, resetLink);

        return Result.Success("Password reset email sent");
    }

    public async Task<Result> ResetPasswordAsync(ResetPasswordRequestDTO request)
    {
        if (request == null)
            return Result.Error("Invalid request", 400);

        if (request.NewPassword != request.ConfirmNewPassword)
            return Result.Error("Passwords do not match", 400);

        // Server-side password policy enforcement (same as registration validator)
        var pwdRegex = new System.Text.RegularExpressions.Regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&_]+$");
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6 ||
            !pwdRegex.IsMatch(request.NewPassword))
        {
            return Result.Error(
                "Password must be at least 6 characters and contain uppercase, lowercase letters and a digit.", 400);
        }

        // Validate token
        var valid = await _tokenManager.ValidateEmailTokenAsync(request.Token);
        if (!valid) return Result.Error("Invalid or expired token", 400);

        var email = await _tokenManager.GetEmailFromTokenAsync(request.Token);
        if (string.IsNullOrWhiteSpace(email)) return Result.Error("Invalid token payload", 400);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        if (user == null) return Result.Error("User not found", 404);

        user.PasswordHash = HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return Result.Success("Password has been reset successfully");
    }
}
