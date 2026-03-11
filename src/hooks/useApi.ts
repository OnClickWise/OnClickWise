'use client'

import { useState, useEffect } from 'react'
import {
  getAuthToken,
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
    (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') + '/api';

  const apiCall = async (
    endpoint: string,
    options: RequestInit = {},
    timeoutMs = 15000
  ) => {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Client only' };
    }

    const token = getAuthToken();
    const isFormData = options.body instanceof FormData;

    const config: RequestInit = {
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    config.signal = controller.signal;

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
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            // pathname: /<locale>/<org>/... or /<org>/...
            const locale = ['pt', 'en', 'es', 'fr'].includes(pathParts[0]) ? pathParts[0] : 'pt';
            const orgSlug = pathParts[1] || pathParts[0];

            window.location.href = orgSlug && ['pt', 'en', 'es', 'fr'].includes(locale)
              ? `/${locale}/${orgSlug}/login`
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
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'O servidor demorou muito para responder. Tente novamente.',
          timeout: true,
        };
      }
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Network error',
      };
    } finally {
      clearTimeout(timeoutId);
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
