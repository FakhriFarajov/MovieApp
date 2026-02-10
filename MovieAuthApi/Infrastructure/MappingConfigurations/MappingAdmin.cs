using AutoMapper;
using MovieAuthApi.Core.DTOs.AdminDtos.Request;
using MovieAuthApi.Core.DTOs.UserDtos.Request;
using MovieAuthApi.Core.Models;

namespace MovieAuthApi.Infrastructure.MappingConfigurations
{
    public class MappingProfileAdmin : Profile
    {
        public MappingProfileAdmin()
        {
            // -------------------------
            // Registration Mappings for Admin
            // -------------------------

            // Base mapping for admin DTO -> User (reuse similar mapping as for UserRegisterRequestDTO)
            CreateMap<AdminRegisterRequestDTO, User>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Surname, opt => opt.MapFrom(src => src.Surname))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(dest => dest.PasswordHash, opt => opt.MapFrom(src => src.Password))
                .ForMember(dest => dest.RefreshToken, opt => opt.Ignore())
                .ForMember(dest => dest.RefreshTokenExpiryTime, opt => opt.Ignore())
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => Core.Enums.Role.Admin));

            // Map to Admin and reuse base mapping
            // Admin does not inherit from User in our model. Map AdminRegisterRequestDTO -> Admin directly.
            CreateMap<AdminRegisterRequestDTO, Admin>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore());
        }
    }
}
