import { getApiOrigin } from '@/lib/api-url';

export function getAccessTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
  return tokenCookie ? tokenCookie.split('=')[1] : null;
}

export function getRefreshTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const refreshTokenCookie = cookies.find(cookie => cookie.trim().startsWith('refreshToken='));
  return refreshTokenCookie ? refreshTokenCookie.split('=')[1] : null;
}

export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const csrfTokenCookie = cookies.find(cookie => cookie.trim().startsWith('csrfToken='));
  return csrfTokenCookie ? csrfTokenCookie.split('=')[1] : null;
}

/** Retorna o access token do cookie OU do localStorage (fallback para dev/localhost) */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return getAccessTokenFromCookie() || localStorage.getItem('token');
}

export function setAccessTokenCookie(token: string): void {
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const secureFlag = isLocalhost ? '' : '; secure';
  document.cookie = `accessToken=${token}; path=/; max-age=3600${secureFlag}; samesite=strict`;
}

export function setRefreshTokenCookie(refreshToken: string): void {
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const secureFlag = isLocalhost ? '' : '; secure';
  document.cookie = `refreshToken=${refreshToken}; path=/; max-age=2592000${secureFlag}; samesite=strict`;
}

export function clearAuthCookies(): void {
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'csrfToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

let authFetchPatched = false;

export function installAuthFetchDefaults(): void {
  if (typeof window === 'undefined' || authFetchPatched) return;

  const apiOrigin = getApiOrigin();
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' || input instanceof URL ? input.toString() : input.url;
    const method = (init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();

    if (!(url.startsWith(apiOrigin) || url.startsWith('/api'))) {
      return originalFetch(input, init);
    }

    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const csrfToken = getCsrfTokenFromCookie();
      if (csrfToken && !headers.has('x-csrf-token')) {
        headers.set('x-csrf-token', csrfToken);
      }
    }

    return originalFetch(input, {
      ...init,
      credentials: init.credentials ?? 'include',
      headers,
    });
  };

  authFetchPatched = true;
}

installAuthFetchDefaults();
