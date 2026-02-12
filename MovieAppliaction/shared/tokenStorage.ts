import * as SecureStorage from 'expo-secure-store';

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
export const tokenStorage = {
  get(): string | null {
    try {
      return SecureStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  getRefresh(): string | null {
    try {
      return SecureStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setRefresh(refreshToken: string) {
    try {
      SecureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch {
      return null;
    }
  },
  set(data: {} & { accessToken: string; refreshToken: string }) {
    try {
      console.log(data.accessToken);
      SecureStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      SecureStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      // Notify application that tokens changed
      try { window.dispatchEvent(new Event('auth:tokensChanged')); } catch { /* ignore SSR */ }
    } catch {
      /* ignore */
    }
  },
  async clear() {
    try {
      await SecureStorage.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStorage.deleteItemAsync(REFRESH_TOKEN_KEY);
      try { window.dispatchEvent(new Event('auth:tokensChanged')); } catch { /* ignore SSR */ }
    } catch {
      /* ignore */
    }
  },
  async remove() {
    try {
      await SecureStorage.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStorage.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

