import {
  clearAuthCookies,
  getAuthToken,
} from "@/lib/cookies";
import { getApiBaseUrl } from "@/lib/api-url";

const API_BASE_URL = getApiBaseUrl();
let refreshTokenPromise: Promise<{ success: boolean }> | null = null;
let redirectScheduled = false;

function normalizeAuthErrorMessage(rawMessage: string | undefined, fallback: string): string {
  const message = (rawMessage || '').trim();
  const normalized = message.toLowerCase();

  if (!message) return fallback;
  if (normalized === 'unauthorized' || normalized === 'unauthorizedexception') return 'Acesso não autorizado';
  if (normalized === 'forbidden' || normalized === 'forbiddenexception') return 'Você não tem permissão para executar esta ação';
  if (normalized === 'not found' || normalized === 'notfoundexception') return 'Recurso não encontrado';
  if (normalized === 'bad request' || normalized === 'badrequestexception') return 'Dados inválidos';
  if (normalized === 'internal server error' || normalized === 'internal server error.') return 'Erro interno do servidor';
  if (normalized === 'invalid credentials' || normalized === 'credenciais inválidas') return 'Credenciais inválidas';
  if (normalized === 'refresh token invalid' || normalized === 'refresh token inválido') return 'Refresh token inválido';
  if (normalized === 'refresh token obrigatório') return 'Refresh token obrigatório';

  return message;
}

function isAuthRoute(): boolean {
  if (typeof window === "undefined") return false;

  const pathname = window.location.pathname;
  return (
    pathname.endsWith("/login") ||
    pathname.endsWith("/register") ||
    pathname.endsWith("/forgot-password") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password"
  );
}

function redirectToLoginOnce() {
  if (typeof window === "undefined" || redirectScheduled) return;

  redirectScheduled = true;
  clearAuthCookies();
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("organization");

  if (isAuthRoute()) return;

  const parts = window.location.pathname.split("/").filter(Boolean);
  const locale = ["pt", "en", "es", "fr"].includes(parts[0]) ? parts[0] : "pt";
  const org = parts[1] || "";
  window.location.href = org ? `/${locale}/${org}/login` : "/login";
}

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
    throw new Error(normalizeAuthErrorMessage(data.error || data.message, "Erro ao solicitar recuperacao de senha"));
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
    throw new Error(normalizeAuthErrorMessage(data.error || data.message, "Erro ao redefinir senha"));
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
      credentials: "include",
      body: JSON.stringify({ email, password }),
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = Array.isArray(data.message)
      ? data.message.join(', ')
      : (data.message || data.error || 'Erro ao fazer login');
    throw new Error(normalizeAuthErrorMessage(msg, 'Erro ao fazer login'));
  }

  const data = await res.json();

  if (typeof window !== "undefined" && data.organization) {
    localStorage.setItem("organization", JSON.stringify(data.organization));
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
      credentials: "include",
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const resData = await res.json().catch(() => ({}));
    const msg = Array.isArray(resData.message)
      ? resData.message.join(', ')
      : (resData.message || resData.error || 'Erro ao registrar usuario');
    throw new Error(normalizeAuthErrorMessage(msg, 'Erro ao registrar usuario'));
  }

  const resData = await res.json();

  // API pode retornar 'accessToken' ou 'token'
  if (typeof window !== "undefined" && resData.organization) {
    localStorage.setItem("organization", JSON.stringify(resData.organization));
  }

  return resData;
}

// ----------------------
// LOGOUT
// ----------------------
export async function logout() {
  const res = await fetch(
    `${API_BASE_URL}/auth/logout`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  clearAuthCookies();
  if (typeof window !== "undefined") {
    localStorage.removeItem("organization");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(normalizeAuthErrorMessage(data.error || data.message, "Erro ao fazer logout"));
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
    throw new Error(normalizeAuthErrorMessage(data.error || data.message, "Erro ao buscar usuario"));
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
export async function refreshToken(): Promise<{ success: boolean }> {
  refreshTokenPromise = (async () => {
    const res = await fetch(
      `${API_BASE_URL}/auth/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(normalizeAuthErrorMessage(data.error || data.message, "Erro ao renovar token"));
    }

    const data = await res.json();

    return data;
  })();

  try {
    return await refreshTokenPromise;
  } finally {
    refreshTokenPromise = null;
  }
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
      credentials: "include",
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(options.headers as Record<string, string> ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let res = await makeRequest(getAuthToken());

  if (res.status === 401) {
    try {
      await refreshToken();
      res = await makeRequest(getAuthToken());

      if (res.status === 401) {
        throw new Error("Sessao invalida");
      }
    } catch {
      redirectToLoginOnce();
    }
  }

  return res;
}
