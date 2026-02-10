using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MovieAdminFeaturesApi.Infrastructure.Context;
using MovieAdminFeaturesApi.Infrastructure.MappingConfigurations;
using MovieAdminFeaturesApi.Infrastructure.Middlewares;

namespace MovieAdminFeaturesApi.Presentation.Extensions;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddOpenApi();
        services.AddControllers();

        // Customize automatic validation error response to a friendly, consistent shape
        services.AddCustomValidationResponse();

        // Read DB connection string from environment only
        var connectionString = Environment.GetEnvironmentVariable("CONNECTIONSTRINGS__MAC");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Environment variable 'CONNECTIONSTRINGS__MAC' must be set with the DB connection string.");
        }

        services.AddDbContext<MovieApiDbContext>(options =>
            options.UseSqlServer(connectionString));

        // Local service registrations (admin features)
        
        // Admin features: register genre and movie services
        services.AddScoped<MovieAdminFeaturesApi.Application.Services.Admin.Interfaces.IGenreService, MovieAdminFeaturesApi.Application.Services.Admin.Classes.GenreService>();
        services.AddScoped<MovieAdminFeaturesApi.Application.Services.Admin.Interfaces.IMovieService, MovieAdminFeaturesApi.Application.Services.Admin.Classes.MovieService>();
        // Image service
        services.AddScoped<MovieAdminFeaturesApi.Application.Services.Interfaces.IImageService, MovieAdminFeaturesApi.Application.Services.Classes.MinioImageService>();
        // Theatres & Halls
        services.AddScoped<MovieAdminFeaturesApi.Application.Services.Admin.Interfaces.ITheatreService, MovieAdminFeaturesApi.Application.Services.Admin.Classes.TheatreService>();
        services.AddScoped<MovieAdminFeaturesApi.Application.Services.Admin.Interfaces.IHallService, MovieAdminFeaturesApi.Application.Services.Admin.Classes.HallService>();
        // ShowTimes
        services.AddScoped<MovieAdminFeaturesApi.Application.Services.Admin.Interfaces.IShowTimeService, MovieAdminFeaturesApi.Application.Services.Admin.Classes.ShowTimeService>();

        // LibreTranslate service (HttpClient)
        services.AddHttpClient<MovieAdminFeaturesApi.Application.Services.Interfaces.ILibreTranslateService, MovieAdminFeaturesApi.Application.Services.Classes.LibreTranslateService>(client =>
        {
            var baseUrl = Environment.GetEnvironmentVariable("LIBRETRANSLATE_BASEURL") ?? "https://libretranslate.com";
            client.BaseAddress = new Uri(baseUrl);
        });

        services.AddScoped<BannedUserMiddleware>();
        
        // NOTE: If you have a local GoogleAuthService, register it here. Otherwise remove or add later
        // services.AddScoped<MovieAuthApi.Application.Services.Client.Interfaces.IGoogleAuthService, MovieAuthApi.Application.Services.Client.Classes.GoogleAuthService>();

        services
            .AddFluentValidationAutoValidation()
            .AddFluentValidationClientsideAdapters();
        // Register validators from Infrastructure assembly
        // Register validators from Application assembly (ResetPassword validator)
        services.AddValidatorsFromAssemblyContaining<MovieAdminFeaturesApi.Application.Validators.GenreCreateRequestValidator>();
        services.AddValidatorsFromAssemblyContaining<MovieAdminFeaturesApi.Application.Validators.MovieCreateRequestValidator>();
        services.AddValidatorsFromAssemblyContaining<MovieAdminFeaturesApi.Application.Validators.TheatreCreateRequestValidator>();
        services.AddValidatorsFromAssemblyContaining<MovieAdminFeaturesApi.Application.Validators.HallCreateRequestValidator>();
        services.AddValidatorsFromAssemblyContaining<MovieAdminFeaturesApi.Application.Validators.BanCreateRequestValidator>();

        services.AddAutoMapper(ops => ops.AddProfile(typeof(MappingProfileClient)));
        services.AddAutoMapper(ops => ops.AddProfile(typeof(MappingProfileAdmin)));
        
        services.AddAutoMapper(Assembly.GetExecutingAssembly());


        // Read JWT values only from environment (required)
        var jwtSecret = Environment.GetEnvironmentVariable("JWT__SECRETKEY");
        var jwtIssuer = Environment.GetEnvironmentVariable("JWT__ISSUER");
        var jwtAudience = Environment.GetEnvironmentVariable("JWT__AUDIENCE");

        if (string.IsNullOrWhiteSpace(jwtSecret) || string.IsNullOrWhiteSpace(jwtIssuer) || string.IsNullOrWhiteSpace(jwtAudience))
        {
            throw new InvalidOperationException("Environment variables JWT__SECRETKEY, JWT__ISSUER and JWT__AUDIENCE must be set.");
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = signingKey,
                RoleClaimType = "role",
                ClockSkew = TimeSpan.Zero // enforce strict expiry (no default grace)
            };

            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = async context =>
                {
                    var token = context.SecurityToken as JwtSecurityToken;
                    if (token == null) return;

                    var dbContext = context.HttpContext.RequestServices.GetRequiredService<MovieApiDbContext>();
                    var blacklisted = await dbContext.BlacklistedTokens
                        .AnyAsync(t => t.Token == token.RawData);

                    if (blacklisted)
                    {
                        context.Fail("This token has been revoked");
                    }
                }

            };
        });

                
services.AddAuthorization(options =>
{
    options.AddPolicy("ClientPolicy", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(ctx =>
        {
            // Direct IsInRole check (covers ClaimTypes.Role mapped by framework)
            if (ctx.User.IsInRole("Client")) return true;

            var claims = ctx.User.Claims;
            // Accept multiple common role claim types
            var roleClaims = claims
                .Where(c => c.Type == "role" || c.Type == "roles" || c.Type == System.Security.Claims.ClaimTypes.Role)
                .SelectMany(c => c.Value.Split(',', ' ', ';'))
                .Where(v => !string.IsNullOrWhiteSpace(v))
                .Select(v => v.Trim());

            return roleClaims.Any(v => string.Equals(v, "Client", StringComparison.OrdinalIgnoreCase));
        });
    });

    options.AddPolicy("AdminPolicy", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(ctx =>
        {
            if (ctx.User.IsInRole("Admin")) return true;

            var claims = ctx.User.Claims;
            var roleClaims = claims
                .Where(c => c.Type == "role" || c.Type == "roles" || c.Type == System.Security.Claims.ClaimTypes.Role)
                .SelectMany(c => c.Value.Split(',', ' ', ';'))
                .Where(v => !string.IsNullOrWhiteSpace(v))
                .Select(v => v.Trim());

            return roleClaims.Any(v => string.Equals(v, "Admin", StringComparison.OrdinalIgnoreCase));
        });
    });
});




            services.AddCors(options =>
            {
                options.AddPolicy("DefaultCors", builder =>
                {
                    builder.WithOrigins("http://localhost:5174" , "http://localhost:5175", "http://localhost:8080","http://localhost:8081")
                           .AllowAnyMethod()
                           .AllowAnyHeader()
                           .AllowCredentials();
                });
            });

            return services;
        }
}