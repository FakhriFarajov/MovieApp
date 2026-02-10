using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieClientFeaturesApi.Core.Models;namespace MovieClientFeaturesApi.Infrastructure.Configurations
{
    public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
    {
        public void Configure(EntityTypeBuilder<Ticket> builder)
        {
            builder.HasKey(t => t.Id);

            builder.HasOne(t => t.Booking)
                   .WithMany(b => b.Tickets)
                   .HasForeignKey(t => t.BookingId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(t => t.Seat)
                   .WithMany(s => s.Tickets)
                   .HasForeignKey(t => t.SeatId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.Property(t => t.Price).HasColumnType("decimal(18,2)");
        }
    }
}
