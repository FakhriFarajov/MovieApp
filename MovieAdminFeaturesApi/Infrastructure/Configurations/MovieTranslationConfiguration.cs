using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieAdminFeaturesApi.Core.Models;
namespace MovieAdminFeaturesApi.Infrastructure.Configurations
{
    public class MovieTranslationConfiguration : IEntityTypeConfiguration<MovieTranslation>
    {
        public void Configure(EntityTypeBuilder<MovieTranslation> builder)
        {
            builder.HasKey(mt => mt.Id);

            builder.HasOne(mt => mt.Movie)
                   .WithMany(m => m.Translations)
                   .HasForeignKey(mt => mt.MovieId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(mt => new { mt.MovieId, mt.Language }).IsUnique();
        }
    }
}
