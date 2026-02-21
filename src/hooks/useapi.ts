import { useState, useEffect } from 'react';
import {
  clearAuthCookies,
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@/lib/cookies";

export function useApi() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    // Aguardar até estar no cliente
    if (!isClient) {
      return { success: false, error: 'API calls only available on client side' };
    }

    const token = getAccessTokenFromCookie();
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Se for FormData, não definir Content-Type (deixar o browser definir)
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
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(fullUrl, config);
      
      // Check if response is HTML (API not running)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.log('API not available, returning fallback response');
        return {
          success: false,
          error: 'API not available'
        };
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // Se for erro de autenticação, limpar token
        console.log(response.status)
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('organization');
          localStorage.removeItem('lastActivity');
          // Redirecionar para login da organização específica se estivermos no cliente
          if (typeof window !== 'undefined') {
            // Extrair o slug da organização da URL atual
            const pathParts = window.location.pathname.split('/');
            const orgSlug = pathParts[1]; // Primeira parte após a barra
            if (orgSlug && orgSlug !== 'login' && orgSlug !== 'register') {
              window.location.href = `/${orgSlug}/login`;
            } else {
              window.location.href = '/login';
            }
          }
        }
        
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      // Check if response has content before trying to parse JSON
      const contentLength = response.headers.get('content-length');
      
      // If status is 204 (No Content) or content-length is 0, return success without data
      if (response.status === 204 || contentLength === '0' || (!contentType?.includes('application/json'))) {
        console.log('API response: No content (success)');
        return {
          success: true,
          data: undefined
        };
      }
      
      // Check if the response body is empty
      const text = await response.text();
      if (!text || text.trim() === '') {
        console.log('API response: Empty body (success)');
        return {
          success: true,
          data: undefined
        };
      }
      
      // Try to parse JSON
      try {
        const data = JSON.parse(text);
        // Removed generic API response log to reduce console pollution
        // Use specific [API] logs in components for debugging instead
        
        // If data is an array, return it directly as data property
        // to avoid spreading array as object properties
        if (Array.isArray(data)) {
          return {
            success: true,
            data: data
          };
        }
        
        return {
          success: true,
          ...data
        };
      } catch (error) {
        console.error('Failed to parse JSON response:', error);
        console.error('Response text:', text);
        return {
          success: false,
          error: `Failed to parse response: ${text}`
        };
      }
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  return { isClient, apiCall };
}
