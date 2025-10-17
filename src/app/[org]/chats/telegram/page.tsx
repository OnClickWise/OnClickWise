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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Phone,
  Video,
  Info,
  MessageCircle,
  Bot,
  Plus,
  Settings,
  ChevronDown,
  Pin,
  Trash2,
  RotateCcw
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useApi } from "@/hooks/useApi"
import { getApiBaseUrl } from "@/lib/api"

// Tipos para as interfaces
interface TelegramBot {
  id: string;
  bot_name: string;
  bot_username: string;
  is_active: boolean;
  is_online?: boolean;
  created_at: string;
}

interface TelegramAccount {
  id: string;
  api_id: string;
  phone_number: string;
  is_active: boolean;
  is_online?: boolean;
  created_at: string;
}

interface TelegramConversation {
  id: string;
  bot_id?: string;
  account_id?: string;
  organization_id: string;
  telegram_chat_id: number;
  telegram_user_id: string;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  lead_id?: string;
  chat_type: string;
  is_active: boolean;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  last_message_preview?: string;
  last_message_direction?: 'incoming' | 'outgoing';
}

interface TelegramMessage {
  id: string;
  conversation_id: string;
  telegram_message_id: number;
  direction: 'incoming' | 'outgoing';
  message_text?: string;
  message_type: string;
  file_id?: string;
  file_url?: string;
  caption?: string;
  is_delivered?: boolean;
  telegram_date?: string;
  created_at: string;
  message_metadata?: {
    file_name?: string;
    file_size?: number;
  };
}

