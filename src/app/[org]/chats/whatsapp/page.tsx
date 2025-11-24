"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { 
  Search, 
  Send, 
  MessageCircle,
  Phone,
  Settings,
  Loader2,
  AlertCircle,
  Paperclip,
  Smile,
  ChevronDown,
  Pin,
  UserPlus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useApi } from "@/hooks/useApi"
import { useRouter } from "next/navigation"
import { LinkLeadModal } from "@/components/LinkLeadModal"
import { Lead } from "@/lib/api"

// Tipos para Evolution API
interface WhatsAppInstance {
  id: string;
  instance_name: string;
  instance_id?: string;
  status: string;
  qrcode?: string;
  meta?: {
    owner?: string;
    profileName?: string;
    profilePicUrl?: string;
  };
}

interface EvolutionChat {
  id: string;
  conversationId?: string;
  unreadCount?: number;
  pin?: number;
  name?: string;
  subject?: string;
  displayName?: string;
  pushName?: string;
  remoteJid?: string;
  jid?: string;
  lastMessage?: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    messageTimestamp?: number;
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      imageMessage?: {
        caption?: string;
        mimetype?: string;
      };
      videoMessage?: {
        caption?: string;
        mimetype?: string;
      };
      audioMessage?: {
        mimetype?: string;
      };
      documentMessage?: {
        caption?: string;
        mimetype?: string;
        fileName?: string;
      };
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
}

interface EvolutionMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  messageTimestamp?: number;
  pushName?: string;
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      caption?: string;
      mimetype?: string;
      url?: string;
      directPath?: string;
    };
    videoMessage?: {
      caption?: string;
      mimetype?: string;
      url?: string;
      directPath?: string;
    };
    audioMessage?: {
      mimetype?: string;
      url?: string;
      directPath?: string;
    };
    documentMessage?: {
      caption?: string;
      mimetype?: string;
      fileName?: string;
      url?: string;
      directPath?: string;
    };
    [key: string]: unknown;
  };
  // Cache para base64 de mídias
  _imageBase64?: string;
  _imageMimetype?: string;
  _localImageUrl?: string; // URL local da imagem baixada
  _videoBase64?: string;
  _videoMimetype?: string;
  _audioBase64?: string;
  _audioMimetype?: string;
  _documentBase64?: string;
  _documentMimetype?: string;
  [key: string]: unknown;
}

