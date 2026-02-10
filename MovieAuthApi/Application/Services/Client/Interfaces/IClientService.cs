namespace MovieAuthApi.Application.Services.Client.Interfaces;
public interface IClientService
{
    public Task<string> GetIdByEmailAsync(string email);
}