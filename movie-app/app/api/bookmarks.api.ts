import * as SecureStore from 'expo-secure-store';
import { BASE_URL, getHeaders as staticGetHeaders } from './config';
import { decodeUserFromToken } from '@/shared/utils/decodeToken';

const getAuthHeaders = async () => {
  try {
    const token = await SecureStore.getItemAsync('access_token');
    const base = (typeof staticGetHeaders === 'function') ? staticGetHeaders() : { Accept: 'application/json' };
    if (token) {
      return {
        ...base,
        Authorization: `Bearer ${token}`,
      } as Record<string, string>;
    }
    return base as Record<string, string>;
  } catch (e) {
    return (typeof staticGetHeaders === 'function') ? staticGetHeaders() : { Accept: 'application/json' };
  }
};

const parseResponse = async (res: Response) => {
  const txt = await res.text().catch(() => '');
  if (!txt) return null;
  try { return JSON.parse(txt); } catch { return txt; }
};

const getClientIdFromToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync('access_token');
    if (!token) return null;
    const decoded = decodeUserFromToken(token);
    if (!decoded) return null;
    return decoded.client_profile_id ?? decoded.userId ?? null;
  } catch (e) {
    return null;
  }
};

// Fetch bookmarks. If clientId provided, hit /api/Bookmarks/{clientId}, otherwise /api/Bookmarks
export const fetchBookmarks = async (clientId?: string) => {
  let resolvedClientId: string | undefined = clientId ?? undefined;
  if (typeof resolvedClientId === 'undefined') {
    const fromToken = await getClientIdFromToken();
    resolvedClientId = fromToken ?? undefined;
  }
  const endpoint = resolvedClientId ? `${BASE_URL}/api/Bookmarks/${encodeURIComponent(resolvedClientId)}` : `${BASE_URL}/api/Bookmarks`;
  const headers = await getAuthHeaders();
  const res = await fetch(endpoint, { method: 'GET', headers });
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to fetch bookmarks (${res.status})`);
  }
  const parsed = await parseResponse(res);
  return Array.isArray(parsed) ? parsed : (parsed == null ? [] : parsed);
};

// Add bookmark. New API expects { clientId, movieId } in body. clientId may be provided by caller.
export const addBookmark = async (movieId: string, clientId?: string) => {
  const endpoint = `${BASE_URL}/api/Bookmarks`;
  const headers = await getAuthHeaders();
  const fromToken = await getClientIdFromToken();
  const resolvedClientId = clientId ?? fromToken ?? '';
  const body = JSON.stringify({ clientId: resolvedClientId, movieId });
  const res = await fetch(endpoint, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body });
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to add bookmark (${res.status})`);
  }
  const parsed = await parseResponse(res);
  return parsed;
};

// Delete single bookmark by clientId and bookmark id
export const deleteBookmark = async (clientId: string | undefined, id: string) => {
  const fromToken = await getClientIdFromToken();
  const resolvedClientId = clientId ?? fromToken ?? undefined;
  if (!resolvedClientId) throw new Error('clientId is required to delete a bookmark');
  const endpoint = `${BASE_URL}/api/Bookmarks/${encodeURIComponent(resolvedClientId)}/${encodeURIComponent(id)}`;
  const headers = await getAuthHeaders();
  const res = await fetch(endpoint, { method: 'DELETE', headers });
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to delete bookmark ${id} for client ${clientId} (${res.status})`);
  }
  return true;
};

// Delete all bookmarks for a client
export const deleteBookmarksForClient = async (clientId?: string) => {
  const fromToken = await getClientIdFromToken();
  const resolvedClientId = clientId ?? fromToken ?? undefined;
  if (!resolvedClientId) throw new Error('clientId is required to delete bookmarks for client');
  const endpoint = `${BASE_URL}/api/Bookmarks/${encodeURIComponent(resolvedClientId)}`;
  const headers = await getAuthHeaders();
  const res = await fetch(endpoint, { method: 'DELETE', headers });
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to delete bookmarks for client ${clientId} (${res.status})`);
  }
  return true;
};
