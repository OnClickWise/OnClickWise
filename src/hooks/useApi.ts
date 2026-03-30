'use client'

import { useState, useEffect } from 'react'
import {
  getAuthToken,
  clearAuthCookies,
} from '@/lib/cookies'
import { getApiBaseUrl } from '@/lib/api-url'
import { refreshToken } from '@/services/authService'

  
export function useApi() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  const API_BASE_URL = getApiBaseUrl();



  const resolveLoginRedirect = () => {
    if (typeof window === 'undefined') return '/login'

    const locales = ['pt', 'en', 'es', 'fr']
    const pathParts = window.location.pathname.split('/').filter(Boolean)

    let locale = 'pt'
    let orgSlug = ''

    if (pathParts.length >= 2 && locales.includes(pathParts[0])) {
      locale = pathParts[0]
      orgSlug = pathParts[1]
    } else if (pathParts.length >= 1 && !locales.includes(pathParts[0])) {
      orgSlug = pathParts[0]
    }

    return orgSlug ? `/${locale}/${orgSlug}/login` : '/login'
  }

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

    const makeConfig = (authToken: string | null): RequestInit => ({
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
      },
    })

    const parseResponse = async (response: Response) => {
      const contentType = response.headers.get('content-type')

      if (
        response.status === 204 ||
        !contentType?.includes('application/json')
      ) {
        return { success: true }
      }

      const text = await response.text()
      if (!text) {
        return { success: true }
      }

      const data = JSON.parse(text)

      if (Array.isArray(data)) {
        return { success: true, data }
      }

      return { success: true, ...data }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const config = makeConfig(token)
      config.signal = controller.signal

      let response = await fetch(`${API_BASE_URL}${endpoint}`, config)

      if (response.status === 401) {
        try {
          const refreshed = await refreshToken()
          const retryConfig = makeConfig(refreshed.accessToken)
          retryConfig.signal = controller.signal
          response = await fetch(`${API_BASE_URL}${endpoint}`, retryConfig)
        } catch {
          clearAuthCookies()
          localStorage.removeItem('organization')
          localStorage.removeItem('lastActivity')
          window.location.href = resolveLoginRedirect()
          return { success: false, error: 'Sessao expirada' }
        }
      }

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 401) {
          clearAuthCookies();
          localStorage.removeItem('organization');
          localStorage.removeItem('lastActivity');
          window.location.href = resolveLoginRedirect();
        }

        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      return parseResponse(response)
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
