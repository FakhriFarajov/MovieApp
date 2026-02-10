using System.ComponentModel.DataAnnotations;

namespace MovieAuthApi.Core.Models
{
    public class WatchlistItem
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string ClientId { get; set; } = null!;   
        public Client Client { get; set; } = null!;
        
        public string MovieId { get; set; } = null!;
        
        public Movie Movie { get; set; } = null!;
    }
}
