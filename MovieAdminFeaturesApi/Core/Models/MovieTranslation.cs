using System.ComponentModel.DataAnnotations;

namespace MovieAdminFeaturesApi.Core.Models
{
    public class MovieTranslation
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // FK to Movie
        public string MovieId { get; set; } = string.Empty;
        public Movie Movie { get; set; } = null!;

        // Language code, e.g. "en", "fr"
        public string Language { get; set; } = string.Empty;

        // Translated fields
        public string Title { get; set; } = string.Empty;
        public string Overview { get; set; } = string.Empty;
    }
}
