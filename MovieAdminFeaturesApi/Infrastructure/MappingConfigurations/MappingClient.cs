using AutoMapper;
using MovieAdminFeaturesApi.Core.DTOs.ClientDtos.Request;
using MovieAdminFeaturesApi.Core.DTOs.UserDtos.Request;
using MovieAdminFeaturesApi.Core.DTOs.UserDtos.Response;
using MovieAdminFeaturesApi.Core.Models;

namespace MovieAdminFeaturesApi.Infrastructure.MappingConfigurations
{
    public class MappingProfileClient : Profile
    {
        public MappingProfileClient()
        {
            // -------------------------
            // Registration Mappings for User -> User (base) and User -> Client
            // -------------------------

            // Base mapping: DTO -> User
            CreateMap<UserRegisterRequestDTO, User>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Surname, opt => opt.MapFrom(src => src.Surname))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(dest => dest.PasswordHash, opt => opt.MapFrom(src => src.Password))
                .ForMember(dest => dest.RefreshToken, opt => opt.Ignore())
                .ForMember(dest => dest.RefreshTokenExpiryTime, opt => opt.Ignore());

            // Map ClientRegisterRequestDTO -> User (base)
            CreateMap<ClientRegisterRequestDTO, User>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Surname, opt => opt.MapFrom(src => src.Surname))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(dest => dest.PasswordHash, opt => opt.MapFrom(src => src.Password))
                .ForMember(dest => dest.RefreshToken, opt => opt.Ignore())
                .ForMember(dest => dest.RefreshTokenExpiryTime, opt => opt.Ignore());

            // Map to the concrete Client class (inherits from User) from User DTO
            CreateMap<UserRegisterRequestDTO, Client>()
                .IncludeBase<UserRegisterRequestDTO, User>()
                .ForMember(dest => dest.Id, opt => opt.Ignore());

            // Map ClientRegisterRequestDTO -> Client (includes DateOfBirth)
            CreateMap<ClientRegisterRequestDTO, Client>()
                .IncludeBase<ClientRegisterRequestDTO, User>()
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
