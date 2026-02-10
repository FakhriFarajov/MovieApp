using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieAuthApi.Core.Models;

namespace MovieAuthApi.Infrastructure.Configurations
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
