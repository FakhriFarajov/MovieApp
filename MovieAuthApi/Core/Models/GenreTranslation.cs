using System.ComponentModel.DataAnnotations;

namespace MovieAuthApi.Core.Models
{
    public class GenreTranslation
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // FK to Genre
        public string GenreId { get; set; } = string.Empty;
        public Genre Genre { get; set; } = null!;

        // Language code
        public string Language { get; set; } = string.Empty;

        // Translated name
        public string Name { get; set; } = string.Empty;
    }
}
