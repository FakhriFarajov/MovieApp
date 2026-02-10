import { BASE_URL, getHeaders } from './config';

export const fetchTheatres = async () => {
  const endpoint = `${BASE_URL}/api/Theatres`;
  const res = await fetch(endpoint, { method: 'GET', headers: getHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || 'Failed to fetch theatres');
  }
  const txt = await res.text().catch(() => null);
  if (!txt) return [] as any[];
  try { return JSON.parse(txt); } catch { return txt as any; }
};
