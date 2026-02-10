using Microsoft.AspNetCore.Mvc;
using MovieAuthApi.Application.Services.Admin.Interfaces;
using MovieAuthApi.Core.DTOs.AdminDtos.Request;

namespace MovieAuthApi.Presentation.Controllers.AdminControllers;

[ApiController]
[Route("api/Admin/[controller]")]
public class AccountController : ControllerBase
{
    private readonly IAccountService _accountService;
    private readonly IAdminService _adminService;

    public AccountController(IAccountService accountService, IAdminService adminService)
    {
        _accountService = accountService;
        _adminService = adminService;
    }

    [HttpPost("Register")]
    public async Task<IActionResult> RegisterAsync([FromBody] AdminRegisterRequestDTO requestDto)
    {
        var res = await _accountService.RegisterAdminAsync(requestDto);
        return Ok(res);
    }
}

