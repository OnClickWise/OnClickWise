'use client'

import { useState, useEffect } from 'react'
import {
  getAccessTokenFromCookie,
  clearAuthCookies,
} from '@/lib/cookies'

  
export function useApi() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const apiCall = async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Client only' };
    }

    const token = getAccessTokenFromCookie();
    const isFormData = options.body instanceof FormData;

    const config: RequestInit = {
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 401) {
          clearAuthCookies();
          localStorage.removeItem('organization');
          localStorage.removeItem('lastActivity');

          if (typeof window !== 'undefined') {
            const pathParts = window.location.pathname.split('/');
            const orgSlug = pathParts[1];

            window.location.href = orgSlug
              ? `/${orgSlug}/login`
              : '/login';
          }
        }

        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      if (
        response.status === 204 ||
        !contentType?.includes('application/json')
      ) {
        return { success: true };
      }

      const text = await response.text();

      if (!text) {
        return { success: true };
      }

      const data = JSON.parse(text);

      if (Array.isArray(data)) {
        return { success: true, data };
      }

      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Network error',
      };
    }
  };

  // 👇 Compatibilidade com código antigo
  const get = (endpoint: string, options?: RequestInit) =>
    apiCall(endpoint, { ...options, method: 'GET' });

  const post = (
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ) =>
    apiCall(endpoint, {
      ...options,
      method: 'POST',
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body),
    });

  const put = (
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ) =>
    apiCall(endpoint, {
      ...options,
      method: 'PUT',
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body),
    });

  const del = (endpoint: string, options?: RequestInit) =>
    apiCall(endpoint, { ...options, method: 'DELETE' });

  return {
    isClient,
    apiCall,
    get,
    post,
    put,
    delete: del,
  };
} 
