using Microsoft.EntityFrameworkCore;
using MovieAuthApi.Core.Models;

namespace MovieAuthApi.Infrastructure.Context
{
    public class MovieApiDbContext : DbContext
    {
        public MovieApiDbContext(DbContextOptions<MovieApiDbContext> options) : base(options)
        {
        }

        // Base Users table (base class for Client/Admin)
        public DbSet<User> Users { get; set; } = null!;

        // Convenience DbSets for derived types
        public DbSet<Client> Clients { get; set; } = null!;
        public DbSet<Admin> Admins { get; set; } = null!;
        public DbSet<GoogleAuthedUser> GoogleAuthedUsers { get; set; } = null!;
        public DbSet<BannedUser> BannedUsers { get; set; } = null!;

        public DbSet<WatchlistItem> WatchlistItems { get; set; } = null!;
        public DbSet<BlacklistedToken> BlacklistedTokens { get; set; } = null!;

        // New DbSets for movies, genres, and translations
        public DbSet<Movie> Movies { get; set; } = null!;
        public DbSet<Genre> Genres { get; set; } = null!;
        public DbSet<MovieTranslation> MovieTranslations { get; set; } = null!;
        public DbSet<GenreTranslation> GenreTranslations { get; set; } = null!;
        // Halls and seats
        public DbSet<Theatre> Theatres { get; set; } = null!;
        public DbSet<Hall> Halls { get; set; } = null!;
        public DbSet<Seat> Seats { get; set; } = null!;
        public DbSet<ShowTime> ShowTimes { get; set; } = null!;
        // Bookings
        public DbSet<Booking> Bookings { get; set; } = null!;
        // Tickets
        public DbSet<Ticket> Tickets { get; set; } = null!;
        // Payments
        public DbSet<Payment> Payments { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Apply configurations from the Context.Configuration namespace
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(MovieApiDbContext).Assembly);
        }
    }
}
