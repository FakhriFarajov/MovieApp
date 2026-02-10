using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieAuthApi.Core.Models;

namespace MovieAuthApi.Infrastructure.Configurations
{
    public class SeatConfiguration : IEntityTypeConfiguration<Seat>
    {
        public void Configure(EntityTypeBuilder<Seat> builder)
        {
            builder.HasKey(s => s.Id);

            builder.Property(s => s.Label).HasMaxLength(20);

            builder.HasIndex(s => new { s.HallId, s.RowNumber, s.ColumnNumber }).IsUnique();
        }
    }
}
