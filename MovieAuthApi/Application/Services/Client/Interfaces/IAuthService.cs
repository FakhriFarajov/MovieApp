using MovieAuthApi.Core.DTOs.ClientDtos.Response;
using MovieAuthApi.Core.DTOs.ClientDtos.Request;

namespace MovieAuthApi.Application.Services.Client.Interfaces;

public interface IAuthService
{
    public Task<TypedResult<object>> LoginAsync(ClientLoginRequestDTO request);
    public Task<TypedResult<object>> LogoutAsync(string token);
    
    public Task<TypedResult<object>> RefreshTokenAsync(RefreshRequest request);
}