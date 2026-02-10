import { BASE_URL, getHeaders } from './config';

export const fetchGenres = async (lang?: string | null) => {
  const q = `?lang=${encodeURIComponent(String(lang ?? 'null'))}`;
  const endpoint = `${BASE_URL}/api/Genres${q}`;
  const res = await fetch(endpoint, { method: 'GET', headers: getHeaders() });
  console.log('Fetching genres from:', endpoint);
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || 'Failed to fetch genres');
  }
  const txt = await res.text().catch(() => null);
  if (!txt) return [] as any[];
  try { return JSON.parse(txt); } catch { return txt as any; }
};
