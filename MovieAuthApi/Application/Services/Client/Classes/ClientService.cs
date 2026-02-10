using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MovieAuthApi.Application.Services.Client.Interfaces;
using MovieAuthApi.Infrastructure.Context;

namespace MovieAuthApi.Application.Services.Client.Classes;

public class ClientService : IClientService
{
    private readonly MovieApiDbContext _context;
    private readonly IMapper _mapper;

    public ClientService(MovieApiDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<string> GetIdByEmailAsync(string email)
    {
        var res =  await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (res == null)
        {
            throw new Exception("Client not found");
        }
        return res.Id;
    }

}