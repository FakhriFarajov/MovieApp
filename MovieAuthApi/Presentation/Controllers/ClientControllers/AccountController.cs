using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieAuthApi.Application.Services.Client.Interfaces;
using MovieAuthApi.Application.Services.Utils;
using MovieAuthApi.Core.DTOs.AdminDtos.Response;
using MovieAuthApi.Core.DTOs.ClientDtos.Request;

namespace MovieAuthApi.Presentation.Controllers.ClientControllers;

[ApiController]
[Route("api/Client/[controller]")]
public class AccountController : ControllerBase
{
    private readonly IAccountService _accountService;
    private readonly TokenManager _tokenService;

    public AccountController(IAccountService accountService, TokenManager tokenService)
    {
        _accountService = accountService;
        _tokenService = tokenService;
    }

    [HttpPost("Register")]
    public async Task<IActionResult> RegisterAsync([FromBody] ClientRegisterRequestDTO requestDto)
    {
        var res = await _accountService.RegisterClientAsync(requestDto);
        return Ok(res);
    }

    [HttpPost("SendConfirmationEmail")]
    public async Task<IActionResult> SendConfirmationEmailAsync([FromBody] SendConfirmationEmailRequestDTO? request)
    {
        // Determine email: request body overrides authenticated user claim
        var email = request?.Email?.Trim();
        if (string.IsNullOrWhiteSpace(email))
        {
            email = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email)?.Value;
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            var err = Result.Error("Email is required", 400);
            return StatusCode(err.StatusCode, err);
        }

        // Basic email format validation
        try
        {
            var _ = new System.Net.Mail.MailAddress(email);
        }
        catch
        {
            var err = Result.Error("Invalid email format", 400);
            return StatusCode(err.StatusCode, err);
        }

        try
        {
            var claims = new List<System.Security.Claims.Claim>
            {
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Email, email)
            };
            var principal = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(claims, "email-confirm"));

            var token = await _tokenService.CreateEmailTokenAsync(principal);
            var res = await _accountService.SendConfirmationEmailAsync(principal, token, HttpContext);
            return StatusCode(res.StatusCode, res);
        }
        catch (Exception ex)
        {
            var err = Result.Error("Failed to send confirmation email", 500);
            return StatusCode(err.StatusCode, err);
        }
    }

    [HttpPost("ForgotPassword")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDTO request)
    {
        var res = await _accountService.ForgotPasswordAsync(request, HttpContext);
        return StatusCode(res.StatusCode, res);
    }

    [HttpPost("ResetPassword")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDTO request)
    {
        var res = await _accountService.ResetPasswordAsync(request);
        return StatusCode(res.StatusCode, res);
    }

    [HttpGet("VerifyToken/{id}/{token}")]
    public async Task<IActionResult> VerifyTokenAsync(string id, string token)
    {
        var result = await _accountService.VerifyEmailAsync(id, token);
        if (result.IsSuccess)
        {
            return Redirect("http://localhost:8080/email-confirmation?status=success");
        }

        return Redirect("http://localhost:8080/email-confirmation?status=failure");
    }
    
    [Authorize(Policy = "ClientPolicy")] //We need to send a Bearer token in the header to access this endpoint
    [HttpPost("ChangePassword")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDTO request)
    {
        var result = await _accountService.ChangePassword(request);
        return Ok(result);
    }
}
