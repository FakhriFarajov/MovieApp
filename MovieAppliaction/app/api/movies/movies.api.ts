import { authHttp } from '../HttpClient';
import { MovieItem, MoviesListResponse } from './movies.types';

export const getPopular = async (params?: { lang?: string | null; page?: number; pageSize?: number; genreId?: string | null }) => {
  const lang = params?.lang ?? null;
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const genreId = params?.genreId ?? null;
  const res = await authHttp.get(`/Movies/getPopular`, { params: { lang, page, pageSize, genreId } });
  if (res.status !== 200) throw new Error(`Failed to fetch popular movies: ${res.statusText}`);
  return res.data as MoviesListResponse;
};

export const searchByNameOrGenre = async (params?: { lang?: string | null; page?: number; pageSize?: number; query?: string | null; genreId?: string | null }) => {
  const lang = params?.lang ?? null;
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const query = params?.query ?? null;
  const genreId = params?.genreId ?? null;
  const res = await authHttp.get(`/Movies/searchByNameOrGenre`, { params: { lang, page, pageSize, query, genreId } });
  if (res.status !== 200) throw new Error(`Failed to search movies: ${res.statusText}`);
  return res.data as MoviesListResponse;
};

export const getDetails = async (id: string, lang?: string | null) => {
  const res = await authHttp.get(`/Movies/getDetails/${encodeURIComponent(id)}`, { params: { lang: lang ?? null } });
  if (res.status !== 200) throw new Error(`Failed to fetch movie details: ${res.statusText}`);
  return res.data as MovieItem;
};