export default function WhatsAppChatsPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  const router = useRouter()
  const { apiCall, isClient } = useApi()
  
  // States
  const [instance, setInstance] = React.useState<WhatsAppInstance | null>(null)
  const [chats, setChats] = React.useState<EvolutionChat[]>([])
  const [selectedChat, setSelectedChat] = React.useState<EvolutionChat | null>(null)
  const [messages, setMessages] = React.useState<EvolutionMessage[]>([])
  const [newMessage, setNewMessage] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [loadingMessages, setLoadingMessages] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [wsConnected, setWsConnected] = React.useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [activeEmojiTab, setActiveEmojiTab] = React.useState('faces')
  const [isAtBottom, setIsAtBottom] = React.useState(true)
  const [showDebugPanel, setShowDebugPanel] = React.useState(false)
  const [apiCallsLog, setApiCallsLog] = React.useState<Array<{timestamp: string, endpoint: string, method: string}>>([])
  const [loadingImages, setLoadingImages] = React.useState<Set<string>>(new Set())
  const [failedUrls, setFailedUrls] = React.useState<Set<string>>(new Set()) // Rastrear URLs que falharam
  const [loadingOlder, setLoadingOlder] = React.useState(false)
  const [hasMoreMessages, setHasMoreMessages] = React.useState(true)
  const MESSAGES_PAGE_SIZE = 10000 // Aumentado para buscar o máximo possível de mensagens
  
  // Monitor API calls
  const logApiCall = React.useCallback((endpoint: string, method: string = 'GET') => {
    setApiCallsLog(prev => {
      const newLog = {
        timestamp: new Date().toLocaleTimeString(),
        endpoint,
        method
      }
      // Manter apenas os últimos 10
      return [newLog, ...prev].slice(0, 10)
    })
  }, [])
  
  // Lead management states
  const [isLinkLeadModalOpen, setIsLinkLeadModalOpen] = React.useState(false)
  const [currentLinkedLead, setCurrentLinkedLead] = React.useState<Lead | null>(null)
  
  // New conversation states
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = React.useState(false)
  const [newConversationNumber, setNewConversationNumber] = React.useState('')
  const [newConversationMessage, setNewConversationMessage] = React.useState('')
  const [isStartingConversation, setIsStartingConversation] = React.useState(false)
  
  // List state: pins, deletions
  const [pinned, setPinned] = React.useState<Set<string>>(new Set())
  const [hiddenChats, setHiddenChats] = React.useState<Set<string>>(new Set())
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const wsRef = React.useRef<WebSocket | EventSource | null>(null)
  const isMountedRef = React.useRef(true)
  
  // Persistence keys for localStorage
  const pinsKey = `whatsapp_pins_${org}`
  const deletedKey = `whatsapp_deleted_${org}`

  // Load saved pins/hidden from localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined' && isClient) {
      try {
        const ps = localStorage.getItem(pinsKey)
        if (ps) setPinned(new Set(JSON.parse(ps)))
        const ds = localStorage.getItem(deletedKey)
        if (ds) setHiddenChats(new Set(JSON.parse(ds)))
      } catch {}
    }
  }, [isClient, pinsKey, deletedKey])

  // Helpers to persist pins/hidden
  const persistPins = (next: Set<string>) => {
    setPinned(new Set(next))
    if (typeof window !== 'undefined') {
      localStorage.setItem(pinsKey, JSON.stringify(Array.from(next)))
    }
  }
  const persistHidden = (next: Set<string>) => {
    setHiddenChats(new Set(next))
    if (typeof window !== 'undefined') {
      localStorage.setItem(deletedKey, JSON.stringify(Array.from(next)))
    }
  }

  // Actions for dropdown menu
  const togglePin = (id: string) => {
    const next = new Set(pinned)
    if (next.has(id)) next.delete(id); else next.add(id)
    persistPins(next)
  }
  const deleteChatLocal = (id: string) => {
    const next = new Set(hiddenChats)
    next.add(id)
    persistHidden(next)
    if (selectedChat?.id === id) setSelectedChat(null)
  }

  // Scroll para última mensagem
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      if (smooth) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: "auto" })
      }
    }
  }

  // Função auxiliar para normalizar remoteJid (deve ser declarada antes de ser usada)
  // Normaliza um JID para formato canônico (@s.whatsapp.net para contato, @g.us para grupo, @lid para listas)
  const normalizeJidString = React.useCallback((rawJid: string): string => {
    if (!rawJid) return rawJid
    const jid = String(rawJid).trim()
    
    // Se já tem um formato válido de JID, processar adequadamente
    // Suporta: @s.whatsapp.net, @g.us, @c.us, @lid (listas de discussão)
    if (/@(g\.us|s\.whatsapp\.net|c\.us|lid)$/i.test(jid)) {
      // Grupos: limpar sufixos como ":0@g.us"
      if (/@g\.us$/i.test(jid)) {
        const base = jid.split('@')[0].split(':')[0].replace(/[^\d]/g, '')
        return base ? `${base}@g.us` : jid
      }
      // Listas de discussão (@lid) - manter como está
      if (/@lid$/i.test(jid)) {
        return jid
      }
      // Unificar @c.us -> @s.whatsapp.net
      if (/@c\.us$/i.test(jid)) {
        return jid.replace(/@c\.us$/i, '@s.whatsapp.net')
      }
      // @s.whatsapp.net - manter como está
      return jid
    }
    
    // Se já tem @ mas não é um formato conhecido, retornar como está
    if (jid.includes('@')) return jid
    
    // Tentar inferir o tipo baseado no número
    const numberOnly = jid.replace(/[^\d]/g, '')
    if (!numberOnly) return jid
    const looksLikeGroup = /^120\d{5,}$/.test(numberOnly)
    return looksLikeGroup ? `${numberOnly}@g.us` : `${numberOnly}@s.whatsapp.net`
  }, [])

  // Função helper para verificar se um chat é um grupo
  const isGroupChat = React.useCallback((chat: EvolutionChat): boolean => {
    const remoteJid = chat.remoteJid || chat.jid || chat.id || ''
    return remoteJid.includes('@g.us')
  }, [])

  const normalizeRemoteJid = React.useCallback((chat: EvolutionChat): string | null => {
    // Prioridade de extração:
    // 1. lastMessage.key.remoteJid (mais confiável)
    // 2. remoteJid (propriedade direta do chat)
    // 3. jid (propriedade direta do chat)
    // 4. id (pode ser o remoteJid em alguns casos)
    // 5. conversationId (último recurso)
    
    const jid = chat.lastMessage?.key?.remoteJid || 
                chat.remoteJid || 
                chat.jid ||
                chat.id || 
                chat.conversationId
    
    if (!jid) {
      console.warn('⚠️ [WhatsApp] Nenhum identificador encontrado no chat:', chat)
      return null
    }
    
    // Canonicalizar com helper
    try {
      return normalizeJidString(jid)
    } catch {
      console.warn('⚠️ [WhatsApp] Não foi possível normalizar remoteJid:', jid)
      return jid
    }
  }, [normalizeJidString])

  // Check if at bottom (will be used in scroll event listener if needed)
  // const checkIfAtBottom = () => {
  //   const messagesContainer = document.getElementById('messages-container')
  //   if (messagesContainer) {
  //     const { scrollTop, scrollHeight, clientHeight } = messagesContainer
  //     const isNearBottom = scrollHeight - scrollTop - clientHeight < 200
  //     setIsAtBottom(isNearBottom)
  //   }
  // }

  React.useEffect(() => {
    if (isAtBottom) {
      scrollToBottom(false)
    }
  }, [messages, isAtBottom])

  // Monitor scroll position to update isAtBottom
  React.useEffect(() => {
    const messagesContainer = document.getElementById('messages-container')
    if (!messagesContainer) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200
      setIsAtBottom(isNearBottom)
    }

    messagesContainer.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial position

    return () => {
      messagesContainer.removeEventListener('scroll', handleScroll)
    }
  }, [selectedChat])

  // Função para verificar status da instância diretamente na Evolution API
  const checkInstanceStatus = React.useCallback(async (instanceName: string) => {
    try {
      const response = await apiCall(`/whatsapp/instance/status/${instanceName}`)
      
      if (response.success && response.instance) {
        const state = response.instance.state
        // Normalizar o estado para minúsculas para comparação
        const stateLower = state?.toLowerCase() || ''
        
        // Mapear estados conectados para 'open'
        let mappedStatus = state
        if (stateLower === 'open' || stateLower === 'connected') {
          mappedStatus = 'open'
        } else if (stateLower === 'close' || stateLower === 'closed' || stateLower === 'disconnected') {
          mappedStatus = 'close'
        } else if (stateLower === 'connecting') {
          mappedStatus = 'connecting'
        }
        
        // Atualizar status da instância se mudou
        setInstance(prev => {
          if (prev && prev.instance_name === instanceName) {
            const newStatus = mappedStatus
            if (prev.status !== newStatus) {
              return { ...prev, status: newStatus }
            }
          }
          return prev
        })
        
        return mappedStatus
      }
    } catch (error) {
      // Erro silencioso
    }
    return null
    // Removendo apiCall da dependência para evitar loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Carregar instância (APENAS UMA VEZ ao montar o componente)
  React.useEffect(() => {
    if (!isClient) return
    
    const loadInstance = async () => {
      try {
        setLoading(true)
        const response = await apiCall('/whatsapp/instance')
        
        if (response.success && response.exists && response.instance) {
          const inst = response.instance
          setInstance(inst)
          
          // Verificar status atual na Evolution API para garantir sincronização
          await checkInstanceStatus(inst.instance_name)
        }
      } catch (error) {
        // Erro silencioso
      } finally {
        setLoading(false)
      }
    }
    
    loadInstance()
    
    // IMPORTANTE: Sem dependência de apiCall para evitar loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, checkInstanceStatus])

  // Verificar status da instância periodicamente (a cada 30 segundos)
  React.useEffect(() => {
    if (!instance?.instance_name) return
    
    // Verificar imediatamente
    checkInstanceStatus(instance.instance_name)
    
    // Configurar verificação periódica
    const statusInterval = setInterval(() => {
      checkInstanceStatus(instance.instance_name)
    }, 30000) // A cada 30 segundos
    
    return () => {
      clearInterval(statusInterval)
    }
  }, [instance?.instance_name, checkInstanceStatus])

  // Carregar chats (apenas uma vez ou quando solicitado)
  const loadChats = React.useCallback(async () => {
    if (!instance?.instance_name) {
      return Promise.resolve()
    }
    
    try {
      console.log('📋 [WhatsApp] Carregando chats da instância:', instance.instance_name)
      const response = await apiCall(`/whatsapp/instance/${instance.instance_name}/chats`)
      
      console.log('📥 [WhatsApp] Resposta dos chats:', {
        success: response.success,
        chatsCount: response.chats?.length || 0,
        hasChats: !!response.chats
      })
      
      if (response.success && response.chats) {
        console.log('✅ [WhatsApp] Chats recebidos:', response.chats.length)
        
        // Filtrar grupos (chats que contêm @g.us no JID)
        const filteredChats = response.chats.filter((chat: EvolutionChat) => {
          const isGroup = isGroupChat(chat)
          
          if (isGroup) {
            console.log('🚫 [WhatsApp] Grupo ignorado:', {
              id: chat.id,
              remoteJid: chat.remoteJid,
              jid: chat.jid,
              name: chat.name || chat.displayName || chat.pushName
            })
          }
          
          return !isGroup
        })
        
        console.log('✅ [WhatsApp] Chats após filtrar grupos:', filteredChats.length, 'de', response.chats.length)
        
        // Log do primeiro chat para debug
        if (filteredChats.length > 0) {
          console.log('📋 [WhatsApp] Exemplo de chat (primeiro):', {
            id: filteredChats[0].id,
            conversationId: filteredChats[0].conversationId,
            remoteJid: filteredChats[0].remoteJid,
            jid: filteredChats[0].jid,
            lastMessageRemoteJid: filteredChats[0].lastMessage?.key?.remoteJid,
            fullChat: filteredChats[0]
          })
        }
        setChats(filteredChats)
      } else {
        console.warn('⚠️ [WhatsApp] Nenhum chat encontrado ou erro na resposta:', response)
      }
    } catch (error) {
      console.error('❌ [WhatsApp] Erro ao carregar chats:', error)
    }
    // Removendo apiCall da dependência para evitar loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance?.instance_name])

  const normalizeRemoteJidFromLoose = React.useCallback((value: Record<string, unknown>): string | null => {
    const candidates = [
      value.remoteJid,
      value.remotejid,
      value.chatId,
      value.id,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string") {
        const normalized = normalizeJidString(candidate);
        if (normalized) {
          return normalized;
        }
      }
    }

    return null;
  }, [normalizeJidString]);

  const normalizeIncomingMessage = React.useCallback((input: unknown): EvolutionMessage | null => {
    if (!input || typeof input !== "object") {
      return null;
    }

    const candidate = input as Record<string, unknown>;

    if (!candidate.key || typeof candidate.key !== "object") {
      const remoteJidCandidate = normalizeRemoteJidFromLoose(candidate);
      const messageId = String(candidate.id ?? candidate.messageId ?? candidate.keyId ?? "");

      if (!remoteJidCandidate || !messageId) {
        return null;
      }

      return {
        key: {
          remoteJid: remoteJidCandidate,
          fromMe: Boolean(candidate.fromMe),
          id: messageId,
        },
        messageTimestamp: typeof candidate.timestamp === "number"
          ? candidate.timestamp
          : typeof candidate.messageTimestamp === "number"
            ? candidate.messageTimestamp
            : Math.floor(Date.now() / 1000),
        pushName: typeof candidate.pushName === "string" ? candidate.pushName : undefined,
        message: (candidate.message && typeof candidate.message === "object")
          ? (candidate.message as EvolutionMessage["message"])
          : {}, // Sempre retornar objeto vazio ao invés de undefined
        status: typeof candidate.status === "string" ? candidate.status : undefined,
      };
    }

    const key = candidate.key as Record<string, unknown>;
    const remoteJid = normalizeJidString(String(key.remoteJid ?? key.remotejid ?? key.chatId ?? ""));
    if (!remoteJid) {
      return null;
    }

    return {
      ...(candidate as EvolutionMessage),
      key: {
        remoteJid,
        fromMe: Boolean(key.fromMe ?? candidate.fromMe),
        id: String(key.id ?? candidate.id ?? candidate.messageId ?? candidate.keyId ?? ""),
      },
      messageTimestamp: typeof candidate.messageTimestamp === "number"
        ? candidate.messageTimestamp
        : typeof candidate.timestamp === "number"
          ? candidate.timestamp
          : Math.floor(Date.now() / 1000),
      // Garantir que message sempre seja um objeto
      message: (candidate.message && typeof candidate.message === "object")
        ? (candidate.message as EvolutionMessage["message"])
        : {},
    };
  }, [normalizeJidString, normalizeRemoteJidFromLoose]);

  const fetchMessagesFromEvolution = React.useCallback(async (
    remoteJid: string,
    options: { limit?: number; beforeTimestamp?: number } = {}
  ): Promise<EvolutionMessage[]> => {
    if (!instance?.instance_name) {
      return [];
    }

    // Usar apiCall que adiciona automaticamente o token de autenticação
    const endpoint = `/api/whatsapp/instance/${instance.instance_name}/messages/evolution`;

    const payload: Record<string, unknown> = {
      remoteJid,
      limit: options.limit ?? MESSAGES_PAGE_SIZE,
      fetchAll: true, // Buscar todas as mensagens disponíveis
    };

    if (options.beforeTimestamp) {
      payload.beforeTimestamp = options.beforeTimestamp;
    }

    try {
      logApiCall(endpoint, "POST");
    } catch {
      // noop
    }

    try {
      // Usar apiCall em vez de fetch direto para incluir autenticação automaticamente
      const response = await apiCall(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.success) {
        console.error("❌ [WhatsApp] Erro ao buscar mensagens na Evolution API:", response.error);
        return [];
      }

      // A API já retorna as mensagens normalizadas
      const rawMessages: unknown[] = Array.isArray(response.messages) ? response.messages : [];

      const normalized = rawMessages
        .map((item) => normalizeIncomingMessage(item))
        .filter((msg): msg is EvolutionMessage => Boolean(msg && msg.key && msg.key.id));

      normalized.sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0));
      return normalized;
    } catch (error) {
      console.error("❌ [WhatsApp] Falha na requisição à Evolution API:", error);
      return [];
    }
  }, [instance?.instance_name, MESSAGES_PAGE_SIZE, logApiCall, normalizeIncomingMessage, apiCall]);

  /**
   * ========================================
   * WebSocket Connection - DOCUMENTAÇÃO
   * ========================================
   * 
   * Este componente usa WebSocket para receber atualizações em tempo real.
   * 
   * EVENTOS RECEBIDOS DO BACKEND:
   * 
   * 1. whatsapp:message:new - Nova mensagem recebida
   *    { type: 'whatsapp:message:new', data: { instanceName, remoteJid, message } }
   * 
   * 2. whatsapp:chat:update - Chat atualizado
   *    { type: 'whatsapp:chat:update', data: { instanceName, chat } }
   * 
   * 3. whatsapp:instance:status:update - Status da instância mudou
   *    { type: 'whatsapp:instance:status:update', data: { instanceName, status } }
   * 
   * IMPORTANTE: Com WebSocket, NÃO é necessário fazer polling para:
   * - Novas mensagens
   * - Atualizações de chat
   * - Status da instância
   * 
   * Tudo é atualizado automaticamente via WebSocket!
   * ========================================
   */

  // Marcar componente como montado/desmontado
  React.useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Conectar via Server-Sent Events (SSE) - o backend usa SSE, não WebSocket
  React.useEffect(() => {
    if (!isClient || !instance) return

    // Construir URL do SSE - usar /whatsapp-ws que é o endpoint SSE
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const fullWsUrl = `${apiUrl}/api/whatsapp-ws`
    
    let eventSource: EventSource
    try {
      eventSource = new EventSource(fullWsUrl)
    } catch (createError) {
      if (isMountedRef.current) {
        setWsConnected(false)
      }
      console.error('❌ [WhatsApp] Erro ao criar EventSource:', createError)
      return
    }
    
    eventSource.onopen = () => {
      if (isMountedRef.current) {
        setWsConnected(true)
        console.log('✅ [WhatsApp] Conectado via SSE em:', fullWsUrl)
      }
    }
    
    eventSource.onerror = (error) => {
      // Só atualizar estado se o componente ainda estiver montado
      if (isMountedRef.current) {
        console.error('❌ [WhatsApp] Erro no SSE:', {
          readyState: eventSource.readyState,
          url: fullWsUrl,
          error: error
        })
        
        // EventSource.readyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
        if (eventSource.readyState === EventSource.CLOSED) {
          setWsConnected(false)
          console.warn('⚠️ [WhatsApp] SSE fechado, tentando reconectar em 3 segundos...')
          
          // Tentar reconectar após 3 segundos
          setTimeout(() => {
            if (isMountedRef.current && instance) {
              console.log('🔄 [WhatsApp] Tentando reconectar SSE...')
              eventSource.close()
              // O useEffect será executado novamente se instance ainda existir
            }
          }, 3000)
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          console.log('🔄 [WhatsApp] SSE reconectando...')
          setWsConnected(false)
        }
      }
    }
    
    eventSource.onmessage = (event) => {
      // Verificar se o componente ainda está montado antes de processar
      if (!isMountedRef.current) {
        return
      }
      
      // Verificar se o EventSource ainda está aberto
      if (eventSource.readyState !== EventSource.OPEN) {
        return
      }
      
      try {
        // SSE envia dados no formato "data: {...}"
        const dataStr = event.data
        if (!dataStr || dataStr.trim() === '' || dataStr === 'heartbeat') {
          return // Ignorar heartbeats e dados vazios
        }
        
        const data = JSON.parse(dataStr)
        
        // Verificar novamente se ainda está montado após parse (pode ter demorado)
        if (!isMountedRef.current) {
          return
        }
        
        console.log('📨 [WhatsApp] Evento SSE recebido:', {
          type: data.type,
          hasData: !!data.data,
          dataKeys: data.data ? Object.keys(data.data) : [],
          fullEvent: data
        })
        
        // Eventos do WhatsAppStore via SSE
        if (data.type === 'whatsapp:message:new' || data.type === 'new_message') {
          // Nova mensagem recebida da Evolution API
          const { instanceName, remoteJid, message } = data.data
          
          if (!message || !message.key) {
            console.warn('⚠️ [WhatsApp] Mensagem recebida via WebSocket sem estrutura válida:', data.data)
            return
          }
          
          // Normalizar remoteJid recebido para comparação
          // O remoteJid pode vir do data.data.remoteJid ou do message.key.remoteJid
          const messageRemoteJid = message.key?.remoteJid || remoteJid
          const normalizedRemoteJid = messageRemoteJid ? normalizeJidString(messageRemoteJid) : undefined
          
          if (!normalizedRemoteJid) {
            console.warn('⚠️ [WhatsApp] Não foi possível normalizar remoteJid da mensagem:', {
              remoteJid,
              messageRemoteJid,
              messageKey: message.key
            })
            return
          }
          
          // Verificar se é o chat atual selecionado
          // Comparar remoteJid de diferentes formas possíveis usando a função de normalização
          let isCurrentChat = false
          if (selectedChat && instance?.instance_name === instanceName) {
            const selectedChatRemoteJid = normalizeRemoteJid(selectedChat)
            if (selectedChatRemoteJid) {
              // Comparar os remoteJids normalizados (mais flexível)
              const normalizedSelected = normalizeJidString(selectedChatRemoteJid)
              isCurrentChat = normalizedSelected === normalizedRemoteJid ||
                              normalizeJidString(selectedChat.lastMessage?.key?.remoteJid || '') === normalizedRemoteJid ||
                              normalizeJidString((selectedChat.remoteJid as string) || '') === normalizedRemoteJid ||
                              normalizeJidString((selectedChat.jid as string) || '') === normalizedRemoteJid ||
                              normalizeJidString((selectedChat.id as string) || '') === normalizedRemoteJid ||
                              normalizeJidString((selectedChat.conversationId as string) || '') === normalizedRemoteJid
              
              // Também verificar se o remoteJid da mensagem corresponde ao chat selecionado
              if (!isCurrentChat && message.key?.remoteJid) {
                const messageJidNormalized = normalizeJidString(message.key.remoteJid)
                isCurrentChat = normalizedSelected === messageJidNormalized ||
                                selectedChatRemoteJid === messageJidNormalized
              }
            }
          }
          
          console.log('💬 [WhatsApp] Nova mensagem recebida via WebSocket:', {
            instanceName,
            remoteJid,
            messageRemoteJid: message.key?.remoteJid,
            normalizedRemoteJid,
            selectedChatRemoteJid: selectedChat ? normalizeRemoteJid(selectedChat) : null,
            isCurrentChat,
            messageId: message.key?.id,
            messageFromMe: message.key?.fromMe
          })
          
          // Atualizar mensagens se for o chat atual
          if (isCurrentChat && message) {
            // Verificar se ainda está montado antes de atualizar estado
            if (!isMountedRef.current) return
            
            setMessages(prev => {
              // Evitar duplicatas pelo key.id
              const exists = prev.some(m => m.key?.id === message.key?.id)
              if (exists) {
                console.log('⚠️ [WhatsApp] Mensagem duplicada ignorada:', message.key?.id)
                return prev
              }
              
              console.log('✅ [WhatsApp] Adicionando nova mensagem ao chat atual')
              console.log('✅ [WhatsApp] Mensagem antes de adicionar:', {
                id: message.key?.id,
                remoteJid: message.key?.remoteJid,
                fromMe: message.key?.fromMe,
                timestamp: message.messageTimestamp,
                text: message.message?.conversation || message.message?.extendedTextMessage?.text
              })
              
              // Adicionar e ordenar por timestamp
              const updated = [...prev, message].sort((a, b) => {
                const aTime = a.messageTimestamp || 0
                const bTime = b.messageTimestamp || 0
                return aTime - bTime
              })
              
              console.log('✅ [WhatsApp] Total de mensagens após adicionar:', updated.length)
              
              return updated
            })
            
            // Scroll para a última mensagem apenas se estiver no final
            if (isAtBottom && isMountedRef.current) {
              setTimeout(() => {
                if (isMountedRef.current) {
                  scrollToBottom(true)
                }
              }, 100)
            }
          } else if (message && instance?.instance_name === instanceName) {
            // Se não for o chat atual, mas for da mesma instância, apenas atualizar lista de chats
            // A mensagem será carregada quando o usuário selecionar o chat
            console.log('ℹ️ [WhatsApp] Mensagem recebida para outro chat, atualizando lista de chats')
          }
          
          // Sempre atualizar lista de chats para mostrar nova mensagem e atualizar contadores
          loadChats()
          
          // IMPORTANTE: Recarregar mensagens do store se o chat estiver selecionado
          // Isso garante que mensagens recebidas via webhook sejam exibidas mesmo se não chegarem via SSE
          if (selectedChat && instance?.instance_name === instanceName) {
            setTimeout(async () => {
              if (!isMountedRef.current || !selectedChat || !instance?.instance_name) return
              
              try {
                const remoteJid = normalizeRemoteJid(selectedChat)
                if (!remoteJid) return
                
                console.log('🔄 [WhatsApp] Recarregando mensagens do store após nova mensagem...')
                const url = `/whatsapp/instance/${instance.instance_name}/messages?remoteJid=${encodeURIComponent(remoteJid)}&limit=${MESSAGES_PAGE_SIZE}&order=DESC`
                const response = await apiCall(url)
                
                if (response.success && Array.isArray(response.messages)) {
                  const validMessages = response.messages.filter((m: EvolutionMessage) => m?.key)
                  const sortedMessages = [...validMessages].sort((a, b) => {
                    const aTime = a.messageTimestamp || 0
                    const bTime = b.messageTimestamp || 0
                    return aTime - bTime
                  })
                  
                  if (isMountedRef.current) {
                    setMessages(sortedMessages)
                    console.log('✅ [WhatsApp] Mensagens recarregadas do store:', sortedMessages.length)
                    
                    // Scroll para o final se estiver no final
                    if (isAtBottom) {
                      setTimeout(() => scrollToBottom(true), 100)
                    }
                  }
                }
              } catch (error) {
                console.error('❌ [WhatsApp] Erro ao recarregar mensagens:', error)
              }
            }, 500) // Pequeno delay para garantir que o store foi atualizado
          }
          
          // IMPORTANTE: Se há um chat selecionado e a mensagem é da mesma instância,
          // tentar adicionar a mensagem mesmo se a comparação inicial falhou
          // Isso garante que mensagens sejam sempre exibidas quando chegam
          if (!isCurrentChat && selectedChat && instance?.instance_name === instanceName && message && normalizedRemoteJid) {
            // Verificar novamente de forma mais flexível após um pequeno delay
            // Isso permite que o estado seja atualizado antes da comparação
            setTimeout(() => {
              // Verificar se o componente ainda está montado
              if (!isMountedRef.current) return
              
              const currentSelectedChat = selectedChat
              if (!currentSelectedChat) return
              
              const selectedChatRemoteJid = normalizeRemoteJid(currentSelectedChat)
              if (!selectedChatRemoteJid || !normalizedRemoteJid) return
              
              // Comparação mais flexível - remover caracteres especiais e comparar
              const selectedNormalized = normalizeJidString(selectedChatRemoteJid)
                .replace(/[:@]/g, '')
                .toLowerCase()
                .trim()
              const messageNormalized = normalizedRemoteJid
                .replace(/[:@]/g, '')
                .toLowerCase()
                .trim()
              
              // Verificar se os números correspondem (pode haver diferença de formato)
              const selectedNumbers = selectedNormalized.replace(/[^\d]/g, '')
              const messageNumbers = messageNormalized.replace(/[^\d]/g, '')
              
              // Se os números correspondem ou se os JIDs normalizados são similares
              const numbersMatch = selectedNumbers && messageNumbers && 
                                   (selectedNumbers === messageNumbers || 
                                    selectedNumbers.endsWith(messageNumbers) || 
                                    messageNumbers.endsWith(selectedNumbers))
              
              const jidsMatch = selectedNormalized === messageNormalized ||
                               selectedNormalized.includes(messageNormalized) ||
                               messageNormalized.includes(selectedNormalized)
              
              if (numbersMatch || jidsMatch) {
                // Verificar se ainda está montado antes de atualizar
                if (!isMountedRef.current) return
                
                console.log('🔄 [WhatsApp] Mensagem corresponde ao chat atual (comparação flexível), adicionando...')
                
                // Adicionar mensagem ao estado atual
                setMessages(prev => {
                  const exists = prev.some(m => m.key?.id === message.key?.id)
                  if (exists) {
                    console.log('⚠️ [WhatsApp] Mensagem já existe, ignorando duplicata')
                    return prev
                  }
                  
                  console.log('✅ [WhatsApp] Adicionando mensagem após comparação flexível')
                  const updated = [...prev, message].sort((a, b) => {
                    const aTime = a.messageTimestamp || 0
                    const bTime = b.messageTimestamp || 0
                    return aTime - bTime
                  })
                  
                  return updated
                })
                
                // Scroll para a última mensagem se estiver no final
                if (isAtBottom && isMountedRef.current) {
                  setTimeout(() => {
                    if (isMountedRef.current) {
                      scrollToBottom(true)
                    }
                  }, 100)
                }
              } else {
                // Se ainda não corresponde, recarregar mensagens do banco como fallback
                // Isso garante que a mensagem seja exibida mesmo se a comparação falhar
                console.log('🔄 [WhatsApp] Recarregando mensagens do banco como fallback (comparação não correspondeu)')
                console.log('🔄 [WhatsApp] Comparação:', {
                  selectedNormalized,
                  messageNormalized,
                  selectedNumbers,
                  messageNumbers,
                  numbersMatch,
                  jidsMatch
                })
                
                const loadMessages = async () => {
                  // Verificar se o componente ainda está montado antes de fazer chamada assíncrona
                  if (!isMountedRef.current) return
                  
                  try {
                    const remoteJid = normalizeRemoteJid(currentSelectedChat)
                    if (!remoteJid || !instance?.instance_name) return
                    
                    const url = `/whatsapp/instance/${instance.instance_name}/messages?remoteJid=${encodeURIComponent(remoteJid)}&limit=${MESSAGES_PAGE_SIZE}&order=DESC`
                    const response = await apiCall(url)
                    
                    // Verificar novamente após a chamada assíncrona
                    if (!isMountedRef.current) return
                    
                    if (response.success && Array.isArray(response.messages)) {
                      const validMessages = response.messages.filter((m: EvolutionMessage) => m?.key)
                      const sortedMessages = [...validMessages].sort((a, b) => {
                        const aTime = a.messageTimestamp || 0
                        const bTime = b.messageTimestamp || 0
                        return aTime - bTime
                      })
                      setMessages(sortedMessages)
                      console.log('✅ [WhatsApp] Mensagens recarregadas do banco:', sortedMessages.length)
                      
                      // Verificar se a nova mensagem está na lista recarregada
                      const hasNewMessage = sortedMessages.some(m => m.key?.id === message.key?.id)
                      if (hasNewMessage) {
                        console.log('✅ [WhatsApp] Nova mensagem encontrada na lista recarregada!')
                      } else {
                        console.warn('⚠️ [WhatsApp] Nova mensagem não encontrada na lista recarregada. Pode ser que o remoteJid não corresponda.')
                      }
                    }
                  } catch (error) {
                    // Só logar se o componente ainda estiver montado
                    if (isMountedRef.current) {
                      console.error('❌ [WhatsApp] Erro ao recarregar mensagens:', error)
                    }
                  }
                }
                loadMessages()
              }
            }, 300)
          } else if (selectedChat && instance?.instance_name === instanceName && message) {
            // Fallback final: se há um chat selecionado mas a comparação falhou completamente,
            // recarregar mensagens após um delay maior para garantir que a mensagem seja exibida
            console.log('🔄 [WhatsApp] Fallback final: recarregando mensagens após 1 segundo')
            setTimeout(async () => {
              // Verificar se o componente ainda está montado
              if (!isMountedRef.current) return
              
              try {
                const remoteJid = normalizeRemoteJid(selectedChat)
                if (!remoteJid || !instance?.instance_name) return
                
                const url = `/whatsapp/instance/${instance.instance_name}/messages?remoteJid=${encodeURIComponent(remoteJid)}&limit=${MESSAGES_PAGE_SIZE}&order=DESC`
                const response = await apiCall(url)
                
                // Verificar novamente após a chamada assíncrona
                if (!isMountedRef.current) return
                
                if (response.success && Array.isArray(response.messages)) {
                  const validMessages = response.messages.filter((m: EvolutionMessage) => m?.key)
                  const sortedMessages = [...validMessages].sort((a, b) => {
                    const aTime = a.messageTimestamp || 0
                    const bTime = b.messageTimestamp || 0
                    return aTime - bTime
                  })
                  setMessages(sortedMessages)
                  console.log('✅ [WhatsApp] Mensagens recarregadas (fallback final):', sortedMessages.length)
                }
              } catch (error) {
                // Só logar se o componente ainda estiver montado
                if (isMountedRef.current) {
                  console.error('❌ [WhatsApp] Erro no fallback final:', error)
                }
              }
            }, 1000)
          }
        } else if (data.type === 'whatsapp:chat:new' || data.type === 'whatsapp:chat:update' || data.type === 'chat_update') {
          // Chat atualizado ou novo chat criado
          if (!isMountedRef.current) return
          console.log('🔄 [WhatsApp] Chat atualizado via SSE, recarregando lista...')
          loadChats()
          
          // Se o chat atualizado é o chat selecionado, recarregar mensagens também
          if (selectedChat && data.data?.chat) {
            const updatedChat = data.data.chat as EvolutionChat
            const selectedRemoteJid = normalizeRemoteJid(selectedChat)
            const updatedRemoteJid = normalizeRemoteJid(updatedChat)
            
            if (selectedRemoteJid && updatedRemoteJid && 
                normalizeJidString(selectedRemoteJid) === normalizeJidString(updatedRemoteJid)) {
              console.log('🔄 [WhatsApp] Chat selecionado foi atualizado, recarregando mensagens...')
              // Recarregar mensagens do store
              setTimeout(async () => {
                if (!isMountedRef.current || !selectedChat || !instance?.instance_name) return
                
                try {
                  const remoteJid = normalizeRemoteJid(selectedChat)
                  if (!remoteJid) return
                  
                  const url = `/whatsapp/instance/${instance.instance_name}/messages?remoteJid=${encodeURIComponent(remoteJid)}&limit=${MESSAGES_PAGE_SIZE}&order=DESC`
                  const response = await apiCall(url)
                  
                  if (response.success && Array.isArray(response.messages)) {
                    const validMessages = response.messages.filter((m: EvolutionMessage) => m?.key)
                    const sortedMessages = [...validMessages].sort((a, b) => {
                      const aTime = a.messageTimestamp || 0
                      const bTime = b.messageTimestamp || 0
                      return aTime - bTime
                    })
                    
                    if (isMountedRef.current) {
                      setMessages(sortedMessages)
                      console.log('✅ [WhatsApp] Mensagens recarregadas após atualização de chat:', sortedMessages.length)
                    }
                  }
                } catch (error) {
                  console.error('❌ [WhatsApp] Erro ao recarregar mensagens após atualização de chat:', error)
                }
              }, 300)
            }
          }
        } else if (data.type === 'whatsapp:instance:status:update' || data.type === 'instance_status') {
          // Atualizar status da instância
          if (!isMountedRef.current) return
          console.log('🔄 [WhatsApp] Atualização de status recebida via WebSocket:', data.data)
          if (data.data) {
            const { instanceName, status } = data.data
            const state = status || data.data.state
            
            // Só atualizar se for a instância atual
            if (instanceName && instance?.instance_name === instanceName && isMountedRef.current) {
              // Normalizar e mapear o estado
              const stateLower = (state || '').toLowerCase()
              let mappedStatus = state
              if (stateLower === 'open' || stateLower === 'connected' || stateLower === 'ready') {
                mappedStatus = 'open'
              } else if (stateLower === 'close' || stateLower === 'closed' || stateLower === 'disconnected') {
                mappedStatus = 'close'
              } else if (stateLower === 'connecting') {
                mappedStatus = 'connecting'
              }
              
              console.log(`✅ [WhatsApp] Atualizando status da instância: ${instance.status} → ${mappedStatus}`)
              
              setInstance(prev => {
                if (!prev || prev.instance_name !== instanceName) return prev
                if (prev.status !== mappedStatus) {
                  return { ...prev, status: mappedStatus }
                }
                return prev
              })
            }
          }
        } else if (data.type === 'whatsapp:instance:connected') {
          // Instância conectada
          if (!isMountedRef.current) return
          console.log('✅ [WhatsApp] Instância conectada via WebSocket:', data.data)
          if (data.data) {
            const { instanceName } = data.data
            if (instanceName && instance?.instance_name === instanceName && isMountedRef.current) {
              setInstance(prev => {
                if (!prev || prev.instance_name !== instanceName) return prev
                if (prev.status !== 'open') {
                  console.log(`✅ [WhatsApp] Atualizando status para 'open' após conexão`)
                  return { ...prev, status: 'open' }
                }
                return prev
              })
              // Recarregar chats quando conectar
              if (isMountedRef.current) {
                loadChats()
              }
            }
          }
        } else if (data.type === 'whatsapp:instance:disconnected') {
          // Instância desconectada
          if (!isMountedRef.current) return
          console.log('❌ [WhatsApp] Instância desconectada via WebSocket:', data.data)
          if (data.data) {
            const { instanceName } = data.data
            if (instanceName && instance?.instance_name === instanceName && isMountedRef.current) {
              setInstance(prev => {
                if (!prev || prev.instance_name !== instanceName) return prev
                if (prev.status !== 'close') {
                  console.log(`❌ [WhatsApp] Atualizando status para 'close' após desconexão`)
                  return { ...prev, status: 'close' }
                }
                return prev
              })
            }
          }
        } else if (data.type === 'connected') {
          // Mensagem de boas-vindas do WebSocket
          if (isMountedRef.current) {
            console.log('✅ [WhatsApp] Conectado ao WebSocket:', data.data)
          }
        } else if (data.type === 'pong') {
          // Resposta do ping
          // Não fazer nada, apenas manter conexão viva
        } else {
          if (isMountedRef.current) {
            console.log('📬 [WhatsApp] Evento WebSocket não reconhecido:', data.type, data)
          }
        }
      } catch (error) {
        // Só logar se o componente ainda estiver montado
        if (isMountedRef.current) {
          console.error('❌ [WhatsApp] Erro ao processar mensagem WebSocket:', error)
        }
      }
    }
    
    eventSource.onerror = (error) => {
      // Só atualizar estado se o componente ainda estiver montado
      if (isMountedRef.current) {
        const readyStateText = eventSource.readyState === EventSource.CONNECTING ? 'CONNECTING' :
                              eventSource.readyState === EventSource.OPEN ? 'OPEN' :
                              eventSource.readyState === EventSource.CLOSED ? 'CLOSED' : 'UNKNOWN'
        
        console.error('❌ [WhatsApp] Erro no SSE:', {
          readyState: eventSource.readyState,
          readyStateText,
          url: fullWsUrl,
          error: error,
          timestamp: new Date().toISOString()
        })
        
        setWsConnected(false)
        
        // EventSource.readyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
        if (eventSource.readyState === EventSource.CLOSED) {
          console.warn('⚠️ [WhatsApp] SSE fechado, tentando reconectar em 3 segundos...')
          
          // Tentar reconectar após 3 segundos
          setTimeout(() => {
            if (isMountedRef.current && instance) {
              console.log('🔄 [WhatsApp] Tentando reconectar SSE...')
              try {
                eventSource.close()
              } catch (e) {
                // Já fechado, ignorar
              }
              // O useEffect será executado novamente se instance ainda existir
            }
          }, 3000)
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          console.log('🔄 [WhatsApp] SSE reconectando automaticamente...')
        }
      }
    }
    
    wsRef.current = eventSource

    return () => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        try {
          eventSource.close()
        } catch (closeError) {
          // Erro silencioso
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, instance, selectedChat, normalizeRemoteJid, normalizeJidString, isAtBottom, loadChats])

  // Carregar chats inicialmente (APENAS UMA VEZ quando a instância for carregada)
  React.useEffect(() => {
    if (!isClient || !instance?.instance_name) return
    
    loadChats()
    
    // Não adicionar loadChats nas dependências para evitar loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, instance?.instance_name])

  // Ref para rastrear se o carregamento foi cancelado
  const loadMessagesCancelRef = React.useRef(false)
  
  // Carregar mensagens do chat selecionado
  React.useEffect(() => {
    // Cancelar carregamento anterior se houver
    loadMessagesCancelRef.current = true
    
    if (!selectedChat || !instance?.instance_name) {
      setMessages([])
      return
    }
    
    // Resetar flag de cancelamento para este carregamento
    loadMessagesCancelRef.current = false
    
    const loadMessages = async () => {
      try {
        setLoadingMessages(true)
        
        // Normalizar remoteJid
        const remoteJid = normalizeRemoteJid(selectedChat)
        
        console.log('🔍 [WhatsApp] Carregando mensagens do store para chat:', {
          selectedChatId: selectedChat.id,
          selectedChatConversationId: selectedChat.conversationId,
          normalizedRemoteJid: remoteJid,
          instanceName: instance.instance_name
        })
        
        if (!remoteJid) {
          console.error('❌ [WhatsApp] remoteJid não encontrado no chat:', selectedChat)
          if (!loadMessagesCancelRef.current) setMessages([])
          return
        }
        
        const url = `/whatsapp/instance/${instance.instance_name}/messages?remoteJid=${encodeURIComponent(remoteJid)}&limit=${MESSAGES_PAGE_SIZE}&order=DESC`
        console.log('📡 [WhatsApp] Buscando mensagens na URL:', url)
        
        const response = await apiCall(url)
        
        if (loadMessagesCancelRef.current) return
        
        console.log('📥 [WhatsApp] Resposta da API (resumo):', {
          success: response.success,
          messagesCount: response.messages?.length || 0,
          hasMessages: !!response.messages,
          isArray: Array.isArray(response.messages)
        })
        
        if (response.success) {
          // Verificar se há mensagens (pode ser array vazio)
          let messagesArray: EvolutionMessage[] = (response.messages as EvolutionMessage[]) || []
          let usedEvolutionFallback = false
          
          console.log('✅ [WhatsApp] Mensagens recebidas do store:', messagesArray.length)
          
          // Sempre tentar carregar da Evolution API se o store estiver vazio ou se houver poucas mensagens
          if (messagesArray.length === 0) {
            console.warn('⚠️ [WhatsApp] Nenhuma mensagem no cache local, tentando Evolution API diretamente...')
            const fallbackMessages = await fetchMessagesFromEvolution(remoteJid, { limit: MESSAGES_PAGE_SIZE })
            if (loadMessagesCancelRef.current) return
            if (fallbackMessages.length > 0) {
              messagesArray = fallbackMessages
              usedEvolutionFallback = true
              console.log('✅ [WhatsApp] Mensagens recuperadas via Evolution API:', fallbackMessages.length)
            } else {
              console.warn('⚠️ [WhatsApp] Nenhuma mensagem encontrada na Evolution API para:', remoteJid)
            }
          }

          if (loadMessagesCancelRef.current) return

          if (messagesArray.length === 0) {
            console.warn('⚠️ [WhatsApp] Array de mensagens está vazio para remoteJid:', remoteJid)
            if (!loadMessagesCancelRef.current) {
              setMessages([])
              setHasMoreMessages(false)
            }
            return
          }
          
          // Normalizar e filtrar mensagens válidas (que têm key)
          const validMessages = messagesArray
            .filter((msg: EvolutionMessage) => {
              return msg && msg.key
            })
            .map((msg: EvolutionMessage) => {
              // Garantir que a estrutura da mensagem está correta
              // Se message não existe ou não é um objeto, criar um objeto vazio
              if (!msg.message || typeof msg.message !== 'object') {
                console.warn('⚠️ [WhatsApp] Mensagem sem campo message válido, normalizando:', {
                  messageId: msg.key?.id,
                  hasMessage: !!msg.message,
                  messageType: typeof msg.message,
                  originalMessage: msg
                })
                return {
                  ...msg,
                  message: msg.message || {}
                }
              }
              return msg
            })
          
          console.log('✅ [WhatsApp] Mensagens válidas após filtro e normalização:', validMessages.length, 'de', messagesArray.length)
          
          // Debug: Verificar quantas mensagens têm mídia
          const messagesWithMedia = validMessages.filter((msg: EvolutionMessage) => {
            return !!(msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.audioMessage || msg.message?.documentMessage)
          })
          console.log('📸 [WhatsApp] Mensagens com mídia detectadas:', messagesWithMedia.length)
          
          // Ordenar mensagens por timestamp (mais antigas primeiro)
          const sortedMessages = [...validMessages].sort((a, b) => {
            const aTime = a.messageTimestamp || 0
            const bTime = b.messageTimestamp || 0
            return aTime - bTime
          })
          
          console.log('✅ [WhatsApp] Mensagens ordenadas:', sortedMessages.length)
          
          if (!loadMessagesCancelRef.current) {
            setMessages(sortedMessages)
            // Como estamos buscando todas as mensagens (fetchAll), não há mais mensagens antigas
            setHasMoreMessages(false)
          }
        } else {
          console.error('❌ [WhatsApp] Erro na resposta da API:', response.error)
          
          if (loadMessagesCancelRef.current) return
          
          console.warn('⚠️ [WhatsApp] Tentando carregamento direto da Evolution API após falha...')
          const fallbackMessages = await fetchMessagesFromEvolution(remoteJid)
          if (loadMessagesCancelRef.current) return
          if (fallbackMessages.length > 0) {
            setMessages(fallbackMessages)
            setHasMoreMessages(false)
          } else {
            setMessages([])
          }
        }
      } catch (error) {
        if (loadMessagesCancelRef.current) return
        console.error('❌ [WhatsApp] Erro ao carregar mensagens:', error)
        setMessages([])
      } finally {
        if (!loadMessagesCancelRef.current) {
          setLoadingMessages(false)
        }
      }
    }
    
    loadMessages()
    
    // Cleanup function para cancelar se o componente desmontar ou o chat mudar
    return () => {
      loadMessagesCancelRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Usar apenas valores primitivos estáveis como dependências
    selectedChat?.id,
    selectedChat?.conversationId,
    instance?.instance_name
  ])

  // Ref para rastrear IDs das mensagens atuais (para polling)
  const lastMessageIdsRef = React.useRef<Set<string>>(new Set())
  
  // Atualizar referência dos IDs das mensagens atuais
  React.useEffect(() => {
    const currentIds = new Set(messages.map(m => m.key?.id).filter(Boolean) as string[])
    lastMessageIdsRef.current = currentIds
  }, [messages])

  // Polling automático para verificar novas mensagens (fallback caso SSE não funcione)
  // Apenas ativo se SSE não estiver conectado
  React.useEffect(() => {
    if (!selectedChat || !instance?.instance_name || !isMountedRef.current) return
    
    // Se SSE estiver conectado, não fazer polling (evitar requisições desnecessárias)
    if (wsConnected) {
      return
    }

    const POLLING_INTERVAL = 10000 // Verificar a cada 10 segundos (aumentado para reduzir carga)
    
    const pollForNewMessages = async () => {
      if (!isMountedRef.current || !selectedChat || !instance?.instance_name) return
      
      try {
        const remoteJid = normalizeRemoteJid(selectedChat)
        if (!remoteJid) return

        // Buscar todas as mensagens (o store já filtra e ordena)
        const url = `/whatsapp/instance/${instance.instance_name}/messages?remoteJid=${encodeURIComponent(remoteJid)}&limit=${MESSAGES_PAGE_SIZE}&order=DESC`
        
        const response = await apiCall(url)
        
        if (!isMountedRef.current) return
        
        if (response.success && Array.isArray(response.messages) && response.messages.length > 0) {
          const allMessages = (response.messages as EvolutionMessage[])
            .filter((m: EvolutionMessage) => m?.key)
          
          // Identificar novas mensagens comparando IDs
          const currentIds = lastMessageIdsRef.current
          const newMessages = allMessages.filter((m: EvolutionMessage) => {
            const messageId = m.key?.id
            return messageId && !currentIds.has(messageId)
          })
          
          if (newMessages.length > 0) {
            console.log('🔄 [WhatsApp] Novas mensagens encontradas via polling:', newMessages.length)
            
            // Atualizar referência de IDs
            newMessages.forEach(m => {
              if (m.key?.id) {
                currentIds.add(m.key.id)
              }
            })
            
            // Recarregar todas as mensagens ordenadas
            const sortedMessages = [...allMessages].sort((a, b) => {
              const aTime = a.messageTimestamp || 0
              const bTime = b.messageTimestamp || 0
              return aTime - bTime
            })
            
            setMessages(sortedMessages)
            
            // Scroll para o final se estiver no final
            if (isAtBottom) {
              setTimeout(() => scrollToBottom(true), 100)
            }
            
            // Atualizar lista de chats
            loadChats()
          }
        }
      } catch (error) {
        console.error('❌ [WhatsApp] Erro no polling de mensagens:', error)
      }
    }

    // Iniciar polling
    const intervalId = setInterval(pollForNewMessages, POLLING_INTERVAL)
    
    // Executar imediatamente também
    pollForNewMessages()
    
    return () => {
      clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?.id, selectedChat?.conversationId, instance?.instance_name, wsConnected])

  // Carregar mensagens mais antigas (prepend) usando o timestamp da primeira mensagem atual
  const loadOlderMessages = React.useCallback(async () => {
    if (!selectedChat || !instance?.instance_name || loadingOlder || messages.length === 0) return
    const firstMessage = messages[0]
    const beforeTs = firstMessage?.messageTimestamp
    if (!beforeTs) return
    try {
      setLoadingOlder(true)
      const remoteJid = normalizeRemoteJid(selectedChat)
      if (!remoteJid) return
      const url = `/whatsapp/instance/${instance.instance_name}/messages?remoteJid=${encodeURIComponent(remoteJid)}&limit=${MESSAGES_PAGE_SIZE}&order=DESC&beforeTimestamp=${beforeTs}`
      const response = await apiCall(url)
      if (response.success && Array.isArray(response.messages)) {
        let batch = (response.messages as EvolutionMessage[]).filter(m => m?.key).sort((a, b) => {
          const aTime = a.messageTimestamp || 0
          const bTime = b.messageTimestamp || 0
          return aTime - bTime
        })

        if (batch.length === 0) {
          console.warn('⚠️ [WhatsApp] Sem mensagens adicionais no cache local, tentando Evolution API...')
          batch = await fetchMessagesFromEvolution(remoteJid, { limit: MESSAGES_PAGE_SIZE, beforeTimestamp: beforeTs })
        }

        if (batch.length === 0) {
          setHasMoreMessages(false)
          return
        }
        setMessages(prev => {
          // Evitar duplicatas pelo key.id
          const ids = new Set(prev.map(m => m.key?.id))
          const merged = [...batch.filter(m => !ids.has(m.key?.id)), ...prev]
          merged.sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0))
          return merged
        })
        setHasMoreMessages(batch.length === MESSAGES_PAGE_SIZE)
      } else {
        console.warn('⚠️ [WhatsApp] Falha ao carregar mensagens antigas via cache local, tentando Evolution API...')
        const batch = await fetchMessagesFromEvolution(remoteJid, { limit: MESSAGES_PAGE_SIZE, beforeTimestamp: beforeTs })
        if (batch.length > 0) {
          setMessages(prev => {
            const ids = new Set(prev.map(m => m.key?.id))
            const merged = [...batch.filter(m => !ids.has(m.key?.id)), ...prev]
            merged.sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0))
            return merged
          })
          setHasMoreMessages(batch.length === MESSAGES_PAGE_SIZE)
        } else {
          setHasMoreMessages(false)
        }
      }
    } catch (e) {
      console.error('❌ [WhatsApp] Erro ao carregar mensagens antigas:', e)
    } finally {
      setLoadingOlder(false)
    }
  }, [selectedChat, instance?.instance_name, loadingOlder, messages, normalizeRemoteJid, MESSAGES_PAGE_SIZE, apiCall, fetchMessagesFromEvolution])

  // Extrair número do remoteJid para envio
  const extractNumberFromJid = (jid: string): string => {
    if (!jid) return ''
    // Formato: 5511999999999@s.whatsapp.net ou 5511999999999:0@g.us
    // Extrair número antes do @
    const match = jid.match(/^(\d+)@/)
    if (match && match[1]) {
      return match[1]
    }
    // Se não encontrar, retornar o próprio jid
    return jid
  }

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !instance || !selectedChat) return
    
    try {
      setSending(true)
      
      // Verificar status da instância em tempo real antes de enviar
      // Isso garante que temos o status mais atualizado
      let currentStatus = instance.status
      let statusCheckFailed = false
      let statusCheckReturnedNull = false
      
      if (instance?.instance_name) {
        try {
          console.log('🔍 [WhatsApp] Verificando status da instância antes de enviar mensagem...')
          const statusResponse = await apiCall(`/whatsapp/instance/status/${instance.instance_name}`)
          
          if (statusResponse.success && statusResponse.instance) {
            const state = statusResponse.instance.state
            
            // Se state for null ou undefined, considerar como falha
            if (state === null || state === undefined) {
              console.warn('⚠️ [WhatsApp] Status retornado é null/undefined, usando status local')
              statusCheckReturnedNull = true
              statusCheckFailed = true
            } else {
              const stateLower = state?.toLowerCase() || ''
              
              console.log('🔍 [WhatsApp] Estado retornado pela API:', {
                state,
                stateLower,
                instanceFull: statusResponse.instance
              })
              
              // Mapear estados conectados (mais abrangente)
              // A Evolution API pode retornar diferentes variações
              if (stateLower === 'open' || 
                  stateLower === 'connected' || 
                  stateLower === 'ready' ||
                  state === 'open' ||
                  state === 'CONNECTED' ||
                  state === 'OPEN') {
                currentStatus = 'open'
                console.log('✅ [WhatsApp] Instância está conectada (mapeado para "open")')
              } else if (stateLower === 'close' || 
                         stateLower === 'closed' || 
                         stateLower === 'disconnected' ||
                         state === 'CLOSED' ||
                         state === 'DISCONNECTED') {
                currentStatus = 'close'
                console.log('❌ [WhatsApp] Instância está desconectada (mapeado para "close")')
              } else {
                currentStatus = state
                console.log(`⚠️ [WhatsApp] Status desconhecido, usando valor original: ${state}`)
              }
              
              // Atualizar status local se mudou
              if (currentStatus !== instance.status) {
                setInstance(prev => prev ? { ...prev, status: currentStatus } : prev)
                console.log(`🔄 [WhatsApp] Status atualizado: ${instance.status} → ${currentStatus}`)
              }
            }
          } else {
            console.warn('⚠️ [WhatsApp] Resposta de status não contém instance:', statusResponse)
            statusCheckFailed = true
          }
        } catch (statusError) {
          console.warn('⚠️ [WhatsApp] Erro ao verificar status, usando status local:', statusError)
          statusCheckFailed = true
          // Continuar com o status local se a verificação falhar
        }
      }
      
      // Verificar se está conectada - priorizar status local se verificação falhou ou retornou null
      const statusToCheck = (statusCheckFailed || statusCheckReturnedNull) ? instance.status : currentStatus
      const statusLower = statusToCheck?.toLowerCase() || ''
      const isConnected = statusLower === 'open' || 
                          statusLower === 'connected' ||
                          statusLower === 'ready' ||
                          statusToCheck === 'open' || 
                          statusToCheck === 'CONNECTED' || 
                          statusToCheck === 'connected' ||
                          statusToCheck === 'OPEN' ||
                          statusToCheck === 'READY'
      
      console.log('🔍 [WhatsApp] Verificação de conexão:', {
        statusLocal: instance.status,
        statusVerificado: currentStatus,
        statusUsado: statusToCheck,
        statusLower,
        isConnected,
        statusCheckFailed,
        statusCheckReturnedNull,
        instanceName: instance.instance_name
      })
      
      // Se a verificação falhou ou retornou null, confiar no status local
      if (statusCheckFailed || statusCheckReturnedNull) {
        console.log('⚠️ [WhatsApp] Verificação de status falhou ou retornou null, usando status local como referência')
        const localStatusLower = instance.status?.toLowerCase() || ''
        const localIsConnected = localStatusLower === 'open' || 
                                 localStatusLower === 'connected' ||
                                 localStatusLower === 'ready' ||
                                 instance.status === 'open' ||
                                 instance.status === 'CONNECTED' ||
                                 instance.status === 'OPEN' ||
                                 instance.status === 'READY'
        
        // Se status local indica conectado, permitir envio
        if (localIsConnected) {
          console.log('✅ [WhatsApp] Status local indica conectado, prosseguindo com envio')
          // Continuar com o envio usando status local
        } else {
          // Se status local não indica conectado, mas a verificação falhou/retornou null,
          // pode ser que a instância tenha conectado mas o status não foi atualizado ainda
          // Permitir tentar enviar - se realmente não estiver conectada, a Evolution API retornará erro
          console.warn('⚠️ [WhatsApp] Status local não indica conectado, mas verificação falhou/retornou null')
          console.warn('⚠️ [WhatsApp] Permitindo tentativa de envio - se não estiver conectada, a API retornará erro')
          console.warn('⚠️ [WhatsApp] Isso pode ser um problema de sincronização de status')
          // Continuar com o envio - deixar a Evolution API decidir
        }
      } else if (!isConnected) {
        // Verificação funcionou mas indica desconectado
        console.warn('⚠️ [WhatsApp] Status verificado indica desconectado:', currentStatus)
        
        // Verificar se status local indica conectado (fallback)
        const localStatusLower = instance.status?.toLowerCase() || ''
        const localIsConnected = localStatusLower === 'open' || 
                                 localStatusLower === 'connected' ||
                                 localStatusLower === 'ready' ||
                                 instance.status === 'open' ||
                                 instance.status === 'CONNECTED' ||
                                 instance.status === 'OPEN' ||
                                 instance.status === 'READY'
        
        if (localIsConnected) {
          console.warn('⚠️ [WhatsApp] Status verificado indica desconectado, mas status local indica conectado')
          console.warn('⚠️ [WhatsApp] Continuando com envio usando status local como fallback')
          // Continuar com o envio usando o status local como fallback
        } else {
          // Ambos indicam desconectado - bloquear envio
          alert(`⚠️ A instância do WhatsApp não está conectada (Status verificado: ${currentStatus || 'null'}, Status local: ${instance.status}).\n\nConecte-a primeiro antes de enviar mensagens.\n\nVocê pode verificar o status em Configurações > WhatsApp.`)
          setSending(false)
          return
        }
      } else {
        console.log('✅ [WhatsApp] Instância está conectada, prosseguindo com envio')
      }
      
      // Obter remoteJid do chat selecionado usando a função de normalização
      const remoteJid = normalizeRemoteJid(selectedChat)
      
      if (!remoteJid) {
        console.error('❌ [WhatsApp] Não foi possível obter remoteJid do chat selecionado')
        alert('❌ Erro: Não foi possível identificar o destinatário da mensagem.')
        setSending(false)
        return
      }
      
      // Extrair número do remoteJid
      // Para a Evolution API, precisamos do número sem o sufixo @s.whatsapp.net ou @g.us
      // Para grupos, usar o ID do grupo (número antes de @g.us)
      // Para contatos individuais, usar o número antes de @s.whatsapp.net
      let number: string
      
      if (remoteJid.includes('@g.us')) {
        // Grupo: extrair o número/ID antes de @g.us
        // Formato: 120363400146352860@g.us -> 120363400146352860
        const groupId = remoteJid.split('@')[0]
        // Se tiver : no ID (como 120363400146352860:0), pegar apenas a primeira parte
        number = groupId.split(':')[0]
        console.log('📤 [WhatsApp] Enviando para grupo. ID do grupo:', number)
      } else if (remoteJid.includes('@s.whatsapp.net')) {
        // Contato individual: extrair o número antes de @s.whatsapp.net
        number = extractNumberFromJid(remoteJid)
      } else {
        // Se não tem @, usar o próprio valor (pode ser apenas o número)
        number = remoteJid.replace(/[^\d]/g, '')
      }
      
      if (!number) {
        console.error('❌ [WhatsApp] Não foi possível extrair número do remoteJid:', remoteJid)
        return
      }
      
      console.log('📤 [WhatsApp] Número extraído para envio:', number)
      
      const messageText = newMessage.trim()
      const messageTextToSend = messageText
      
      console.log('📤 [WhatsApp] Enviando mensagem:', {
        instanceName: instance.instance_name,
        number,
        remoteJid,
        messageText: messageTextToSend.substring(0, 50)
      })
      
      // Enviar mensagem diretamente para Evolution API
      const evolutionBaseUrl = (process.env.NEXT_PUBLIC_EVOLUTION_URL || 'http://localhost:8080').replace(/\/$/, '')
      const evolutionApiKey = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || 'B6D9F640-6F4D-490F-86FE-4FB6F5AC5F8A'
      const evolutionEndpoint = `${evolutionBaseUrl}/message/sendText/${instance.instance_name}`
      try { logApiCall(evolutionEndpoint, 'POST') } catch {}
      const evolutionFetchResponse = await fetch(evolutionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apiKey': evolutionApiKey
        },
        body: JSON.stringify({
          number,
          text: messageTextToSend
        })
      })
      const response: Record<string, unknown> = await evolutionFetchResponse.json().catch(() => ({} as Record<string, unknown>))
      
      console.log('📥 [WhatsApp] Resposta do envio (Evolution):', {
        httpOk: evolutionFetchResponse.ok,
        status: evolutionFetchResponse.status,
        response
      })
      
      if (evolutionFetchResponse.ok) {
        // Salvar o texto da mensagem antes de limpar
        const sentMessageText = messageTextToSend
        
        // Limpar campo de mensagem
        setNewMessage('')
        
        // Adicionar mensagem enviada imediatamente à lista (otimista)
        const r = response as { data?: { id?: string }, message?: { key?: { id?: string } }, id?: string, error?: string }
        const generatedId =
          r?.data?.id ||
          r?.message?.key?.id ||
          r?.id ||
          `sent-${Date.now()}`
        const nowTs = Math.floor(Date.now() / 1000)
        const sentMessage: EvolutionMessage = {
          key: {
            remoteJid,
            fromMe: true,
            id: String(generatedId)
          },
          message: {
            conversation: sentMessageText,
            extendedTextMessage: {
              text: sentMessageText
            }
          },
          messageTimestamp: nowTs,
          pushName: selectedChat.lastMessage?.pushName || selectedChat.pushName
        }
        setMessages(prev => {
          const exists = prev.some(m => m.key?.id === sentMessage.key?.id)
          if (exists) return prev
          const updated = [...prev, sentMessage].sort((a, b) => {
            const aTime = a.messageTimestamp || 0
            const bTime = b.messageTimestamp || 0
            return aTime - bTime
          })
          return updated
        })
        setTimeout(() => scrollToBottom(true), 100)
        setTimeout(() => {
          loadChats()
        }, 300)
      } else {
        console.error('❌ [WhatsApp] Erro ao enviar mensagem (Evolution):', response)
        
        // Mostrar mensagem de erro mais amigável
        const r = response as { error?: string, message?: unknown }
        const errorMessage = r?.error || (typeof r?.message === 'string' ? r.message : '') || `Erro HTTP ${evolutionFetchResponse.status}`
        
        // Verificar se é timeout
        if (errorMessage.includes('Timeout') || errorMessage.includes('Timed Out')) {
          console.warn('⚠️ [WhatsApp] Timeout detectado. Verificando status da instância...')
          
          // Verificar status da instância
          if (instance?.instance_name) {
            try {
              const statusResponse = await apiCall(`/whatsapp/instance/status/${instance.instance_name}`)
              if (statusResponse.success && statusResponse.instance) {
                const state = statusResponse.instance.state?.toLowerCase() || ''
                if (state !== 'open' && state !== 'connected') {
                  console.error('❌ [WhatsApp] Instância não está conectada:', state)
                  // Aqui você pode adicionar uma notificação para o usuário
                  alert('A instância do WhatsApp não está conectada. Conecte-a primeiro antes de enviar mensagens.')
                  return
                }
              }
            } catch (statusError) {
              console.error('❌ [WhatsApp] Erro ao verificar status:', statusError)
            }
          }
          
          alert('A mensagem demorou muito para ser enviada. Verifique sua conexão e se a instância está conectada, depois tente novamente.')
        } else {
          // Outro tipo de erro
          alert(`Erro ao enviar mensagem: ${errorMessage}`)
        }
      }
    } catch (error) {
      console.error('❌ [WhatsApp] Erro ao enviar mensagem:', error)
      // Aqui você pode adicionar uma notificação de erro para o usuário
    } finally {
      setSending(false)
    }
  }

  // Helper para extrair texto da mensagem (declarado antes de ser usado)
  const extractMessageText = React.useCallback((message?: EvolutionMessage['message']): string => {
    if (!message) return ''
    if (message.conversation) return message.conversation
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text
    if (message.imageMessage?.caption) return message.imageMessage.caption
    if (message.videoMessage?.caption) return message.videoMessage.caption
    if (message.documentMessage?.caption) return message.documentMessage.caption
    if (message.imageMessage) return '📷 Imagem'
    if (message.videoMessage) return '🎥 Vídeo'
    if (message.audioMessage) return '🎵 Áudio'
    if (message.documentMessage) return `📄 ${message.documentMessage.fileName || 'Documento'}`
    return 'Mensagem'
  }, [])

  // Helper para fazer download e salvar imagem localmente
  const downloadImage = React.useCallback(async (imageUrl: string, messageId: string, mimetype: string = 'image/jpeg') => {
    if (!imageUrl || loadingImages.has(messageId)) {
      return
    }

    try {
      setLoadingImages(prev => new Set(prev).add(messageId))
      console.log('📥 [WhatsApp] Fazendo download da imagem:', imageUrl)

      const response = await apiCall('/whatsapp/download-media', {
        method: 'POST',
        body: JSON.stringify({ 
          imageUrl, 
          messageId,
          mimetype 
        })
      })

      if (response.success && response.localUrl) {
        // Converter URL relativa para URL absoluta do backend
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const fullLocalUrl = response.localUrl.startsWith('http') 
          ? response.localUrl 
          : `${API_BASE_URL}${response.localUrl}`;
        
        // Atualizar mensagem com URL local
        setMessages(prev => prev.map(msg => {
          if (msg.key?.id === messageId) {
            return {
              ...msg,
              _localImageUrl: fullLocalUrl
            }
          }
          return msg
        }))
        console.log('✅ [WhatsApp] Imagem baixada e salva localmente:', fullLocalUrl)
      } else {
        console.warn('⚠️ [WhatsApp] Erro ao fazer download da imagem:', response.error)
      }
    } catch (error) {
      console.error('❌ [WhatsApp] Erro ao fazer download da imagem:', error)
    } finally {
      setLoadingImages(prev => {
        const next = new Set(prev)
        next.delete(messageId)
        return next
      })
    }
  }, [apiCall, loadingImages])

  // Helper para buscar imagem pela URL (contorna problemas de CORS)
  const fetchImageFromUrl = React.useCallback(async (imageUrl: string, messageId: string) => {
    if (!imageUrl || loadingImages.has(messageId)) {
      return
    }

    try {
      setLoadingImages(prev => new Set(prev).add(messageId))
      console.log('🔄 [WhatsApp] Buscando imagem pela URL via proxy:', imageUrl)

      const response = await apiCall('/whatsapp/fetch-image-from-url', {
        method: 'POST',
        body: JSON.stringify({ imageUrl })
      })

      if (response.success && response.base64) {
        // Atualizar mensagem com base64
        setMessages(prev => prev.map(msg => {
          if (msg.key?.id === messageId) {
            return {
              ...msg,
              _imageBase64: response.base64,
              _imageMimetype: response.mimetype || 'image/jpeg'
            }
          }
          return msg
        }))
        console.log('✅ [WhatsApp] Imagem carregada via proxy:', messageId)
      } else {
        console.warn('⚠️ [WhatsApp] Erro ao buscar imagem via proxy:', response.error)
      }
    } catch (error) {
      console.error('❌ [WhatsApp] Erro ao buscar imagem via proxy:', error)
    } finally {
      setLoadingImages(prev => {
        const next = new Set(prev)
        next.delete(messageId)
        return next
      })
    }
  }, [apiCall, loadingImages])

  // Helper para buscar base64 de mídia (imagens, vídeos, áudios, documentos)
  const fetchMediaBase64 = React.useCallback(async (message: EvolutionMessage) => {
    if (!instance?.instance_name) {
      console.warn('⚠️ [WhatsApp] Instância não disponível para buscar mídia')
      return
    }
    
    // Verificar se a mensagem tem algum tipo de mídia
    // Verificar também se message.message existe e não está vazio
    if (!message.message || typeof message.message !== 'object') {
      console.warn('⚠️ [WhatsApp] Mensagem sem campo message válido:', {
        messageId: message.key?.id,
        hasMessage: !!message.message,
        messageType: typeof message.message
      })
      return
    }
    
    const hasImage = !!message.message?.imageMessage
    const hasVideo = !!message.message?.videoMessage
    const hasAudio = !!message.message?.audioMessage
    const hasDocument = !!message.message?.documentMessage
    
    if (!hasImage && !hasVideo && !hasAudio && !hasDocument) {
      console.log('ℹ️ [WhatsApp] Mensagem não tem mídia:', {
        messageId: message.key?.id,
        messageKeys: Object.keys(message.message || {})
      })
      return
    }
    
    const messageId = message.key?.id
    if (!messageId) {
      console.warn('⚠️ [WhatsApp] Mensagem sem ID válido')
      return
    }
    
    // Se já tem base64 cacheado, não buscar novamente
    if (message._imageBase64 || message._videoBase64 || message._audioBase64 || message._documentBase64) {
      console.log('ℹ️ [WhatsApp] Mídia já está em cache:', messageId)
      return
    }
    
    // Se tem URL disponível, tentar usar a URL primeiro
    // Mas não bloquear a busca de base64 - pode ser necessário se a URL falhar
    // A busca de base64 será feita apenas se não tiver URL ou se a URL falhar
    const hasImageUrl = hasImage && message.message?.imageMessage?.url
    const hasVideoUrl = hasVideo && message.message?.videoMessage?.url
    const hasAudioUrl = hasAudio && message.message?.audioMessage?.url
    const hasDocumentUrl = hasDocument && message.message?.documentMessage?.url
    
    // Se tem URL, não buscar base64 imediatamente (a URL será tentada primeiro na renderização)
    // Mas se a URL falhar, o onError vai chamar fetchMediaBase64
    if (hasImageUrl || hasVideoUrl || hasAudioUrl || hasDocumentUrl) {
      console.log('ℹ️ [WhatsApp] Mídia tem URL disponível, tentando usar URL primeiro:', {
        hasImageUrl,
        hasVideoUrl,
        hasAudioUrl,
        hasDocumentUrl,
        imageUrl: hasImageUrl ? message.message?.imageMessage?.url : null
      })
      // Não retornar aqui - deixar a renderização tentar a URL primeiro
      // Se a URL falhar, o onError vai buscar base64
    }
    
    // Verificar se já está carregando
    setLoadingImages(prev => {
      if (prev.has(messageId)) {
        console.log('ℹ️ [WhatsApp] Mídia já está sendo carregada:', messageId)
        return prev
      }
      return new Set(prev).add(messageId)
    })
    
    try {
      // Validar se a mensagem tem estrutura válida
      if (!message.key || !message.key.remoteJid || !message.key.id) {
        console.warn('⚠️ [WhatsApp] Mensagem sem key válida:', message)
        return
      }

      // Validar se a mensagem tem mídia
      if (!message.message || typeof message.message !== 'object') {
        console.warn('⚠️ [WhatsApp] Mensagem sem campo message válido:', message)
        return
      }

      // Verificar se realmente tem algum tipo de mídia
      const hasAnyMedia = !!(message.message.imageMessage || 
                             message.message.videoMessage || 
                             message.message.audioMessage || 
                             message.message.documentMessage)
      
      if (!hasAnyMedia) {
        console.warn('⚠️ [WhatsApp] Mensagem não contém mídia:', message)
        return
      }

      // Garantir que a estrutura da mensagem está completa
      // A Evolution API espera a estrutura completa da mensagem
      const messagePayload = {
        key: {
          remoteJid: message.key.remoteJid,
          fromMe: message.key.fromMe ?? false,
          id: message.key.id
        },
        message: message.message
      }
      
      console.log('📡 [WhatsApp] Buscando base64 de mídia:', {
        messageId,
        hasImage,
        hasVideo,
        hasAudio,
        hasDocument,
        instanceName: instance.instance_name,
        remoteJid: message.key.remoteJid,
        payloadStructure: {
          hasKey: !!messagePayload.key,
          hasMessage: !!messagePayload.message,
          messageKeys: Object.keys(messagePayload.message),
          hasImageMessage: !!messagePayload.message.imageMessage,
          hasVideoMessage: !!messagePayload.message.videoMessage,
          hasAudioMessage: !!messagePayload.message.audioMessage,
          hasDocumentMessage: !!messagePayload.message.documentMessage
        }
      })
      
      const response = await apiCall(
        `/whatsapp/instance/${instance.instance_name}/get-media-base64`,
        {
          method: 'POST',
          body: JSON.stringify({
            message: messagePayload
          })
        }
      )
      
      console.log('📥 [WhatsApp] Resposta da API de mídia:', {
        success: response.success,
        hasBase64: !!response.base64,
        base64Length: response.base64?.length || 0,
        mimetype: response.mimetype,
        error: response.error,
        fullResponse: response
      })
      
      if (response.success && response.base64) {
        // Atualizar mensagem com base64 baseado no tipo de mídia
        setMessages(prev => prev.map(msg => {
          if (msg.key?.id === messageId) {
            const updated = { ...msg }
            
            if (hasImage) {
              updated._imageBase64 = response.base64
              updated._imageMimetype = response.mimetype || msg.message?.imageMessage?.mimetype || 'image/jpeg'
              console.log('✅ [WhatsApp] Imagem carregada:', {
                messageId,
                mimetype: updated._imageMimetype,
                base64Length: response.base64.length
              })
            } else if (hasVideo) {
              updated._videoBase64 = response.base64
              updated._videoMimetype = response.mimetype || msg.message?.videoMessage?.mimetype || 'video/mp4'
              console.log('✅ [WhatsApp] Vídeo carregado:', {
                messageId,
                mimetype: updated._videoMimetype,
                base64Length: response.base64.length
              })
            } else if (hasAudio) {
              updated._audioBase64 = response.base64
              updated._audioMimetype = response.mimetype || msg.message?.audioMessage?.mimetype || 'audio/ogg'
              console.log('✅ [WhatsApp] Áudio carregado:', {
                messageId,
                mimetype: updated._audioMimetype,
                base64Length: response.base64.length
              })
            } else if (hasDocument) {
              updated._documentBase64 = response.base64
              updated._documentMimetype = response.mimetype || msg.message?.documentMessage?.mimetype || 'application/octet-stream'
              console.log('✅ [WhatsApp] Documento carregado:', {
                messageId,
                mimetype: updated._documentMimetype,
                base64Length: response.base64.length
              })
            }
            
            return updated
          }
          return msg
        }))
      } else {
        console.warn('⚠️ [WhatsApp] Resposta da API não contém base64:', {
          success: response.success,
          hasBase64: !!response.base64,
          error: response.error,
          responseKeys: Object.keys(response || {})
        })
      }
    } catch (error) {
      console.error('❌ [WhatsApp] Erro ao buscar base64 da mídia:', error)
      if (error instanceof Error) {
        console.error('❌ [WhatsApp] Detalhes do erro:', {
          message: error.message,
          stack: error.stack
        })
      }
    } finally {
      setLoadingImages(prev => {
        const next = new Set(prev)
        next.delete(messageId)
        return next
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance?.instance_name, apiCall])

  // Buscar mídias automaticamente quando mensagens mudarem
  React.useEffect(() => {
    if (!instance?.instance_name || messages.length === 0) return
    
    console.log('🔍 [WhatsApp] Verificando mensagens para mídia:', {
      totalMessages: messages.length,
      instanceName: instance.instance_name
    })
    
    messages.forEach((msg, idx) => {
      const messageId = msg.key?.id
      if (!messageId || loadingImages.has(messageId)) return
      
      // Verificar se tem algum tipo de mídia e se ainda não foi carregado
      // Se tem URL, não buscar base64 imediatamente (deixar a renderização tentar a URL primeiro)
      // Se não tem URL nem base64, buscar base64
      const hasImage = !!msg.message?.imageMessage && !msg._imageBase64
      const hasVideo = !!msg.message?.videoMessage && !msg._videoBase64
      const hasAudio = !!msg.message?.audioMessage && !msg._audioBase64
      const hasDocument = !!msg.message?.documentMessage && !msg._documentBase64
      
      // Se tem URL, não buscar base64 automaticamente (será buscado apenas se a URL falhar)
      const hasImageUrl = !!msg.message?.imageMessage?.url
      const hasVideoUrl = !!msg.message?.videoMessage?.url
      const hasAudioUrl = !!msg.message?.audioMessage?.url
      const hasDocumentUrl = !!msg.message?.documentMessage?.url
      
      // Se tem imagem com URL e ainda não foi baixada, fazer download
      if (hasImage && hasImageUrl && !msg._localImageUrl) {
        const imageUrl = msg.message?.imageMessage?.url
        const mimetype = msg.message?.imageMessage?.mimetype || 'image/jpeg'
        if (imageUrl && messageId) {
          console.log('📥 [WhatsApp] Iniciando download automático da imagem:', messageId)
          downloadImage(imageUrl, messageId, mimetype)
        }
      }
      
      // Só buscar base64 se não tiver URL (URL será tentada primeiro na renderização)
      const shouldFetchImage = hasImage && !hasImageUrl
      const shouldFetchVideo = hasVideo && !hasVideoUrl
      const shouldFetchAudio = hasAudio && !hasAudioUrl
      const shouldFetchDocument = hasDocument && !hasDocumentUrl
      
      // Debug: Log mensagens com mídia
      if (shouldFetchImage || shouldFetchVideo || shouldFetchAudio || shouldFetchDocument) {
        console.log(`📸 [WhatsApp] Mensagem ${idx + 1} precisa buscar base64:`, {
          messageId,
          shouldFetchImage,
          shouldFetchVideo,
          shouldFetchAudio,
          shouldFetchDocument,
          hasImageUrl,
          hasVideoUrl,
          hasAudioUrl,
          hasDocumentUrl,
          messageStructure: {
            hasMessage: !!msg.message,
            messageKeys: msg.message ? Object.keys(msg.message) : [],
            imageMessage: msg.message?.imageMessage ? Object.keys(msg.message.imageMessage) : null,
            videoMessage: msg.message?.videoMessage ? Object.keys(msg.message.videoMessage) : null,
            audioMessage: msg.message?.audioMessage ? Object.keys(msg.message.audioMessage) : null,
            documentMessage: msg.message?.documentMessage ? Object.keys(msg.message.documentMessage) : null
          }
        })
        fetchMediaBase64(msg)
      } else if (hasImage || hasVideo || hasAudio || hasDocument) {
        console.log(`ℹ️ [WhatsApp] Mensagem ${idx + 1} tem mídia com URL, não precisa buscar base64:`, {
          messageId,
          hasImageUrl,
          hasVideoUrl,
          hasAudioUrl,
          hasDocumentUrl
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, instance?.instance_name, fetchMediaBase64, downloadImage])

  // Sort chats by last activity with pinned first
  const sortedChats = React.useMemo(() => {
    const visible = chats.filter(c => !hiddenChats.has(c.id))
    return [...visible].sort((a, b) => {
      // Pinned first
      const aPinned = pinned.has(a.id) ? 1 : 0
      const bPinned = pinned.has(b.id) ? 1 : 0
      if (aPinned !== bPinned) return bPinned - aPinned
      const aTime = (a.lastMessage?.messageTimestamp || 0) * 1000
      const bTime = (b.lastMessage?.messageTimestamp || 0) * 1000
      return bTime - aTime
    })
  }, [chats, pinned, hiddenChats])

  // Filtrar chats por busca
  const filteredChats = React.useMemo(() => {
    return sortedChats.filter(chat => {
      const searchLower = searchQuery.toLowerCase()
      const chatId = chat.id || chat.conversationId || ''
      const pushName = chat.lastMessage?.pushName || ''
      const lastMessageText = extractMessageText(chat.lastMessage?.message) || ''
      
      return (
        chatId.toLowerCase().includes(searchLower) ||
        pushName.toLowerCase().includes(searchLower) ||
        lastMessageText.toLowerCase().includes(searchLower)
      )
    })
  }, [sortedChats, searchQuery, extractMessageText])

  // Formatar timestamp para chat (mesmo formato do Telegram)
  const formatChatTimestamp = (timestamp?: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp * 1000)
    const now = new Date()

    const sameDay = date.toDateString() === now.toDateString()
    if (sameDay) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    }

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }

    // Start of current week (Monday 00:00)
    const weekStart = new Date(now)
    weekStart.setHours(0, 0, 0, 0)
    const dayOfWeek = now.getDay() // 0=Sun .. 6=Sat
    const diffToMonday = (dayOfWeek + 6) % 7 // converts Sun(0)->6, Mon(1)->0
    weekStart.setDate(now.getDate() - diffToMonday)

    if (date >= weekStart) {
      return date.toLocaleDateString('en-US', { weekday: 'long' })
    }

    // Older than current week: MM/DD/YYYY
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const yyyy = date.getFullYear()
    return `${mm}/${dd}/${yyyy}`
  }

  // Formatar timestamp para mensagem
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp * 1000)
    const now = new Date()
    
    // Verificar se é o mesmo dia
    const isToday = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear()
    
    // Se for hoje, mostrar apenas o horário
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    }
    
    // Verificar se foi ontem
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.getDate() === yesterday.getDate() &&
                        date.getMonth() === yesterday.getMonth() &&
                        date.getFullYear() === yesterday.getFullYear()
    
    if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })}`
    }
    
    // Se for da semana passada
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInDays < 7) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const dayName = dayNames[date.getDay()]
      return `${dayName} ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })}`
    }
    // Se for mais antigo
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: '2-digit',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  // Helper para extrair número de telefone de um remoteJid
  const extractPhoneFromJid = (jid: string): string | null => {
    if (!jid) return null
    
    // Formato típico: 5511999999999@s.whatsapp.net ou 5511999999999:0@g.us (grupo)
    // Extrair número antes do @
    const match = jid.match(/^(\d+)@/)
    if (match && match[1]) {
      const phone = match[1]
      // Formatar número brasileiro (11 dígitos) ou internacional
      if (phone.length >= 10) {
        // Se for número brasileiro com código do país (13 dígitos)
        if (phone.length === 13 && phone.startsWith('55')) {
          // Formatar: (XX) XXXXX-XXXX
          const ddd = phone.substring(2, 4)
          const part1 = phone.substring(4, 9)
          const part2 = phone.substring(9)
          return `+55 (${ddd}) ${part1}-${part2}`
        }
        // Se for número brasileiro sem código do país (11 dígitos)
        if (phone.length === 11 && phone.startsWith('55') === false) {
          const ddd = phone.substring(0, 2)
          const part1 = phone.substring(2, 7)
          const part2 = phone.substring(7)
          return `(${ddd}) ${part1}-${part2}`
        }
        // Para outros formatos, retornar o número
        return phone
      }
      return phone
    }
    
    return null
  }

  // Helper para formatar ID de forma mais legível
  const formatId = (id: string): string => {
    if (!id || id.length < 10) return id
    // Mostrar primeiros 8 e últimos 4 caracteres
    return `${id.substring(0, 8)}...${id.substring(id.length - 4)}`
  }

  // Get display name
  const getDisplayName = (chat: EvolutionChat): string => {
    // 1. Tentar pegar pushName da última mensagem (nome que o contato configurou)
    const pushName = chat.lastMessage?.pushName
    if (pushName && pushName.trim()) {
      return pushName.trim()
    }
    
    // 2. Verificar se há informações adicionais no chat (name, subject, etc)
    // A Evolution API pode retornar informações adicionais diretamente no chat
    const chatName = chat.name || chat.subject || chat.displayName || chat.pushName
    if (chatName && chatName.trim()) {
      return chatName.trim()
    }
    
    // 3. Tentar extrair número do remoteJid da última mensagem (MAIS IMPORTANTE!)
    // O remoteJid da última mensagem geralmente contém o número de telefone
    const lastMessageRemoteJid = chat.lastMessage?.key?.remoteJid
    if (lastMessageRemoteJid) {
      const phone = extractPhoneFromJid(lastMessageRemoteJid)
      if (phone) return phone
    }
    
    // 4. Tentar encontrar remoteJid diretamente no chat
    const chatRemoteJid = chat.remoteJid || chat.jid
    if (chatRemoteJid && typeof chatRemoteJid === 'string' && chatRemoteJid.includes('@')) {
      const phone = extractPhoneFromJid(chatRemoteJid)
      if (phone) return phone
      
      // Se for um grupo, tentar pegar o nome do grupo
      if (chatRemoteJid.includes('@g.us')) {
        const groupName = chat.subject || chat.name
        if (groupName) return groupName
        return `Grupo ${formatId(chatRemoteJid)}`
      }
    }
    
    // 5. Tentar extrair número do ID do chat (pode ser o remoteJid em alguns casos)
    const chatId = chat.id || chat.conversationId || ''
    if (chatId && chatId.includes('@')) {
      const phoneFromId = extractPhoneFromJid(chatId)
      if (phoneFromId) return phoneFromId
      
      // Se for um grupo
      if (chatId.includes('@g.us')) {
        const groupName = chat.subject || chat.name
        if (groupName) return groupName
        return `Grupo ${formatId(chatId)}`
      }
    }
    
    // 6. Se o chat tem uma última mensagem mas não tem remoteJid válido,
    // usar o remoteJid da última mensagem mesmo que não consiga extrair número
    if (lastMessageRemoteJid && lastMessageRemoteJid.includes('@')) {
      // Tentar extrair parte do número antes do @
      const numberPart = lastMessageRemoteJid.split('@')[0]
      if (numberPart && numberPart.length >= 10) {
        // Se parecer um número, mostrar formatado
        return `+${numberPart}`
      }
    }
    
    // 7. Última opção: formatar o ID de forma mais legível
    // Se o ID parece ser um hash/ID interno, mostrar de forma mais amigável
    if (chatId && chatId.length > 20 && !chatId.includes('@')) {
      return `Contato ${formatId(chatId)}`
    }
    
    return formatId(chatId) || 'Contato'
  }

  // Insert emoji
  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setTimeout(() => {
      const messageInput = document.getElementById('message-input') as HTMLInputElement
      if (messageInput) {
        messageInput.focus()
      }
    }, 50)
  }

  // Lead management functions
  const handleLinkToLead = React.useCallback(async () => {
    if (!selectedChat) return

    try {
      // TODO: Implementar link de lead com Evolution API
      console.log('⚠️ Link to lead ainda não implementado para Evolution API')
    } catch (error) {
      console.error('Error linking chat to lead:', error)
    }
  }, [selectedChat])

  // Start new conversation
  const handleStartConversation = React.useCallback(async () => {
    if (!instance?.instance_name || !newConversationNumber.trim() || !newConversationMessage.trim()) {
      return
    }

    try {
      setIsStartingConversation(true)
      console.log('📤 [WhatsApp] Iniciando nova conversa:', {
        instanceName: instance.instance_name,
        number: newConversationNumber,
        message: newConversationMessage.substring(0, 50)
      })

      const response = await apiCall(
        `/whatsapp/instance/${instance.instance_name}/start-conversation`,
        {
          method: 'POST',
          body: JSON.stringify({
            number: newConversationNumber.trim(),
            message: newConversationMessage.trim()
          })
        }
      )

      if (response.success) {
        console.log('✅ [WhatsApp] Conversa iniciada com sucesso:', response)
        
        // Fechar modal e limpar campos
        setIsNewConversationModalOpen(false)
        setNewConversationNumber('')
        setNewConversationMessage('')
        
        // Aguardar um pouco para garantir que o chat foi criado
        setTimeout(async () => {
          // Recarregar lista de chats
          await loadChats()
          
          // Tentar encontrar e selecionar o chat recém-criado
          // O número pode estar em diferentes formatos, então vamos tentar encontrar por remoteJid
          const normalizedNumber = normalizeJidString(newConversationNumber.trim())
          const possibleJids = [
            normalizedNumber,
            `${newConversationNumber.trim()}@s.whatsapp.net`,
            normalizeJidString(`${newConversationNumber.trim()}@s.whatsapp.net`)
          ]
          
          // Aguardar um pouco mais para garantir que o chat apareça na lista
          setTimeout(() => {
            // Buscar chats atualizados
            loadChats().then(() => {
              // Aguardar um pouco mais para os chats serem atualizados no estado
              setTimeout(() => {
                // Usar uma função que acessa o estado atualizado
                setChats(currentChats => {
                  const foundChat = currentChats.find(chat => {
                    const chatRemoteJid = normalizeRemoteJid(chat)
                    if (!chatRemoteJid) return false
                    
                    return possibleJids.some(jid => {
                      const normalizedChatJid = normalizeJidString(chatRemoteJid)
                      const normalizedSearchJid = normalizeJidString(jid)
                      return normalizedChatJid === normalizedSearchJid ||
                             normalizedChatJid.includes(newConversationNumber.trim().replace(/[^\d]/g, '')) ||
                             normalizedSearchJid.includes(newConversationNumber.trim().replace(/[^\d]/g, ''))
                    })
                  })
                  
                  if (foundChat) {
                    console.log('✅ [WhatsApp] Chat encontrado, selecionando:', foundChat)
                    setSelectedChat(foundChat)
                  } else {
                    console.log('⚠️ [WhatsApp] Chat não encontrado automaticamente, mas a conversa foi iniciada')
                  }
                  
                  return currentChats
                })
              }, 300)
            })
          }, 500)
        }, 500)
      } else {
        console.error('❌ [WhatsApp] Erro ao iniciar conversa:', response.error)
        alert(`Erro ao iniciar conversa: ${response.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('❌ [WhatsApp] Erro ao iniciar conversa:', error)
      alert(`Erro ao iniciar conversa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsStartingConversation(false)
    }
  }, [instance?.instance_name, newConversationNumber, newConversationMessage, apiCall, loadChats, normalizeJidString, normalizeRemoteJid])

  const unlinkConversationFromLead = React.useCallback(async () => {
    if (!selectedChat) return

    try {
      // TODO: Implementar unlink de lead com Evolution API
      console.log('⚠️ Unlink lead ainda não implementado para Evolution API')
      setCurrentLinkedLead(null)
    } catch (error) {
      console.error('Error unlinking chat from lead:', error)
    }
  }, [selectedChat])

  // Fechar seletor de emojis quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const emojiPicker = document.getElementById('emoji-picker')
      const emojiButton = document.querySelector('[data-emoji-button]')
      
      if (emojiPicker && !emojiPicker.contains(event.target as Node) && 
          emojiButton && !emojiButton.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  // Renderizar status da instância
  const renderInstanceStatus = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando...
        </div>
      )
    }
    
    if (!instance) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma instância configurada</h3>
          <p className="text-muted-foreground mb-4">
            Configure sua instância do WhatsApp para começar
          </p>
          <Button onClick={() => router.push(`/${org}/settings/whatsapp`)}>
            <Settings className="w-4 h-4 mr-2" />
            Configurar WhatsApp
          </Button>
        </div>
      )
    }
    
    // Status que bloqueiam completamente o uso
    // Apenas bloquear se realmente não estiver conectada E não tiver QR code pendente
    const blockingStatuses = ['ERROR', 'FAILED']
    const isConnected = instance.status === 'open' || 
                        instance.status === 'CONNECTED' || 
                        instance.status === 'connected' ||
                        instance.status === 'OPEN'
    
    // Se estiver conectada, não bloquear
    if (isConnected) {
      return null
    }
    
    // Se tiver QR code gerado ou estiver criada, permitir uso (mas mostrar banner)
    if (instance.status === 'QRCODE_GENERATED' || instance.status === 'CREATED' || instance.status === 'CREATING') {
      return null // Permitir uso, mas o banner será mostrado
    }
    
    // Apenas bloquear se for erro ou falha
    if (blockingStatuses.includes(instance.status)) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Instância não conectada</h3>
          <p className="text-muted-foreground mb-4">
            Status: {instance.status}. Conecte sua instância para começar a usar.
          </p>
          <Button onClick={() => router.push(`/${org}/settings/whatsapp`)}>
            <Settings className="w-4 h-4 mr-2" />
            Ver Configurações
          </Button>
        </div>
      )
    }
    
    return null
  }

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
          {/* HEADER */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${org}/dashboard`}>
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>WhatsApp Chats</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
                    {instance && (
              <div className="ml-auto flex items-center gap-2">
                <Badge variant={wsConnected ? "default" : "secondary"}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  {wsConnected ? 'Conectado' : 'Desconectado'}
                </Badge>
                <Badge variant={
                  instance.status === 'open' || 
                  instance.status === 'CONNECTED' || 
                  instance.status === 'connected' ||
                  instance.status === 'OPEN'
                    ? "default" : "secondary"
                }>
                  <Phone className="w-3 h-3 mr-1" />
                  {instance.instance_name}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/${org}/settings/whatsapp`)}
                >
                  <Settings className="w-4 h-4" />
            </Button>
          </div>
            )}
          </header>

          {/* MAIN CONTENT */}
          <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden w-full">
            {renderInstanceStatus() || (
              <>
                
                {/* Container principal */}
                <div className="flex flex-1 overflow-hidden">
                  {/* Lista de Chats */}
                  <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col min-w-0">
                    {/* Header da Lista */}
                    <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <h1 className="text-xl font-semibold text-gray-800">WhatsApp</h1>
                        {instance && (
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              instance.status === 'open' || 
                              instance.status === 'CONNECTED' || 
                              instance.status === 'connected' ||
                              instance.status === 'OPEN'
                                ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className={`text-sm font-medium ${
                              instance.status === 'open' || 
                              instance.status === 'CONNECTED' || 
                              instance.status === 'connected' ||
                              instance.status === 'OPEN'
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {instance.status === 'open' || 
                               instance.status === 'CONNECTED' || 
                               instance.status === 'connected' ||
                               instance.status === 'OPEN'
                                ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => setIsNewConversationModalOpen(true)}
                          className="cursor-pointer"
                          disabled={!instance || (instance.status !== 'open' && instance.status !== 'CONNECTED' && instance.status !== 'connected' && instance.status !== 'OPEN')}
                          title="Iniciar nova conversa"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Nova Conversa
                        </Button>
                        <Button variant="outline" size="sm" asChild className="cursor-pointer">
                          <a href={`/${org}/settings/whatsapp`}>
                            <Settings className="w-4 h-4" />
                          </a>
                        </Button>
                        {process.env.NODE_ENV === 'development' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDebugPanel(!showDebugPanel)}
                            className="cursor-pointer"
                            title="Toggle Debug Panel"
                          >
                            🐛
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

                  {/* Lista de chats */}
                  <div className="flex-1 overflow-y-auto min-w-0">
                    {filteredChats.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32">
                        <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <div className="text-gray-500 text-sm">
                          {chats.length === 0 
                            ? 'No chats yet' 
                            : 'No chats found'}
                        </div>
                        </div>
                    ) : (
                      filteredChats.map((chat) => {
                        // Usar o remoteJid da última mensagem como ID do chat se disponível
                        // Isso garante que o ID seja o remoteJid real do WhatsApp
                        const chatRemoteJid = chat.lastMessage?.key?.remoteJid || chat.remoteJid || chat.jid
                        const chatId = chatRemoteJid || chat.id || chat.conversationId || ''
                        const lastMessage = chat.lastMessage
                        const lastMessageText = extractMessageText(lastMessage?.message)
                        const isFromMe = lastMessage?.key?.fromMe || false
                        
                        return (
                        <div
                          key={chatId}
                          onClick={() => {
                            console.log('🖱️ [WhatsApp] Chat selecionado:', {
                              chatId,
                              chatRemoteJid,
                              chatIdFromChat: chat.id,
                              conversationId: chat.conversationId,
                              lastMessageRemoteJid: chat.lastMessage?.key?.remoteJid,
                              chatRemoteJidProp: chat.remoteJid,
                              chatJid: chat.jid,
                              fullChat: chat
                            })
                            setSelectedChat(chat)
                          }}
                          className={`group relative p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${
                            (selectedChat?.lastMessage?.key?.remoteJid || selectedChat?.id) === chatId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          {/* Pin indicator */}
                          {pinned.has(chatId) && (
                            <div className="absolute bottom-2 right-2 flex items-center text-yellow-600 opacity-80 pointer-events-none">
                              <Pin className="w-4 h-4" />
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                  <Avatar className="w-12 h-12">
                                <AvatarFallback>
                                  {getDisplayName(chat).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                            </div>
                            
                <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                  {getDisplayName(chat)}
                    </h3>
                                <div className="flex items-center space-x-2">
                                  {(chat.unreadCount ?? 0) > 0 && (
                                    <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                                      {(chat.unreadCount ?? 0) > 99 ? '99+' : chat.unreadCount}
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {formatChatTimestamp(lastMessage?.messageTimestamp)}
                                  </span>
                                </div>
                  </div>
                              
                              <div className="flex items-center justify-between mt-1">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-600 truncate max-w-full">
                                    {lastMessageText ? (
                                      <>
                                        {isFromMe ? 'You: ' : ''}
                                        {lastMessageText}
                                      </>
                                    ) : ''}
                                  </p>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  {/* Dropdown trigger */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label="More options"
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" sideOffset={8} onClick={(e)=>e.stopPropagation()}>
                                      <DropdownMenuItem className="cursor-pointer" onClick={() => togglePin(chatId)}>
                                        {pinned.has(chatId) ? 'Unpin from Top' : 'Pin to Top'}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-red-600 focus:text-red-700 cursor-pointer" onClick={() => deleteChatLocal(chatId)}>
                                        Delete Chat
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
              </div>
            </div>
                          </div>
                        </div>
                        )
                      })
                    )}
        </div>
      </div>

      {/* Área de Chat */}
                <div className="flex-1 flex flex-col max-w-full min-w-0 overflow-hidden">
                  {!selectedChat ? (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select a chat</h3>
                        <p className="text-gray-500">Choose a chat from the list to start chatting</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Header do chat */}
                      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {getDisplayName(selectedChat).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              {getDisplayName(selectedChat)}
                            </h2>
                            <p className="text-sm text-gray-500">
                            {selectedChat.id || selectedChat.conversationId}
                          </p>
                        </div>
              </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="cursor-pointer"
                            onClick={() => setIsLinkLeadModalOpen(true)}
                            title="Link to Lead"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
              </div>
            </div>

            {/* Mensagens */}
                      <div className="relative flex-1 overflow-hidden">
                        <div 
                          id="messages-container" 
                          className="h-full overflow-y-auto p-4 space-y-2 bg-gray-50 w-full"
                          style={{ minHeight: '300px' }}
                        >
                        {loadingMessages ? (
                            <div className="flex items-center justify-center h-full min-h-[300px]">
                              <div className="text-center">
                                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-3" />
                                <div className="text-gray-700 text-base font-medium">Loading messages...</div>
                                <div className="text-gray-500 text-sm mt-1">Please wait</div>
                              </div>
                          </div>
                        ) : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full min-h-[300px]">
                              <div className="text-center p-8 bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 max-w-md">
                                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <div className="text-gray-700 text-lg font-medium mb-2">Nenhuma mensagem encontrada</div>
                                <div className="text-gray-500 text-sm mb-4">
                                  {selectedChat ? (
                                    <>
                                      <p className="mb-3">
                                        Este chat não possui mensagens no histórico ou as mensagens não foram carregadas da Evolution API.
                                      </p>
                                      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-left">
                                        <p className="text-blue-800 font-semibold text-xs mb-2">ℹ️ Informações:</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
                                          <li><strong>Chat:</strong> {getDisplayName(selectedChat)}</li>
                                          <li><strong>RemoteJid:</strong> {normalizeRemoteJid(selectedChat) || 'N/A'}</li>
                                          <li><strong>Tipo:</strong> {normalizeRemoteJid(selectedChat)?.includes('@g.us') ? 'Grupo' : 'Contato Individual'}</li>
                                        </ul>
                                      </div>
                                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3 text-left">
                                        <p className="text-yellow-800 font-semibold text-xs mb-2">⚠️ Possíveis causas:</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs text-yellow-700">
                                          <li>O chat é novo e ainda não tem mensagens armazenadas</li>
                                          <li>A Evolution API não está armazenando o histórico de mensagens</li>
                                          <li>O histórico foi limpo ou não está disponível</li>
                                          <li>A instância não tem permissão para acessar mensagens antigas</li>
                                        </ul>
                                      </div>
                                      <div className="mt-3 text-xs text-gray-600">
                                        <p><strong>💡 Dica:</strong> Envie uma mensagem para este contato para começar uma nova conversa.</p>
                                      </div>
                                    </>
                                  ) : (
                                    'Selecione um chat para ver as mensagens'
                                  )}
                                </div>
                                {selectedChat && (
                                  <div className="mt-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        if (!selectedChat || !instance?.instance_name) return
                                        try {
                                          setLoadingMessages(true)
                                          const remoteJid = normalizeRemoteJid(selectedChat)
                                          if (!remoteJid) return
                                          
                                          const url = `/whatsapp/instance/${instance.instance_name}/messages?remoteJid=${encodeURIComponent(remoteJid)}&limit=${MESSAGES_PAGE_SIZE}&order=DESC`
                                          const response = await apiCall(url)
                                          
                                          if (response.success && response.messages) {
                                            const sortedMessages = [...response.messages].sort((a, b) => {
                                              const aTime = a.messageTimestamp || 0
                                              const bTime = b.messageTimestamp || 0
                                              return aTime - bTime
                                            })
                                            setMessages(sortedMessages)
                                            setHasMoreMessages((response.messages?.length || 0) === MESSAGES_PAGE_SIZE)
                                          }
                                        } catch (error) {
                                          console.error('Erro ao recarregar mensagens:', error)
                                        } finally {
                                          setLoadingMessages(false)
                                        }
                                      }}
                                    >
                                      🔄 Tentar novamente
                                    </Button>
                                  </div>
                                )}
                                {process.env.NODE_ENV === 'development' && (
                                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-left">
                                    <p className="font-bold text-yellow-800 mb-1">🐛 Debug Info:</p>
                                    <p className="text-yellow-700">Selected Chat ID: {selectedChat?.id || 'N/A'}</p>
                                    <p className="text-yellow-700">RemoteJid: {selectedChat ? normalizeRemoteJid(selectedChat) || 'N/A' : 'N/A'}</p>
                                    <p className="text-yellow-700">Messages Array Length: {messages.length}</p>
                                    <p className="text-yellow-700">Loading State: {loadingMessages ? 'true' : 'false'}</p>
                                  </div>
                                )}
                              </div>
                        </div>
                      ) : (
                          <>
                            {/* Load older button */}
                            {hasMoreMessages && (
                              <div className="flex justify-center mb-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={loadingOlder}
                                  onClick={loadOlderMessages}
                                  className="cursor-pointer"
                                >
                                  {loadingOlder ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                      Loading older...
                                    </>
                                  ) : (
                                    'Load older messages'
                                  )}
                                </Button>
                              </div>
                            )}
                            {console.log('🎨 Renderizando', messages.length, 'mensagens')}
                            {/* Debug indicator */}
                            {process.env.NODE_ENV === 'development' && (
                              <div className="bg-green-100 border-l-4 border-green-500 p-2 mb-3 text-sm">
                                <p className="font-bold text-green-800">✅ Rendering {messages.length} messages</p>
                              </div>
                            )}
                            
                            {messages.map((message, index) => {
                              // Validar se a mensagem tem estrutura válida
                              if (!message || !message.key) {
                                console.warn(`⚠️ [WhatsApp] Mensagem inválida no índice ${index}:`, message)
                                return null
                              }
                              
                              const messageId = message.key?.id || `msg-${index}-${Date.now()}`
                              const isFromMe = message.key?.fromMe || false
                              const messageText = extractMessageText(message.message)
                              
                              // Verificar se tem mídia - verificar também se message.message existe
                              const hasImage = !!(message.message && typeof message.message === 'object' && message.message.imageMessage)
                              const hasVideo = !!(message.message && typeof message.message === 'object' && message.message.videoMessage)
                              const hasAudio = !!(message.message && typeof message.message === 'object' && message.message.audioMessage)
                              const hasDocument = !!(message.message && typeof message.message === 'object' && message.message.documentMessage)
                              const isLoadingImage = loadingImages.has(messageId)
                              
                              // Debug: Log mensagens com mídia detectada
                              if ((hasImage || hasVideo || hasAudio || hasDocument) && process.env.NODE_ENV === 'development') {
                                console.log(`📸 [WhatsApp] Renderizando mensagem ${index + 1} com mídia:`, {
                                  messageId,
                                  hasImage,
                                  hasVideo,
                                  hasAudio,
                                  hasDocument,
                                  hasImageBase64: !!message._imageBase64,
                                  hasVideoBase64: !!message._videoBase64,
                                  hasAudioBase64: !!message._audioBase64,
                                  hasDocumentBase64: !!message._documentBase64,
                                  isLoadingImage,
                                  messageStructure: message.message ? Object.keys(message.message) : []
                                })
                              }
                              
                              // Verificar se a mensagem tem algum conteúdo
                              const hasContent = messageText || hasImage || hasVideo || hasAudio || hasDocument
                              
                              // Se não tem conteúdo, ainda mostrar a mensagem (pode ser uma mensagem de sistema ou vazia)
                              if (!hasContent && process.env.NODE_ENV === 'development') {
                                console.log(`📝 Mensagem ${index + 1} sem conteúdo:`, {
                                  id: messageId,
                                  fromMe: isFromMe,
                                  timestamp: message.messageTimestamp,
                                  messageKeys: message.message ? Object.keys(message.message) : [],
                                  hasMessage: !!message.message,
                                  messageType: typeof message.message
                                })
                              }
                              
                              return (
                                <div
                                  key={messageId}
                                  className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-2`}
                                >
                                  <div
                                    className={`max-w-[80%] px-4 py-3 rounded-2xl break-words overflow-hidden shadow-md ${
                                      isFromMe
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-900 border-2 border-gray-200'
                                    }`}
                                  >
                                    <div className="flex flex-col space-y-2">
                                      {/* Imagem */}
                                      {hasImage && (() => {
                                        // Priorizar URL local (imagem baixada), depois URL original, depois base64
                                        const localImageUrl = message._localImageUrl
                                        const imageUrl = message.message?.imageMessage?.url
                                        const imageBase64 = message._imageBase64
                                        const imageMimetype = message._imageMimetype || message.message?.imageMessage?.mimetype || 'image/jpeg'
                                        const urlFailed = imageUrl ? failedUrls.has(imageUrl) : false
                                        
                                        return (
                                          <div className="relative rounded-lg overflow-hidden max-w-full">
                                            {(isLoadingImage && !localImageUrl && !imageUrl && !imageBase64) || (urlFailed && !localImageUrl && !imageBase64 && isLoadingImage) ? (
                                              <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                                                <div className="text-center">
                                                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
                                                  <span className="text-gray-500 text-sm">Carregando imagem...</span>
                                                </div>
                                              </div>
                                            ) : localImageUrl ? (
                                              // Priorizar URL local (imagem baixada)
                                              <div className="relative">
                                                <img
                                                  src={localImageUrl}
                                                  alt={messageText || 'Imagem'}
                                                  className="max-w-full h-auto rounded-lg cursor-pointer"
                                                  style={{ maxHeight: '400px' }}
                                                  onError={(e) => {
                                                    console.error('❌ Erro ao carregar imagem local:', localImageUrl, e)
                                                    // Se a imagem local falhar, tentar URL original ou base64
                                                    if (imageUrl && !urlFailed && !loadingImages.has(messageId)) {
                                                      console.log('🔄 Imagem local falhou, tentando URL original...')
                                                    } else if (imageBase64) {
                                                      console.log('🔄 Usando base64 como fallback...')
                                                    }
                                                  }}
                                                  onLoad={() => {
                                                    console.log('✅ Imagem local carregada com sucesso:', localImageUrl)
                                                  }}
                                                  onClick={() => {
                                                    // Abrir imagem em nova aba ao clicar
                                                    window.open(localImageUrl, '_blank')
                                                  }}
                                                />
                                                {message.message?.imageMessage?.caption && (
                                                  <p className={`text-sm mt-2 ${isFromMe ? 'text-blue-100' : 'text-gray-700'}`}>
                                                    {message.message.imageMessage.caption}
                                                  </p>
                                                )}
                                              </div>
                                            ) : imageUrl && !urlFailed ? (
                                              // Usar URL direta quando disponível (enquanto não foi baixada)
                                              <div className="relative">
                                                <img
                                                  src={imageUrl}
                                                  alt={messageText || 'Imagem'}
                                                  className="max-w-full h-auto rounded-lg cursor-pointer"
                                                  style={{ maxHeight: '400px' }}
                                                  onError={(e) => {
                                                    console.error('❌ Erro ao carregar imagem da URL (CORS provavelmente):', imageUrl, e)
                                                    // Marcar URL como falhada
                                                    setFailedUrls(prev => new Set(prev).add(imageUrl))
                                                    // Se a URL falhar, tentar buscar via proxy (backend busca e retorna base64)
                                                    if (!imageBase64 && !loadingImages.has(messageId)) {
                                                      console.log('🔄 URL falhou por CORS, tentando buscar via proxy do backend...')
                                                      fetchImageFromUrl(imageUrl, messageId)
                                                    }
                                                  }}
                                                  onLoad={() => {
                                                    console.log('✅ Imagem carregada com sucesso da URL:', imageUrl)
                                                  }}
                                                  onClick={() => {
                                                    // Abrir imagem em nova aba ao clicar
                                                    window.open(imageUrl, '_blank')
                                                  }}
                                                />
                                                {message.message?.imageMessage?.caption && (
                                                  <p className={`text-sm mt-2 ${isFromMe ? 'text-blue-100' : 'text-gray-700'}`}>
                                                    {message.message.imageMessage.caption}
                                                  </p>
                                                )}
                                              </div>
                                            ) : imageBase64 ? (
                                              // Usar base64 quando URL não estiver disponível
                                              <div className="relative">
                                                <img
                                                  src={`data:${imageMimetype};base64,${imageBase64}`}
                                                  alt={messageText || 'Imagem'}
                                                  className="max-w-full h-auto rounded-lg cursor-pointer"
                                                  style={{ maxHeight: '400px' }}
                                                  onError={(e) => {
                                                    console.error('❌ Erro ao carregar imagem:', e)
                                                    const target = e.target as HTMLImageElement
                                                    const parent = target.parentElement
                                                    if (parent) {
                                                      parent.innerHTML = `
                                                        <div class="w-full h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                                                          <div class="text-center">
                                                            <span class="text-gray-500 text-2xl mb-2 block">📷</span>
                                                            <span class="text-gray-500 text-sm">Erro ao carregar imagem</span>
                                                          </div>
                                                        </div>
                                                      `
                                                    }
                                                  }}
                                                  onClick={() => {
                                                    // Abrir imagem em nova aba ao clicar
                                                    const newWindow = window.open()
                                                    if (newWindow) {
                                                      newWindow.document.write(`
                                                        <html>
                                                          <head><title>Imagem</title></head>
                                                          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000">
                                                            <img src="data:${imageMimetype};base64,${imageBase64}" style="max-width:100%;max-height:100vh" />
                                                          </body>
                                                        </html>
                                                      `)
                                                    }
                                                  }}
                                                />
                                                {message.message?.imageMessage?.caption && (
                                                  <p className="text-gray-700 text-sm mt-2">{message.message.imageMessage.caption}</p>
                                                )}
                                              </div>
                                            ) : urlFailed && isLoadingImage ? (
                                              // URL falhou e está buscando base64
                                              <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                                                <div className="text-center">
                                                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
                                                  <span className="text-gray-500 text-sm">Carregando imagem...</span>
                                                </div>
                                              </div>
                                            ) : (
                                              // Sem URL, sem base64, não está carregando - mostrar placeholder
                                              <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                                                <div className="text-center">
                                                  <span className="text-gray-500 text-2xl mb-2 block">📷</span>
                                                  <span className="text-gray-500 text-sm">
                                                    {urlFailed ? 'Erro ao carregar imagem' : 'Carregando imagem...'}
                                                  </span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })()}
                                      
                                      {/* Vídeo */}
                                      {hasVideo && (
                                        <div className="relative rounded-lg overflow-hidden max-w-full">
                                          {isLoadingImage ? (
                                            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                            </div>
                                          ) : message._videoBase64 ? (
                                            <video
                                              controls
                                              className="max-w-full h-auto rounded-lg"
                                              style={{ maxHeight: '400px' }}
                                              onError={(e) => {
                                                console.error('❌ Erro ao carregar vídeo:', e)
                                                const target = e.target as HTMLVideoElement
                                                target.style.display = 'none'
                                              }}
                                            >
                                              <source
                                                src={`data:${message._videoMimetype || 'video/mp4'};base64,${message._videoBase64}`}
                                                type={message._videoMimetype || 'video/mp4'}
                                              />
                                              Seu navegador não suporta a tag de vídeo.
                                            </video>
                                          ) : (
                                            <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                                              <div className="text-center">
                                                <span className="text-gray-500 text-2xl mb-2 block">🎥</span>
                                                <span className="text-gray-500 text-sm">Carregando vídeo...</span>
                                              </div>
                                            </div>
                                          )}
                                          {message.message?.videoMessage?.caption && (
                                            <p className="text-gray-700 text-sm mt-2">{message.message.videoMessage.caption}</p>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Áudio */}
                                      {hasAudio && (
                                        <div className="relative rounded-lg overflow-hidden max-w-full">
                                          {isLoadingImage ? (
                                            <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                                              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                            </div>
                                          ) : message._audioBase64 ? (
                                            <audio
                                              controls
                                              className="w-full"
                                              onError={(e) => {
                                                console.error('❌ Erro ao carregar áudio:', e)
                                              }}
                                            >
                                              <source
                                                src={`data:${message._audioMimetype || 'audio/ogg'};base64,${message._audioBase64}`}
                                                type={message._audioMimetype || 'audio/ogg'}
                                              />
                                              Seu navegador não suporta a tag de áudio.
                                            </audio>
                                          ) : (
                                            <div className="w-full h-32 bg-gray-200 flex items-center justify-center rounded-lg">
                                              <div className="text-center">
                                                <span className="text-gray-500 text-2xl mb-2 block">🎵</span>
                                                <span className="text-gray-500 text-sm">Carregando áudio...</span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Documento */}
                                      {hasDocument && (
                                        <div className="relative rounded-lg overflow-hidden max-w-full">
                                          <div className="w-full p-4 bg-gray-200 flex items-center justify-between rounded-lg">
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                              <span className="text-gray-500 text-2xl flex-shrink-0">📄</span>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-gray-700 font-medium truncate">
                                                  {message.message?.documentMessage?.fileName || 'Documento'}
                                                </p>
                                                {message.message?.documentMessage?.caption && (
                                                  <p className="text-gray-600 text-sm truncate">{message.message.documentMessage.caption}</p>
                                                )}
                                                {message._documentBase64 && (
                                                  <a
                                                    href={`data:${message._documentMimetype || 'application/octet-stream'};base64,${message._documentBase64}`}
                                                    download={message.message?.documentMessage?.fileName || 'documento'}
                                                    className="text-blue-600 hover:text-blue-800 text-xs mt-1 inline-block"
                                                  >
                                                    📥 Baixar
                                                  </a>
                                                )}
                                              </div>
                                            </div>
                                            {isLoadingImage && (
                                              <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Texto */}
                                      {messageText && (
                                        <div className="flex items-end space-x-2">
                                          <div className="flex-1 min-w-0">
                                            {/* Não mostrar texto se for apenas placeholder de mídia */}
                                            {messageText !== '📷 Imagem' && 
                                             messageText !== '🎥 Vídeo' && 
                                             messageText !== '🎵 Áudio' && 
                                             !messageText.startsWith('📄') && (
                                              <p 
                                                className="text-base leading-relaxed break-words whitespace-pre-wrap"
                                                style={{
                                                  wordBreak: 'break-word',
                                                  overflowWrap: 'break-word',
                                                  hyphens: 'auto'
                                                }}
                                              >
                                                {messageText}
                                              </p>
                                            )}
                                          </div>
                                          
                                          {/* Timestamp */}
                                          <div className="flex items-center space-x-1 flex-shrink-0 self-end">
                                            <span className={`text-xs ${
                                              isFromMe ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                              {formatTimestamp(message.messageTimestamp)}
                                            </span>
                                            {isFromMe && (
                                              <span className="text-xs text-blue-100">
                                                ✓
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Se não tem texto mas tem mídia, mostrar timestamp separado */}
                                      {!messageText && (hasImage || hasVideo || hasAudio || hasDocument) && (
                                        <div className="flex items-center justify-end space-x-1 mt-1">
                                          <span className={`text-xs ${
                                            isFromMe ? 'text-blue-100' : 'text-gray-500'
                                          }`}>
                                            {formatTimestamp(message.messageTimestamp)}
                                          </span>
                                          {isFromMe && (
                                            <span className="text-xs text-blue-100">
                                              ✓
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Mostrar mensagem genérica se não tem nenhum conteúdo */}
                                      {!hasContent && (
                                        <div className="flex items-end space-x-2">
                                          <div className="flex-1 min-w-0">
                                            <p className={`text-sm italic ${
                                              isFromMe ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                              Mensagem sem conteúdo
                                            </p>
                                          </div>
                                          <div className="flex items-center space-x-1 flex-shrink-0 self-end">
                                            <span className={`text-xs ${
                                              isFromMe ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                              {formatTimestamp(message.messageTimestamp)}
                                            </span>
                                            {isFromMe && (
                                              <span className="text-xs text-blue-100">
                                                ✓
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </>
                      )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                        {/* Botão "Ir para o final" */}
                        {!isAtBottom && (
                          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
                            <Button
                              onClick={() => scrollToBottom(true)}
                              className="bg-white hover:bg-gray-100 text-black border border-gray-300 rounded-full shadow-lg"
                              size="sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Input de Mensagem */}
                      <div className="bg-white border-t border-gray-200 p-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer"
                            title="Attach file"
                          >
                            <Paperclip className="w-4 h-4" />
                          </Button>
                          
                          <div className="flex-1 relative">
                            <textarea
                              id="message-input"
                              placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] max-h-[120px] break-words overflow-wrap-anywhere"
                              rows={1}
                              style={{
                                height: 'auto',
                                minHeight: '40px',
                                maxHeight: '120px',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                overflow: 'hidden'
                              }}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement
                                target.style.height = 'auto'
                                const newHeight = Math.min(target.scrollHeight, 120)
                                target.style.height = newHeight + 'px'
                                
                                if (target.scrollHeight > 120) {
                                  target.style.overflow = 'auto'
                                } else {
                                  target.style.overflow = 'hidden'
                                }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 cursor-pointer"
                              data-emoji-button
                            >
                              <Smile className="w-4 h-4" />
                            </Button>
                          </div>
                          
                      <Button 
                        onClick={handleSendMessage} 
                            disabled={!newMessage.trim() || sending}
                            className="cursor-pointer"
                            title="Send message"
                          >
                            {sending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                  <Send className="w-4 h-4" />
                            )}
                </Button>
              </div>
            </div>

                      {/* Seletor de Emojis */}
                      {showEmojiPicker && (
                        <div 
                          id="emoji-picker" 
                          className="absolute bottom-20 right-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50 w-80 max-h-64 overflow-y-auto"
                          style={{
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-gray-700">Emojis</h3>
                            <button
                              onClick={() => setShowEmojiPicker(false)}
                              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Category Tabs */}
                          <div className="flex space-x-1 mb-3 border-b border-gray-200">
                            {[
                              { id: 'faces', label: '😀', name: 'Faces' },
                              { id: 'objects', label: '❤️', name: 'Objects' },
                              { id: 'food', label: '🍎', name: 'Food' },
                              { id: 'activities', label: '⚽', name: 'Activities' }
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                onClick={() => setActiveEmojiTab(tab.id)}
                                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                                  activeEmojiTab === tab.id
                                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <span className="mr-1">{tab.label}</span>
                                {tab.name}
                              </button>
                            ))}
                          </div>
                          
                          <div className="grid grid-cols-8 gap-1">
                            {(() => {
                              const emojiCategories = {
                                faces: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'],
                                objects: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'],
                                food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫒', '🌽', '🥕', '🫑', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕'],
                                activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪']
                              };
                              
                              return emojiCategories[activeEmojiTab as keyof typeof emojiCategories] || [];
                            })().map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => insertEmoji(emoji)}
                                className="text-xl hover:bg-blue-50 hover:scale-110 rounded-lg p-2 transition-all duration-150 flex items-center justify-center min-h-[40px] min-w-[40px]"
                                title={emoji}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
              </div>
                </div>
              </>
        )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Link to Lead Modal */}
      <LinkLeadModal
        isOpen={isLinkLeadModalOpen}
        onClose={() => setIsLinkLeadModalOpen(false)}
        onLink={handleLinkToLead}
        onUnlink={unlinkConversationFromLead}
        conversationName={selectedChat ? getDisplayName(selectedChat) : undefined}
        currentLinkedLead={currentLinkedLead}
      />

      {/* New Conversation Modal */}
      <Dialog open={isNewConversationModalOpen} onOpenChange={setIsNewConversationModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Iniciar Nova Conversa</DialogTitle>
            <DialogDescription>
              Digite o número do WhatsApp e a mensagem inicial para começar uma nova conversa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone-number">Número do WhatsApp</Label>
              <Input
                id="phone-number"
                type="text"
                placeholder="5511999999999 ou 11999999999"
                value={newConversationNumber}
                onChange={(e) => setNewConversationNumber(e.target.value)}
                disabled={isStartingConversation}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Digite o número com código do país (ex: 5511999999999) ou apenas o número (ex: 11999999999)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial-message">Mensagem Inicial</Label>
              <textarea
                id="initial-message"
                placeholder="Digite a mensagem que será enviada..."
                value={newConversationMessage}
                onChange={(e) => setNewConversationMessage(e.target.value)}
                disabled={isStartingConversation}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNewConversationModalOpen(false)
                setNewConversationNumber('')
                setNewConversationMessage('')
              }}
              disabled={isStartingConversation}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStartConversation}
              disabled={!newConversationNumber.trim() || !newConversationMessage.trim() || isStartingConversation || !instance || (instance.status !== 'open' && instance.status !== 'CONNECTED' && instance.status !== 'connected' && instance.status !== 'OPEN')}
              className="cursor-pointer"
            >
              {isStartingConversation ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Iniciar Conversa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Debug Panel - Only in Development */}
      {process.env.NODE_ENV === 'development' && showDebugPanel && (
        <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-xl overflow-auto z-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg">🐛 Debug Panel</h3>
            <button
              onClick={() => setShowDebugPanel(false)}
              className="text-white hover:text-red-400 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="border-t border-gray-600 pt-2">
              <p className="font-semibold text-green-400">WebSocket Status:</p>
              <p className={wsConnected ? 'text-green-300' : 'text-red-300'}>
                {wsConnected ? '✅ Connected' : '❌ Disconnected'}
              </p>
            </div>
            
            <div className="border-t border-gray-600 pt-2">
              <p className="font-semibold text-blue-400">Instance Info:</p>
              {instance ? (
                <>
                  <p>Instance: {instance.instance_name}</p>
                  <p>Status: {instance.status}</p>
                  <p>Connected: {instance.status === 'open' || instance.status === 'CONNECTED' ? '✅' : '❌'}</p>
                </>
              ) : (
                <p className="text-red-300">No instance loaded</p>
              )}
            </div>
            
            <div className="border-t border-gray-600 pt-2">
              <p className="font-semibold text-yellow-400">Chats:</p>
              <p>Total: {chats.length}</p>
              <p>Filtered: {filteredChats.length}</p>
              <p>Selected: {selectedChat ? (selectedChat.id || selectedChat.conversationId || '').substring(0, 8) : 'None'}</p>
            </div>
            
            <div className="border-t border-gray-600 pt-2">
              <p className="font-semibold text-purple-400">Messages:</p>
              <p>Count: {messages.length}</p>
              <p>Loading: {loadingMessages ? '⏳' : '✅'}</p>
              <p>At Bottom: {isAtBottom ? '✅' : '❌'}</p>
              {messages.length > 0 ? (
                <>
                  <p className="mt-1 font-semibold">Last Message:</p>
                  <p className="truncate">{extractMessageText(messages[messages.length - 1]?.message) || 'N/A'}</p>
                  <p className="text-gray-400">
                    {messages[messages.length - 1]?.key?.fromMe ? '📤 Outgoing' : '📥 Incoming'} | {formatTimestamp(messages[messages.length - 1]?.messageTimestamp)}
                  </p>
                  <div className="mt-2 max-h-32 overflow-y-auto bg-gray-800 p-2 rounded">
                    <p className="font-semibold text-xs mb-1">All Messages:</p>
                    {messages.map((msg, idx) => {
                      const msgId = msg.key?.id || `msg-${idx}`
                      const isFromMe = msg.key?.fromMe || false
                      const messageText = extractMessageText(msg.message)
                      return (
                        <div key={msgId} className="text-xs border-b border-gray-700 pb-1 mb-1">
                          <span className="text-yellow-300">{idx + 1}.</span>{' '}
                          <span className={isFromMe ? 'text-green-300' : 'text-blue-300'}>
                            {isFromMe ? '📤' : '📥'}
                          </span>{' '}
                          <span className="truncate block text-gray-300">
                            {messageText?.substring(0, 40) || 'Mensagem sem texto'}
                          </span>
                          <span className="text-gray-500 text-[10px]">{msgId.substring(0, 8)}...</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p className="text-red-300 mt-1">
                  {selectedChat ? '⚠️ No messages loaded' : 'Select a chat'}
                </p>
              )}
            </div>
            
            <div className="border-t border-gray-600 pt-2">
              <p className="font-semibold text-orange-400">API Calls Log:</p>
              <p className="text-gray-400 text-xs mb-1">Últimas {apiCallsLog.length} requisições</p>
              {apiCallsLog.length === 0 ? (
                <p className="text-gray-500 text-xs">Nenhuma requisição ainda</p>
              ) : (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {apiCallsLog.map((log, index) => (
                    <div key={index} className="text-xs bg-gray-800 p-1 rounded">
                      <span className="text-yellow-300">{log.timestamp}</span>
                      {' '}
                      <span className={`font-bold ${
                        log.method === 'GET' ? 'text-green-400' : 
                        log.method === 'POST' ? 'text-blue-400' : 
                        'text-purple-400'
                      }`}>
                        {log.method}
                      </span>
                      {' '}
                      <span className="text-gray-300 truncate block">{log.endpoint}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setApiCallsLog([])}
                className="mt-2 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs cursor-pointer w-full"
              >
                Limpar Log
              </button>
            </div>
            
            <div className="border-t border-gray-600 pt-2">
              <p className="font-semibold text-pink-400">Actions:</p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    console.log('🔍 Current State:', {
                      instance,
                      chats,
                      selectedChat,
                      messages,
                      wsConnected,
                      apiCallsLog
                    })
                  }}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white cursor-pointer w-full"
                >
                  Log State to Console
                </button>
                
                {selectedChat && instance && (
                  <button
                    onClick={async () => {
                      if (!selectedChat || !instance) return
                      try {
                        setLoadingMessages(true)
                        console.log('🔄 Force reloading messages...')
                        const remoteJid = normalizeRemoteJid(selectedChat)
                        if (!remoteJid) return
                        const response = await apiCall(`/whatsapp/instance/${instance.instance_name}/messages?remoteJid=${encodeURIComponent(remoteJid)}&limit=${MESSAGES_PAGE_SIZE}&order=DESC`)
                        console.log('📨 Force reload response:', response)
                        if (response.success && response.messages) {
                          const sortedMessages = [...response.messages].sort((a, b) => {
                            const aTime = a.messageTimestamp || 0
                            const bTime = b.messageTimestamp || 0
                            return aTime - bTime
                          })
                          setMessages(sortedMessages)
                          console.log('✅ Messages force reloaded:', sortedMessages.length)
                          setHasMoreMessages((response.messages?.length || 0) === MESSAGES_PAGE_SIZE)
                        }
                      } catch (error) {
                        console.error('❌ Error force reloading:', error)
                      } finally {
                        setLoadingMessages(false)
                      }
                    }}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white cursor-pointer w-full"
                    disabled={loadingMessages}
                  >
                    {loadingMessages ? 'Reloading...' : '🔄 Force Reload Messages'}
                  </button>
                )}
                
                <button
                  onClick={async () => {
                    if (!instance) return
                    console.log('🔄 Force reloading chats...')
                    await loadChats()
                  }}
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white cursor-pointer w-full"
                >
                  🔄 Reload Chats
                </button>
                
                {selectedChat && (
                  <button
                    onClick={() => {
                      const testMessage: EvolutionMessage = {
                        key: {
                          remoteJid: selectedChat.id || selectedChat.conversationId || '',
                          fromMe: false,
                          id: `test-${Date.now()}`
                        },
                        messageTimestamp: Math.floor(Date.now() / 1000),
                        pushName: 'Test User',
                        message: {
                          conversation: `🧪 Test message at ${new Date().toLocaleTimeString()}`
                        }
                      }
                      setMessages(prev => [...prev, testMessage])
                      console.log('🧪 Added test message:', testMessage)
                    }}
                    className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-white cursor-pointer w-full"
                  >
                    🧪 Add Test Message
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  )
}

