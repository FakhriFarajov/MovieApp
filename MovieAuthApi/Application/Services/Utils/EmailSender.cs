using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace MovieAuthApi.Application.Services.Utils;


public class EmailSender
{
    private readonly SmtpClient _smtpClient;
    private readonly IConfiguration _configuration;
    private readonly string _fromAddress;

    public EmailSender(IConfiguration configuration)
    {
        _configuration = configuration;

        // Prefer environment variables, fall back to configuration
        var host = Environment.GetEnvironmentVariable("EMAIL_HOST") ?? _configuration["Email:Host"];
        var portEnv = Environment.GetEnvironmentVariable("EMAIL_PORT");
        int port = 587;
        if (!string.IsNullOrWhiteSpace(portEnv) && int.TryParse(portEnv, out var p1)) port = p1;
        else if (!string.IsNullOrWhiteSpace(_configuration["Email:Port"]) && int.TryParse(_configuration["Email:Port"], out var p2)) port = p2;

        var enableSslEnv = Environment.GetEnvironmentVariable("EMAIL_ENABLE_SSL");
        bool enableSsl = true;
        if (!string.IsNullOrWhiteSpace(enableSslEnv) && bool.TryParse(enableSslEnv, out var b1)) enableSsl = b1;
        else if (!string.IsNullOrWhiteSpace(_configuration["Email:EnableSsl"]) && bool.TryParse(_configuration["Email:EnableSsl"], out var b2)) enableSsl = b2;

        _smtpClient = new SmtpClient
        {
            Host = host ?? string.Empty,
            Port = port,
            EnableSsl = enableSsl
        };

        var username = Environment.GetEnvironmentVariable("EMAIL_USERNAME") ?? _configuration["Email:Username"];
        var password = Environment.GetEnvironmentVariable("EMAIL_PASSWORD") ?? _configuration["Email:Password"];

        if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
        {
            _smtpClient.Credentials = new NetworkCredential(username, password);
        }

        // From address
        _fromAddress = Environment.GetEnvironmentVariable("EMAIL_FROM") ?? _configuration["Email:From"] ?? string.Empty;
    }

    public async Task SendEmailAsync(string email, string subject, string htmlBody)
    {
        MailMessage message = new()
        {
            From = new MailAddress(_fromAddress),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };

        message.To.Add(email);

        await _smtpClient.SendMailAsync(message);
    }
    
    public async Task SendPasswordResetEmailAsync(string email, string userName, string resetLink)
    {
        // Load the password reset template
        var templatePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "PasswordResetMessage.html");
        string htmlBody = await File.ReadAllTextAsync(templatePath);
        htmlBody = htmlBody.Replace("{User}", userName)
                           .Replace("{ResetLink}", resetLink);
        string subject = "Password Reset Request";
        await SendEmailAsync(email, subject, htmlBody);
    }
}