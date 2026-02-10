using AutoMapper;
using MovieAdminFeaturesApi.Core.DTOs.AdminDtos.Request;
using MovieAdminFeaturesApi.Core.Models;

namespace MovieAdminFeaturesApi.Infrastructure.MappingConfigurations
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
            CreateMap<AdminRegisterRequestDTO, Admin>()
                .IncludeBase<AdminRegisterRequestDTO, User>()
                .ForMember(dest => dest.Id, opt => opt.Ignore());
        }
    }
}
