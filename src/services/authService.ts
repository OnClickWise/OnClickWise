import {
  clearAuthCookies,
  getAuthToken,
  getRefreshTokenFromCookie,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@/lib/cookies";
import { getApiBaseUrl } from "@/lib/api-url";

const API_BASE_URL = getApiBaseUrl();

export interface RegisterResponse {
  success: boolean;
  token?: string;
  organization?: {
    slug: string;
    name: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// ----------------------
// FORGOT PASSWORD
// ----------------------
export async function forgotPassword(email: string) {
  const res = await fetch(
    `${API_BASE_URL}/auth/forgot-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Erro ao solicitar recuperacao de senha");
  }
  return res.json();
}

// ----------------------
// RESET PASSWORD
// ----------------------
export async function resetPassword({ token, password }: { token: string; password: string }) {
  const res = await fetch(
    `${API_BASE_URL}/auth/reset-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Erro ao redefinir senha");
  }
  return res.json();
}

// ----------------------
// LOGIN
// ----------------------
export async function login({ email, password }: { email: string; password: string }) {
  const res = await fetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = Array.isArray(data.message)
      ? data.message.join(', ')
      : (data.message || data.error || 'Erro ao fazer login');
    throw new Error(msg);
  }

  const data = await res.json();

  if (data.accessToken) {
    setAccessTokenCookie(data.accessToken);
    if (data.refreshToken) setRefreshTokenCookie(data.refreshToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("token", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      if (data.organization) {
        localStorage.setItem("organization", JSON.stringify(data.organization));
      }
    }
  }

  return data;
}

// ----------------------
// REGISTER
// ----------------------
export async function register(data: any) {
  const res = await fetch(
    `${API_BASE_URL}/auth/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const resData = await res.json().catch(() => ({}));
    const msg = Array.isArray(resData.message)
      ? resData.message.join(', ')
      : (resData.message || resData.error || 'Erro ao registrar usuario');
    throw new Error(msg);
  }

  const resData = await res.json();

  // API pode retornar 'accessToken' ou 'token'
  const tokenValue = resData.accessToken || resData.token;
  if (tokenValue) {
    setAccessTokenCookie(tokenValue);
    if (resData.refreshToken) setRefreshTokenCookie(resData.refreshToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("token", tokenValue);
      if (resData.refreshToken) {
        localStorage.setItem("refreshToken", resData.refreshToken);
      }
      if (resData.organization) {
        localStorage.setItem("organization", JSON.stringify(resData.organization));
      }
    }
  }

  return resData;
}

// ----------------------
// LOGOUT
// ----------------------
export async function logout() {
  const token = getAuthToken();
  const currentRefreshToken = getRefreshTokenFromCookie()
    ?? (typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null);

  const res = await fetch(
    `${API_BASE_URL}/auth/logout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
      credentials: "include",
    },
  );

  clearAuthCookies();
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("organization");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Erro ao fazer logout");
  }

  return res.json();
}

// ----------------------
// GET CURRENT USER
// ----------------------
export async function getCurrentUser() {
  const res = await authenticatedFetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Erro ao buscar usuario");
  }
  const data = await res.json();
  return {
    id: data.user?.id || null,
    name: data.user?.name,
    email: data.user?.email,
    avatar: data.user?.avatar || "/avatars/shadcn.jpg",
    role: data.user?.role || "employee",
    organization_id: data.organization?.id,
  };
}

// ----------------------
// REFRESH TOKEN
// ----------------------
export async function refreshToken(): Promise<{ accessToken: string; refreshToken?: string }> {
  const currentRefreshToken = getRefreshTokenFromCookie()
    ?? (typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null);
  if (!currentRefreshToken) throw new Error("Refresh token nao encontrado");

  const res = await fetch(
    `${API_BASE_URL}/auth/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Erro ao renovar token");
  }

  const data = await res.json();

  if (data.accessToken) {
    setAccessTokenCookie(data.accessToken);
    if (data.refreshToken) setRefreshTokenCookie(data.refreshToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("token", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
    }
    return data;
  }

  throw new Error("Token nao recebido na renovacao");
}

// ----------------------
// AUTHENTICATED FETCH (auto-refresh on 401)
// ----------------------
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (typeof window === "undefined") throw new Error("Client only");

  const method = (options.method || "GET").toUpperCase();
  const hasBody = method !== "GET" && method !== "DELETE" && method !== "HEAD";

  const makeRequest = (token: string | null): Promise<Response> =>
    fetch(url, {
      ...options,
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> ?? {}),
      },
    });

  let res = await makeRequest(getAuthToken());

  if (res.status === 401) {
    try {
      const refreshed = await refreshToken();
      res = await makeRequest(refreshed.accessToken);
    } catch {
      clearAuthCookies();
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("organization");
      const parts = window.location.pathname.split("/").filter(Boolean);
      const locale = ["pt", "en", "es", "fr"].includes(parts[0]) ? parts[0] : "pt";
      const org = parts[1] || "";
      window.location.href = org ? `/${locale}/${org}/login` : "/login";
    }
  }

  return res;
}
