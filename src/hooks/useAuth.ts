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

  // Verificar autenticação no localStorage
  const checkAuth = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      const organizationStr = localStorage.getItem('organization');
      const lastActivityStr = localStorage.getItem('lastActivity');
      
      if (token && organizationStr) {
        const organization = JSON.parse(organizationStr);
        const lastActivity = lastActivityStr ? parseInt(lastActivityStr) : Date.now();
        
        // Verificar se o usuário está inativo
        if (isUserInactive(lastActivity)) {
          // Usuário inativo, fazer logout automático
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
      setAuthState({
        isAuthenticated: false,
        user: null,
        organization: null,
        token: null,
        isLoading: false,
        lastActivity: null,
      });
    }
  }, [isUserInactive]);

  // Verificar se o usuário está autenticado para a organização correta
  const isAuthenticatedForOrg = useCallback((orgSlug: string) => {
    return authState.isAuthenticated && 
           authState.organization?.slug === orgSlug;
  }, [authState.isAuthenticated, authState.organization?.slug]);

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
  }, [router, apiCall]);

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

  return {
    ...authState,
    checkAuth,
    isAuthenticatedForOrg,
    logout,
    saveAuthData,
    updateActivity,
    redirectToOrgLogin,
  };
}
