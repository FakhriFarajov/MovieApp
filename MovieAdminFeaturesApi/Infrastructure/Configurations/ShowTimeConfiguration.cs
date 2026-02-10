using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieAdminFeaturesApi.Core.Models;
namespace MovieAdminFeaturesApi.Infrastructure.Configurations
{
    public class ShowTimeConfiguration : IEntityTypeConfiguration<ShowTime>
    {
        public void Configure(EntityTypeBuilder<ShowTime> builder)
        {
            builder.HasKey(s => s.Id);

            builder.HasOne(s => s.Movie)
                   .WithMany()
                   .HasForeignKey(s => s.MovieId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(s => s.Hall)
                   .WithMany(h => h.ShowTimes)
                   .HasForeignKey(s => s.HallId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.Property(s => s.BasePrice).HasColumnType("decimal(18,2)");
        }
    }
}
