import * as SecureStore from 'expo-secure-store';
import { tokenStorage } from '@/shared';

export const BASE_URL =  'http://localhost:5287';

export const getHeaders = () => ({
  accept: 'application/json',
  Authorization: `Bearer ${tokenStorage.get()}`,
});

// Async helper that prefers native SecureStore (mobile) then falls back to web tokenStorage
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const token = await SecureStore.getItemAsync('access_token');
    const base: Record<string, string> = { accept: 'application/json' };
    if (token) {
      return { ...base, Authorization: `Bearer ${token}` };
    }
    const webToken = tokenStorage.get();
    if (webToken) return { ...base, Authorization: `Bearer ${webToken}` };
    return base;
  } catch (e) {
    const webToken = tokenStorage.get();
    return { accept: 'application/json', Authorization: webToken ? `Bearer ${webToken}` : '' };
  }
};
