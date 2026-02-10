using MovieAuthApi.Core.DTOs.AdminDtos.Request;
using MovieAuthApi.Core.DTOs.AdminDtos.Response;

namespace MovieAuthApi.Application.Services.Admin.Interfaces;

public interface IAccountService
{
    public Task<Result> RegisterAdminAsync(AdminRegisterRequestDTO request);
}