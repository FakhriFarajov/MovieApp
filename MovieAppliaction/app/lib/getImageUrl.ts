export function getImageUrl(pathOrUrl?: string | null, size: string = 'w342') {
  if (!pathOrUrl) return undefined;
  const s = String(pathOrUrl);
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `https://image.tmdb.org/t/p/${size}${s}`;
  return s;
}
