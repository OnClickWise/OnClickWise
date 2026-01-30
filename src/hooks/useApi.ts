import { useEffect, useState } from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function useApi() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  const apiCall = async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    if (!isClient) {
      return {
        success: false,
        error: 'Client-side only',
      };
    }

    const token = localStorage.getItem('token');
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
      const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        config
      );

      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 401) {
          localStorage.clear();
          window.location.href = '/login';
        }

        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      if (
        response.status === 204 ||
        !contentType ||
        !contentType.includes('application/json')
      ) {
        return { success: true };
      }

      const data = await response.json();
      return { success: true, data };
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

  return {
    isClient,
    apiCall,
  };
}
