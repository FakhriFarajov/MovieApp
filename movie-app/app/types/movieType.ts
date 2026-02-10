
export interface Movie {
  id: string;
  title: string;
  overview: string;
  backdropPath: string;
  posterPath: string;
  releaseDate: string; // ISO string (e.g. "2026-02-04T00:00:00")
  duration: string; // HH:mm:ss
  ageRestriction: string;
  genreIds: string[];
  video: boolean;
  videoUrl: string | null;
  isInBookmark: boolean;
  isForAdult: boolean;
  originalLanguage: string;
  languages: string[];
  actors: string[];
  director: string;
  homePageUrl: string;
  averageRating: number;
  revenue: number;
  budget: number;
  status: string;   // e.g. "Released", "Post Production"
  tagLine: string;
  translations: Translation[];
}

export type LanguageCode = "en" | "az" | "ru";
export type MovieStatus =
  | "Rumored"
  | "Planned"
  | "In Production"
  | "Post Production"
  | "Released"
  | "Canceled";


export interface Translation {
  language: string;
  title?: string;
  overview?: string;
}


export interface MovieCollection {
  id: number | string;
  name: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
}

export interface Genre {
  id: number | string;
  name: string;
}

export interface ProductionCompany {
  id: number | string;
  logo_path?: string | null;
  name: string;
  origin_country?: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  english_name?: string;
  iso_639_1?: string;
  name?: string;
}