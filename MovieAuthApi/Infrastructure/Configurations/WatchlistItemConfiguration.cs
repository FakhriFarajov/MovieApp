using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieAuthApi.Core.Models;

namespace MovieAuthApi.Infrastructure.Configurations
{
    public class WatchlistItemConfiguration : IEntityTypeConfiguration<WatchlistItem>
    {
        public void Configure(EntityTypeBuilder<WatchlistItem> builder)
        {
            builder.HasKey(w => w.Id);

            builder.HasOne(w => w.Client)
                   .WithMany(u => u.Watchlist)
                   .HasForeignKey(w => w.ClientId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
