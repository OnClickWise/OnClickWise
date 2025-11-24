import { useEffect, useRef, useState, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api';

export interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp?: string;
}

export interface WhatsAppInstanceStatus {
  instanceName: string;
  status: string;
  owner?: string;
  profileName?: string;
  profilePicUrl?: string;
}

export interface QRCodeUpdate {
  instanceName: string;
  qrcode: string;
  pairingCode?: string;
}

export function useWhatsAppWebSocket(
  onStatusUpdate?: (status: WhatsAppInstanceStatus) => void,
  onQRCodeUpdate?: (update: QRCodeUpdate) => void,
  onConnected?: (instanceName: string, owner?: string, profileName?: string) => void,
  onDisconnected?: (instanceName: string) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 segundos
  const PING_INTERVAL = 30000; // 30 segundos

  const connect = useCallback(() => {
    // Declarar wsUrl fora do try para estar acessível no catch
    const apiUrl = getApiBaseUrl();
    // Converter http:// para ws:// ou https:// para wss://
    const wsUrl = apiUrl.replace(/^http/, 'ws') + '/whatsapp-ws';
    
    try {
      console.log('🔌 [WebSocket] Conectando em:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ [WebSocket] Conectado com sucesso');
        setIsConnected(true);
        setReconnectAttempts(0);
        
        // Iniciar ping para manter conexão viva
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 [WebSocket] Mensagem recebida:', message);

          switch (message.type) {
            case 'connected':
              console.log('✅ [WebSocket] Conexão estabelecida:', message.data);
              break;

            case 'pong':
              // Resposta do ping, manter conexão viva
              break;

            case 'whatsapp:instance:status:update':
              console.log('🔄 [WebSocket] Atualização de status:', message.data);
              if (onStatusUpdate) {
                onStatusUpdate({
                  instanceName: message.data.instanceName as string,
                  status: message.data.status as string,
                  owner: message.data.owner as string | undefined,
                  profileName: message.data.profileName as string | undefined,
                  profilePicUrl: message.data.profilePicUrl as string | undefined
                });
              }
              break;

            case 'whatsapp:instance:qrcode:update':
              console.log('📱 [WebSocket] QR Code atualizado:', message.data);
              if (onQRCodeUpdate) {
                onQRCodeUpdate({
                  instanceName: message.data.instanceName as string,
                  qrcode: message.data.qrcode as string,
                  pairingCode: message.data.pairingCode as string | undefined
                });
              }
              break;

            case 'whatsapp:instance:connected':
              console.log('✅ [WebSocket] Instância conectada:', message.data);
              if (onConnected) {
                onConnected(
                  message.data.instanceName as string,
                  message.data.owner as string | undefined,
                  message.data.profileName as string | undefined
                );
              }
              break;

            case 'whatsapp:instance:disconnected':
              console.log('❌ [WebSocket] Instância desconectada:', message.data);
              if (onDisconnected) {
                onDisconnected(message.data.instanceName as string);
              }
              break;

            default:
              console.log('📬 [WebSocket] Mensagem não reconhecida:', message.type);
          }
        } catch (error) {
          console.error('❌ [WebSocket] Erro ao processar mensagem:', error);
        }
      };

      ws.onerror = (error) => {
        // O objeto error do WebSocket não contém informações úteis diretamente
        // Vamos logar informações mais detalhadas sobre o estado da conexão
        const wsState = ws.readyState;
        const stateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
        const stateName = stateNames[wsState] || 'UNKNOWN';
        
        console.error('❌ [WebSocket] Erro na conexão:', {
          url: wsUrl,
          readyState: wsState,
          readyStateName: stateName,
          errorEvent: error,
          errorType: error.type || 'unknown',
          errorTarget: error.target ? {
            url: (error.target as WebSocket).url,
            readyState: (error.target as WebSocket).readyState
          } : null,
          timestamp: new Date().toISOString()
        });
        
        // Logar mensagem mais amigável
        console.error(`❌ [WebSocket] Falha ao conectar em ${wsUrl}. Estado: ${stateName}`);
        console.error(`❌ [WebSocket] Verifique se o servidor WebSocket está rodando e acessível.`);
        
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('🔌 [WebSocket] Conexão fechada');
        setIsConnected(false);
        
        // Limpar intervalos
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Tentar reconectar se não excedeu o limite
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * (reconnectAttempts + 1);
          console.log(`🔄 [WebSocket] Reconectando em ${delay}ms (tentativa ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else {
          console.error('❌ [WebSocket] Máximo de tentativas de reconexão atingido');
        }
      };
    } catch (error) {
      console.error('❌ [WebSocket] Erro ao criar conexão:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        url: wsUrl,
        timestamp: new Date().toISOString()
      });
      setIsConnected(false);
      
      // Tentar reconectar após um delay se não excedeu o limite
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = RECONNECT_DELAY * (reconnectAttempts + 1);
        console.log(`🔄 [WebSocket] Tentando reconectar após erro em ${delay}ms...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, delay);
      }
    }
  }, [reconnectAttempts, onStatusUpdate, onQRCodeUpdate, onConnected, onDisconnected]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setReconnectAttempts(0);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isConnected,
    connect,
    disconnect
  };
}
