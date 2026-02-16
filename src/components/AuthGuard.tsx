'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';


interface AuthGuardProps {
  children: React.ReactNode;
  orgSlug: string;
}

export default function AuthGuard({ children, orgSlug }: AuthGuardProps) {
  const { isAuthenticatedForOrg, isLoading, redirectToOrgLogin, isAuthenticated, lastActivity, updateActivity, saveLastVisitedUrl, checkAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Verificar autenticação na montagem e quando não está autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticatedForOrg(orgSlug)) {
      redirectToOrgLogin(orgSlug);
    }
  }, [isLoading, isAuthenticatedForOrg, orgSlug, redirectToOrgLogin]);

  // Verificar autenticação periodicamente (a cada 5 segundos)
  // Isso garante que se o token for limpo/corrompido, o usuário será desconectado imediatamente
  useEffect(() => {
    const interval = setInterval(() => {
      checkAuth();
      
      // Se após verificar não estiver mais autenticado, redirecionar imediatamente
      if (!isLoading && !isAuthenticatedForOrg(orgSlug)) {
        redirectToOrgLogin(orgSlug);
      }
    }, 5000); // Verificar a cada 5 segundos
    
    return () => clearInterval(interval);
  }, [checkAuth, isLoading, isAuthenticatedForOrg, orgSlug, redirectToOrgLogin]);

  // Salvar automaticamente a URL atual quando autenticado e navegando
  useEffect(() => {
    if (!isLoading && isAuthenticated && pathname) {
      // Não salvar páginas de login
      if (!pathname.includes('/login')) {
        saveLastVisitedUrl(pathname);
      }
    }
  }, [isLoading, isAuthenticated, pathname, saveLastVisitedUrl]);

  // Detectar atividade do usuário e verificar inatividade
  useEffect(() => {
    if (!isLoading && isAuthenticated && lastActivity) {
      const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
      
      const checkInactivity = () => {
        if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
          // Usuário inativo, redirecionar IMEDIATAMENTE para login
          router.push(`/${orgSlug}/login?inactive=true`);
        }
      };

      // Verificação imediata ao montar o componente
      checkInactivity();

      // Verificar a cada 2 segundos para logout mais responsivo
      const interval = setInterval(checkInactivity, 2000);
      
      return () => clearInterval(interval);
    }
  }, [isLoading, isAuthenticated, lastActivity, orgSlug, router]);

  // Atualizar atividade em eventos do usuário
  // IMPORTANTE: Esta detecção funciona em TODAS as abas do navegador
  // Atividade em outras abas também conta como atividade do usuário
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      const handleActivity = () => {
        updateActivity();
      };

      events.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
      };
    }
  }, [isLoading, isAuthenticated, updateActivity]);

  // Não renderizar nada enquanto verifica autenticação ou se não estiver autenticado
  // Isso evita que qualquer dado vaze ou chamadas de API sejam feitas antes da verificação
  if (isLoading || !isAuthenticatedForOrg(orgSlug)) {
    return null;
  }

  // Se estiver autenticado, renderizar o conteúdo
  return <>{children}</>;
}
