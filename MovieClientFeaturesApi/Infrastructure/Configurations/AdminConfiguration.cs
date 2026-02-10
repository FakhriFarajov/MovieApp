using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieClientFeaturesApi.Core.Models;

namespace MovieClientFeaturesApi.Infrastructure.Configurations
{
    public class AdminConfiguration : IEntityTypeConfiguration<Admin>
    {
        public void Configure(EntityTypeBuilder<Admin> builder)
        {
            builder.HasKey(a => a.Id);

            // One-to-one: Admin.UserId -> User.Id
            builder.HasOne(a => a.User)
                   .WithOne(u => u.AdminProfile)
                   .HasForeignKey<Admin>(a => a.UserId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
