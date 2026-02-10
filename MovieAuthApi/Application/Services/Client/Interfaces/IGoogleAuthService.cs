using MovieAuthApi.Core.DTOs.ClientDtos.Response;
using MovieAuthApi.Core.DTOs.ClientDtos.Request;

namespace MovieAuthApi.Application.Services.Client.Interfaces;

public interface IGoogleAuthService
{
    Task<TypedResult<object>> LoginAsync(GoogleAuthDto dto);
}

