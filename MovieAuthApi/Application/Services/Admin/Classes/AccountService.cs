using AutoMapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using MovieAuthApi.Application.Services.Admin.Interfaces;
using MovieAuthApi.Core.DTOs.AdminDtos.Request;
using MovieAuthApi.Core.DTOs.AdminDtos.Response;
using MovieAuthApi.Core.Enums;
using MovieAuthApi.Core.Models;
using MovieAuthApi.Infrastructure.Context;
using static BCrypt.Net.BCrypt;

namespace MovieAuthApi.Application.Services.Admin.Classes;


public class AccountService : IAccountService
{
    private readonly MovieApiDbContext _context;
    private readonly IMapper _mapper;
    private readonly IWebHostEnvironment _env;

    public AccountService(MovieApiDbContext context, IMapper mapper, IWebHostEnvironment env)
    {
        _context = context;
        _mapper = mapper;
        _env = env;
    }
    
    public async Task<Result> RegisterAdminAsync(AdminRegisterRequestDTO request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (existingUser != null)
        {
            return Result.Error("Email is already registered.", 409);
        }

        var userToAdd = _mapper.Map<User>(request);
        userToAdd.Email = normalizedEmail;
        userToAdd.PasswordHash = HashPassword(request.Password);
        userToAdd.Role = Role.Admin; // Set role directly

        var adminProfile = _mapper.Map<Core.Models.Admin>(request);
        adminProfile.UserId = userToAdd.Id;

        userToAdd.AdminProfileId = adminProfile.Id;

        _context.Users.Add(userToAdd);
        _context.Admins.Add(adminProfile);

        await _context.SaveChangesAsync();

        return Result.Success("Admin registered successfully");
    }
}
