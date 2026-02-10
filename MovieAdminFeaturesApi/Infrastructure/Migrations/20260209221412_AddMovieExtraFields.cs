﻿using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MovieAdminFeaturesApi.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMovieExtraFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Only add the new columns to the existing Movies table to avoid recreating the whole schema
            migrationBuilder.AddColumn<string>(
                name: "HomePageUrl",
                table: "Movies",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: string.Empty);

            migrationBuilder.AddColumn<decimal>(
                name: "AverageRating",
                table: "Movies",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<long>(
                name: "Revenue",
                table: "Movies",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "Budget",
                table: "Movies",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Movies",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: string.Empty);

            migrationBuilder.AddColumn<string>(
                name: "TagLine",
                table: "Movies",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: string.Empty);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "TagLine", table: "Movies");
            migrationBuilder.DropColumn(name: "Status", table: "Movies");
            migrationBuilder.DropColumn(name: "Budget", table: "Movies");
            migrationBuilder.DropColumn(name: "Revenue", table: "Movies");
            migrationBuilder.DropColumn(name: "AverageRating", table: "Movies");
            migrationBuilder.DropColumn(name: "HomePageUrl", table: "Movies");
        }
    }
}
