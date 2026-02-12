import { GenreMovie } from '../genres.types';

export interface BookmarkItem {
  id: string;
  movieId: string;
  clientId?: string;
  movie?: GenreMovie;
  // allow extra backend props
  [key: string]: any;
}

export type BookmarksResponse = BookmarkItem[];
