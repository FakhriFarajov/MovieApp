import * as SecureStore from 'expo-secure-store';
import { BASE_URL, getAuthHeaders, getHeaders } from './config';
import { decodeUserFromToken } from '@/shared/utils/decodeToken';
import { tokenStorage } from '@/shared';

// helper to resolve client id from token (mobile SecureStore or web tokenStorage)
const getClientIdFromToken = async (): Promise<string | null> => {
  try {
    const token = (await SecureStore.getItemAsync('access_token')) ?? tokenStorage.get();
    if (!token) return null;
    const decoded = decodeUserFromToken(token);
    if (!decoded) return null;
    return decoded.client_profile_id ?? decoded.userId ?? null;
  } catch (e) {
    return null;
  }
};

export const fetchMovies = async (params?: { lang?: string | null; page?: number; pageSize?: number; genreId?: string | null }) => {
  const qs: string[] = [];
  if (params?.lang !== undefined) qs.push(`lang=${encodeURIComponent(String(params.lang ?? null))}`);
  if (params?.page !== undefined) qs.push(`page=${encodeURIComponent(String(params.page))}`);
  if (params?.pageSize !== undefined) qs.push(`pageSize=${encodeURIComponent(String(params.pageSize))}`);
  if (params?.genreId !== undefined) qs.push(`genreId=${encodeURIComponent(String(params.genreId ?? null))}`);
  // include clientId (backend expects clientId in query; send 'null' when not available)
  const clientId = await getClientIdFromToken();
  qs.push(`clientId=${encodeURIComponent(String(clientId ?? 'null'))}`);

  const query = qs.length ? `?${qs.join('&')}` : '';
  const endpoint = `${BASE_URL}/api/Movies${query}`;
  const headers = await getAuthHeaders();
  const res = await fetch(endpoint, { method: 'GET', headers });
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || 'Failed to fetch movies');
  }
  const txt = await res.text().catch(() => null);
  if (!txt) return null;
  try { return JSON.parse(txt); } catch { return txt as any; }
};

export const fetchMovieById = async (id: string, lang?: string | null) => {
  const qs: string[] = [];
  if (lang !== undefined) qs.push(`lang=${encodeURIComponent(String(lang ?? null))}`);
  const clientId = await getClientIdFromToken();
  qs.push(`clientId=${encodeURIComponent(String(clientId ?? 'null'))}`);
  const query = qs.length ? `?${qs.join('&')}` : '';
  const endpoint = `${BASE_URL}/api/Movies/${encodeURIComponent(id)}${query}`;
  const headers = await getAuthHeaders();
  const res = await fetch(endpoint, { method: 'GET', headers });
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to fetch movie ${id}`);
  }
  const txt = await res.text().catch(() => null);
  if (!txt) return null;
  try { return JSON.parse(txt); } catch { return txt as any; }
};

export const searchMovies = async (params?: { lang?: string | null; page?: number; pageSize?: number; query?: string | null; genreId?: string | null }) => {
  const qs: string[] = [];
  if (params?.lang !== undefined) qs.push(`lang=${encodeURIComponent(String(params.lang ?? ''))}`);
  if (params?.page !== undefined) qs.push(`page=${encodeURIComponent(String(params.page))}`);
  if (params?.pageSize !== undefined) qs.push(`pageSize=${encodeURIComponent(String(params.pageSize))}`);
  if (params?.query !== undefined) qs.push(`query=${encodeURIComponent(String(params.query ?? null))}`);
  if (params?.genreId !== undefined) qs.push(`genreId=${encodeURIComponent(String(params.genreId ?? null))}`);
  const clientId = await getClientIdFromToken();
  qs.push(`clientId=${encodeURIComponent(String(clientId ?? 'null'))}`);
  const query = qs.length ? `?${qs.join('&')}` : '';
  const endpoint = `${BASE_URL}/api/Movies/search${query}`;
  const headers = await getAuthHeaders();
  const res = await fetch(endpoint, { method: 'GET', headers });
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || 'Failed to search movies');
  }
  const txt = await res.text().catch(() => null);
  if (!txt) return null;
  try { return JSON.parse(txt); } catch { return txt as any; }
};

export const fetchMovieVideos = async (id: string | number) => {
  const endpoint = `${BASE_URL}/api/Movies/${encodeURIComponent(String(id))}/videos`;
  const headers = await getAuthHeaders();
  const res = await fetch(endpoint, { method: 'GET', headers });
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to fetch videos for movie ${id}`);
  }
  const txt = await res.text().catch(() => null);
  if (!txt) return null;
  try { return JSON.parse(txt); } catch { return txt as any; }
};


