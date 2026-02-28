'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  name: string;
  is_temporary_password?: boolean;
}

interface Organization {
  id: number;
  name: string;
  slug: string;
  email: string;
  logo_url?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isLoading: boolean;
  lastActivity: number | null;
}

export function useAuth() {
  const { apiCall } = useApi();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    organization: null,
    token: null,
    isLoading: true,
    lastActivity: null,
  });
  
  const router = useRouter();

  // Verificar se o usuário está inativo há mais de 30 minutos
  const isUserInactive = useCallback((lastActivity: number) => {
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
    return Date.now() - lastActivity > INACTIVITY_TIMEOUT;
  }, []);

  // Atualizar atividade do usuário
  const updateActivity = useCallback(() => {
    const now = Date.now();
    setAuthState(prev => ({
      ...prev,
      lastActivity: now,
    }));
    localStorage.setItem('lastActivity', now.toString());
  }, []);

  // Validar se o token é um JWT válido
  const isValidJWT = useCallback((token: string): boolean => {
    if (!token) return false;
    
    /* JWT deve ter exatamente 3 partes separadas por ponto
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format: token does not have 3 parts');
      return false;
    }
    
    // Verificar se as partes não estão vazias
    if (parts.some(part => !part || part.trim() === '')) {
      console.error('Invalid JWT format: token has empty parts');
      return false;
    }
    
    // Tentar decodificar o payload para verificar se é um JWT válido
    try {
      const payload = JSON.parse(atob(parts[1]));
      
      // Verificar se tem as propriedades básicas de um JWT
      if (!payload.exp || !payload.userId || !payload.organizationId) {
        console.error('Invalid JWT: missing required claims');
        return false;
      }
      
      // Verificar se o token não está expirado
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        console.error('JWT token has expired');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Invalid JWT format: cannot decode payload', error);
      return false;
    }
      */
    return true;
  }, []);

  // Limpar autenticação inválida
  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('organization');
    localStorage.removeItem('lastActivity');
    setAuthState({
      isAuthenticated: false,
      user: null,
      organization: null,
      token: null,
      isLoading: false,
      lastActivity: null,
    });
  }, []);

  // Verificar autenticação no localStorage
  const checkAuth = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      const organizationStr = localStorage.getItem('organization');
      const lastActivityStr = localStorage.getItem('lastActivity');
      
      if (token && organizationStr) {
        // Validar formato JWT ANTES de usar o token
        if (!isValidJWT(token)) {
          console.error('Invalid or malformed JWT token detected, clearing auth');
          clearAuth();
          return;
        }
        
        const organization = JSON.parse(organizationStr);
        const lastActivity = lastActivityStr ? parseInt(lastActivityStr) : Date.now();
        
        // Verificar se o usuário está inativo
        if (isUserInactive(lastActivity)) {
          // Usuário inativo, fazer logout automático
          clearAuth();
          return;
        }
        
        setAuthState({
          isAuthenticated: true,
          user: null, // Será preenchido quando necessário
          organization,
          token,
          isLoading: false,
          lastActivity,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          organization: null,
          token: null,
          isLoading: false,
          lastActivity: null,
        });
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      clearAuth();
    }
  }, [isUserInactive, isValidJWT, clearAuth]);

  // Verificar se o usuário está autenticado para a organização correta
  const isAuthenticatedForOrg = useCallback((orgSlug: string) => {
    return authState.isAuthenticated && 
           authState.organization?.slug === orgSlug;
  }, [authState.isAuthenticated, authState.organization?.slug]);

  // Salvar a última URL visitada para este usuário
  const saveLastVisitedUrl = useCallback((url: string) => {
    try {
      const token = localStorage.getItem('token');
      const organizationStr = localStorage.getItem('organization');
      
      if (!token || !organizationStr) return;
      
      const organization = JSON.parse(organizationStr);
      const parts = token.split('.');
      if (parts.length !== 3) return;
      
      const payload = JSON.parse(atob(parts[1]));
      const userEmail = payload.email || payload.sub || '';
      
      // Identificador único por usuário
      const userId = `${organization.id}_${userEmail}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      const key = `lastVisitedUrl_${userId}`;
      
      localStorage.setItem(key, url);
    } catch (error) {
      console.error('Error saving last visited URL:', error);
    }
  }, []);

  // Obter a última URL visitada para este usuário
  const getLastVisitedUrl = useCallback((orgSlug: string): string | null => {
    try {
      const token = localStorage.getItem('token');
      const organizationStr = localStorage.getItem('organization');
      
      if (!token || !organizationStr) return null;
      
      const organization = JSON.parse(organizationStr);
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      const userEmail = payload.email || payload.sub || '';
      
      // Identificador único por usuário
      const userId = `${organization.id}_${userEmail}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      const key = `lastVisitedUrl_${userId}`;
      
      const url = localStorage.getItem(key);
      // Validar se a URL é da organização correta
      if (url && url.startsWith(`/${orgSlug}/`)) {
        return url;
      }
      return null;
    } catch (error) {
      console.error('Error getting last visited URL:', error);
      return null;
    }
  }, []);

  // Fazer logout
  const logout = useCallback(async (orgSlug?: string) => {
    try {
      // best-effort notify backend before clearing token
      await apiCall('/presence/force-logout', { method: 'POST' });
    } catch {}
    
    // Obter o slug da organização do localStorage antes de limpar
    const organizationStr = localStorage.getItem('organization');
    let organizationSlug = orgSlug;
    
    if (organizationStr && !orgSlug) {
      try {
        const organization = JSON.parse(organizationStr);
        organizationSlug = organization.slug;
      } catch (error) {
        console.error('Error parsing organization data:', error);
      }
    }
    
    // Salvar a URL atual antes do logout (se estiver em uma página da organização)
    if (typeof window !== 'undefined' && organizationSlug) {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith(`/${organizationSlug}/`) && !currentPath.includes('/login')) {
        saveLastVisitedUrl(currentPath);
      }
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('organization');
    localStorage.removeItem('lastActivity');
    setAuthState({
      isAuthenticated: false,
      user: null,
      organization: null,
      token: null,
      isLoading: false,
      lastActivity: null,
    });
    
    if (organizationSlug && organizationSlug !== 'undefined') {
      router.push(`/${organizationSlug}/login`);
    } else {
      router.push('/');
    }
  }, [router, apiCall, saveLastVisitedUrl]);

  // Salvar dados de autenticação
  const saveAuthData = useCallback((token: string, organization: Organization) => {
    const now = Date.now();
    localStorage.setItem('token', token);
    localStorage.setItem('organization', JSON.stringify(organization));
    localStorage.setItem('lastActivity', now.toString());
    
    setAuthState({
      isAuthenticated: true,
      user: null,
      organization,
      token,
      isLoading: false,
      lastActivity: now,
    });
  }, []);

  // Redirecionar para login da organização
  const redirectToOrgLogin = useCallback((orgSlug: string) => {
    router.push(`/${orgSlug}/login`);
  }, [router]);

  // Verificar autenticação na montagem do componente
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Escutar mudanças no localStorage (quando token é removido em outra aba)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Se o token foi removido ou modificado em outra aba
      if (e.key === 'token' || e.key === 'organization') {
        console.log('Storage change detected, rechecking auth');
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuth]);

  return {
    ...authState,
    checkAuth,
    isAuthenticatedForOrg,
    logout,
    saveAuthData,
    updateActivity,
    redirectToOrgLogin,
    saveLastVisitedUrl,
    getLastVisitedUrl,
  };
}
