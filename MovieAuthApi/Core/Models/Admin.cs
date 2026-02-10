using System.ComponentModel.DataAnnotations;
using MovieAuthApi.Core.Enums;

using System.ComponentModel.DataAnnotations;
using MovieAuthApi.Core.Enums;

namespace MovieAuthApi.Core.Models
{
    public class Admin
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string UserId { get; set; }
        public User User { get; set; }
    }
}
