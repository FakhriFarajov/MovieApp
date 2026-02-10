using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using MovieAuthApi.Core.DTOs.ClientDtos.Response;
using MovieAuthApi.Core.DTOs.ClientDtos.Request;

namespace MovieAuthApi.Application.Services.Client.Interfaces;

public interface IAccountService
{
    public Task<Result> RegisterClientAsync(ClientRegisterRequestDTO requestDto);
    public Task<Result> SendConfirmationEmailAsync(ClaimsPrincipal user, string token, HttpContext context);
    public Task<Result> VerifyEmailAsync(string id, string token);
    Task<Result> ForgotPasswordAsync(ForgotPasswordRequestDTO request, HttpContext context);
    Task<Result> ResetPasswordAsync(ResetPasswordRequestDTO request);
    Task<Result> ChangePassword(ChangePasswordRequestDTO requestDto);
}