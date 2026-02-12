import { Config } from "./api";

async function parseJsonSafe(response: Response) {
  const text = await response.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const fetchShowTimes = async (params?: { movieId?: string | null; hallId?: string | null }) => {
  const qs: string[] = [];
  if (params?.movieId !== undefined) qs.push(`movieId=${encodeURIComponent(params.movieId ?? 'null')}`);
  if (params?.hallId !== undefined) qs.push(`hallId=${encodeURIComponent(params.hallId ?? 'null')}`);
  const query = qs.length ? `?${qs.join('&')}` : '';
  const endpoint = `${Config.BASE_URL}/api/Admin/ShowTimes${query}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: Config.headers,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(text || 'Failed to fetch showtimes');
  }
  const data = await parseJsonSafe(response);
  return (data || []) as Array<any>;
};

export const fetchShowTimesByTheatre = async (theatreId: string) => {
  const endpoint = `${Config.BASE_URL}/api/Admin/ShowTimes/by-theatre/${theatreId}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: Config.headers,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(text || 'Failed to fetch showtimes by theatre');
  }
  const data = await parseJsonSafe(response);
  return (data || []) as Array<any>;
};

export const getShowTimeById = async (id: string) => {
  const endpoint = `${Config.BASE_URL}/api/Admin/ShowTimes/${id}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: Config.headers,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(text || 'Failed to get showtime');
  }
  return await parseJsonSafe(response);
};

export const createShowTime = async (payload: {
  movieId: string;
  hallId: string;
  startTime: string;
  endTime: string;
  basePrice: number;
}) => {
  const endpoint = `${Config.BASE_URL}/api/Admin/ShowTimes`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { ...Config.headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(text || 'Failed to create showtime');
  }
  return await parseJsonSafe(response);
};

export const updateShowTime = async (id: string, payload: {
  movieId: string;
  hallId: string;
  startTime: string;
  endTime: string;
  basePrice: number;
}) => {
  const endpoint = `${Config.BASE_URL}/api/Admin/ShowTimes/${id}`;
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { ...Config.headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(text || 'Failed to update showtime');
  }
  return await parseJsonSafe(response);
};

export const deleteShowTime = async (id: string) => {
  const endpoint = `${Config.BASE_URL}/api/Admin/ShowTimes/${id}`;
  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: Config.headers,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(text || 'Failed to delete showtime');
  }
  return await parseJsonSafe(response);
};
