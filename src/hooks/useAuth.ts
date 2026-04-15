'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
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
    
    //JWT deve ter exatamente 3 partes separadas por ponto
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
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));

      // Aceita variações comuns de claims entre provedores.
      // O único requisito obrigatório aqui é não estar expirado quando 'exp' existir.
      if (payload.exp && typeof payload.exp === 'number') {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          console.error('JWT token has expired');
          return false;
        }
      }

      if (!payload.sub && !payload.email && !payload.userId && !payload.id) {
        console.error('Invalid JWT: missing user identity claims');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Invalid JWT format: cannot decode payload', error);
      return false;
    }
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

  // Verificar autenticação validando a sessão com o backend
  const checkAuth = useCallback(async () => {
    try {
      const organizationStr = localStorage.getItem('organization');
      const lastActivityStr = localStorage.getItem('lastActivity');

      if (!organizationStr) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          organization: null,
          token: null,
          isLoading: false,
          lastActivity: null,
        });
        return;
      }

      const organization = JSON.parse(organizationStr);
      const lastActivity = lastActivityStr ? parseInt(lastActivityStr) : Date.now();

      if (isUserInactive(lastActivity)) {
        clearAuth();
        return;
      }

      const session = await apiCall('/auth/me', { method: 'GET' });
      if (!session?.success) {
        clearAuth();
        return;
      }

      setAuthState({
        isAuthenticated: true,
        user: session.user || null,
        organization: session.organization || organization,
        token: null,
        isLoading: false,
        lastActivity,
      });
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
      const organization = authState.organization || JSON.parse(localStorage.getItem('organization') || 'null');
      const userEmail = authState.user?.email || '';

      if (!organization || !userEmail) return;

      // Identificador único por usuário
      const userId = `${organization.id}_${userEmail}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      const key = `lastVisitedUrl_${userId}`;
      
      localStorage.setItem(key, url);
    } catch (error) {
      console.error('Error saving last visited URL:', error);
    }
  }, [authState.organization, authState.user?.email]);

  // Obter a última URL visitada para este usuário
  const getLastVisitedUrl = useCallback((orgSlug: string): string | null => {
    try {
      const organization = authState.organization || JSON.parse(localStorage.getItem('organization') || 'null');
      const userEmail = authState.user?.email || '';

      if (!organization || !userEmail) return null;

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
  }, [authState.organization, authState.user?.email]);

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
    localStorage.setItem('organization', JSON.stringify(organization));
    localStorage.setItem('lastActivity', now.toString());
    
    setAuthState({
      isAuthenticated: true,
      user: null,
      organization,
      token: null,
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
    void checkAuth();
  }, [checkAuth]);

  // Escutar mudanças no localStorage (quando token é removido em outra aba)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Se a organização foi removida ou modificada em outra aba
      if (e.key === 'organization' || e.key === 'lastActivity') {
        void checkAuth();
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
