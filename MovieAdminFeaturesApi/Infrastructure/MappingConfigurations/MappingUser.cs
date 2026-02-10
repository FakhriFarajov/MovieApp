using AutoMapper;
using MovieAdminFeaturesApi.Core.DTOs.UserDtos.Request;
using MovieAdminFeaturesApi.Core.Models;

namespace MovieAdminFeaturesApi.Infrastructure.MappingConfigurations
{
    public class MappingProfileUser : Profile
    {
        public MappingProfileUser()
        {
            // -------------------------
            // Registration Mappings for User -> User (base) and User -> Client
            // -------------------------

            // Map to the base User class
            CreateMap<UserRegisterRequestDTO, User>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Surname, opt => opt.MapFrom(src => src.Surname))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(dest => dest.PasswordHash, opt => opt.MapFrom(src => src.Password))
                .ForMember(dest => dest.RefreshToken, opt => opt.Ignore())
                .ForMember(dest => dest.RefreshTokenExpiryTime, opt => opt.Ignore())
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => Core.Enums.Role.Client));
        }
    }
}
