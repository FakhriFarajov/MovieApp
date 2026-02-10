using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MovieClientFeaturesApi.Core.Models
{
    public class Movie
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public bool IsForAdult { get; set; } = false;

        public string BackdropPath { get; set; } = string.Empty;

        public IList<string> GenreIds { get; set; } = new List<string>();

        public string OriginalLanguage { get; set; } = string.Empty;
        
        public IList<string> Languages { get; set; } = new List<string>();

        public string OriginalTitle { get; set; } = string.Empty;

        public string Overview { get; set; } = string.Empty;

        public string PosterPath { get; set; } = string.Empty;
        
        // Keep the DB column as DateTime (existing schema). Map it to DurationDb.
        [Column("Duration")]
        public DateTime DurationDb { get; set; } = new DateTime(1900, 1, 1);

        // Expose a TimeSpan Duration for domain/DTO usage and conversions.
        [NotMapped]
        public TimeSpan Duration
        {
            get => DurationDb.TimeOfDay;
            set => DurationDb = new DateTime(1900, 1, 1).Add(value);
        }
        
        public string AgeRestriction { get; set; } = string.Empty;

        public DateTime? ReleaseDate { get; set; }

        public bool Video { get; set; } = false;
        
        public string VideoUrl { get; set; } = string.Empty;

        public IList<string> Actors { get; set; } = new List<string>();

        public string Director { get; set; } = string.Empty;

        // New fields
        public string HomePageUrl { get; set; } = string.Empty;
        public decimal AverageRating { get; set; } = 0m;
        public long Revenue { get; set; } = 0;
        public long Budget { get; set; } = 0;
        public string Status { get; set; } = string.Empty;
        public string TagLine { get; set; } = string.Empty;
        
        // New: translations for movie fields (title, overview, etc.)
        public List<MovieTranslation> Translations { get; set; } = new();

        public List<WatchlistItem> Watchlist { get; set; } = new();
    }
}
