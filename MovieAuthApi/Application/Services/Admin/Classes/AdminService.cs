using Microsoft.EntityFrameworkCore;
using MovieAuthApi.Application.Services.Admin.Interfaces;
using MovieAuthApi.Infrastructure.Context;

namespace MovieAuthApi.Application.Services.Admin.Classes;

public class AdminService : IAdminService
{
    private readonly MovieApiDbContext _context;

    public AdminService(MovieApiDbContext context)
    {
        _context = context;
    }

    public async Task<string> GetIdByEmailAsync(string email)
    {
        var res =  await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (res == null)
        {
            throw new Exception("Admin not found");
        }
        return res.Id;
    }

}