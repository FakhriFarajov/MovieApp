using AutoMapper;
using MovieAuthApi.Core.DTOs.UserDtos.Response;
using MovieAuthApi.Core.DTOs.ClientDtos.Request;
using MovieAuthApi.Core.Models;

namespace MovieAuthApi.Infrastructure.MappingConfigurations
{
    public class MappingProfileClient : Profile
    {
        public MappingProfileClient()
        {
            // -------------------------
            // Registration Mappings for User -> User (base) and User -> Client
            // -------------------------

            // Map ClientRegisterRequestDTO -> User (map the user part of client registration)
            CreateMap<ClientRegisterRequestDTO, User>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Surname, opt => opt.MapFrom(src => src.Surname))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(dest => dest.PasswordHash, opt => opt.MapFrom(src => src.Password))
                .ForMember(dest => dest.RefreshToken, opt => opt.Ignore())
                .ForMember(dest => dest.RefreshTokenExpiryTime, opt => opt.Ignore())
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => MovieAuthApi.Core.Enums.Role.Client));

            // Map ClientRegisterRequestDTO -> Client (includes DateOfBirth)
            CreateMap<ClientRegisterRequestDTO, Client>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.DateOfBirth, opt => opt.MapFrom(src => src.DateOfBirth));

            // Response mapping: User -> UserDto (hide sensitive fields)
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Surname, opt => opt.MapFrom(src => src.Surname))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.ProfileImage, opt => opt.MapFrom(src => src.ProfileImage))
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role));
        }
    }
}
