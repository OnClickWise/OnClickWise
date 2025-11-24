'use client';

import { useWhatsAppWebSocket } from '@/hooks/useWhatsAppWebSocket';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export function WhatsAppWebSocketDemo() {
  const {
    isConnected,
    lastMessage,
    messages,
    connect,
    disconnect,
    clearMessages,
    reconnectAttempts,
  } = useWhatsAppWebSocket({
    url: 'ws://localhost:3000/whatsapp/ws',
    autoConnect: true,
    onMessage: (message) => {
      console.log('Nova mensagem recebida:', message);
      
      // Aqui você pode adicionar lógica customizada, como:
      // - Mostrar notificação
      // - Atualizar lista de conversas
      // - Reproduzir som de notificação
      // - Adicionar mensagem ao chat ativo
    },
    onConnect: () => {
      console.log('Conectado ao WebSocket do WhatsApp!');
    },
    onDisconnect: () => {
      console.log('Desconectado do WebSocket do WhatsApp');
    },
  });

  // Exemplo de notificação quando recebe mensagem nova
  useEffect(() => {
    if (lastMessage?.type === 'incoming_message') {
      // Reproduzir som de notificação (opcional)
      // new Audio('/notification.mp3').play();
      
      // Mostrar notificação do navegador (se permitido)
      if ('Notification' in window && Notification.permission === 'granted') {
        const from = lastMessage.data?.from || 'Desconhecido';
        const content = lastMessage.data?.content?.text || 'Nova mensagem';
        
        new Notification('Nova mensagem WhatsApp', {
          body: `De: ${from}\n${content}`,
          icon: '/whatsapp-icon.png',
        });
      }
    }
  }, [lastMessage]);

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'incoming_message':
        return 'bg-green-500';
      case 'message_status':
        return 'bg-blue-500';
      case 'connection':
        return 'bg-gray-500';
      case 'test':
        return 'bg-purple-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Status da Conexão */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">WhatsApp WebSocket</h2>
            <Badge
              className={`${
                isConnected
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
            </Badge>
            {reconnectAttempts > 0 && (
              <Badge variant="outline">
                Tentativas de reconexão: {reconnectAttempts}
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            {!isConnected ? (
              <Button onClick={connect} variant="default">
                Conectar
              </Button>
            ) : (
              <Button onClick={disconnect} variant="destructive">
                Desconectar
              </Button>
            )}
            <Button onClick={clearMessages} variant="outline">
              Limpar Mensagens
            </Button>
          </div>
        </div>

        {/* Última Mensagem */}
        {lastMessage && (
          <div className="border rounded-lg p-4 bg-muted">
            <h3 className="font-semibold mb-2">Última Mensagem:</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={getMessageTypeColor(lastMessage.type)}>
                  {lastMessage.type}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(lastMessage.timestamp).toLocaleString('pt-BR')}
                </span>
              </div>
              <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(lastMessage, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Lista de Mensagens */}
        <div className="space-y-2">
          <h3 className="font-semibold">
            Histórico de Mensagens ({messages.length}):
          </h3>
          <div className="max-h-96 overflow-auto space-y-2">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma mensagem recebida ainda
              </p>
            ) : (
              messages
                .slice()
                .reverse()
                .map((msg, index) => (
                  <div
                    key={index}
                    className="border rounded p-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getMessageTypeColor(msg.type)}>
                        {msg.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {msg.type === 'incoming_message' && msg.data && (
                      <div className="text-sm space-y-1">
                        <p>
                          <strong>De:</strong> {msg.data.from}
                        </p>
                        <p>
                          <strong>Para:</strong> {msg.data.display_phone}
                        </p>
                        <p>
                          <strong>Tipo:</strong> {msg.data.message_type}
                        </p>
                        {msg.data.content?.text && (
                          <p className="mt-2 p-2 bg-background rounded">
                            {msg.data.content.text}
                          </p>
                        )}
                      </div>
                    )}

                    {msg.type === 'message_status' && msg.data && (
                      <div className="text-sm space-y-1">
                        <p>
                          <strong>Status:</strong> {msg.data.status}
                        </p>
                        <p>
                          <strong>Message ID:</strong> {msg.data.message_id}
                        </p>
                      </div>
                    )}

                    {msg.type === 'connection' && (
                      <p className="text-sm">{msg.message}</p>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

