import { tokenStorage } from '@/shared/tokenStorage';

// Shared promise to serialize refresh requests so only one network call runs at a time
let refreshInProgress: Promise<any> | null = null;

/**
 * A small wrapper that runs the provided API function and, on 401, attempts
 * to refresh tokens by calling a manually-provided refresh function (if available)
 * and retries the original request once. This keeps the file simple and avoids
 * coupling to a specific auth module path — set `globalThis.manualRefreshToken`
 * elsewhere (auth service) to enable automatic refresh.
 */

export async function apiCallWithManualRefresh<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    try {
      const status = err?.response?.status ?? err?.status ?? undefined;
      console.warn('[apiWithManualRefresh] request failed', { status, message: err?.message });
      // If unauthorized, try one refresh + retry (shared across callers)
      if (status === 401) {
        const refreshFn = (globalThis as any)?.manualRefreshToken;
        const refreshToken = tokenStorage.getRefresh();

        // If there's no refresh token at all, just rethrow and let caller handle redirect
        if (!refreshToken) {
          console.warn('[apiWithManualRefresh] no refresh token available — aborting, caller should handle redirect');
          throw err;
        }

        if (typeof refreshFn === 'function') {
          console.info('[apiWithManualRefresh] detected 401 — will attempt refresh (serialized)');

          // Start a shared refresh if none in progress, otherwise await the existing one
          if (!refreshInProgress) {
            refreshInProgress = (async () => {
              try {
                return await refreshFn(refreshToken);
              } finally {
                // ensure the shared promise is cleared so future refreshes can run
                refreshInProgress = null;
              }
            })();
          }

          // Await the shared refresh result
          const refreshResult = await refreshInProgress;
          console.info('[apiWithManualRefresh] refresh result (serialized)', refreshResult);

          // Normalize success: support TypedResult with isSuccess, or raw LoginResponse shape
          const refreshed = Boolean(refreshResult && (refreshResult.isSuccess || (refreshResult.accessToken && refreshResult.refreshToken)));

          if (!refreshed) {
            console.warn('[apiWithManualRefresh] refresh did not succeed — aborting, caller should handle logout/redirect');
            throw err;
          }

          // Retry original request once
          try {
            return await fn();
          } catch (retryErr: any) {
            const retryStatus = retryErr?.response?.status ?? retryErr?.status ?? undefined;
            console.error('[apiWithManualRefresh] retry after refresh failed', retryStatus, retryErr?.message);
            // If retry also returns 401, give up and let caller handle redirect/logout
            throw retryErr;
          }
        }
      }
    } catch (inner) {
      console.error('[apiWithManualRefresh] error handling failed', inner);
    }

    // if not handled above, rethrow original error
    throw err;
  }
}
