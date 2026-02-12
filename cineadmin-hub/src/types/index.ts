export interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'banned';
  createdAt: string;
  ban?: Ban;
}

export interface Ban {
  id: string;
  clientProfileId: string;
  adminProfileId?: string;
  reason: string;
  expiresAt?: string;
  createdAt: string;
}

export interface Genre {
  id: string;
  name: string;
}

export interface Theatre {
  id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
}

export interface Hall {
  id: string;
  theatreId: string;
  theatreName?: string;
  name: string;
  type: 'standard' | 'vip' | 'imax' | 'dolby';
  rows: number;
  columns: number;
}

export type MovieStatus =
  | 'Rumored'
  | 'Planned'
  | 'In Production'
  | 'Post Production'
  | 'Released'
  | 'Canceled';

export interface Movie {
  id: string;
  isForAdult: boolean;
  backdropPath: string;
  genreIds: string[];
  originalLanguage: string;
  languages: string[];
  originalTitle: string;
  overview: string;
  posterPath: string;
  duration: string;
  ageRestriction: string;
  releaseDate?: string;
  video: boolean;
  videoUrl: string;
  actors: string[];
  director: string;
  // new optional fields returned by the API
  homePageUrl?: string;
  averageRating?: number;
  revenue?: number;
  budget?: number;
  status?: MovieStatus;
  tagLine?: string;
}

export interface ShowTime {
  id: string;
  movieId: string;
  hallId: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  movieTitle?: string;
  hallName?: string;
  theatreName?: string;
}