export default function TelegramPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  const { apiCall, isClient } = useApi()
  
  const [selectedChat, setSelectedChat] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [messageText, setMessageText] = React.useState('')
  const [bot, setBot] = React.useState<TelegramBot | null>(null)
  const [account, setAccount] = React.useState<TelegramAccount | null>(null)
  const [conversations, setConversations] = React.useState<TelegramConversation[]>([])
  const [messages, setMessages] = React.useState<TelegramMessage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [filePreview, setFilePreview] = React.useState<string | null>(null)
  const [imageModal, setImageModal] = React.useState<{ isOpen: boolean; src: string }>({ isOpen: false, src: '' })
  const [uploading, setUploading] = React.useState(false)
  const [unreadCounts, setUnreadCounts] = React.useState<{[key: string]: number}>({})
  const [isMarkingAsRead, setIsMarkingAsRead] = React.useState(false)
  const [markAsReadTimeout, setMarkAsReadTimeout] = React.useState<NodeJS.Timeout | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [activeEmojiTab, setActiveEmojiTab] = React.useState('faces')
  const [isSending, setIsSending] = React.useState(false)
  const [isAtBottom, setIsAtBottom] = React.useState(true)
  const [messageQueue, setMessageQueue] = React.useState<Array<{
    id: string;
    text: string;
    file?: File;
    filePreview?: string;
    timestamp: number;
    status: 'pending' | 'sending' | 'sent' | 'failed';
    conversationId: string; // scoping queued item to a specific conversation
  }>>([])
  const [isProcessingQueue, setIsProcessingQueue] = React.useState(false)
  // New chat modal state
  const [showNewChatModal, setShowNewChatModal] = React.useState(false)
  const [newChatIdentifier, setNewChatIdentifier] = React.useState('')
  const [newChatFirstMessage, setNewChatFirstMessage] = React.useState('')
  const [startingChat, setStartingChat] = React.useState(false)
  
  // Chat type management
  const [chatType, setChatType] = React.useState<'bot' | 'account'>('bot')
  const [hasBot, setHasBot] = React.useState(false)
  const [hasAccount, setHasAccount] = React.useState(false)
  // List state: pins, deletions, unread overrides
  const [pinned, setPinned] = React.useState<Set<string>>(new Set())
  const [hiddenConversations, setHiddenConversations] = React.useState<Set<string>>(new Set())
  const [unreadOverrides, setUnreadOverrides] = React.useState<{[key: string]: number}>({})


  // Persistence key for localStorage
  const persistenceKey = `telegram_chat_type_${org}`
  const pinsKey = `telegram_pins_${org}`
  const deletedKey = `telegram_deleted_${org}`
  const unreadOverrideKey = `telegram_unread_overrides_${org}`

  // Load saved chat type from localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined' && isClient) {
      const savedChatType = localStorage.getItem(persistenceKey) as 'bot' | 'account' | null
      if (savedChatType && (savedChatType === 'bot' || savedChatType === 'account')) {
        setChatType(savedChatType)
      }
      // load pins/hidden/unread overrides
      try {
        const ps = localStorage.getItem(pinsKey)
        if (ps) setPinned(new Set(JSON.parse(ps)))
        const ds = localStorage.getItem(deletedKey)
        if (ds) setHiddenConversations(new Set(JSON.parse(ds)))
        const uo = localStorage.getItem(unreadOverrideKey)
        if (uo) setUnreadOverrides(JSON.parse(uo))
      } catch {}
    }
  }, [isClient, persistenceKey])

  // Presence: heartbeat while on chats page and page-exit on unmount
  React.useEffect(() => {
    if (!isClient) return
    let interval: any
    const sendHeartbeat = async () => {
      try { await apiCall('/presence/heartbeat', { method: 'POST' }) } catch {}
    }
    // start immediately then every 30s
    sendHeartbeat()
    interval = setInterval(sendHeartbeat, 30000)

    const handleBeforeUnload = () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        if (token && typeof fetch !== 'undefined') {
          // Usar fetch com keepalive para enviar com Authorization
          fetch(`${API_BASE_URL}/presence/telegram-page-exit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({}),
            keepalive: true,
          }).catch(() => {})
        }
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      if (interval) clearInterval(interval)
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
      // best-effort exit when navigating away
      apiCall('/presence/telegram-page-exit', { method: 'POST' }).catch(() => {})
    }
  }, [isClient, apiCall])

  // Save chat type to localStorage
  const saveChatType = (type: 'bot' | 'account') => {
    setChatType(type)
    setSelectedChat(null) // Clear selected chat when switching types
    if (typeof window !== 'undefined') {
      localStorage.setItem(persistenceKey, type)
    }
  }

  // Helpers to persist pins/hidden/unread overrides
  const persistPins = (next: Set<string>) => {
    setPinned(new Set(next))
    if (typeof window !== 'undefined') {
      localStorage.setItem(pinsKey, JSON.stringify(Array.from(next)))
    }
  }
  const persistHidden = (next: Set<string>) => {
    setHiddenConversations(new Set(next))
    if (typeof window !== 'undefined') {
      localStorage.setItem(deletedKey, JSON.stringify(Array.from(next)))
    }
  }
  const persistUnreadOverrides = (next: {[key: string]: number}) => {
    setUnreadOverrides({...next})
    if (typeof window !== 'undefined') {
      localStorage.setItem(unreadOverrideKey, JSON.stringify(next))
    }
  }

  // Função para adicionar mensagem à fila
  const addToQueue = (text: string, file?: File, filePreview?: string) => {
    const newMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      text,
      file,
      filePreview,
      timestamp: Date.now(),
      status: 'pending' as const,
      conversationId: selectedChat!
    }
    setMessageQueue(prev => [...prev, newMessage])
    return newMessage.id
  }

  // Função para processar a fila de mensagens
  const processQueue = async () => {
    if (isProcessingQueue || messageQueue.length === 0) return
    
    setIsProcessingQueue(true)
    const nextMessage = messageQueue.find(msg => msg.status === 'pending')
    
    if (!nextMessage) {
      setIsProcessingQueue(false)
      return
    }

    // Marcar como enviando
    setMessageQueue(prev => prev.map(msg => 
      msg.id === nextMessage.id ? { ...msg, status: 'sending' } : msg
    ))

    try {
      let response
      
      if (nextMessage.file) {
        // Enviar arquivo
        const formData = new FormData()
        formData.append('conversation_id', nextMessage.conversationId)
        formData.append('file', nextMessage.file)
        formData.append('message_type', getMessageType(nextMessage.file))
        if (nextMessage.text.trim()) {
          formData.append('caption', nextMessage.text)
        }
        
        response = await apiCall('/telegram/send-file', {
          method: 'POST',
          body: formData
        })
      } else {
        // Enviar texto
        response = await apiCall('/telegram/send-message', {
          method: 'POST',
          body: JSON.stringify({
            conversation_id: nextMessage.conversationId,
            message_text: nextMessage.text,
            message_type: 'text'
          })
        })
      }
      
      if (response.success) {
        // Marcar como enviada (mas manter na fila)
        setMessageQueue(prev => prev.map(msg => 
          msg.id === nextMessage.id ? { ...msg, status: 'sent' } : msg
        ))
        
        // Recarregar mensagens
        setTimeout(async () => {
          // Recarregar somente se o usuário ainda está nessa conversa
          if (nextMessage.conversationId !== selectedChat) return
          try {
            const messagesResponse = await apiCall(`/telegram/conversations/${nextMessage.conversationId}/messages`)
            if (messagesResponse.success && messagesResponse.messages) {
              setMessages(messagesResponse.messages)
              setTimeout(() => {
                if (isAtBottom) {
                  scrollToBottom(false)
                }
              }, 100)
            }
          } catch (error) {
            console.error('Erro ao recarregar mensagens:', error)
          }
        }, 500)
      } else {
        // Marcar como falhou
        setMessageQueue(prev => prev.map(msg => 
          msg.id === nextMessage.id ? { ...msg, status: 'failed' } : msg
        ))
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      // Marcar como falhou
      setMessageQueue(prev => prev.map(msg => 
        msg.id === nextMessage.id ? { ...msg, status: 'failed' } : msg
      ))
    } finally {
      setIsProcessingQueue(false)
    }
  }

  // Reenviar mensagem que falhou (recoloca como pending)
  const retryQueuedMessage = (id: string) => {
    setMessageQueue(prev => prev.map(msg => 
      msg.id === id 
        ? { ...msg, status: 'pending', timestamp: Date.now() }
        : msg
    ))
  }

  // Excluir mensagem da fila
  const deleteQueuedMessage = (id: string) => {
    setMessageQueue(prev => prev.filter(msg => msg.id !== id))
  }

  // Função para verificar se está no final do chat
  const checkIfAtBottom = () => {
    const messagesContainer = document.getElementById('messages-container')
    if (messagesContainer) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200 // 200px de tolerância
      setIsAtBottom(isNearBottom)
    }
  }

  // Função para scroll suave para o final
  const scrollToBottom = (smooth = true) => {
    const messagesContainer = document.getElementById('messages-container')
    if (messagesContainer) {
      if (smooth) {
        messagesContainer.scrollTo({
          top: messagesContainer.scrollHeight,
          behavior: 'smooth'
        })
      } else {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
    }
  }

  // Fechar seletor de emojis quando clicar fora (mas não no botão)
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const emojiPicker = document.getElementById('emoji-picker')
      const emojiButton = document.querySelector('[data-emoji-button]')
      
      // Só fechar se clicar fora do picker E fora do botão
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

  // Carregar configurações do Telegram (bot e account)
  React.useEffect(() => {
    // Só executar no cliente e quando isClient for true
    if (typeof window === 'undefined' || !isClient) return
    
    const loadConfigurations = async () => {
      try {
        setLoading(true)
        
        // Carregar bot
        const botResponse = await apiCall('/telegram/bots')
        let botAvailable = false
        if (botResponse.success && botResponse.bots && botResponse.bots.length > 0) {
          setBot(botResponse.bots[0])
          setHasBot(true)
          botAvailable = true
        } else {
          setHasBot(false)
        }
        
        // Carregar account
        const accountResponse = await apiCall('/telegram/accounts')
        let accountAvailable = false
        if (accountResponse.success && accountResponse.accounts && accountResponse.accounts.length > 0) {
          setAccount(accountResponse.accounts[0])
          setHasAccount(true)
          accountAvailable = true
        } else {
          setHasAccount(false)
        }
        
        // Determinar chat type inicial baseado na disponibilidade
        if (!botAvailable && accountAvailable) {
          saveChatType('account')
        } else if (botAvailable && !accountAvailable) {
          saveChatType('bot')
        }
        // Se ambos estão disponíveis, usar o tipo salvo (já carregado do localStorage)
        
        
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      } finally {
        setLoading(false)
      }
    }
    loadConfigurations()
  }, [isClient]) // Adicionado isClient como dependência

  // Carregar conversas baseado no tipo de chat selecionado
  React.useEffect(() => {
    // Só executar no cliente, quando isClient for true e se houver configuração
    if (typeof window === 'undefined' || !isClient) return
    
    const loadConversations = async () => {
      try {
        setLoading(true)
        let response
        
        if (chatType === 'bot' && bot) {
          response = await apiCall(`/telegram/conversations?bot_id=${bot.id}`)
        } else if (chatType === 'account' && account) {
          response = await apiCall(`/telegram/conversations?account_id=${account.id}`)
        } else {
          setConversations([])
          setLoading(false)
          return
        }
        
        if (response.success && response.conversations) {
          setConversations(response.conversations)
        } else {
          setConversations([])
        }
      } catch (error) {
        console.error('Erro ao carregar conversas:', error)
        setConversations([])
      } finally {
        setLoading(false)
      }
    }
    loadConversations()
  }, [isClient, chatType, bot, account]) // Adicionado chatType, bot e account como dependências

  // Auto-refresh das conversas a cada 10 segundos
  React.useEffect(() => {
    if (!isClient) return

    const refreshConversations = async () => {
      try {
        let response
        
        if (chatType === 'bot' && bot) {
          response = await apiCall(`/telegram/conversations?bot_id=${bot.id}`)
        } else if (chatType === 'account' && account) {
          response = await apiCall(`/telegram/conversations?account_id=${account.id}`)
        } else {
          return
        }
        
        if (response.success && response.conversations) {
          setConversations(response.conversations)
        }
      } catch (error) {
        console.error('Erro ao atualizar conversas:', error)
      }
    }

    const interval = setInterval(refreshConversations, 10000) // Atualizar a cada 10 segundos
    return () => clearInterval(interval)
  }, [chatType, bot, account, isClient])

  // Carregar mensagens quando uma conversa for selecionada
  React.useEffect(() => {
    // Só executar no cliente, quando isClient for true e se houver conversa selecionada
    if (typeof window === 'undefined' || !isClient || !selectedChat) return
    
    const loadMessages = async () => {
      try {
        const response = await apiCall(`/telegram/conversations/${selectedChat}/messages`)
        if (response.success && response.messages) {
          setMessages(response.messages)
          
          // Scroll para o final apenas se estiver no final
          setTimeout(() => {
            if (isAtBottom) {
              scrollToBottom(false)
            }
          }, 100)
          // Zerar notificações para o chat aberto
          setUnreadCounts(prev => ({ ...prev, [selectedChat]: 0 }))
        } else {
          console.error('Erro na resposta da API para mensagens:', response.error || 'Resposta inválida')
        }
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error)
      }
    }
    loadMessages()
  }, [isClient, selectedChat]) // Adicionado isClient como dependência

  // Focar automaticamente no campo de texto quando uma conversa é selecionada
  React.useEffect(() => {
    if (selectedChat && isClient) {
      setTimeout(() => {
        const messageInput = document.getElementById('message-input') as HTMLInputElement
        if (messageInput) {
          messageInput.focus()
        }
      }, 200)
    }
  }, [selectedChat, isClient])

  // Detectar scroll do usuário para controlar auto-scroll
  React.useEffect(() => {
    const messagesContainer = document.getElementById('messages-container')
    if (!messagesContainer) return

    const handleScroll = () => {
      checkIfAtBottom()
    }

    messagesContainer.addEventListener('scroll', handleScroll)
    
    // Verificar posição inicial
    checkIfAtBottom()

    return () => {
      messagesContainer.removeEventListener('scroll', handleScroll)
    }
  }, [selectedChat, messages])

  // Start new account chat
  const startNewAccountChat = async () => {
    if (!account) return
    if (!newChatIdentifier.trim()) return
    setStartingChat(true)
    try {
      const response = await apiCall(`/telegram/accounts/${account.id}/start-chat`, {
        method: 'POST',
        body: JSON.stringify({ identifier: newChatIdentifier.trim(), firstMessage: newChatFirstMessage.trim() || undefined })
      })
      if (response.success && response.conversation) {
        setShowNewChatModal(false)
        setNewChatIdentifier('')
        setNewChatFirstMessage('')
        // Refresh conversations and select the new one
        const list = await apiCall(`/telegram/conversations?account_id=${account.id}`)
        if (list.success && list.conversations) {
          setConversations(list.conversations)
          const conv = list.conversations.find((c: any) => c.telegram_chat_id?.toString() === response.conversation.telegram_chat_id?.toString())
          if (conv) setSelectedChat(conv.id)
        }
      } else {
        alert(response.error || 'Failed to start chat')
      }
    } catch (e) {
      console.error('Start chat error:', e)
      alert('Failed to start chat')
    } finally {
      setStartingChat(false)
    }
  }

  // Processar fila de mensagens automaticamente
  React.useEffect(() => {
    const pendingMessages = messageQueue.filter(msg => msg.status === 'pending')
    if (pendingMessages.length > 0 && !isProcessingQueue) {
      const timer = setTimeout(() => {
        processQueue()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [messageQueue, isProcessingQueue])

  // Remover mensagens da fila quando aparecerem do banco de dados
  React.useEffect(() => {
    if (messages.length > 0 && messageQueue.length > 0) {
      const sentMessages = messageQueue.filter(msg => msg.status === 'sent' && msg.conversationId === selectedChat)
      
      sentMessages.forEach(sentMsg => {
        // Verificar se a mensagem já existe no banco
        const existsInDB = messages.some(dbMsg => {
          // Verificar se é mensagem de saída e timestamp próximo
          const isOutgoing = dbMsg.direction === 'outgoing'
          const isRecent = Math.abs(new Date(dbMsg.created_at).getTime() - sentMsg.timestamp) < 15000 // 15 segundos
          
          if (!isOutgoing || !isRecent) return false
          
          // Para mensagens de texto simples
          if (!sentMsg.file && dbMsg.message_type === 'text') {
            return dbMsg.message_text === sentMsg.text
          }
          
          // Para mensagens com arquivo
          if (sentMsg.file && dbMsg.message_type !== 'text') {
            // Verificar se tem caption correspondente
            const captionMatch = sentMsg.text ? 
              (dbMsg.caption === sentMsg.text) : 
              (!dbMsg.caption || dbMsg.caption === '')
            
            return captionMatch
          }
          
          return false
        })
        
        if (existsInDB) {
          // Remover da fila se já existe no banco
          console.log('Removendo mensagem da fila:', sentMsg.id, sentMsg.text)
          setMessageQueue(prev => prev.filter(msg => msg.id !== sentMsg.id))
        }
      })
    }
  }, [messages, messageQueue, selectedChat])

  // Timeout de segurança para remover mensagens enviadas após 3 segundos
  React.useEffect(() => {
    const sentMessages = messageQueue.filter(msg => msg.status === 'sent')
    if (sentMessages.length > 0) {
      const timer = setTimeout(() => {
        console.log('Timeout: removendo mensagens enviadas da fila')
        setMessageQueue(prev => prev.filter(msg => msg.status !== 'sent'))
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [messageQueue])

  // Detectar e remover mensagens duplicadas na fila
  React.useEffect(() => {
    if (messageQueue.length > 1) {
      const duplicates = messageQueue.filter((msg, index, arr) => 
        arr.findIndex(m => 
          m.text === msg.text && 
          m.timestamp === msg.timestamp && 
          m.status === msg.status
        ) !== index
      )
      
      if (duplicates.length > 0) {
        console.log('Removendo duplicatas da fila:', duplicates.length)
        setMessageQueue(prev => {
          const seen = new Set()
          return prev.filter(msg => {
            const key = `${msg.text}-${msg.timestamp}-${msg.status}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
        })
      }
    }
  }, [messageQueue])

  // Removido auto-scroll forçado para permitir navegação livre

  // Auto-refresh das mensagens a cada 5 segundos (menos frequente para não interferir)
  React.useEffect(() => {
    if (!selectedChat || !isClient || isMarkingAsRead || uploading) return

    const refreshMessages = async () => {
      if (isRefreshing) return
      
      try {
        setIsRefreshing(true)
        const response = await apiCall(`/telegram/conversations/${selectedChat}/messages`)
        if (response.success && response.messages) {
          setMessages(response.messages)
          
          // Scroll para o final apenas se estiver no final
          setTimeout(() => {
            if (isAtBottom) {
              scrollToBottom(false)
            }
          }, 100)
          // Zerar notificações para o chat aberto
          setUnreadCounts(prev => ({ ...prev, [selectedChat]: 0 }))
          // Enquanto estiver dentro da conversa, marcar como lido imediatamente no backend
          try {
            const markResp = await apiCall(`/telegram/conversations/${selectedChat}/mark-read`, { method: 'POST' })
            if (markResp?.success) {
              setUnreadCounts(prev => ({ ...prev, [selectedChat]: 0 }))
            }
          } catch (e) {
            console.error('Erro ao auto-marcar como lido durante refresh:', e)
          }
        }
      } catch (error) {
        console.error('Erro ao atualizar mensagens:', error)
      } finally {
        setIsRefreshing(false)
      }
    }

    const interval = setInterval(refreshMessages, 5000) // Atualizar a cada 5 segundos
    return () => clearInterval(interval)
  }, [selectedChat, isClient, isRefreshing, isMarkingAsRead, uploading])

  // Auto-refresh das contagens de não lidas a cada 10 segundos (reduzido para evitar conflito)
  React.useEffect(() => {
    if (!isClient || !conversations.length) return

    const refreshUnreadCounts = async () => {
      // Não atualizar se estiver marcando mensagens como lidas
      if (isMarkingAsRead) {
        return
      }
      
      try {
        const counts: {[key: string]: number} = {}
        for (const conversation of conversations) {
          try {
            if (conversation.id === selectedChat) {
              counts[conversation.id] = 0
            } else {
              const response = await apiCall(`/telegram/conversations/${conversation.id}/unread-count`)
              if (response.success) {
                counts[conversation.id] = response.unreadCount || 0
              }
            }
          } catch (error) {
            console.error(`Erro ao carregar contagem para conversa ${conversation.id}:`, error)
            counts[conversation.id] = 0
          }
        }
        setUnreadCounts(counts)
      } catch (error) {
        console.error('Erro ao atualizar contagens de não lidas:', error)
      }
    }

    const interval = setInterval(refreshUnreadCounts, 10000) // Atualizar a cada 10 segundos
    return () => clearInterval(interval)
  }, [isClient, conversations, isMarkingAsRead, selectedChat])

  // Carregar contagem de mensagens não lidas
  React.useEffect(() => {
    if (!isClient || !conversations.length) return

    const loadUnreadCounts = async () => {
      try {
        const counts: {[key: string]: number} = {}
        for (const conversation of conversations) {
          try {
            if (conversation.id === selectedChat) {
              counts[conversation.id] = 0
            } else {
              const response = await apiCall(`/telegram/conversations/${conversation.id}/unread-count`)
              if (response.success) {
                counts[conversation.id] = response.unreadCount || 0
              }
            }
          } catch (error) {
            console.error(`Erro ao carregar contagem para conversa ${conversation.id}:`, error)
            counts[conversation.id] = 0
          }
        }
        setUnreadCounts(counts)
      } catch (error) {
        console.error('Erro ao carregar contagens de não lidas:', error)
      }
    }

    loadUnreadCounts()
  }, [isClient, conversations, selectedChat])

  // Marcar mensagens como lidas quando a conversa for selecionada
  React.useEffect(() => {
    if (!selectedChat || !isClient) return

    // Limpar timeout anterior se existir
    if (markAsReadTimeout) {
      clearTimeout(markAsReadTimeout)
    }

    const markAsRead = async () => {
      try {
        setIsMarkingAsRead(true)
        console.log(`Marking messages as read for conversation: ${selectedChat}`)
        const response = await apiCall(`/telegram/conversations/${selectedChat}/mark-read`, {
          method: 'POST'
        })
        
        if (response.success) {
          console.log(`Successfully marked ${response.unreadCount || 0} messages as read`)
          // Atualizar contagem local
          setUnreadCounts(prev => ({
            ...prev,
            [selectedChat]: 0
          }))
        } else {
          console.error('Failed to mark messages as read:', response.error)
        }
      } catch (error) {
        console.error('Erro ao marcar mensagens como lidas:', error)
      } finally {
        setIsMarkingAsRead(false)
      }
    }

    // Marcar como lida após um delay para garantir que as mensagens foram carregadas
    const timeout = setTimeout(markAsRead, 1000)
    setMarkAsReadTimeout(timeout)
    
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [selectedChat, isClient])

  // Sort conversations by last activity (last_message_at fallback to updated_at/created_at)
  const sortedConversations = React.useMemo(() => {
    const visible = conversations.filter(c => !hiddenConversations.has(c.id))
    return [...visible].sort((a, b) => {
      // Pinned first
      const aPinned = pinned.has(a.id) ? 1 : 0
      const bPinned = pinned.has(b.id) ? 1 : 0
      if (aPinned !== bPinned) return bPinned - aPinned
      const aTime = new Date(a.last_message_at || a.updated_at || a.created_at).getTime()
      const bTime = new Date(b.last_message_at || b.updated_at || b.created_at).getTime()
      return bTime - aTime
    })
  }, [conversations, pinned, hiddenConversations])

  const filteredConversations = sortedConversations.filter(conv => {
    const searchLower = searchTerm.toLowerCase()
    return (
      conv.first_name?.toLowerCase().includes(searchLower) ||
      conv.last_name?.toLowerCase().includes(searchLower) ||
      conv.telegram_username?.toLowerCase().includes(searchLower) ||
      (conv.lead_id && 'lead vinculado'.toLowerCase().includes(searchLower))
    )
  })

  const selectedConversation = conversations.find(conv => conv.id === selectedChat)

  // Merge API unread with local overrides
  const effectiveUnread = (id: string) => {
    return (unreadCounts[id] || 0) + (unreadOverrides[id] || 0)
  }

  // Actions for dropdown menu
  const markAsUnread = (id: string) => {
    const next = { ...unreadOverrides, [id]: Math.max(1, (unreadOverrides[id] || 0) + 1) }
    persistUnreadOverrides(next)
  }
  const togglePin = (id: string) => {
    const next = new Set(pinned)
    if (next.has(id)) next.delete(id); else next.add(id)
    persistPins(next)
  }
  const deleteChatLocal = (id: string) => {
    const next = new Set(hiddenConversations)
    next.add(id)
    persistHidden(next)
    if (selectedChat === id) setSelectedChat(null)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      // Criar preview para imagens
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setFilePreview(null)
      }
    }
  }

  const getMessageType = (file: File): string => {
    if (file.type.startsWith('image/')) return 'photo'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const handleSendMessage = () => {
    if ((messageText.trim() || selectedFile) && selectedChat) {
      // Adicionar à fila imediatamente
      addToQueue(messageText, selectedFile || undefined, filePreview || undefined)
      
      // Limpar campos imediatamente
          setMessageText('')
          setSelectedFile(null)
          setFilePreview(null)
          const fileInput = document.getElementById('file-input') as HTMLInputElement
          if (fileInput) fileInput.value = ''
          
      // Manter foco na caixa de texto imediatamente
      setTimeout(() => {
        const messageInput = document.getElementById('message-input') as HTMLInputElement
        if (messageInput) {
          messageInput.focus()
          messageInput.click() // Força o foco
        }
      }, 10)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    // Se for hoje, mostrar apenas o horário
    if (diffInDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    }
    // Se for ontem
    else if (diffInDays === 1) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })}`
    }
    // Se for da semana passada
    else if (diffInDays < 7) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const dayName = dayNames[date.getDay()]
      return `${dayName} ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })}`
    }
    // Se for mais antigo
    else {
      return date.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: '2-digit',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  // Timestamp format specifically for conversation preview (en-US rules requested)
  const formatConversationTimestamp = (timestamp?: string) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
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

  // Função para formatar tamanho e tipo do arquivo igual ao WhatsApp
  const formatFileInfo = (fileName: string, fileSize: number) => {
    const extension = fileName.split('.').pop()?.toUpperCase() || ''
    const sizeInKB = fileSize / 1024
    const sizeInMB = fileSize / (1024 * 1024)
    
    let sizeText = ''
    if (sizeInMB >= 1) {
      sizeText = `${sizeInMB.toFixed(1)} MB`
    } else {
      sizeText = `${sizeInKB.toFixed(0)} KB`
    }
    
    return `${extension} • ${sizeText}`
  }

  const getDisplayName = (conversation: TelegramConversation) => {
    if (conversation.first_name && conversation.last_name) {
      return `${conversation.first_name} ${conversation.last_name}`
    } else if (conversation.first_name) {
      return conversation.first_name
    } else if (conversation.telegram_username) {
      return `@${conversation.telegram_username}`
    } else {
      return `Usuário ${conversation.telegram_user_id}`
    }
  }

  const insertEmoji = (emoji: string) => {
    setMessageText(prev => prev + emoji)
    // Não fechar o picker automaticamente - permitir múltiplos emojis
    // Manter foco no input após inserir emoji
    setTimeout(() => {
      const messageInput = document.getElementById('message-input') as HTMLInputElement
      if (messageInput) {
        messageInput.focus()
      }
    }, 50)
  }


  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
          {/* HEADER */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${org}/dashboard`}>
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/${org}/chats`}>
                    Chats
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Telegram</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* MAIN CONTENT */}
          <div className="flex h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden w-full">
            {/* Lista de Conversas */}
            <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col min-w-0">
              {/* Header da Lista */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-xl font-semibold text-gray-800">Telegram</h1>
                    {/* Status indicator */}
                    {(chatType === 'bot' && bot) && (
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${bot.is_online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-sm font-medium ${bot.is_online ? 'text-green-600' : 'text-red-600'}`}>
                          {bot.is_online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    )}
                    {(chatType === 'account' && account) && (
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${account.is_online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-sm font-medium ${account.is_online ? 'text-green-600' : 'text-red-600'}`}>
                          {account.is_online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" asChild className="cursor-pointer">
                        <a href={`/${org}/settings/telegram`}>
                          <Settings className="w-4 h-4" />
                        </a>
                      </Button>
                  </div>
                </div>
                
                {/* Chat Type Selector */}
                {(hasBot && hasAccount) && (
                  <div className="mb-4">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => saveChatType('bot')}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          chatType === 'bot'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Bot className="w-4 h-4" />
                          <span>Bot Chats</span>
                        </div>
                      </button>
                      <button
                        onClick={() => saveChatType('account')}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          chatType === 'account'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <MessageCircle className="w-4 h-4" />
                          <span>Account Chats</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {chatType === 'account' && (
                    <Button size="sm" onClick={() => setShowNewChatModal(true)} className="cursor-pointer">
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Lista de Conversas */}
              <div className="flex-1 overflow-y-auto min-w-0">
                {(() => {
                  if (!hasBot && !hasAccount) {
                    return (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <Bot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <div className="text-gray-500 text-sm mb-2">No Telegram configuration found</div>
                          <Button variant="outline" size="sm" asChild className="cursor-pointer">
                            <a href={`/${org}/settings/telegram`}>
                              Configure Telegram
                            </a>
                          </Button>
                        </div>
                      </div>
                    )
                  } else if (chatType === 'bot' && !bot) {
                    return (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <Bot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <div className="text-gray-500 text-sm mb-2">No bot configured</div>
                          <Button variant="outline" size="sm" asChild className="cursor-pointer">
                            <a href={`/${org}/settings/telegram`}>
                              Configure Bot
                            </a>
                          </Button>
                        </div>
                      </div>
                    )
                  } else if (chatType === 'account' && !account) {
                    return (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <div className="text-gray-500 text-sm mb-2">No account configured</div>
                          <Button variant="outline" size="sm" asChild className="cursor-pointer">
                            <a href={`/${org}/settings/telegram`}>
                              Configure Account
                            </a>
                          </Button>
                        </div>
                      </div>
                    )
                  } else if (loading) {
                    return (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-gray-500">Loading conversations...</div>
                      </div>
                    )
                  } else if (filteredConversations.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <Bot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <div className="text-gray-500 text-sm">No conversations found</div>
                        </div>
                      </div>
                    )
                  } else {
                    return (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={async () => {
                        // Selecionar conversa
                        setSelectedChat(conversation.id)
                        // Limpar badge local imediatamente (UX otimista)
                        setUnreadCounts(prev => ({ ...prev, [conversation.id]: 0 }))
                        // Remover override local, se houver
                        try {
                        	const nextOverrides = { ...unreadOverrides }
                        	if (nextOverrides[conversation.id]) {
                        		delete nextOverrides[conversation.id]
                        		persistUnreadOverrides(nextOverrides)
                        	}
                        } catch {}
                        // Marcar como lido no backend imediatamente
                        try {
                        	await apiCall(`/telegram/conversations/${conversation.id}/mark-read`, { method: 'POST' })
                        } catch (e) {
                        	console.error('Falha ao marcar como lido ao selecionar conversa:', e)
                        }
                      }}
                      className={`group relative p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${
                        selectedChat === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      {/* Pin indicator - bottom-right of the card */}
                      {pinned.has(conversation.id) && (
                        <div className="absolute bottom-2 right-2 flex items-center text-yellow-600 opacity-80 pointer-events-none">
                          <Pin className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback>
                              {getDisplayName(conversation).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {getDisplayName(conversation)}
                            </h3>
                            <div className="flex items-center space-x-2">
                              {effectiveUnread(conversation.id) > 0 && (
                                <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                                  {effectiveUnread(conversation.id) > 99 ? '99+' : effectiveUnread(conversation.id)}
                                </div>
                              )}
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatConversationTimestamp(conversation.last_message_at || conversation.updated_at || conversation.created_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-600 truncate max-w-full">
                                {conversation.last_message_direction === 'outgoing' ? 'You: ' : ''}
                                {conversation.last_message_preview || (conversation.telegram_username ? `@${conversation.telegram_username}` : 'Private conversation')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {conversation.lead_id && (
                                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                  ✅ Lead Linked
                                </Badge>
                              )}
                              {/* Removed explicit "Private" badge as requested */}
                              {/* Dropdown trigger moved to bottom-right */}
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
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => markAsUnread(conversation.id)}>
                                    Mark as Unread
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => togglePin(conversation.id)}>
                                    {pinned.has(conversation.id) ? 'Unpin from Top' : 'Pin to Top'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600 focus:text-red-700 cursor-pointer" onClick={() => deleteChatLocal(conversation.id)}>
                                    Delete Chat
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                    )
                  }
                })()}
              </div>
            </div>

            {/* Área de Chat */}
            <div className="flex-1 flex flex-col max-w-full min-w-0 overflow-hidden">
              {selectedConversation ? (
                <>
                  {/* Header do Chat */}
                  <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {getDisplayName(selectedConversation).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {getDisplayName(selectedConversation)}
                        </h2>
                        <div className="space-y-1">
                        <p className="text-sm text-gray-500">
                          {selectedConversation.telegram_username ? `@${selectedConversation.telegram_username}` : 'Private conversation'}
                        </p>
                          {selectedConversation.phone_number && (
                            <p className="text-sm text-blue-600">
                              📞 {selectedConversation.phone_number}
                            </p>
                          )}
                          {selectedConversation.lead_id && (
                            <p className="text-sm text-green-600">
                              ✅ Lead linked
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="cursor-pointer">
                        <Info className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mensagens */}
                          <div className="relative flex-1 overflow-hidden">
                    <div id="messages-container" className={`h-full overflow-y-auto p-4 space-y-2 bg-gray-50 w-full ${selectedFile ? 'mb-20' : ''}`}>
                    {messages.length === 0 && messageQueue.length === 0 ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <div className="text-gray-500 text-sm">No messages yet</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Mensagens do banco de dados */}
                        {messages
                        .sort((a, b) => {
                          const aTime = new Date(a.telegram_date || a.created_at).getTime()
                          const bTime = new Date(b.telegram_date || b.created_at).getTime()
                          return aTime - bTime // Mais antigas primeiro
                        })
                        .map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'} mb-1`}
                            >
                            <div
                              className={`max-w-[80%] px-3 py-2 rounded-2xl break-words overflow-hidden ${
                                message.direction === 'outgoing'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white text-gray-900 border border-gray-200'
                              }`}
                            >
                              <div className="flex items-end space-x-2">
                                <div className="flex-1 min-w-0">
                                  {message.message_text && (
                                    <p 
                                      className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                                      style={{
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        hyphens: 'auto'
                                      }}
                                    >
                                      {message.message_text}
                                    </p>
                                  )}
                                  {message.message_type === 'photo' && (
                                    <div className="mt-2">
                                        {message.file_id ? (
                                          <div className="space-y-2">
                                            <div className="relative group">
                                              <img 
                                                src={`${getApiBaseUrl()}/telegram/files/${message.file_id}`}
                                                alt="Foto"
                                                className="max-w-xs max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => setImageModal({ isOpen: true, src: `${getApiBaseUrl()}/telegram/files/${message.file_id}` })}
                                                onError={(e) => {
                                                  const target = e.currentTarget;
                                                  const imageUrl = target.src;
                                                  console.error('Erro ao carregar imagem:', {
                                                    file_id: message.file_id,
                                                    url: imageUrl,
                                                    message_id: message.id,
                                                    error: 'Failed to load image',
                                                    status: 'Image load failed'
                                                  });
                                                  // Hide the broken image and show a placeholder
                                                  target.style.display = 'none';
                                                  // Create a placeholder div
                                                  const placeholder = document.createElement('div');
                                                  placeholder.className = 'max-w-xs max-h-48 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 text-sm';
                                                  placeholder.innerHTML = 'Imagem não carregada';
                                                  target.parentNode?.insertBefore(placeholder, target);
                                                }}
                                                onLoad={(e) => {
                                                  console.log('Imagem carregada com sucesso:', {
                                                    file_id: message.file_id,
                                                    url: e.currentTarget.src
                                                  });
                                                }}
                                              />
                                              {/* Ícone de download no canto superior direito - apenas no hover */}
                                              <a
                                                href={`${getApiBaseUrl()}/telegram/files/${message.file_id}?download=true`}
                                                download
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                                title="Download image"
                                              >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                              </a>
                                            </div>
                                          {/* Texto embaixo da imagem como no Telegram */}
                                          {message.caption && (
                                            <p className={`text-sm ${
                                              message.direction === 'outgoing' 
                                                ? 'text-white' 
                                                : 'text-gray-600'
                                            }`}>
                                              {message.caption}
                                            </p>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500">
                                          <p>Imagem não disponível</p>
                                          <p className="text-xs">file_id: {message.file_id || 'null'}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {message.message_type === 'video' && (
                                    <div className="mt-2">
                                        {message.file_id && (
                                          <div className="space-y-2">
                                           <div className={`flex items-center space-x-3 p-3 rounded-lg group relative cursor-pointer ${
                                             message.direction === 'outgoing' 
                                               ? 'bg-blue-600' 
                                               : 'bg-gray-50'
                                           }`}>
                                             <div className="flex-shrink-0 relative">
                                               <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                                 <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                               </svg>
                                               {/* Ícone de download bem em cima do ícone do vídeo - apenas no hover */}
                                               <a
                                                 href={`${getApiBaseUrl()}/telegram/files/${message.file_id}?download=true`}
                                                 download
                                                 onClick={(e) => e.stopPropagation()}
                                                 className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center"
                                                 title="Download video"
                                               >
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                 </svg>
                                               </a>
                                             </div>
                                             <div className="flex-1 min-w-0">
                                               <p className={`text-sm font-medium ${
                                                 message.direction === 'outgoing' 
                                                   ? 'text-white' 
                                                   : 'text-gray-900'
                                               }`}>
                                                 🎥 Video
                                               </p>
                                               <p className={`text-xs ${
                                                 message.direction === 'outgoing' 
                                                   ? 'text-blue-100' 
                                                   : 'text-gray-500'
                                               }`}>
                                                 {(() => {
                                                   if (message.message_metadata?.file_name) {
                                                     return formatFileInfo(message.message_metadata.file_name, message.message_metadata.file_size || 0);
                                                   } else {
                                                     return 'MP4 • 0 KB';
                                                   }
                                                 })()}
                                               </p>
                                             </div>
                                           </div>
                                          {/* Texto separado embaixo como no Telegram */}
                                          {message.caption && (
                                            <p className={`text-sm ${
                                              message.direction === 'outgoing' 
                                                ? 'text-white' 
                                                : 'text-gray-600'
                                            }`}>
                                              {message.caption}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {message.message_type === 'document' && (
                                    <div className="mt-2">
                                        {message.file_id && (
                                          <div className="space-y-2">
                                           <div className={`flex items-center space-x-3 p-3 rounded-lg group relative cursor-pointer ${
                                             message.direction === 'outgoing' 
                                               ? 'bg-blue-600' 
                                               : 'bg-gray-50'
                                           }`}>
                                             <div className="flex-shrink-0 relative">
                                               <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                 <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                               </svg>
                                               {/* Ícone de download bem em cima do ícone vermelho - apenas no hover */}
                                               <a
                                                 href={`${getApiBaseUrl()}/telegram/files/${message.file_id}?download=true`}
                                                 download
                                                 onClick={(e) => e.stopPropagation()}
                                                 className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center"
                                                 title="Download document"
                                               >
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                 </svg>
                                               </a>
                                             </div>
                                             <div className="flex-1 min-w-0">
                                               <p className={`text-sm font-medium truncate ${
                                                 message.direction === 'outgoing' 
                                                   ? 'text-white' 
                                                   : 'text-gray-900'
                                               }`}>
                                                 {message.message_metadata?.file_name || 'Document'}
                                               </p>
                                               <p className={`text-xs ${
                                                 message.direction === 'outgoing' 
                                                   ? 'text-blue-100' 
                                                   : 'text-gray-500'
                                               }`}>
                                                 {(() => {
                                                   if (message.message_metadata?.file_name) {
                                                     return formatFileInfo(message.message_metadata.file_name, message.message_metadata.file_size || 0);
                                                   } else {
                                                     return 'DOC • 0 KB';
                                                   }
                                                 })()}
                                               </p>
                                             </div>
                                           </div>
                                          {/* Texto separado embaixo como no Telegram */}
                                          {message.caption && (
                                            <p className={`text-sm ${
                                              message.direction === 'outgoing' 
                                                ? 'text-white' 
                                                : 'text-gray-600'
                                            }`}>
                                              {message.caption}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {message.message_type === 'audio' && (
                                    <div className="mt-2">
                                        {message.file_id && (
                                          <div className="space-y-2">
                                           <div className={`flex items-center space-x-3 p-3 rounded-lg group relative cursor-pointer ${
                                             message.direction === 'outgoing' 
                                               ? 'bg-blue-600' 
                                               : 'bg-gray-50'
                                           }`}>
                                             <div className="flex-shrink-0 relative">
                                               <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                 <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                               </svg>
                                               {/* Ícone de download bem em cima do ícone do áudio - apenas no hover */}
                                               <a
                                                 href={`${getApiBaseUrl()}/telegram/files/${message.file_id}?download=true`}
                                                 download
                                                 onClick={(e) => e.stopPropagation()}
                                                 className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center"
                                                 title="Baixar áudio"
                                               >
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                 </svg>
                                               </a>
                                             </div>
                                             <div className="flex-1 min-w-0">
                                               <p className={`text-sm font-medium ${
                                                 message.direction === 'outgoing' 
                                                   ? 'text-white' 
                                                   : 'text-gray-900'
                                               }`}>
                                                 🎵 Audio
                                               </p>
                                               <p className={`text-xs ${
                                                 message.direction === 'outgoing' 
                                                   ? 'text-blue-100' 
                                                   : 'text-gray-500'
                                               }`}>
                                                 {(() => {
                                                   if (message.message_metadata?.file_name) {
                                                     return formatFileInfo(message.message_metadata.file_name, message.message_metadata.file_size || 0);
                                                   } else {
                                                     return 'MP3 • 0 KB';
                                                   }
                                                 })()}
                                               </p>
                                             </div>
                                           </div>
                                          {/* Texto separado embaixo como no Telegram */}
                                          {message.caption && (
                                            <p className={`text-sm ${
                                              message.direction === 'outgoing' 
                                                ? 'text-white' 
                                                : 'text-gray-600'
                                            }`}>
                                              {message.caption}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {message.message_type === 'voice' && (
                                    <div className="flex items-center space-x-2">
                                    <div className="text-xs opacity-75">🎤 Voice message</div>
                                      {message.file_id && (
                                        <a 
                                          href={`${getApiBaseUrl()}/telegram/files/${message.file_id}?download=true`}
                                          download
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                                        >
                                          Reproduzir
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  {message.message_type === 'sticker' && (
                                    <div className="text-xs opacity-75">😀 Sticker</div>
                                  )}
                                  {message.message_type === 'location' && (
                                    <div className="text-xs opacity-75">📍 Location</div>
                                  )}
                                  {message.message_type === 'contact' && (
                                    <div className="text-xs opacity-75">👤 Contact</div>
                                  )}
                                </div>
                                
                                {/* Bottom-right timestamp */}
                                <div className="flex items-center space-x-1 flex-shrink-0 self-end">
                                  <span className={`text-xs ${
                                    message.direction === 'outgoing' ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                    {formatTimestamp(message.telegram_date || message.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Mensagens da fila (pendentes/enviando) - usando formato idêntico ao banco */}
                        {messageQueue
                          .filter(q => q.conversationId === selectedChat)
                          .sort((a, b) => a.timestamp - b.timestamp)
                          .map((queuedMessage) => (
                            <div
                              key={queuedMessage.id}
                              className="flex justify-end mb-1"
                            >
                              <div className="max-w-xs lg:max-w-md px-3 py-2 rounded-2xl bg-blue-500 text-white break-words overflow-hidden">
                                <div className="flex items-end space-x-2">
                                  <div className="flex-1 min-w-0">
                                    {/* Arquivo/Imagem primeiro */}
                                    {queuedMessage.file && (
                                      <div className="mt-2">
                                        {queuedMessage.filePreview ? (
                                          <div className="space-y-2">
                                            <div className="relative group">
                                              <img 
                                                src={queuedMessage.filePreview} 
                                                alt="Preview" 
                                                className="max-w-xs max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                              />
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            <div className="flex items-center space-x-3 p-3 rounded-lg group relative cursor-pointer bg-blue-600">
                                              <div className="flex-shrink-0 relative">
                                                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                </svg>
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                  {queuedMessage.file.name}
                                                </p>
                                                <p className="text-xs text-blue-100">
                                                  {formatFileInfo(queuedMessage.file.name, queuedMessage.file.size)}
                                                </p>
                                              </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                    )}
                                    
                                    {/* Texto da mensagem embaixo */}
                                    {queuedMessage.text && (
                                      <p 
                                        className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                                        style={{
                                          wordBreak: 'break-word',
                                          overflowWrap: 'break-word',
                                          hyphens: 'auto'
                                        }}
                                      >
                                        {queuedMessage.text}
                                      </p>
                                    )}
                              </div>
                                  
                                  {/* Horário e indicadores de status */}
                                  <div className="flex items-center space-x-1 flex-shrink-0">
                                    <span className="text-xs text-blue-100">
                                      {new Date(queuedMessage.timestamp).toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: false
                                      })}
                                    </span>
                                    
                                    {/* Loading ou status */}
                                    {queuedMessage.status === 'pending' && (
                                      <div className="flex space-x-0.5">
                                        <div className="w-1 h-1 rounded-full bg-blue-300 animate-pulse"></div>
                                        <div className="w-1 h-1 rounded-full bg-blue-300 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                        <div className="w-1 h-1 rounded-full bg-blue-300 animate-pulse" style={{animationDelay: '0.4s'}}></div>
                            </div>
                                    )}
                                    
                                    {queuedMessage.status === 'sending' && (
                                      <div className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                    
                                    {queuedMessage.status === 'failed' && (
                                      <div className="flex items-center gap-1">
                                        <div className="text-red-300 text-xs">❌</div>
                                        <button
                                          title="Retry"
                                          onClick={() => retryQueuedMessage(queuedMessage.id)}
                                          className="ml-1 p-1 rounded hover:bg-blue-600/30 cursor-pointer"
                                        >
                                          <RotateCcw className="w-3 h-3 text-blue-100" />
                                        </button>
                                        <button
                                          title="Delete"
                                          onClick={() => deleteQueuedMessage(queuedMessage.id)}
                                          className="p-1 rounded hover:bg-blue-600/30 cursor-pointer"
                                        >
                                          <Trash2 className="w-3 h-3 text-blue-100" />
                                        </button>
                                      </div>
                                    )}
                          </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </>
                    )}
                    </div>
                    
                    {/* Botão "Ir para o final" - meio embaixo */}
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
                    {selectedFile && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {filePreview ? (
                              <div className="space-y-2">
                                <img 
                                  src={filePreview} 
                                  alt="Preview" 
                                  className="max-w-xs max-h-32 rounded-lg object-cover"
                                />
                          <div className="text-sm text-gray-600">
                            📎 {selectedFile.name} ({formatFileInfo(selectedFile.name, selectedFile.size)})
                          </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">
                                📎 {selectedFile.name} ({formatFileInfo(selectedFile.name, selectedFile.size)})
                              </div>
                            )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null)
                              setFilePreview(null)
                            const fileInput = document.getElementById('file-input') as HTMLInputElement
                            if (fileInput) fileInput.value = ''
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <input
                          id="file-input"
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => document.getElementById('file-input')?.click()}
                          className="cursor-pointer"
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex-1 relative">
                        <textarea
                          id="message-input"
                          placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
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
                            
                            // Mostrar scrollbar apenas quando necessário
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
                        disabled={(!messageText.trim() && !selectedFile)}
                        className="cursor-pointer"
                        title="Send message"
                      >
                          <Send className="w-4 h-4" />
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
                          // Define emoji categories (deduplicated)
                          const emojiCategories = {
                            faces: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'],
                            objects: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🌍', '🌎', '🌏', '🗺️', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏮', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌉', '🌁', '🚇', '🚊', '🚉', '🚈', '🚅', '🚄', '🚂', '🚃', '🚋', '🚆', '🚝', '🚞', '🚟', '🚠', '🚡', '🚢', '⛴️', '🛥️', '🛳️', '⛵', '🚤', '🛶', '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛰️'],
                            food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫒', '🌽', '🥕', '🫑', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥙', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🫖', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾'],
                            activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🏋️‍♂️', '🤼‍♀️', '🤼', '🤼‍♂️', '🤸‍♀️', '🤸', '🤸‍♂️', '⛹️‍♀️', '⛹️', '⛹️‍♂️', '🤺', '🤾‍♀️', '🤾', '🤾‍♂️', '🏌️‍♀️', '🏌️', '🏌️‍♂️', '🏇', '🧘‍♀️', '🧘', '🧘‍♂️', '🏄‍♀️', '🏄', '🏄‍♂️', '🏊‍♀️', '🏊', '🏊‍♂️', '🤽‍♀️', '🤽', '🤽‍♂️', '🚣‍♀️', '🚣', '🚣‍♂️', '🧗‍♀️', '🧗', '🧗‍♂️', '🚵‍♀️', '🚵', '🚵‍♂️', '🚴‍♀️', '🚴', '🚴‍♂️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🤹‍♀️', '🤹‍♂️', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🪘', '🥁', '🎸', '🪕', '🎺', '🎷', '🎹', '🎻', '🪈', '🎲', '♠️', '♥️', '♦️', '♣️', '♟️', '🃏', '🀄', '🎴', '🎯', '🎳', '🎮', '🕹️', '🎰', '🧩', '🪅', '🪆', '🎊', '🎉', '🎈', '🎁', '🪄', '🎀', '🎂', '🎃', '🎄', '🎆', '🎇', '✨', '🎐', '🎑', '🧧', '🎎', '🎏', '🎌', '🏮', '🪔']
                          };
                          
                          // Get emojis for current category
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
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-500">Choose a conversation from the list to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Start new chat</h3>
            <div className="space-y-3">
              <Input
                placeholder="@username or phone (with country code)"
                value={newChatIdentifier}
                onChange={(e) => setNewChatIdentifier(e.target.value)}
              />
              <Input
                placeholder="First message (optional)"
                value={newChatFirstMessage}
                onChange={(e) => setNewChatFirstMessage(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewChatModal(false)} className="cursor-pointer">Cancel</Button>
                <Button onClick={startNewAccountChat} disabled={startingChat || !newChatIdentifier.trim()} className="cursor-pointer">
                  {startingChat ? 'Starting...' : 'Start chat'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de imagem com transição suave */}
      {imageModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-all duration-300 ease-in-out"
          onClick={() => setImageModal({ isOpen: false, src: '' })}
        >
          <div className="relative max-w-6xl max-h-6xl p-4 transform transition-all duration-300 ease-in-out scale-100">
            <img 
              src={imageModal.src}
              alt="Imagem ampliada"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300 ease-in-out"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setImageModal({ isOpen: false, src: '' })}
              className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200 hover:scale-110"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </AuthGuard>
  )
}