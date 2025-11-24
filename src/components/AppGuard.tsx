"use client"

import React, { useEffect, useState } from 'react';
import { useAppConfig } from '@/hooks/useAppConfig';
import { AlertCircle } from 'lucide-react';
import { ThemeStyles } from './ThemeStyles';

export function AppGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };
    
    checkAuth();
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, []);

  const { active, loading, uiMode } = useAppConfig(15000);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  if (active && uiMode === 1) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-md mx-4">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Sistema Temporariamente Indisponível</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Estamos realizando manutenção programada no sistema. 
            Algumas funcionalidades podem estar temporariamente indisponíveis.
          </p>
          <p className="text-sm text-muted-foreground">
            Por favor, tente novamente em alguns instantes.
          </p>
        </div>
      </div>
    );
  }

  if (active && uiMode === 2) {
    return (
      <>
        <ThemeStyles />
        {children}
      </>
    );
  }

  return <>{children}</>;
}

