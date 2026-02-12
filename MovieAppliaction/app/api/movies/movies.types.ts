export interface MovieItem {
  id: string;
  title?: string;
  overview?: string;
  backdropPath?: string;
  posterPath?: string;
  releaseDate?: string;
  duration?: string;
  ageRestriction?: string;
  genreIds?: string[];
  video?: boolean;
  videoUrl?: string;
  isInBookmark?: boolean;
  isForAdult?: boolean;
  originalLanguage?: string;
  languages?: string[];
  actors?: string[];
  director?: string;
  homePageUrl?: string;
  averageRating?: number;
  revenue?: number;
  budget?: number;
  status?: string;
  tagLine?: string;
  translations?: any[];
  // allow extra props
  [key: string]: any;
}

export interface MoviesListResponse {
  items: MovieItem[];
  total: number;
  page: number;
  pageSize: number;
}
