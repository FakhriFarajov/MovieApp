namespace MovieClientFeaturesApi.Core.Models
{
    public class GoogleAuthedUser
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = null!; // FK to Users
        public string GoogleId { get; set; } = null!; // Google sub
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }
    }
}

