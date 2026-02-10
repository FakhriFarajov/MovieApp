using System.ComponentModel.DataAnnotations;

namespace MovieAdminFeaturesApi.Core.Models
{
    public class Genre
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Human-readable name for the genre
        public string Name { get; set; } = string.Empty;

        // Relation: many watchlist items may reference this genre via Movie -> GenreIds mapping
        public List<WatchlistItem> Watchlist { get; set; } = new();

        // Optional: relation to movies if you choose to map it explicitly
        public List<Movie> Movies { get; set; } = new();

        // Translations for this genre
        public List<GenreTranslation> Translations { get; set; } = new();
    }
}
