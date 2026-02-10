using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieAdminFeaturesApi.Core.Models;
namespace MovieAdminFeaturesApi.Infrastructure.Configurations
{
    public class BookingConfiguration : IEntityTypeConfiguration<Booking>
    {
        public void Configure(EntityTypeBuilder<Booking> builder)
        {
            builder.HasKey(b => b.Id);

            builder.HasOne(b => b.Client)
                   .WithMany(u => u.Bookings)
                   .HasForeignKey(b => b.ClientId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(b => b.ShowTime)
                   .WithMany(s => s.Bookings)
                   .HasForeignKey(b => b.ShowTimeId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.Property(b => b.TotalPrice).HasColumnType("decimal(18,2)");
        }
    }
}
