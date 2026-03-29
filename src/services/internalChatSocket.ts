import { io, Socket } from 'socket.io-client';
import { getAuthToken } from '@/lib/cookies';
import { getApiOrigin } from '@/lib/api-url';

let socketInstance: Socket | null = null;

function getSocketToken() {
  return getAuthToken() || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
}

export function getInternalChatSocket() {
  if (socketInstance) {
    return socketInstance;
  }

  const tokenLocalStorage = getSocketToken();

  socketInstance = io(`${getApiOrigin()}/chat`, {
    autoConnect: false,
    transports: ['websocket'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 10000,
    auth: { token: tokenLocalStorage },
  });

  socketInstance.on('connect_error', (err) => {
    console.warn('[chat-socket] connect_error:', err?.message || err);
  });

  socketInstance.on('connect', () => {
    console.info('[chat-socket] connected', socketInstance?.id);
  });

  socketInstance.on('disconnect', (reason) => {
    console.warn('[chat-socket] disconnected:', reason);
  });

  socketInstance.io.on('reconnect_attempt', (attempt) => {
    console.info('[chat-socket] reconnect_attempt:', attempt);
  });

  socketInstance.io.on('reconnect', (attempt) => {
    console.info('[chat-socket] reconnected:', attempt);
  });

  return socketInstance;
}

export function isInternalChatSocketConnected() {
  return Boolean(socketInstance?.connected);
}

export function disconnectInternalChatSocket() {
  if (!socketInstance) return;
  socketInstance.disconnect();
  socketInstance = null;
}
