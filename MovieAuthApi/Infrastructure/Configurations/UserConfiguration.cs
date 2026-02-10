using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieAuthApi.Core.Models;

namespace MovieAuthApi.Infrastructure.Configurations
{
    public class ClientConfiguration : IEntityTypeConfiguration<Client>
    {
        public void Configure(EntityTypeBuilder<Client> builder)
        {
            builder.HasKey(c => c.Id);

            builder.HasMany(c => c.Watchlist)
                   .WithOne(w => w.Client)
                   .HasForeignKey(w => w.ClientId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(c => c.Bookings)
                   .WithOne(b => b.Client)
                   .HasForeignKey(b => b.ClientId)
                   .OnDelete(DeleteBehavior.Cascade);

            // One-to-one: Client.UserId -> User.Id
            builder.HasOne(c => c.User)
                   .WithOne(u => u.ClientProfile)
                   .HasForeignKey<Client>(c => c.UserId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
