using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieAdminFeaturesApi.Core.Models;
namespace MovieAdminFeaturesApi.Infrastructure.Configurations
{
    public class GenreTranslationConfiguration : IEntityTypeConfiguration<GenreTranslation>
    {
        public void Configure(EntityTypeBuilder<GenreTranslation> builder)
        {
            builder.HasKey(gt => gt.Id);

            builder.HasOne(gt => gt.Genre)
                   .WithMany(g => g.Translations)
                   .HasForeignKey(gt => gt.GenreId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(gt => new { gt.GenreId, gt.Language }).IsUnique();
        }
    }
}
