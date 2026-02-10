using System.ComponentModel.DataAnnotations;

namespace MovieClientFeaturesApi.Core.Models
{
    public class BlacklistedToken
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string Token { get; set; } = string.Empty;

        public DateTime ExpiryTime { get; set; }
    }
}
