'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getAuthToken,
  clearAuthCookies,
} from '@/lib/cookies'
import { getApiBaseUrl } from '@/lib/api-url'
import { refreshToken } from '@/services/authService'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiCallResult<T = any> = {
  success: boolean
  data?: T
  error?: string
  status?: number
  unauthorized?: boolean
  timeout?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, any>

export type ApiAuthBehavior = { redirectOnUnauthorized?: boolean }

export function useApi() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true)
    }
  }, [])

  // Memoize a base URL para não recriar a cada render
  const API_BASE_URL = useMemo(() => getApiBaseUrl(), [])

  const resolveLoginRedirect = useCallback(() => {
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
  }, [])

  /**
   * Estável entre renders. Resolve o problema de loops infinitos em
   * efeitos que dependem de `apiCall` (ex.: páginas de listagem).
   */
  const apiCall = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async <T = any>(
      endpoint: string,
      options: RequestInit = {},
      timeoutMs = 15000,
      authBehavior?: ApiAuthBehavior,
    ): Promise<ApiCallResult<T>> => {
      if (typeof window === 'undefined') {
        return { success: false, error: 'Client only' }
      }

      const sanitizeToken = (value: string | null | undefined) => {
        if (!value) return null
        const normalized = value.replace(/^Bearer\s+/i, '').trim()
        if (!normalized || normalized === 'null' || normalized === 'undefined') return null
        return normalized
      }

      const token = sanitizeToken(getAuthToken())
      const shouldRedirectOnUnauthorized =
        authBehavior?.redirectOnUnauthorized ?? endpoint === '/auth/me'
      const isFormData = options.body instanceof FormData
      // Só anexa Content-Type: application/json quando há corpo de fato.
      // Backends estritos (Fastify body-limit / NestJS validators) podem rejeitar
      // GETs/DELETEs com Content-Type setado mas sem body — vide bug do plano de
      // contas: "Body cannot be empty when content-type is set to 'application/json'".
      const hasBody = options.body !== undefined && options.body !== null
      const shouldSetJsonContentType = !isFormData && hasBody

      const makeConfig = (authToken: string | null): RequestInit => {
        const normalizedToken = sanitizeToken(authToken)
        return {
          ...options,
          credentials: 'include',
          headers: {
            ...(shouldSetJsonContentType ? { 'Content-Type': 'application/json' } : {}),
            ...(normalizedToken && { Authorization: `Bearer ${normalizedToken}` }),
            ...options.headers,
          },
        }
      }

      const parseResponse = async (response: Response): Promise<ApiCallResult<T>> => {
        const contentType = response.headers.get('content-type')

        if (response.status === 204 || !contentType?.includes('application/json')) {
          return { success: true }
        }

        const text = await response.text()
        if (!text) return { success: true }

        const data = JSON.parse(text)

        if (Array.isArray(data)) {
          return { success: true, data: data as unknown as T }
        }

        return { success: true, ...(data as object) } as ApiCallResult<T>
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      try {
        const config = makeConfig(token)
        config.signal = controller.signal

        let response = await fetch(`${API_BASE_URL}${endpoint}`, config)

        if (response.status === 401) {
          try {
            await refreshToken()
            const retryConfig = makeConfig(getAuthToken())
            retryConfig.signal = controller.signal
            response = await fetch(`${API_BASE_URL}${endpoint}`, retryConfig)
          } catch {
            if (shouldRedirectOnUnauthorized) {
              clearAuthCookies()
              localStorage.removeItem('organization')
              localStorage.removeItem('lastActivity')
              window.location.href = resolveLoginRedirect()
            }

            return { success: false, error: 'Sessao expirada', unauthorized: true, status: 401 }
          }
        }

        if (!response.ok) {
          const errorText = await response.text()

          if (response.status === 401 && shouldRedirectOnUnauthorized) {
            clearAuthCookies()
            localStorage.removeItem('organization')
            localStorage.removeItem('lastActivity')
            window.location.href = resolveLoginRedirect()
          }

          return {
            success: false,
            unauthorized: response.status === 401,
            status: response.status,
            error: extractErrorMessage(errorText, response.status),
          }
        }

        return parseResponse(response)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return {
            success: false,
            error: 'O servidor demorou muito para responder. Tente novamente.',
            timeout: true,
          }
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Network error',
        }
      } finally {
        clearTimeout(timeoutId)
      }
    },
    [API_BASE_URL, resolveLoginRedirect],
  )

  // Helpers compatíveis com código antigo, todos estáveis entre renders.
  const get = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T = any>(endpoint: string, options?: RequestInit) =>
      apiCall<T>(endpoint, { ...options, method: 'GET' }),
    [apiCall],
  )

  const post = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T = any>(endpoint: string, body?: unknown, options?: RequestInit) =>
      apiCall<T>(endpoint, {
        ...options,
        method: 'POST',
        body: body instanceof FormData ? body : JSON.stringify(body),
      }),
    [apiCall],
  )

  const put = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T = any>(endpoint: string, body?: unknown, options?: RequestInit) =>
      apiCall<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: body instanceof FormData ? body : JSON.stringify(body),
      }),
    [apiCall],
  )

  const del = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T = any>(endpoint: string, options?: RequestInit) =>
      apiCall<T>(endpoint, { ...options, method: 'DELETE' }),
    [apiCall],
  )

  return {
    isClient,
    apiCall,
    get,
    post,
    put,
    delete: del,
  }
}

/**
 * Extrai mensagem amigável do corpo de erro da API.
 * Tenta JSON primeiro (NestJS payload), cai para texto bruto.
 */
function extractErrorMessage(rawText: string, status: number): string {
  if (!rawText) return `HTTP ${status}`

  try {
    const parsed = JSON.parse(rawText) as { message?: string | string[]; error?: string }
    if (Array.isArray(parsed.message)) return parsed.message.join('; ')
    if (typeof parsed.message === 'string') return parsed.message
    if (typeof parsed.error === 'string') return parsed.error
  } catch {
    // texto não-JSON, segue
  }

  return `HTTP ${status}: ${rawText.slice(0, 300)}`
}
