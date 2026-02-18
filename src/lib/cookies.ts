export function getAccessTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
  return tokenCookie ? tokenCookie.split('=')[1] : null;
}

export function getRefreshTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  const refreshTokenCookie = cookies.find(cookie => cookie.trim().startsWith('refreshToken='));
  return refreshTokenCookie ? refreshTokenCookie.split('=')[1] : null;
}

export function setAccessTokenCookie(token: string): void {
  document.cookie = `accessToken=${token}; path=/; max-age=3600; secure; samesite=strict`;
}

export function setRefreshTokenCookie(refreshToken: string): void {
  document.cookie = `refreshToken=${refreshToken}; path=/; max-age=2592000; secure; samesite=strict`;
}

export function clearAuthCookies(): void {
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}
