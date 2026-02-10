using System.ComponentModel.DataAnnotations;

namespace MovieClientFeaturesApi.Core.Models
{
    public class Admin
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        public string UserId { get; set; }
        public User User { get; set; }
    }
}
