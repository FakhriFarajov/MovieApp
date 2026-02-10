using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieClientFeaturesApi.Core.Models;namespace MovieClientFeaturesApi.Infrastructure.Configurations
{
    public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
    {
        public void Configure(EntityTypeBuilder<Payment> builder)
        {
            builder.HasKey(p => p.Id);

            builder.HasOne(p => p.Booking)
                   .WithMany(b => b.Payments)
                   .HasForeignKey(p => p.BookingId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.Property(p => p.Amount).HasColumnType("decimal(18,2)");
            builder.Property(p => p.TransactionId).HasMaxLength(200);
        }
    }
}
