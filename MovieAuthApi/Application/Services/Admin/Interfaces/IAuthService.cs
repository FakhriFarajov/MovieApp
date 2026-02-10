using MovieAuthApi.Core.DTOs.AdminDtos.Request;
using MovieAuthApi.Core.DTOs.AdminDtos.Response;

namespace MovieAuthApi.Application.Services.Admin.Interfaces;

public interface IAuthService
{
    public Task<TypedResult<object>> LoginAsync(AdminLoginRequestDTO request);
    public Task<TypedResult<object>> LogoutAsync(string token);
    public Task<TypedResult<object>> RefreshTokenAsync(RefreshRequest request);
}