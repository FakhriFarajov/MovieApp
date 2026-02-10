export interface VideoResponse {
  id: number;
  results: Video[];
}

export interface Video {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  name: string;
  key: string;
  site: "YouTube" | string;
  size: number;
  type:
    | "Trailer"
    | "Teaser"
    | "Clip"
    | "Featurette"
    | string;
  official: boolean;
  published_at: string; // ISO date string
}
