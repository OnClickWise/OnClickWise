'use client';

import { useState, useEffect, useCallback } from 'react';
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

  // Buscar dados do usuário da API
  const fetchUserData = useCallback(async (token: string) => {
    try {
      const response = await fetch('http://localhost:3000/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return {
            user: data.user,
            organization: data.organization
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }, []);

  // Verificar autenticação no localStorage
  const checkAuth = useCallback(async () => {
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
        
        // Buscar dados atualizados da API
        const userData = await fetchUserData(token);
        
        if (userData) {
          // Dados da API obtidos com sucesso
          setAuthState({
            isAuthenticated: true,
            user: userData.user,
            organization: userData.organization,
            token,
            isLoading: false,
            lastActivity,
          });
        } else {
          // Fallback para dados do localStorage
          console.log('API failed, using localStorage data');
          setAuthState({
            isAuthenticated: true,
            user: null, // Dados do usuário não estão no localStorage
            organization,
            token,
            isLoading: false,
            lastActivity,
          });
        }
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
  }, [isUserInactive, fetchUserData]);

  // Verificar se o usuário está autenticado para a organização correta
  const isAuthenticatedForOrg = useCallback((orgSlug: string) => {
    return authState.isAuthenticated && 
           authState.organization?.slug === orgSlug;
  }, [authState.isAuthenticated, authState.organization?.slug]);

  // Fazer logout
  const logout = useCallback((orgSlug?: string) => {
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
    // Redirecionar para a página de login da empresa ou página principal
    if (orgSlug) {
      router.push(`/${orgSlug}/login`);
    } else {
      router.push('/');
    }
  }, [router]);

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
