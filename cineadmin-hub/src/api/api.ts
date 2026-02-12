import { tokenStorage } from "@/shared";

export const Config = {
    BASE_URL: import.meta.env.VITE_ADMIN_FEATURES_API,
    get headers() {
        return {
            accept: 'application/json',
            Authorization: `Bearer ${tokenStorage.get()}`,
        };
    },
};

// Helper to safely parse JSON responses that may be empty
async function parseJsonSafe(response: Response) {
    const text = await response.text().catch(() => '');
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

export const banUser = async (payload: { clientProfileId: string; adminProfileId?: string | null; reason: string; expiresAt?: string | null }) => {
    const endpoint = `${Config.BASE_URL}/api/Admin/BannedUsers/ban/${payload.clientProfileId}`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            ...Config.headers,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            clientProfileId: payload.clientProfileId,
            adminProfileId: payload.adminProfileId ?? null,
            reason: payload.reason,
            expiresAt: payload.expiresAt ?? null,
        }),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to ban user');
    }
    const data = await parseJsonSafe(response);
    return data;
};

export const fetchActiveBannedUsers = async () => {
    const endpoint = `${Config.BASE_URL}/api/Admin/BannedUsers/clients`;
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: Config.headers,
    });

    if (!response.ok) {
        throw new Error('Failed to fetch active banned users');
    }

    const data = await parseJsonSafe(response);
    // The API returns an array of user objects — return it directly (or null).
    return (data || []) as Array<any>;
};

export const unbanUser = async (clientProfileId: string) => {
    const endpoint = `${Config.BASE_URL}/api/Admin/BannedUsers/unban/${clientProfileId}`;
    const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: Config.headers,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to unban user');
    }

    // Some APIs may return no JSON for DELETE — try to parse but tolerate empty.
    const data = await response.text().then((t) => {
        try { return t ? JSON.parse(t) : null; } catch { return t; }
    }).catch(() => null);
    return data;
};

// THEATRES
export const fetchTheatres = async () => {
    const endpoint = `${Config.BASE_URL}/api/Admin/Theatres`;
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: Config.headers,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to fetch theatres');
    }

    const data = await response.json();
    return data as Array<any>;
};

export const createTheatre = async (payload: { name: string; address: string; latitude: string; longitude: string }) => {
    const endpoint = `${Config.BASE_URL}/api/Admin/Theatres`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { ...Config.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to create theatre');
    }

    const data = await parseJsonSafe(response);
    return data;
};

export const getTheatreById = async (id: string) => {
    const endpoint = `${Config.BASE_URL}/api/Admin/Theatres/${id}`;
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: Config.headers,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to get theatre');
    }

    const data = await parseJsonSafe(response);
    return data;
};

export const updateTheatre = async (id: string, payload: { name: string; address: string; latitude: string; longitude: string }) => {
    const endpoint = `${Config.BASE_URL}/api/Admin/Theatres/${id}`;
    const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { ...Config.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to update theatre');
    }

    const data = await parseJsonSafe(response);
    return data;
};

export const deleteTheatre = async (id: string) => {
    const endpoint = `${Config.BASE_URL}/api/Admin/Theatres/${id}`;
    const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: Config.headers,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to delete theatre');
    }

    const data = await parseJsonSafe(response);
    return data;
};

// GENRES
export const fetchGenres = async (lang?: string) => {
    const q = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    const endpoint = `${Config.BASE_URL}/api/Admin/Genres${q}`;
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: Config.headers,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to fetch genres');
    }

    const data = await parseJsonSafe(response);
    return (data || []) as Array<any>;
};

export const createGenre = async (payload: { name: string }) => {
    const endpoint = `${Config.BASE_URL}/api/Admin/Genres`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { ...Config.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to create genre');
    }

    const data = await parseJsonSafe(response);
    return data;
};

export const getGenreById = async (id: string, lang?: string) => {
    const q = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    const endpoint = `${Config.BASE_URL}/api/Admin/Genres/${id}${q}`;
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: Config.headers,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to get genre');
    }

    const data = await parseJsonSafe(response);
    return data;
};

export const updateGenre = async (id: string, payload: { name: string }) => {
    const endpoint = `${Config.BASE_URL}/api/Admin/Genres/${id}`;
    const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { ...Config.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to update genre');
    }

    const data = await parseJsonSafe(response);
    return data;
};

export const deleteGenre = async (id: string) => {
    const endpoint = `${Config.BASE_URL}/api/Admin/Genres/${id}`;
    const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: Config.headers,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to delete genre');
    }

    const data = await parseJsonSafe(response);
    return data;
};

// MOVIES
export const fetchMovies = async (params?: { lang?: string; page?: number; pageSize?: number; genreId?: string | null }) => {
    const qs: string[] = [];
    if (params?.lang !== undefined) qs.push(`lang=${encodeURIComponent(params.lang ?? '')}`);
    if (params?.page !== undefined) qs.push(`page=${encodeURIComponent(String(params.page))}`);
    if (params?.pageSize !== undefined) qs.push(`pageSize=${encodeURIComponent(String(params.pageSize))}`);
    if (params?.genreId !== undefined) qs.push(`genreId=${encodeURIComponent(String(params.genreId))}`);
    const query = qs.length ? `?${qs.join('&')}` : '';
    const endpoint = `${Config.BASE_URL}/api/Admin/Movies${query}`;
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: Config.headers,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to fetch movies');
    }

    const data = await parseJsonSafe(response);
    return data;
};

export const createMovie = async (payload: any) => {
    const endpoint = `${Config.BASE_URL}/api/Admin/Movies`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { ...Config.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to create movie');
    }

    const data = await parseJsonSafe(response);
    if (data) return data;

    // If server returned no JSON, try to obtain the created resource via Location header
    const loc = response.headers.get('Location') || response.headers.get('location');
    if (loc) {
        const url = loc.startsWith('http') ? loc : `${Config.BASE_URL}${loc.startsWith('/') ? '' : '/'}${loc}`;
        const r = await fetch(url, { method: 'GET', headers: Config.headers });
        if (!r.ok) throw new Error('Failed to fetch created movie from Location header');
        const fetched = await parseJsonSafe(r);
        return fetched;
    }

    return null;
};

export const updateMovie = async (id: string, payload: any) => {
    const endpoint = `${Config.BASE_URL}/api/Admin/Movies/${id}`;
    const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { ...Config.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to update movie');
    }

    const data = await parseJsonSafe(response);
    if (data) return data;

    // If server returned no JSON, try to fetch the updated movie by id
    try {
        const fetched = await getMovieById(id).catch(() => null);
        if (fetched) return fetched;
    } catch {}

    return null;
};

export const deleteMovie = async (id: string, lang?: string) => {
    const q = lang !== undefined ? `?lang=${encodeURIComponent(lang ?? '')}` : '';
    const endpoint = `${Config.BASE_URL}/api/Admin/Movies/${id}${q}`;
    const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: Config.headers,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to delete movie');
    }

    const data = await parseJsonSafe(response);
    return data;
};

export const getMovieById = async (id: string, lang?: string) => {
    const q = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    const endpoint = `${Config.BASE_URL}/api/Admin/Movies/${id}${q}`;
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: Config.headers,
    });

    console.log('getMovieById response', response);

    if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || 'Failed to get movie');
    }

    const data = await parseJsonSafe(response);
    return data;
};




