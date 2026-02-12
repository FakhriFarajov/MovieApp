using System.Collections.Generic;
using System.Threading.Tasks;using MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response;
using MovieClientFeaturesApi.Core.DTOs.ClientDtos.Request;
using MovieClientFeaturesApi.Core.DTOs.WatchlistDtos.Response;

namespace MovieClientFeaturesApi.Application.Services.Client.Interfaces;

public interface IProfileService
{
    Task<TypedResult<ClientProfileResponseDTO>> GetProfile(string clientId);
    Task<TypedResult<ClientProfileResponseDTO>> UpdateProfile(string clientId, ClientProfileUpdateRequestDTO dto);
}
