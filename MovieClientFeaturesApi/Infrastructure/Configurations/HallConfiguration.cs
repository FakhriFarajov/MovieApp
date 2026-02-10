using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieClientFeaturesApi.Core.Models;namespace MovieClientFeaturesApi.Infrastructure.Configurations
{
    public class HallConfiguration : IEntityTypeConfiguration<Hall>
    {
        public void Configure(EntityTypeBuilder<Hall> builder)
        {
            builder.HasKey(h => h.Id);

            builder.Property(h => h.Name).IsRequired().HasMaxLength(200);
            builder.Property(h => h.Type).HasMaxLength(100);

            builder.HasOne(h => h.Theatre)
                   .WithMany(t => t.Halls)
                   .HasForeignKey(h => h.TheatreId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(h => h.Seats)
                   .WithOne(s => s.Hall)
                   .HasForeignKey(s => s.HallId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
