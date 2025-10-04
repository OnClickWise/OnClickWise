'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  orgSlug: string;
}

export default function AuthGuard({ children, orgSlug }: AuthGuardProps) {
  const { isAuthenticatedForOrg, isLoading, redirectToOrgLogin, isAuthenticated, lastActivity, updateActivity } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticatedForOrg(orgSlug)) {
      redirectToOrgLogin(orgSlug);
    }
  }, [isLoading, isAuthenticatedForOrg, orgSlug, redirectToOrgLogin]);

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

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderizar nada (será redirecionado)
  if (!isAuthenticatedForOrg(orgSlug)) {
    return null;
  }

  // Se estiver autenticado, renderizar o conteúdo
  return <>{children}</>;
}
