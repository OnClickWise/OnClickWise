import { useState, useEffect, useCallback } from 'react';

export function useApi() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    // Aguardar até estar no cliente
    if (!isClient) {
      return { success: false, error: 'API calls only available on client side' };
    }

    const token = localStorage.getItem('token');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(fullUrl, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // Se for erro de autenticação, limpar token
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

      const data = await response.json();
      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, [isClient]);

  return { isClient, apiCall };
}
