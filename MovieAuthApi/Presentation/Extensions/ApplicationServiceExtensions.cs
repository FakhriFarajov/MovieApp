using System;
using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MovieAuthApi.Application.Services.Client.Classes;
using MovieAuthApi.Application.Services.Client.Interfaces;
using MovieAuthApi.Application.Services.Utils;
using MovieAuthApi.Core.Models;
using MovieAuthApi.Infrastructure.Context;
using MovieAuthApi.Infrastructure.MappingConfigurations;
using MovieAuthApi.Infrastructure.Middlewares;

namespace MovieAuthApi.Presentation.Extensions;

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

        services.AddScoped<MovieAuthApi.Application.Services.Client.Interfaces.IAccountService, MovieAuthApi.Application.Services.Client.Classes.AccountService>(); // Client
        services.AddScoped<MovieAuthApi.Application.Services.Admin.Interfaces.IAccountService, MovieAuthApi.Application.Services.Admin.Classes.AccountService>();
        services.AddScoped<MovieAuthApi.Application.Services.Admin.Interfaces.IAdminService, MovieAuthApi.Application.Services.Admin.Classes.AdminService>();
        
        services.AddScoped<MovieAuthApi.Application.Services.Client.Interfaces.IAuthService, MovieAuthApi.Application.Services.Client.Classes.AuthService>(); // Client
        services.AddScoped<MovieAuthApi.Application.Services.Admin.Interfaces.IAuthService, MovieAuthApi.Application.Services.Admin.Classes.AuthService>();

        services.AddScoped<TokenManager>();
        
        services.AddScoped<IClientService, ClientService>();
        services.AddSingleton<EmailSender>();

        services.AddScoped<BannedUserMiddleware>();
        
        services.AddScoped<MovieAuthApi.Application.Services.Client.Interfaces.IGoogleAuthService, MovieAuthApi.Application.Services.Client.Classes.GoogleAuthService>();

        services
            .AddFluentValidationAutoValidation()
            .AddFluentValidationClientsideAdapters();
        // Register validators from Infrastructure assembly
        // Register validators from Application assembly (ResetPassword validator)
        services.AddValidatorsFromAssemblyContaining<MovieAuthApi.Application.Validators.ResetPasswordRequestDTOValidator>();
        services.AddValidatorsFromAssemblyContaining<MovieAuthApi.Application.Validators.ChangePasswordRequestDTOValidator>();

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