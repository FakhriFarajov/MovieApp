const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  getRefresh(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setRefresh(refreshToken: string) {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch {
      return null;
    }
  },
  set(data: {} & { accessToken: string; refreshToken: string }) {
    try {
      console.log(data.accessToken);
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      // Notify application that tokens changed
      try { window.dispatchEvent(new Event('auth:tokensChanged')); } catch { /* ignore SSR */ }
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      try { window.dispatchEvent(new Event('auth:tokensChanged')); } catch { /* ignore SSR */ }
    } catch {
      /* ignore */
    }
  },
  remove() {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

