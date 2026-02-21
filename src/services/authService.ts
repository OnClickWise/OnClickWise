// src/lib/authService.ts

import {
  clearAuthCookies,
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@/lib/cookies";

// ----------------------
// LOGIN
// ----------------------



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



export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Erro ao fazer login");
  }

  const data = await res.json();

  if (data.accessToken) {
    setAccessTokenCookie(data.accessToken);
    if (data.refreshToken) setRefreshTokenCookie(data.refreshToken);
  }

  return data;
}

// ----------------------
// REGISTER
// ----------------------
export async function register(data: any) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const resData = await res.json().catch(() => ({}));
    throw new Error(resData.error || "Erro ao registrar usuário");
  }

  const resData = await res.json();

  if (resData.accessToken) {
    setAccessTokenCookie(resData.accessToken);
    if (resData.refreshToken) setRefreshTokenCookie(resData.refreshToken);
  }

  return resData;
}

// ----------------------
// LOGOUT
// ----------------------
export async function logout() {
  const token = getAccessTokenFromCookie();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/logout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    },
  );

  clearAuthCookies();

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
  const token = getAccessTokenFromCookie();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Erro ao buscar usuário");
  }
  const data = await res.json();
  return {
    id: data.user?.id || null,
    name: data.user?.name,
    email: data.user?.email,
    avatar: data.user?.avatar || "/avatars/shadcn.jpg",
    role: data.user?.role || 'employee',
    organization_id: data.organization.id
  };
}

// ----------------------
// REFRESH TOKEN
// ----------------------
export async function refreshToken(): Promise<{
  accessToken: string;
  refreshToken?: string;
}> {
  const currentRefreshToken = getRefreshTokenFromCookie();
  if (!currentRefreshToken) throw new Error("Refresh token não encontrado");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
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
    return data;
  }

  throw new Error("Token não recebido na renovação");
}
