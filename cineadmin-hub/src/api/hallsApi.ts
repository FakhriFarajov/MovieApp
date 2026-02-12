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

export const fetchHalls = async () => {
  const endpoint = `${Config.BASE_URL}/api/Admin/Halls`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: Config.headers,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(text || 'Failed to fetch halls');
  }
  const data = await parseJsonSafe(response);
  return (data || []) as Array<any>;
};

export const fetchHallsByTheatre = async (theatreId: string) => {
  const endpoint = `${Config.BASE_URL}/api/Admin/Halls/by-theatre/${theatreId}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: Config.headers,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(text || 'Failed to fetch halls by theatre');
  }
  const data = await parseJsonSafe(response);
  return (data || []) as Array<any>;
};

export const getHallById = async (id: string) => {
  const endpoint = `${Config.BASE_URL}/api/Admin/Halls/${id}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: Config.headers,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(text || 'Failed to get hall');
  }
  return await parseJsonSafe(response);
};

export const createHall = async (payload: {
  theatreId: string;
  name: string;
  type: string;
  rows: number;
  columns: number;
}) => {
  const endpoint = `${Config.BASE_URL}/api/Admin/Halls`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { ...Config.headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(text || 'Failed to create hall');
  }
  return await parseJsonSafe(response);
};

export const updateHall = async (id: string, payload: {
  name: string;
  type: string;
  rows: number;
  columns: number;
}) => {
  const endpoint = `${Config.BASE_URL}/api/Admin/Halls/${id}`;
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { ...Config.headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(text || 'Failed to update hall');
  }
  return await parseJsonSafe(response);
};

export const deleteHall = async (id: string) => {
  const endpoint = `${Config.BASE_URL}/api/Admin/Halls/${id}`;
  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: Config.headers,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(text || 'Failed to delete hall');
  }
  return await parseJsonSafe(response);
};
