"use client";

import { useEffect, useState } from "react";

interface Notification {
  id: number;
  text: string;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  // Simulação: em produção, usar WebSocket, SSE ou polling
  useEffect(() => {
    // Exemplo: buscar notificações do backend
    // fetch('/api/notifications').then(...)
    // Aqui, simula recebimento de notificação a cada 20s
    const interval = setInterval(() => {
      setNotifications(prev => [
        ...prev,
        { id: Date.now(), text: "Você foi mencionado em um cartão!", read: false }
      ]);
      setUnread(u => u + 1);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  }

  return { notifications, unread, markAllRead };
}
