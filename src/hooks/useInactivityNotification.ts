'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useInactivityNotification(orgSlug: string) {
  const [showNotification, setShowNotification] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar se foi redirecionado por inatividade
    const urlParams = new URLSearchParams(window.location.search);
    const inactive = urlParams.get('inactive');
    
    if (inactive === 'true') {
      setShowNotification(true);
    }
  }, []);

  // Função para esconder notificação (só será chamada após login bem-sucedido)
  const hideNotification = () => {
    setShowNotification(false);
    // Remover parâmetro da URL
    const url = new URL(window.location.href);
    url.searchParams.delete('inactive');
    router.replace(url.pathname + url.search);
  };

  // Função para fechar manualmente (não remove o parâmetro da URL)
  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  const showInactivityNotification = () => {
    setShowNotification(true);
  };

  return {
    showNotification,
    handleCloseNotification,
    hideNotification,
    showInactivityNotification,
  };
}
