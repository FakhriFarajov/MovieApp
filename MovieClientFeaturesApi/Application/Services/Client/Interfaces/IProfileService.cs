using System.Collections.Generic;
using System.Threading.Tasks;
using MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response;
using MovieClientFeaturesApi.Core.DTOs.ClientDtos.Request;
using MovieClientFeaturesApi.Core.DTOs.WatchlistDtos.Response;

namespace MovieClientFeaturesApi.Application.Services.Client.Interfaces;

public interface IProfileService
{
    Task<MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response.TypedResult<ClientProfileResponseDTO>> GetProfile(string clientId);
    Task<MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response.TypedResult<ClientProfileResponseDTO>> UpdateProfile(string clientId, ClientProfileUpdateRequestDTO dto);
    Task<MovieClientFeaturesApi.Core.DTOs.ClientDtos.Response.TypedResult<IEnumerable<BookmarkResponseDTO>>> GetForClientAsync(string clientId);
}
