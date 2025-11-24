"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
import { useTranslations, useLocale } from 'next-intl'
import { FaTelegram } from "react-icons/fa"
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
  User,
  Mail,
  Plus,
  Settings,
  ChevronDown,
  Pin,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  Eye,
  Download,
  File,
  FileText,
  Image,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  UserPlus,
  Edit,
  Upload,
  Loader2,
  X,
  Mic,
  Play,
  Pause,
  Square,
  Briefcase,
  CreditCard,
  FileDigit,
  MapPin,
  Calendar,
  Clock,
  Tag,
  Hash,
  DollarSign,
  CheckCircle2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useApi } from "@/hooks/useApi"
import { getApiBaseUrl, apiService } from "@/lib/api"
import { LinkLeadModal } from "@/components/LinkLeadModal"
import { AudioPlayer } from "@/components/AudioPlayer"
import { useRouter } from "next/navigation"

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

// Componente otimizado para imagens com cache-awareness
const OptimizedImage = React.memo(({ 
  fileId, 
  onImageLoaded,
  onClick 
}: { 
  fileId: string; 
  onImageLoaded: (id: string) => void;
  onClick: () => void;
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)
  const imgRef = React.useRef<HTMLImageElement>(null)
  const retryTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const isMTProto = fileId.startsWith('mtproto_')
  const maxRetries = isMTProto ? 3 : 0 // Tentar até 3 vezes para MTProto

  React.useEffect(() => {
    // Limpar retry anterior
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    // Verificar se a imagem já está no cache ao montar
    const img = imgRef.current
    if (img && img.complete && img.naturalHeight !== 0) {
      setIsLoaded(true)
      onImageLoaded(fileId)
    }
    
    // Resetar estado quando fileId mudar
    setHasError(false)
    setRetryCount(0)
    
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [fileId, onImageLoaded])

  const handleLoad = React.useCallback(() => {
    setIsLoaded(true)
    setHasError(false)
    onImageLoaded(fileId)
  }, [fileId, onImageLoaded])

  const handleError = React.useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    // Para arquivos MTProto, tentar novamente após delay (podem estar sendo processados)
    if (isMTProto && retryCount < maxRetries) {
      const delay = Math.min(2000 * (retryCount + 1), 5000) // 2s, 4s, 5s
      setRetryCount(prev => prev + 1)
      setIsLoaded(false) // Resetar para tentar novamente
      
      retryTimeoutRef.current = setTimeout(() => {
        // Forçar reload da imagem com cache busting
        const img = imgRef.current
        if (img) {
          img.src = `${getApiBaseUrl()}/telegram/files/${fileId}?retry=${retryCount + 1}&t=${Date.now()}`
        }
      }, delay)
      return // Não mostrar erro ainda
    }
    
    // Se excedeu retries ou não é MTProto, mostrar erro
    setHasError(true)
    setIsLoaded(true)
    onImageLoaded(fileId)
  }, [fileId, onImageLoaded, isMTProto, retryCount, maxRetries])

  // Para arquivos MTProto que estão em retry, mostrar loading state
  if (isMTProto && !hasError && retryCount > 0 && !isLoaded) {
    return (
      <div className="max-w-xs max-h-48 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-gray-400 text-sm p-4 border border-gray-200 animate-pulse">
        <svg className="w-8 h-8 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-center">Carregando imagem...</p>
        <p className="text-xs mt-1 text-gray-400">Tentando novamente ({retryCount}/{maxRetries})</p>
      </div>
    )
  }
  
  // Para arquivos MTProto que falharam após todos os retries
  if (hasError && isMTProto) {
    return (
      <div className="max-w-xs max-h-48 rounded-lg bg-gray-100 flex flex-col items-center justify-center text-gray-500 text-sm p-4 border border-gray-200">
        <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-center">Imagem não disponível</p>
        <p className="text-xs mt-1 text-gray-400">Erro ao carregar arquivo</p>
      </div>
    )
  }

  // Para erros não-MTProto, mostrar placeholder simples
  if (hasError) {
    return (
      <div className="max-w-xs max-h-48 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm p-4 border border-gray-200">
        <p>Imagem não disponível</p>
      </div>
    )
  }

  return (
    <img 
      ref={imgRef}
      src={`${getApiBaseUrl()}/telegram/files/${fileId}`}
      alt="Foto"
      loading="eager"
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: isLoaded ? 'none' : 'opacity 0.15s ease-in'
      }}
      className="max-w-xs max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90"
      onClick={onClick}
      onLoad={handleLoad}
      onError={handleError}
    />
  )
})

OptimizedImage.displayName = 'OptimizedImage'

export default function TelegramPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  const { apiCall, isClient } = useApi()
  const t = useTranslations('TelegramChats')
  const locale = useLocale()
  
  // Função para obter identificador único e persistente do usuário
  const getUserIdentifier = React.useCallback(() => {
    if (typeof window === 'undefined') return null
    try {
      const token = localStorage.getItem('token')
      const organizationStr = localStorage.getItem('organization')
      
      if (!token || !organizationStr) return null
      
      const organization = JSON.parse(organizationStr)
      
      // Decodificar o payload do JWT para pegar o email do usuário
      const parts = token.split('.')
      if (parts.length !== 3) return null
      
      const payload = JSON.parse(atob(parts[1]))
      const userEmail = payload.email || payload.sub || ''
      
      // Usar orgId + email do usuário como identificador único
      // Cada usuário da mesma org terá seu próprio ID
      const identifier = `${organization.id}_${userEmail}`.replace(/[^a-zA-Z0-9_-]/g, '_')
      return identifier
    } catch (error) {
      console.error('Error getting user identifier:', error)
      return null
    }
  }, [])

  // Função para obter o role do usuário do JWT
  const getUserRole = React.useCallback(() => {
    if (typeof window === 'undefined') return 'employee'
    try {
      const token = localStorage.getItem('token')
      if (!token) return 'employee'
      
      const parts = token.split('.')
      if (parts.length !== 3) return 'employee'
      
      const payload = JSON.parse(atob(parts[1]))
      const role = payload.role || payload.type || payload.userType || payload.user_type || 'employee'
      return role
    } catch (error) {
      console.error('Error getting user role:', error)
      return 'employee'
    }
  }, [])

  const [userId, setUserId] = React.useState<string | null>(null)
  const [userRole, setUserRole] = React.useState<string>('employee')

  // Obter o userId e role quando o componente montar ou quando a organização mudar
  React.useEffect(() => {
    const updateUserId = () => {
      const id = getUserIdentifier()
      const role = getUserRole()
      setUserId(id)
      setUserRole(role)
    }
    
    updateUserId()
    
    // Listener para detectar mudanças no localStorage (quando trocar de conta em outra aba)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'organization' || e.key === 'token' || e.key === null) {
        updateUserId()
      }
    }
    
    // Listener para quando a aba recebe foco (usuário volta à aba)
    const handleFocus = () => {
      updateUserId()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [getUserIdentifier, getUserRole])
  
  const [urlParams, setUrlParams] = React.useState<{ phone?: string; conversationId?: string }>({})
  const [autoOpenProcessed, setAutoOpenProcessed] = React.useState(false)
  
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
  const [imageModal, setImageModal] = React.useState<{ isOpen: boolean; src: string; isClosing: boolean }>({ isOpen: false, src: '', isClosing: false })
  const [uploading, setUploading] = React.useState(false)
  const [unreadCounts, setUnreadCounts] = React.useState<{[key: string]: number}>({})
  const [isMarkingAsRead, setIsMarkingAsRead] = React.useState(false)
  const [markAsReadTimeout, setMarkAsReadTimeout] = React.useState<NodeJS.Timeout | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [activeEmojiTab, setActiveEmojiTab] = React.useState('faces')
  const [isSending, setIsSending] = React.useState(false)
  const [isAtBottom, setIsAtBottom] = React.useState(true)
  const [isLinkLeadModalOpen, setIsLinkLeadModalOpen] = React.useState(false)
  const [currentLinkedLead, setCurrentLinkedLead] = React.useState<any>(null)
  const [linkedLeads, setLinkedLeads] = React.useState<Record<string, any>>({})
  const [leadPreview, setLeadPreview] = React.useState<{ open: boolean, lead: any | null }>({ open: false, lead: null })
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const [assignedUserName, setAssignedUserName] = React.useState<string>("")
  const [createdByUserName, setCreatedByUserName] = React.useState<string>("")
  const router = useRouter()
  
  // Ref para cache de mensagens carregadas (deve ser declarado antes do useMemo que o usa)
  const lastLoadedMessagesRef = React.useRef<any[]>([]) // Cache das últimas mensagens carregadas para matching quando estado está vazio
  
  // Ordenar mensagens uma vez usando useMemo para garantir ordem correta e evitar re-ordenações
  const sortedMessages = React.useMemo(() => {
    // Usar mensagens do estado ou cache como fallback
    const messagesToUse = messages.length > 0 ? messages : lastLoadedMessagesRef.current
    
    // Ordenar por telegram_date (timestamp real do Telegram) como prioridade
    const sorted = [...messagesToUse].sort((a, b) => {
      // Priorizar telegram_date sobre created_at (timestamp real do Telegram é mais confiável)
      const aTime = a.telegram_date ? new Date(a.telegram_date).getTime() : new Date(a.created_at).getTime()
      const bTime = b.telegram_date ? new Date(b.telegram_date).getTime() : new Date(b.created_at).getTime()
      
      // Se os timestamps forem iguais (mesmo segundo), usar telegram_message_id como desempate
      if (aTime === bTime) {
        const aMsgId = Number(a.telegram_message_id) || 0
        const bMsgId = Number(b.telegram_message_id) || 0
        return aMsgId - bMsgId
      }
      
      return aTime - bTime // Mais antigas primeiro
    })
    
    // Atualizar cache quando temos mensagens válidas
    if (messages.length > 0) {
      lastLoadedMessagesRef.current = messages
    }
    
    return sorted
  }, [messages])
  
  // Estados para edição de lead
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editValue, setEditValue] = React.useState("")
  const [editExpectedCloseDate, setEditExpectedCloseDate] = React.useState("")
  const [editNotes, setEditNotes] = React.useState("")
  const [editInterest, setEditInterest] = React.useState("")
  const [originalFormValues, setOriginalFormValues] = React.useState<{
    value: string;
    expectedCloseDate: string;
    notes: string;
    interest: string;
  }>({
    value: "",
    expectedCloseDate: "",
    notes: "",
    interest: ""
  })
  const [pendingAttachments, setPendingAttachments] = React.useState<Record<string, {
    toAdd: File[];
    toRemove: string[];
  }>>({})
  const [uploadingAttachments, setUploadingAttachments] = React.useState<Record<string, boolean>>({})
  const [isAttachmentDragActive, setIsAttachmentDragActive] = React.useState(false)
  const attachmentFileInputRef = React.useRef<HTMLInputElement>(null)
  
  // Estados para criação de lead
  const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = React.useState(false)
  const [createLeadName, setCreateLeadName] = React.useState("")
  const [createLeadEmail, setCreateLeadEmail] = React.useState("")
  const [createLeadPhone, setCreateLeadPhone] = React.useState("")
  const [createLeadSsn, setCreateLeadSsn] = React.useState("")
  const [createLeadEin, setCreateLeadEin] = React.useState("")
  const [createLeadSource, setCreateLeadSource] = React.useState("")
  const [createLeadStatus, setCreateLeadStatus] = React.useState("New")
  const [createLeadValue, setCreateLeadValue] = React.useState("")
  const [createLeadEstimatedCloseDate, setCreateLeadEstimatedCloseDate] = React.useState("")
  const [createLeadDescription, setCreateLeadDescription] = React.useState("")
  
  // Estados para gravação de áudio - por conversa
  const [conversationStates, setConversationStates] = React.useState<Map<string, {
    isRecording: boolean;
    isPaused: boolean;
    audioBlob: Blob | null;
    audioURL: string | null;
    mediaRecorder: MediaRecorder | null;
    recordingTime: number;
    messageText: string;
    pausedTime: number; // Tempo acumulado de pausas
  }>>(new Map())
  
  // Estados globais para controle de gravação
  const recordingTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const audioChunksRef = React.useRef<Blob[]>([])
  const recordingStartTimeRef = React.useRef<number | null>(null) // Tempo de início da gravação
  const lastPauseTimeRef = React.useRef<number | null>(null) // Tempo da última pausa (para calcular pause total)
  
  // Funções auxiliares para gerenciar estado por conversa (memoizada para evitar recriações)
  const getConversationState = React.useCallback((conversationId: string) => {
    return conversationStates.get(conversationId) || {
      isRecording: false,
      isPaused: false,
      audioBlob: null,
      audioURL: null,
      mediaRecorder: null,
      recordingTime: 0,
      messageText: '',
      pausedTime: 0
    }
  }, [conversationStates])
  
  // Memoizar estado da conversa atual para evitar recálculos no render
  const currentConversationState = React.useMemo(() => {
    if (!selectedChat) {
      return {
        isRecording: false,
        isPaused: false,
        audioBlob: null,
        audioURL: null,
        mediaRecorder: null,
        recordingTime: 0,
        messageText: '',
        pausedTime: 0
      }
    }
    return getConversationState(selectedChat)
  }, [selectedChat, conversationStates, getConversationState])
  
  const updateConversationState = React.useCallback((conversationId: string, updates: Partial<{
    isRecording: boolean;
    isPaused: boolean;
    audioBlob: Blob | null;
    audioURL: string | null;
    mediaRecorder: MediaRecorder | null;
    recordingTime: number;
    messageText: string;
    pausedTime: number;
  }>) => {
    const startTime = performance.now()
    setConversationStates(prev => {
      const currentState = prev.get(conversationId) || {
        isRecording: false,
        isPaused: false,
        audioBlob: null,
        audioURL: null,
        mediaRecorder: null,
        recordingTime: 0,
        messageText: '',
        pausedTime: 0
      }
      
      // Verificar se realmente há mudanças (evitar re-render desnecessário)
      const hasChanges = Object.keys(updates).some(key => {
        const typedKey = key as keyof typeof updates
        return currentState[typedKey] !== updates[typedKey]
      })
      
      if (!hasChanges) {
        const endTime = performance.now()
        if (endTime - startTime > 1) {
          console.log('[PERF] updateConversationState: Skipped (no changes) in', (endTime - startTime).toFixed(2), 'ms')
        }
        return prev // Retornar a mesma referência para evitar re-render
      }
      
      // Criar novo Map apenas se houver mudanças
      const newMap = new Map(prev)
      newMap.set(conversationId, { ...currentState, ...updates })
      
      const endTime = performance.now()
      if (endTime - startTime > 5) {
        console.warn('[PERF] updateConversationState: Slow update in', (endTime - startTime).toFixed(2), 'ms', 'updates:', Object.keys(updates))
      }
      
      return newMap
    })
  }, [])
  
  // Handler otimizado para onChange do textarea (debounce para messageText apenas)
  const handleMessageTextChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const startTime = performance.now()
    const newValue = e.target.value
    
    if (!selectedChat) return
    
    updateConversationState(selectedChat, { messageText: newValue })
    
    const endTime = performance.now()
    const duration = endTime - startTime
    if (duration > 10) {
      console.warn('[PERF] handleMessageTextChange: Slow in', duration.toFixed(2), 'ms', 'length:', newValue.length)
    } else if (duration > 5) {
      console.log('[PERF] handleMessageTextChange:', duration.toFixed(2), 'ms', 'length:', newValue.length)
    }
  }, [selectedChat, updateConversationState])
  
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
  
  // Refs para evitar re-execução do useEffect quando esses estados mudarem
  const isRefreshingRef = React.useRef(false)
  const isProcessingQueueRef = React.useRef(false)
  const lastManualReloadRef = React.useRef<number>(0) // Timestamp do último reload manual (via processQueue)
  const filteredQueuedMessagesLoggedRef = React.useRef<Set<string>>(new Set()) // Para evitar logs duplicados
  
  // Atualizar refs quando os estados mudarem
  React.useEffect(() => {
    isRefreshingRef.current = isRefreshing
  }, [isRefreshing])
  
  React.useEffect(() => {
    isProcessingQueueRef.current = isProcessingQueue
  }, [isProcessingQueue])
  
  // Função auxiliar reutilizável para matching entre fila e banco
  const matchQueueMessageToDb = React.useCallback((q: any, dbMsg: any): boolean => {
    if (dbMsg.direction !== 'outgoing') return false
    
    const hasTelegramDate = !!dbMsg.telegram_date
    const hasCreatedAt = !!dbMsg.created_at
    if (!hasTelegramDate && !hasCreatedAt) return false
    
    const timeWindow = q.file ? 30000 : 10000
    const dbTimestamp = dbMsg.telegram_date || dbMsg.created_at
    const dbTime = new Date(dbTimestamp).getTime()
    const queueTime = q.timestamp
    const timeDiff = Math.abs(dbTime - queueTime)
    const effectiveWindow = hasTelegramDate ? timeWindow : (timeWindow / 3)
    
    if (timeDiff >= effectiveWindow) return false
    
    // Text messages
    if (!q.file && dbMsg.message_type === 'text') {
      return dbMsg.message_text === q.text
    }
    
    // File messages
    if (q.file && dbMsg.message_type !== 'text') {
      const fileTypeMatch = 
        (q.file.type?.startsWith('image') && dbMsg.message_type === 'photo') ||
        (q.file.type?.startsWith('video') && dbMsg.message_type === 'video') ||
        (q.file.type?.startsWith('audio') && (dbMsg.message_type === 'audio' || dbMsg.message_type === 'voice'))
      if (!fileTypeMatch) return false
      
      const queueCaption = q.text?.trim() || ''
      const dbCaption = dbMsg.caption?.trim() || ''
      
      if (queueCaption && dbCaption && queueCaption !== dbCaption) return false
      if ((queueCaption && !dbCaption) || (!queueCaption && dbCaption)) {
        if (timeDiff > 5000) return false
      }
      
      return true
    }
    
    return false
  }, [])
  
  // Effect para remover mensagens da fila quando encontradas no banco (limpeza adicional)
  React.useEffect(() => {
    if (messageQueue.length === 0 || sortedMessages.length === 0 || !selectedChat) return
    
    const messagesToRemove = messageQueue
      .filter(q => q.conversationId === selectedChat && q.status === 'sent')
      .filter(q => sortedMessages.some(dbMsg => matchQueueMessageToDb(q, dbMsg)))
      .map(q => q.id)
    
    if (messagesToRemove.length > 0) {
      setMessageQueue(prev => prev.filter(msg => !messagesToRemove.includes(msg.id)))
    }
  }, [messageQueue, sortedMessages, selectedChat, matchQueueMessageToDb])
  
  // Memoize filtered queued messages - CRITICAL: Prevents showing messages already in database
  const filteredQueuedMessages = React.useMemo(() => {
    if (messageQueue.length === 0) {
      filteredQueuedMessagesLoggedRef.current.clear()
      return []
    }
    
    return messageQueue
      .filter(q => {
        if (q.conversationId !== selectedChat) return false
        if (q.status !== 'sent') return true
        
        // Check if message already exists in database using shared matching function
        const matchingMsg = sortedMessages.find(dbMsg => matchQueueMessageToDb(q, dbMsg))
        
        if (matchingMsg) {
          return false // Never show in queue if in database
        }
        
        return true
      })
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [messageQueue, selectedChat, sortedMessages, matchQueueMessageToDb])
  const [loadedImages, setLoadedImages] = React.useState<Set<string>>(new Set())
  const imageLoadingRef = React.useRef<Map<string, boolean>>(new Map())
  // Limpar cache quando o chat selecionado muda
  React.useEffect(() => {
    lastLoadedMessagesRef.current = []
    filteredQueuedMessagesLoggedRef.current.clear()
  }, [selectedChat])
  
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


  // Persistence key for localStorage (unique per user) - NEVER use shared keys
  const persistenceKey = React.useMemo(() => userId ? `telegram_chat_type_${org}_${userId}` : null, [org, userId])
  const pinsKey = React.useMemo(() => userId ? `telegram_pins_${org}_${userId}` : null, [org, userId])
  const deletedKey = React.useMemo(() => userId ? `telegram_deleted_${org}_${userId}` : null, [org, userId])
  const unreadOverrideKey = React.useMemo(() => userId ? `telegram_unread_overrides_${org}_${userId}` : null, [org, userId])

  // Cleanup old shared keys from localStorage (run once)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && isClient) {
      // Remove old shared keys that shouldn't be used anymore
      const oldKeys = [
        `telegram_pins_${org}`,
        `telegram_deleted_${org}`,
        `telegram_unread_overrides_${org}`,
        `telegram_chat_type_${org}`
      ]
      oldKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key)
        }
      })
    }
  }, [isClient, org])

  // Load saved chat type from localStorage (only after userId is available)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && isClient && userId && persistenceKey && pinsKey && deletedKey && unreadOverrideKey) {
      const savedChatType = localStorage.getItem(persistenceKey) as 'bot' | 'account' | null
      if (savedChatType && (savedChatType === 'bot' || savedChatType === 'account')) {
        setChatType(savedChatType)
      }
      // load pins/hidden/unread overrides
      try {
        const ps = localStorage.getItem(pinsKey)
        if (ps) {
          setPinned(new Set(JSON.parse(ps)))
        } else {
          setPinned(new Set())
        }
        
        const ds = localStorage.getItem(deletedKey)
        if (ds) setHiddenConversations(new Set(JSON.parse(ds)))
        else setHiddenConversations(new Set())
        
        const uo = localStorage.getItem(unreadOverrideKey)
        if (uo) setUnreadOverrides(JSON.parse(uo))
        else setUnreadOverrides({})
      } catch (e) {
        console.error('Error loading preferences:', e)
      }
    }
  }, [isClient, userId, persistenceKey, pinsKey, deletedKey, unreadOverrideKey])

  // Parse URL parameters on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined' && isClient) {
      const searchParams = new URLSearchParams(window.location.search)
      const phone = searchParams.get('phone')
      const conversationId = searchParams.get('conversationId')
      
      if (phone || conversationId) {
        setUrlParams({ phone: phone || undefined, conversationId: conversationId || undefined })
      }
    }
  }, [isClient])

  // Presence: heartbeat while on chats page and page-exit on unmount
  // Usar ref para evitar chamadas duplicadas de page-exit
  const hasCalledPageExit = React.useRef(false)
  
  React.useEffect(() => {
    if (!isClient) return
    
    // Resetar flag quando componente é montado
    hasCalledPageExit.current = false
    
    let interval: any
    
    const sendHeartbeat = async () => {
      try { await apiCall('/presence/heartbeat', { method: 'POST' }) } catch {}
    }
    
    // start immediately then every 30s
    sendHeartbeat()
    interval = setInterval(sendHeartbeat, 30000)

    const handleBeforeUnload = () => {
      // Evitar chamadas duplicadas
      if (hasCalledPageExit.current) return
      hasCalledPageExit.current = true
      
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
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
      
      // Só chamar page-exit se ainda não foi chamado (evitar duplicatas)
      if (!hasCalledPageExit.current) {
        hasCalledPageExit.current = true
        // best-effort exit when navigating away (usando fetch com keepalive para garantir envio)
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
          if (token && typeof fetch !== 'undefined') {
            fetch(`${API_BASE_URL}/presence/telegram-page-exit`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({}),
              keepalive: true,
            }).catch(() => {})
          } else {
            // Fallback para apiCall se não houver token (improvável, mas seguro)
            apiCall('/presence/telegram-page-exit', { method: 'POST' }).catch(() => {})
          }
        } catch {
          apiCall('/presence/telegram-page-exit', { method: 'POST' }).catch(() => {})
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]) // Removido apiCall das dependências para evitar re-execuções desnecessárias

  // Fetch assigned user and created by user names when preview opens
  React.useEffect(() => {
    const fetchUsers = async () => {
      if (leadPreview.open && (leadPreview.lead?.assigned_user_id || leadPreview.lead?.created_by)) {
        try {
          const response = await apiService.getOrganizationUsers(true) // Include master users
          if (response.success && response.data) {
            if (leadPreview.lead?.assigned_user_id) {
              const assignedUser = response.data.employees.find((u: any) => u.id === leadPreview.lead?.assigned_user_id)
              setAssignedUserName(assignedUser?.name || t('unknownUser'))
            }
            if (leadPreview.lead?.created_by) {
              const createdByUser = response.data.employees.find((u: any) => u.id === leadPreview.lead?.created_by)
              setCreatedByUserName(createdByUser?.name || t('unknownUser'))
            }
          }
        } catch (error) {
          console.error('Error fetching users:', error)
          if (leadPreview.lead?.assigned_user_id) setAssignedUserName(t('unknownUser'))
          if (leadPreview.lead?.created_by) setCreatedByUserName(t('unknownUser'))
        }
      } else {
        setAssignedUserName("")
        setCreatedByUserName("")
      }
    }
    
    fetchUsers()
  }, [leadPreview.open, leadPreview.lead?.assigned_user_id, leadPreview.lead?.created_by])

  // Save chat type to localStorage (only if userId and key are available)
  const saveChatType = (type: 'bot' | 'account') => {
    setChatType(type)
    setSelectedChat(null) // Clear selected chat when switching types
    if (typeof window !== 'undefined' && userId && persistenceKey) {
      localStorage.setItem(persistenceKey, type)
    }
  }

  // Helpers to persist pins/hidden/unread overrides (only if userId and keys are available)
  const persistPins = (next: Set<string>) => {
    setPinned(new Set(next))
    if (typeof window !== 'undefined' && userId && pinsKey) {
      localStorage.setItem(pinsKey, JSON.stringify(Array.from(next)))
    }
  }
  const persistHidden = (next: Set<string>) => {
    setHiddenConversations(new Set(next))
    if (typeof window !== 'undefined' && userId && deletedKey) {
      localStorage.setItem(deletedKey, JSON.stringify(Array.from(next)))
    }
  }
  const persistUnreadOverrides = (next: {[key: string]: number}) => {
    setUnreadOverrides({...next})
    if (typeof window !== 'undefined' && userId && unreadOverrideKey) {
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
        });
      }
      
      if (response.success) {
        // Marcar como enviada (mas manter na fila)
        setMessageQueue(prev => prev.map(msg => 
          msg.id === nextMessage.id ? { ...msg, status: 'sent' } : msg
        ))
        
        // Recarregar mensagens
        // Use longer delay for files to ensure backend processing is complete
        const reloadDelay = nextMessage.file ? 2000 : 800;
        setTimeout(async () => {
          // Recarregar somente se o usuário ainda está nessa conversa
          if (nextMessage.conversationId !== selectedChat) {
            return
          }
          try {
              const messagesResponse = await apiCall(`/telegram/conversations/${nextMessage.conversationId}/messages`)
              if (messagesResponse.success && messagesResponse.messages) {
                // Remover duplicatas antes de ordenar (evitar mensagens duplicadas no estado)
                const uniqueMessages = messagesResponse.messages.filter((msg: any, index: number, self: any[]) =>
                  index === self.findIndex((m: any) => m.id === msg.id)
                )
                
                // CRITICAL: Always sort messages before setting state
                // Ordenar por telegram_date (timestamp real do Telegram) como prioridade
                const sortedMessages = [...uniqueMessages].sort((a, b) => {
                  // Priorizar telegram_date sobre created_at
                  const aTime = a.telegram_date ? new Date(a.telegram_date).getTime() : new Date(a.created_at).getTime()
                  const bTime = b.telegram_date ? new Date(b.telegram_date).getTime() : new Date(b.created_at).getTime()
                  
                  // Se os timestamps forem iguais, usar telegram_message_id como desempate
                  if (aTime === bTime) {
                    const aMsgId = Number(a.telegram_message_id) || 0
                    const bMsgId = Number(b.telegram_message_id) || 0
                    return aMsgId - bMsgId
                  }
                  
                  return aTime - bTime // Mais antigas primeiro
                })
              
              // Atualizar cache e estado (banco é fonte da verdade)
              lastManualReloadRef.current = Date.now()
              lastLoadedMessagesRef.current = sortedMessages
              setMessages(sortedMessages)
              setTimeout(() => {
                if (isAtBottom) {
                  scrollToBottom(false)
                }
              }, 100)
            }
          } catch (error) {
            console.error('Erro ao recarregar mensagens:', error)
          }
        }, reloadDelay)
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

  // Função para atualizar unread-count de UMA conversa específica (quando receber novas mensagens)
  const updateUnreadCountForConversation = React.useCallback(async (conversationId: string) => {
    if (!isClient || conversationId === selectedChat) {
      // Se for a conversa selecionada, já está marcada como lida
      setUnreadCounts(prev => ({ ...prev, [conversationId]: 0 }))
      return
    }

    try {
      const response = await apiCall(`/telegram/conversations/${conversationId}/unread-count`)
      if (response.success) {
        setUnreadCounts(prev => ({
          ...prev,
          [conversationId]: response.unreadCount || 0
        }))
      }
    } catch (error) {
      console.error(`Erro ao atualizar contagem para conversa ${conversationId}:`, error)
    }
  }, [isClient, selectedChat, apiCall])

  // Função unificada para carregar conversas e leads em paralelo
  const loadConversationsAndLeads = React.useCallback(async (isInitialLoad: boolean = false) => {
    if (typeof window === 'undefined' || !isClient) return

    // Verificar se temos as condições necessárias
    const shouldLoad = (chatType === 'bot' && bot?.id) || (chatType === 'account' && account?.id)
    if (!shouldLoad) {
      setConversations([])
      return
    }

    try {
      if (isInitialLoad) {
        setLoading(true)
      }

      // Carregar conversas
      let response
      if (chatType === 'bot' && bot?.id) {
        response = await apiCall(`/telegram/conversations?bot_id=${bot.id}`)
      } else if (chatType === 'account' && account?.id) {
        response = await apiCall(`/telegram/conversations?account_id=${account.id}`)
      } else {
        setConversations([])
        if (isInitialLoad) setLoading(false)
        return
      }

        if (response.success && response.conversations) {
        // Detectar conversas novas ou atualizadas comparando com as atuais (só se não for carregamento inicial)
        let updatedConversations: TelegramConversation[] = []
        if (!isInitialLoad && conversations.length > 0) {
          updatedConversations = response.conversations.filter((newConv: TelegramConversation) => {
            const oldConv = conversations.find(c => c.id === newConv.id)
            if (!oldConv) return true // Nova conversa
            // Verificar se last_message_at mudou (indica possível nova mensagem)
            return newConv.last_message_at !== oldConv.last_message_at
          })
        }
        
        // Atualizar conversas primeiro
        setConversations(response.conversations)
        
        // Atualizar unread-count apenas para conversas novas ou atualizadas (que podem ter novas mensagens)
        // Só se não for o carregamento inicial (no inicial já será carregado pelo loadInitialUnreadCounts)
        if (updatedConversations.length > 0 && !isInitialLoad) {
          updatedConversations.forEach((conv: TelegramConversation) => {
            if (conv.id !== selectedChat) {
              updateUnreadCountForConversation(conv.id)
            }
          })
        }

        // Carregar leads em paralelo para conversas que têm lead_id
        const leadIds = response.conversations
          .filter((conv: TelegramConversation) => conv.lead_id)
          .map((conv: TelegramConversation) => conv.lead_id!)
          .filter((id: string, index: number, self: string[]) => self.indexOf(id) === index) // Remove duplicates

        if (leadIds.length > 0) {
          // Carregar todos os leads em paralelo
          const leadPromises = leadIds.map(async (leadId: string) => {
            try {
              const leadResponse = await apiService.getLeadById(leadId)
              if (leadResponse.success && leadResponse.data) {
                return { leadId, lead: leadResponse.data.lead }
              }
            } catch (error) {
              console.error(`Error loading lead ${leadId}:`, error)
            }
            return null
          })

          const leadResults = await Promise.all(leadPromises)
          const leadsMap: Record<string, any> = {}
          
          leadResults.forEach(result => {
            if (result) {
              leadsMap[result.leadId] = result.lead
            }
          })

          // Atualizar leads após carregar
          setLinkedLeads(prev => ({ ...prev, ...leadsMap }))
        }
      } else {
        setConversations([])
      }
    } catch (error) {
      setConversations([])
    } finally {
      if (isInitialLoad) {
        setLoading(false)
      }
    }
  }, [isClient, chatType, bot?.id, account?.id, apiCall, apiService, selectedChat, conversations, updateUnreadCountForConversation])

  // Carregar conversas inicialmente e quando dependências mudarem
  React.useEffect(() => {
    loadConversationsAndLeads(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, chatType, bot?.id, account?.id]) // loadConversationsAndLeads já está memoizada com as dependências corretas

  // Auto-refresh das conversas a cada 5 segundos
  React.useEffect(() => {
    if (!isClient) return
    
    // Verificar se temos as condições necessárias antes de criar o interval
    const shouldRefresh = (chatType === 'bot' && bot?.id) || (chatType === 'account' && account?.id)
    if (!shouldRefresh) return

    // Atualizar conversas a cada 5 segundos para reduzir delay
    const interval = setInterval(() => {
      loadConversationsAndLeads(false)
    }, 5000) // Atualizar a cada 5 segundos

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatType, bot?.id, account?.id, isClient, loadConversationsAndLeads]) // loadConversationsAndLeads já está memoizada

  // Carregar mensagens quando uma conversa for selecionada
  React.useEffect(() => {
    // Só executar no cliente, quando isClient for true e se houver conversa selecionada
    if (typeof window === 'undefined' || !isClient || !selectedChat) return
    
    const loadMessages = async () => {
      try {
        const response = await apiCall(`/telegram/conversations/${selectedChat}/messages`)
        if (response.success && response.messages) {
          // Remover duplicatas antes de ordenar (evitar mensagens duplicadas no estado)
          const uniqueMessages = response.messages.filter((msg: any, index: number, self: any[]) =>
            index === self.findIndex((m: any) => m.id === msg.id)
          )
          
          // CRITICAL: Always sort messages before setting state
          const sortedMessages = [...uniqueMessages].sort((a, b) => {
            const aTime = new Date(a.telegram_date || a.created_at).getTime()
            const bTime = new Date(b.telegram_date || b.created_at).getTime()
            return aTime - bTime // Mais antigas primeiro
          })
          
          // Atualizar cache ANTES de atualizar o estado
          lastLoadedMessagesRef.current = sortedMessages
          setMessages(sortedMessages)
          
          // Scroll para o final apenas se estiver no final
          setTimeout(() => {
            if (isAtBottom) {
              scrollToBottom(false)
            }
          }, 100)
          // Zerar notificações para o chat aberto
          setUnreadCounts(prev => ({ ...prev, [selectedChat]: 0 }))
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

  // Auto-open chat from URL parameters
  React.useEffect(() => {
    if (!isClient || autoOpenProcessed || conversations.length === 0) return
    if (!urlParams.phone && !urlParams.conversationId) return
    
    // If conversationId is provided, select that conversation directly
    if (urlParams.conversationId) {
      const conversation = conversations.find(c => c.id === urlParams.conversationId)
      if (conversation) {
        setSelectedChat(urlParams.conversationId)
        setAutoOpenProcessed(true)
        
        // Clear URL parameters
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.delete('conversationId')
          url.searchParams.delete('phone')
          window.history.replaceState({}, '', url.toString())
        }
      }
      return
    }
    
    // If phone is provided, find the conversation with that phone number
    if (urlParams.phone) {
      const conversation = conversations.find(c => 
        c.phone_number === urlParams.phone ||
        c.phone_number === urlParams.phone?.replace(/\D/g, '')
      )
      
      if (conversation) {
        setSelectedChat(conversation.id)
        setAutoOpenProcessed(true)
        
        // Clear URL parameters
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.delete('phone')
          url.searchParams.delete('conversationId')
          window.history.replaceState({}, '', url.toString())
        }
      } else {
        // If conversation doesn't exist yet, open new chat modal with the phone pre-filled
        if (account && chatType === 'account') {
          setNewChatIdentifier(urlParams.phone)
          setShowNewChatModal(true)
          setAutoOpenProcessed(true)
          
          // Clear URL parameters
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.delete('phone')
            url.searchParams.delete('conversationId')
            window.history.replaceState({}, '', url.toString())
          }
        }
      }
    }
  }, [isClient, conversations, urlParams, autoOpenProcessed, account, chatType])

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
        // Fechar modal e limpar campos
        setShowNewChatModal(false)
        setNewChatIdentifier('')
        setNewChatFirstMessage('')
        
        // Adicionar ou atualizar a conversa na lista local
        setConversations(prev => {
          // Verificar se a conversa já existe
          const existingIndex = prev.findIndex(c => c.id === response.conversation.id)
          if (existingIndex >= 0) {
            // Atualizar conversa existente
            const updated = [...prev]
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...response.conversation,
              last_message_at: response.conversation.last_message_at || new Date().toISOString()
            }
            return updated
          } else {
            // Adicionar nova conversa ao topo da lista
            return [response.conversation, ...prev]
          }
        })
        
        // Selecionar a conversa imediatamente para abrir o chat
        setSelectedChat(response.conversation.id)
      } else {
        alert(response.error || t('errors.startChatFailed'))
      }
    } catch (e) {
      console.error('Start chat error:', e)
      alert(t('errors.startChatFailed'))
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

  // Remover mensagens da fila quando aparecerem do banco (delay para evitar race conditions)
  // Simplificado: usa a mesma função de matching e remove após delay mínimo
  React.useEffect(() => {
    if (isRefreshing || isProcessingQueue || (Date.now() - lastManualReloadRef.current) < 3000) {
      return
    }
    
    if (messages.length === 0 || messageQueue.length === 0) return
    
    const sentMessages = messageQueue.filter(msg => 
      msg.status === 'sent' && 
      msg.conversationId === selectedChat &&
      messages.some(dbMsg => matchQueueMessageToDb(msg, dbMsg))
    )
    
    // Remover apenas mensagens que já têm telegram_date e passaram tempo mínimo
    const messagesToRemove = sentMessages
      .filter(sentMsg => {
        const matchingDbMsg = messages.find(dbMsg => matchQueueMessageToDb(sentMsg, dbMsg))
        if (!matchingDbMsg?.telegram_date) return false
        
        const timeSinceSend = Date.now() - sentMsg.timestamp
        const minWaitTime = sentMsg.file ? 6000 : 2000
        return timeSinceSend >= minWaitTime
      })
      .map(msg => msg.id)
    
    if (messagesToRemove.length > 0) {
      setMessageQueue(prev => prev.filter(msg => !messagesToRemove.includes(msg.id)))
    }
  }, [messages, messageQueue, selectedChat, isRefreshing, isProcessingQueue, matchQueueMessageToDb])

  // Timeout de segurança para remover mensagens enviadas após um tempo (maior para arquivos)
  React.useEffect(() => {
    const sentMessages = messageQueue.filter(msg => msg.status === 'sent')
    if (sentMessages.length > 0) {
      // Usar timeout maior para arquivos (10s) vs texto (5s)
      const maxWaitTime = sentMessages.some(msg => msg.file) ? 10000 : 5000
      
      const timer = setTimeout(() => {
        setMessageQueue(prev => prev.filter(msg => {
          // Para arquivos, só remover se realmente passou muito tempo
          if (msg.status === 'sent' && msg.file) {
            const timeSinceSend = Date.now() - msg.timestamp
            return timeSinceSend >= maxWaitTime
          }
          return msg.status !== 'sent'
        }))
      }, maxWaitTime)
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

  // Auto-refresh das mensagens a cada 10 segundos
  React.useEffect(() => {
    if (!selectedChat || !isClient || isMarkingAsRead || uploading) return

    const refreshMessages = async () => {
      // Prevent multiple simultaneous refreshes
      if (isRefreshingRef.current || isProcessingQueueRef.current) return
      
      // Don't refresh if we recently manually reloaded (via processQueue)
      const timeSinceManualReload = Date.now() - lastManualReloadRef.current
      if (timeSinceManualReload < 5000 && lastManualReloadRef.current > 0) return
      
      try {
        setIsRefreshing(true)
        
        const response = await apiCall(`/telegram/conversations/${selectedChat}/messages`)
        if (response.success && response.messages) {
          // Remover duplicatas antes de ordenar (evitar mensagens duplicadas no estado)
          const uniqueMessages = response.messages.filter((msg: any, index: number, self: any[]) =>
            index === self.findIndex((m: any) => m.id === msg.id)
          )
          
          // CRITICAL: Always sort messages before setting state
          const sortedMessages = [...uniqueMessages].sort((a, b) => {
            const aTime = new Date(a.telegram_date || a.created_at).getTime()
            const bTime = new Date(b.telegram_date || b.created_at).getTime()
            return aTime - bTime // Mais antigas primeiro
          })
          
          // Atualizar cache ANTES de atualizar o estado para evitar janela de duplicação
          lastLoadedMessagesRef.current = sortedMessages
          setMessages(sortedMessages)
          setIsRefreshing(false)
          
          // Scroll para o final apenas se estiver no final
          setTimeout(() => {
            if (isAtBottom) {
              scrollToBottom(false)
            }
          }, 100)
          // Não marcar como lido automaticamente durante refresh - isso só deve acontecer quando o usuário abrir um chat com notificações
        } else {
          setIsRefreshing(false)
        }
      } catch (error) {
        console.error('[API] refreshMessages: Error updating messages', error)
      } finally {
        setIsRefreshing(false)
      }
    }

    // Atualizar mensagens a cada 5 segundos para reduzir delay
    // IMPORTANTE: Não iniciar imediatamente se acabamos de fazer reload manual
    const timeSinceManualReload = Date.now() - lastManualReloadRef.current
    const initialDelay = timeSinceManualReload < 5000 ? (5000 - timeSinceManualReload) : 5000
    
    let intervalId: NodeJS.Timeout | null = null
    const timeoutId = setTimeout(() => {
      refreshMessages() // Primeira chamada após delay inicial
      intervalId = setInterval(refreshMessages, 5000) // Depois a cada 5 segundos
    }, initialDelay)
    
    return () => {
      clearTimeout(timeoutId)
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat, isClient, isMarkingAsRead, uploading]) // Removido messages para evitar loop

  // Função para carregar unread-count apenas quando conversas são carregadas pela primeira vez
  const loadInitialUnreadCounts = React.useCallback(async (conversationsList: TelegramConversation[], currentSelectedChat: string | null) => {
    if (!isClient || !conversationsList.length) return

    // Não atualizar se estiver marcando mensagens como lidas
    if (isMarkingAsRead) {
      return
    }

    try {
      // Filtrar conversas que precisam de contagem (não a selecionada)
      const conversationsToCheck = conversationsList.filter(conv => conv.id !== currentSelectedChat)
      
      if (conversationsToCheck.length === 0) {
        // Se não há conversas para verificar, apenas zerar o selectedChat
        setUnreadCounts(prev => {
          const newCounts = { ...prev }
          if (currentSelectedChat) {
            newCounts[currentSelectedChat] = 0
          }
          return newCounts
        })
        return
      }

      // Fazer todas as chamadas em paralelo usando Promise.all
      const countPromises = conversationsToCheck.map(async (conversation) => {
        try {
          const response = await apiCall(`/telegram/conversations/${conversation.id}/unread-count`)
          if (response.success) {
            return { conversationId: conversation.id, count: response.unreadCount || 0 }
          }
          return { conversationId: conversation.id, count: 0 }
        } catch (error) {
          console.error(`Erro ao carregar contagem para conversa ${conversation.id}:`, error)
          return { conversationId: conversation.id, count: 0 }
        }
      })

      const results = await Promise.all(countPromises)
      const counts: {[key: string]: number} = {}
      
      // Inicializar todas as conversas com 0 (incluindo a selecionada)
      conversationsList.forEach(conv => {
        counts[conv.id] = conv.id === currentSelectedChat ? 0 : 0
      })
      
      // Atualizar com os resultados
      results.forEach(result => {
        counts[result.conversationId] = result.count
      })

      setUnreadCounts(counts)
    } catch (error) {
      console.error('Erro ao carregar contagens de não lidas:', error)
    }
  }, [isClient, isMarkingAsRead, apiCall])

  // Carregar contagem inicial APENAS quando conversas são carregadas pela primeira vez (não periodicamente)
  React.useEffect(() => {
    if (!isClient || !conversations.length) return
    // Só carregar na primeira vez que as conversas aparecem (quando conversations.length muda de 0 para N)
    loadInitialUnreadCounts(conversations, selectedChat)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, conversations.length, selectedChat]) // Só quando o número de conversas muda, não a cada mudança nos dados

  // Marcar mensagens como lidas quando a conversa for selecionada - APENAS se houver notificações não lidas
  React.useEffect(() => {
    if (!selectedChat || !isClient) return

    // Verificar se há mensagens não lidas antes de marcar (calculando diretamente)
    const unreadCount = (unreadCounts[selectedChat] || 0) + (unreadOverrides[selectedChat] || 0)
    if (unreadCount === 0) {
      // Não há notificações, não precisa marcar como lido
      return
    }

    // Limpar timeout anterior se existir
    if (markAsReadTimeout) {
      clearTimeout(markAsReadTimeout)
    }

    const markAsRead = async () => {
      try {
        setIsMarkingAsRead(true)
        const response = await apiCall(`/telegram/conversations/${selectedChat}/mark-read`, {
          method: 'POST'
        })
        
        if (response.success) {
          // Atualizar contagem local
          setUnreadCounts(prev => ({
            ...prev,
            [selectedChat]: 0
          }))
          // Limpar override se existir
          if (unreadOverrides[selectedChat]) {
            const nextOverrides = { ...unreadOverrides }
            delete nextOverrides[selectedChat]
            setUnreadOverrides(nextOverrides)
            persistUnreadOverrides(nextOverrides)
          }
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
  }, [selectedChat, isClient, unreadCounts, unreadOverrides])

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
      
      // Focar automaticamente na barra de texto para escrever legenda
      setTimeout(() => {
        const messageInput = document.getElementById('message-input') as HTMLTextAreaElement
        if (messageInput) {
          messageInput.focus()
          // Colocar cursor no final do texto existente
          const length = messageInput.value.length
          messageInput.setSelectionRange(length, length)
        }
      }, 100)
    }
  }

  const getMessageType = (file: File): string => {
    if (file.type.startsWith('image/')) return 'photo'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const handleSendMessage = () => {
    if (!selectedChat) return
    const state = getConversationState(selectedChat)
    
    if ((state.messageText.trim() || selectedFile) && selectedChat) {
      // Adicionar à fila imediatamente
      addToQueue(state.messageText, selectedFile || undefined, filePreview || undefined)
      
      // Limpar campos imediatamente
      updateConversationState(selectedChat, { messageText: '' })
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
    
    // Verificar se é o mesmo dia (comparar dia, mês e ano)
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
    
    // Se for ontem
    if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })}`
    }
    
    // Se for da semana passada (menos de 7 dias)
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
    // Se há lead vinculado, priorizar o nome do lead
    if (conversation.lead_id && linkedLeads[conversation.lead_id]) {
      return linkedLeads[conversation.lead_id].name
    }
    
    // Caso contrário, usar o nome do Telegram
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

  // Helper functions for file handling
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image
    if (mimeType.startsWith('video/')) return FileVideo
    if (mimeType.startsWith('audio/')) return FileAudio
    if (mimeType.includes('pdf')) return FileText
    if (mimeType.includes('zip') || mimeType.includes('rar')) return Archive
    return File
  }

  const viewAttachment = (leadId: string, attachmentId: string) => {
    // Implementar visualização de anexo
  }

  const downloadAttachment = (leadId: string, attachmentId: string, fileName: string) => {
    // Implementar download de anexo
  }

  const handleViewLead = (lead: any) => {
    // Navegar para a página de leads com o lead selecionado
    router.push(`/${org}/leads?leadId=${lead.id}`)
  }

  // Função para abrir modal de criar lead com dados pré-preenchidos
  const handleCreateLeadFromContact = () => {
    if (!selectedConversation) return

    // Preencher com dados do Telegram
    const displayName = selectedConversation.first_name && selectedConversation.last_name
      ? `${selectedConversation.first_name} ${selectedConversation.last_name}`
      : selectedConversation.first_name || selectedConversation.telegram_username || ""

    setCreateLeadName(displayName)
    setCreateLeadEmail("")
    setCreateLeadPhone(selectedConversation.phone_number || "")
    setCreateLeadSsn("")
    setCreateLeadEin("")
    setCreateLeadSource("Telegram")
    setCreateLeadStatus("New")
    setCreateLeadValue("")
    setCreateLeadEstimatedCloseDate("")
    setCreateLeadDescription(selectedConversation.telegram_username ? `Telegram: @${selectedConversation.telegram_username}` : "From Telegram")
    
    setIsCreateLeadModalOpen(true)
    setIsLinkLeadModalOpen(false)
  }

  // Função para criar o lead e vincular automaticamente
  async function handleCreateLeadSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!createLeadName.trim()) {
      return
    }

    try {
      const createData: any = {
        name: createLeadName.trim(),
        email: createLeadEmail.trim() || undefined,
        phone: createLeadPhone.trim() || undefined,
        ssn: createLeadSsn.trim() || undefined,
        ein: createLeadEin.trim() || undefined,
        source: createLeadSource.trim() || "Telegram",
        status: createLeadStatus,
        value: createLeadValue ? parseFloat(createLeadValue) : undefined,
        estimated_close_date: createLeadEstimatedCloseDate || undefined,
        description: createLeadDescription.trim() || undefined,
      }

      const response = await apiService.createLead(createData)

      if (response.success && response.data) {
        const newLead = response.data.lead
        
        // Vincular automaticamente ao chat
        if (selectedChat) {
          await handleLinkToLead(newLead.id)
        }

        // Fechar modal e limpar campos
        setIsCreateLeadModalOpen(false)
        resetCreateLeadForm()
      }
    } catch (error) {
      console.error('Error creating lead:', error)
    }
  }

  const resetCreateLeadForm = () => {
    setCreateLeadName("")
    setCreateLeadEmail("")
    setCreateLeadPhone("")
    setCreateLeadSsn("")
    setCreateLeadEin("")
    setCreateLeadSource("")
    setCreateLeadStatus("New")
    setCreateLeadValue("")
    setCreateLeadEstimatedCloseDate("")
    setCreateLeadDescription("")
  }

  // Funções de gravação de áudio
  const startRecording = async () => {
    if (!selectedChat) return
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        updateConversationState(selectedChat, {
          audioBlob: blob,
          audioURL: URL.createObjectURL(blob)
        })
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start(100) // Capture em chunks de 100ms para permitir pausar
      recordingStartTimeRef.current = Date.now() // Armazenar tempo de início
      lastPauseTimeRef.current = null // Resetar último tempo de pausa
      updateConversationState(selectedChat, {
        mediaRecorder: recorder,
        isRecording: true,
        isPaused: false,
        recordingTime: 0,
        pausedTime: 0
      })
      
      // Iniciar timer que calcula a duração baseado no tempo real (desconsiderando pausas)
      recordingTimerRef.current = setInterval(() => {
        if (recordingStartTimeRef.current && !getConversationState(selectedChat).isPaused) {
          const currentTime = Date.now()
          const elapsedSinceStart = currentTime - recordingStartTimeRef.current
          const pausedDuration = getConversationState(selectedChat).pausedTime
          const elapsedSeconds = Math.floor((elapsedSinceStart - pausedDuration) / 1000)
          updateConversationState(selectedChat, {
            recordingTime: elapsedSeconds
          })
        }
      }, 1000)
    } catch (error) {
      console.error('Error starting audio recording:', error)
      alert(t('errors.microphoneAccessDenied'))
    }
  }

  const pauseRecording = () => {
    if (!selectedChat) return
    const state = getConversationState(selectedChat)
    
    if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
      state.mediaRecorder.pause()
      lastPauseTimeRef.current = Date.now() // Registrar quando pausou
      updateConversationState(selectedChat, { isPaused: true })
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  const resumeRecording = () => {
    if (!selectedChat) return
    const state = getConversationState(selectedChat)
    
    if (state.mediaRecorder && state.mediaRecorder.state === 'paused') {
      state.mediaRecorder.resume()
      
      // Calcular tempo de pausa e adicionar ao total
      if (lastPauseTimeRef.current) {
        const pauseDuration = Date.now() - lastPauseTimeRef.current
        updateConversationState(selectedChat, {
          isPaused: false,
          pausedTime: state.pausedTime + pauseDuration
        })
      } else {
        updateConversationState(selectedChat, { isPaused: false })
      }
      lastPauseTimeRef.current = null
      
      // Retomar timer
      recordingTimerRef.current = setInterval(() => {
        if (recordingStartTimeRef.current && !getConversationState(selectedChat).isPaused) {
          const currentTime = Date.now()
          const elapsedSinceStart = currentTime - recordingStartTimeRef.current
          const pausedDuration = getConversationState(selectedChat).pausedTime
          const elapsedSeconds = Math.floor((elapsedSinceStart - pausedDuration) / 1000)
          updateConversationState(selectedChat, {
            recordingTime: elapsedSeconds
          })
        }
      }, 1000)
    }
  }

  const stopRecording = () => {
    if (!selectedChat) return
    const state = getConversationState(selectedChat)
    
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
      state.mediaRecorder.stop()
      updateConversationState(selectedChat, {
        isRecording: false,
        isPaused: false
      })
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  const cancelRecording = () => {
    if (!selectedChat) return
    const state = getConversationState(selectedChat)
    
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
      state.mediaRecorder.stop()
    }
    
    updateConversationState(selectedChat, {
      isRecording: false,
      isPaused: false,
      audioBlob: null,
      audioURL: null,
      recordingTime: 0,
      pausedTime: 0
    })
    audioChunksRef.current = []
    recordingStartTimeRef.current = null
    lastPauseTimeRef.current = null
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }

  const sendAudioMessage = async () => {
    if (!selectedChat) return
    const state = getConversationState(selectedChat)
    if (!state.audioBlob) return

    try {
      // Converter para formato compatível
      const audioFile = new window.File(
        [state.audioBlob], 
        `voice_${Date.now()}.ogg`, 
        { type: 'audio/ogg' }
      )
      
      // Criar FormData
      const formData = new FormData()
      formData.append('conversation_id', selectedChat)
      formData.append('message_type', 'voice')
      formData.append('file', audioFile)
      // Adicionar a duração do áudio
      formData.append('duration', state.recordingTime.toString())

      // Usar apiCall que já trata autenticação corretamente
      const result = await apiCall('/telegram/send-file', {
        method: 'POST',
        body: formData
      })

      if (result.success) {
        // Limpar áudio da conversa atual
        updateConversationState(selectedChat, {
          audioBlob: null,
          audioURL: null,
          recordingTime: 0,
          pausedTime: 0
        })
        audioChunksRef.current = []
        recordingStartTimeRef.current = null
        lastPauseTimeRef.current = null
        
        // Rolar para o final
        setTimeout(() => scrollToBottom(true), 100)
      } else {
        console.error('Failed to send audio:', result.error)
        alert(t('errors.sendVoiceMessageFailed') + ': ' + result.error)
      }
    } catch (error) {
      console.error('Error sending audio:', error)
      alert(t('errors.sendVoiceMessageError'))
    }
  }

  // Funções de edição de lead
  function handleEdit(lead: any) {
    setEditingId(lead.id)
    setEditValue(lead.value?.toString() || "")
    setEditExpectedCloseDate(lead.estimated_close_date || "")
    setEditNotes(lead.description || "")
    setEditInterest(lead.interest || "")
    
    // Save original values for change detection
    setOriginalFormValues({
      value: lead.value?.toString() || "",
      expectedCloseDate: lead.estimated_close_date || "",
      notes: lead.description || "",
      interest: lead.interest || ""
    })
    
    setIsEditModalOpen(true)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return

    try {
      const updates: any = {}
      
      // Only include fields that changed
      if (editValue !== originalFormValues.value) {
        updates.value = editValue ? parseFloat(editValue) : null
      }
      if (editExpectedCloseDate !== originalFormValues.expectedCloseDate) {
        updates.estimated_close_date = editExpectedCloseDate || null
      }
      if (editNotes !== originalFormValues.notes) {
        updates.description = editNotes || null
      }
      if (editInterest !== originalFormValues.interest) {
        updates.interest = editInterest || null
      }

      // Process pending attachments
      const pending = pendingAttachments[editingId]
      if (pending) {
        // Upload new attachments
        if (pending.toAdd && pending.toAdd.length > 0) {
          console.log('Uploading attachments:', pending.toAdd)
          for (const file of pending.toAdd) {
            try {
              const uploadResponse = await apiService.uploadLeadAttachment(editingId, file)
              if (uploadResponse.success) {
                console.log('Attachment uploaded successfully:', uploadResponse.data)
              } else {
                console.error('Failed to upload attachment:', uploadResponse.error)
              }
            } catch (error) {
              console.error('Error uploading attachment:', error)
            }
          }
        }

        // Delete attachments marked for removal
        if (pending.toRemove && pending.toRemove.length > 0) {
          console.log('Deleting attachments:', pending.toRemove)
          for (const attachmentId of pending.toRemove) {
            try {
              const deleteResponse = await apiService.deleteLeadAttachment(editingId, attachmentId)
              if (deleteResponse.success) {
                console.log('Attachment deleted successfully')
              } else {
                console.error('Failed to delete attachment:', deleteResponse.error)
              }
            } catch (error) {
              console.error('Error deleting attachment:', error)
            }
          }
        }
      }

      // Update lead fields if there are changes
      if (Object.keys(updates).length > 0) {
        const response = await apiService.updateLead({ id: editingId, ...updates })
        
        if (!response.success) {
          console.error('Failed to update lead:', response.error)
          return
        }
      }
      
      // Refresh lead data to get updated attachments
      try {
        const leadResponse = await apiService.getLeadById(editingId)
        if (leadResponse.success && leadResponse.data) {
          const updatedLead = leadResponse.data.lead
          
          // Update the linked lead if it's the same one being edited
          if (currentLinkedLead?.id === editingId) {
            setCurrentLinkedLead(updatedLead)
            setLinkedLeads(prev => ({
              ...prev,
              [editingId]: updatedLead
            }))
          }
        }
      } catch (error) {
        console.error('Error refreshing lead data:', error)
      }
      
      // Clear pending attachments
      setPendingAttachments(prev => {
        const newPending = { ...prev }
        delete newPending[editingId]
        return newPending
      })
      
      setIsEditModalOpen(false)
      setEditingId(null)
      setEditValue("")
      setEditExpectedCloseDate("")
      setEditNotes("")
      
    } catch (error) {
      console.error('Error updating lead:', error)
    }
  }

  const handleAttachmentDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsAttachmentDragActive(true)
  }

  const handleAttachmentDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsAttachmentDragActive(false)
  }

  const handleAttachmentDrop = async (e: React.DragEvent, leadId: string) => {
    e.preventDefault()
    setIsAttachmentDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    // Add files to pending
    setPendingAttachments(prev => ({
      ...prev,
      [leadId]: {
        toAdd: [...(prev[leadId]?.toAdd || []), ...files],
        toRemove: prev[leadId]?.toRemove || []
      }
    }))
  }

  const handleAttachmentFileSelect = (e: React.ChangeEvent<HTMLInputElement>, leadId: string) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setPendingAttachments(prev => ({
      ...prev,
      [leadId]: {
        toAdd: [...(prev[leadId]?.toAdd || []), ...files],
        toRemove: prev[leadId]?.toRemove || []
      }
    }))

    // Reset input
    if (e.target) {
      e.target.value = ''
    }
  }

  const removePendingAttachment = (leadId: string, fileIndex: number) => {
    setPendingAttachments(prev => {
      const current = prev[leadId] || { toAdd: [], toRemove: [] }
      return {
        ...prev,
        [leadId]: {
          ...current,
          toAdd: current.toAdd.filter((_, i) => i !== fileIndex)
        }
      }
    })
  }

  const markAttachmentForRemoval = (leadId: string, attachmentId: string) => {
    setPendingAttachments(prev => {
      const current = prev[leadId] || { toAdd: [], toRemove: [] }
      return {
        ...prev,
        [leadId]: {
          ...current,
          toRemove: [...current.toRemove, attachmentId]
        }
      }
    })
  }

  const unmarkAttachmentForRemoval = (leadId: string, attachmentId: string) => {
    setPendingAttachments(prev => {
      const current = prev[leadId] || { toAdd: [], toRemove: [] }
      return {
        ...prev,
        [leadId]: {
          ...current,
          toRemove: current.toRemove.filter(id => id !== attachmentId)
        }
      }
    })
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

  // Função para marcar imagens como carregadas (usada pelo OptimizedImage)
  const handleImageLoaded = React.useCallback((imageId: string) => {
    imageLoadingRef.current.set(imageId, true)
    setLoadedImages(prev => {
      const newSet = new Set(prev)
      newSet.add(imageId)
      return newSet
    })
  }, [])

  // Função para fechar o modal de imagem com animação
  const closeImageModal = React.useCallback(() => {
    setImageModal(prev => ({ ...prev, isClosing: true }))
    setTimeout(() => {
      setImageModal({ isOpen: false, src: '', isClosing: false })
    }, 300) // Tempo da animação
  }, [])

  // Função para abrir o modal de imagem
  const openImageModal = React.useCallback((src: string) => {
    setImageModal({ isOpen: true, src, isClosing: false })
  }, [])

  // Função para forçar download de arquivo
  const handleDownloadFile = React.useCallback((fileId: string, fileName?: string) => {
    const url = `${getApiBaseUrl()}/telegram/files/${fileId}?download=true`
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || fileId
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])


  const handleLinkToLead = React.useCallback(async (leadId: string) => {
    if (!selectedChat) return

    try {
      const response = await apiService.linkTelegramConversationToLead(selectedChat, leadId)
      if (response.success) {
        // Update the conversation in local state to reflect the linked lead
        setConversations(prev => prev.map(conv => 
          conv.id === selectedChat 
            ? { ...conv, lead_id: leadId }
            : conv
        ))
        // Load the linked lead data
        const leadResponse = await apiService.getLeadById(leadId)
        if (leadResponse.success && leadResponse.data) {
          setCurrentLinkedLead(leadResponse.data.lead)
          setLinkedLeads(prev => ({
            ...prev,
            [leadId]: leadResponse.data!.lead
          }))
        }
        // Show success message (optional - could add a toast here)
        console.log('Successfully linked conversation to lead:', response.data)
      } else {
        console.error('Failed to link conversation to lead:', response.error)
        throw new Error(response.error || 'Failed to link conversation to lead')
      }
    } catch (error) {
      console.error('Error linking conversation to lead:', error)
      throw error
    }
  }, [selectedChat])

  const unlinkConversationFromLead = React.useCallback(async () => {
    if (!selectedChat) return

    try {
      const response = await apiCall(`/telegram/conversations/${selectedChat}/unlink-lead`, {
        method: 'POST'
      })
      if (response.success) {
        // Update the conversation in local state to remove the linked lead
        setConversations(prev => prev.map(conv => 
          conv.id === selectedChat 
            ? { ...conv, lead_id: undefined }
            : conv
        ))
        // Clear the linked lead data
        setCurrentLinkedLead(null)
        if (selectedChat) {
          const conversation = conversations.find(conv => conv.id === selectedChat)
          if (conversation?.lead_id) {
            setLinkedLeads(prev => {
              const newLeads = { ...prev }
              delete newLeads[conversation.lead_id!]
              return newLeads
            })
          }
        }
        console.log('Successfully unlinked conversation from lead')
      } else {
        console.error('Failed to unlink conversation from lead:', response.error)
        throw new Error(response.error || 'Failed to unlink conversation from lead')
      }
    } catch (error) {
      console.error('Error unlinking conversation from lead:', error)
      throw error
    }
  }, [selectedChat, apiCall])

  const openLeadPreview = React.useCallback(() => {
    if (currentLinkedLead) {
      setLeadPreview({ open: true, lead: currentLinkedLead })
    }
  }, [currentLinkedLead])

  // Leads são carregados junto com as conversas em loadConversationsAndLeads
  // Este useEffect foi removido para evitar carregamento duplicado

  // Load current linked lead when conversation changes
  React.useEffect(() => {
    if (selectedChat) {
      const conversation = conversations.find(conv => conv.id === selectedChat)
      if (conversation?.lead_id && linkedLeads[conversation.lead_id]) {
        setCurrentLinkedLead(linkedLeads[conversation.lead_id])
      } else {
        setCurrentLinkedLead(null)
      }
    }
  }, [selectedChat, conversations, linkedLeads])

  // Pré-carregar imagens em background para cache do navegador
  React.useEffect(() => {
    if (!isClient || messages.length === 0) return
    
    const photoMessages = messages.filter(m => m.message_type === 'photo' && m.file_id)
    photoMessages.forEach(msg => {
      if (msg.file_id && !loadedImages.has(msg.file_id)) {
        // Pré-carregar imagem em background
        const img = new window.Image()
        img.src = `${getApiBaseUrl()}/telegram/files/${msg.file_id}`
        img.onload = () => {
          handleImageLoaded(msg.file_id!)
        }
      }
    })
  }, [messages, isClient, loadedImages, handleImageLoaded])

  // Fechar modal com ESC
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && imageModal.isOpen) {
        closeImageModal()
      }
    }
    
    if (imageModal.isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevenir scroll do body quando o modal está aberto
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [imageModal.isOpen, closeImageModal])

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
          {/* HEADER */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-2 sm:px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-1 sm:mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${org}/dashboard`}>
                    {t('breadcrumb.dashboard')}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/${org}/chats`} className="text-sm sm:text-base">
                    {t('breadcrumb.chats')}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-2 text-sm sm:text-base">
                    <FaTelegram className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('breadcrumb.telegram')}</span>
                    <span className="sm:hidden">TG</span>
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* MAIN CONTENT */}
          <div className="flex h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden w-full">
            {/* Lista de Conversas */}
            <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 bg-white border-r border-gray-200 flex-col min-w-0`}>
              {/* Header da Lista */}
              <div className="p-2 sm:p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2 sm:mb-4 gap-2">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <FaTelegram className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 flex-shrink-0" />
                    <h1 className="text-base sm:text-xl font-semibold text-gray-800 truncate">{t('header.telegram')}</h1>
                    {/* Status indicator */}
                    {(chatType === 'bot' && bot) && (
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${bot.is_online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-xs sm:text-sm font-medium ${bot.is_online ? 'text-green-600' : 'text-red-600'} hidden sm:inline`}>
                          {bot.is_online ? t('header.online') : t('header.offline')}
                        </span>
                      </div>
                    )}
                    {(chatType === 'account' && account) && (
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${account.is_online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-xs sm:text-sm font-medium ${account.is_online ? 'text-green-600' : 'text-red-600'} hidden sm:inline`}>
                          {account.is_online ? t('header.online') : t('header.offline')}
                        </span>
                      </div>
                    )}
                  </div>
                  {userRole !== 'employee' && (
                  <div className="flex items-center space-x-2 flex-shrink-0">
                      <Button variant="outline" size="sm" asChild className="cursor-pointer h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
                        <a href={`/${org}/settings/telegram`}>
                          <Settings className="w-4 h-4" />
                        </a>
                      </Button>
                  </div>
                  )}
                </div>
                
                {/* Chat Type Selector */}
                {(hasBot && hasAccount) && (
                  <div className="mb-2 sm:mb-4">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => saveChatType('bot')}
                        className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
                          chatType === 'bot'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                          <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">{t('chatType.botChats')}</span>
                          <span className="sm:hidden">Bot</span>
                        </div>
                      </button>
                      <button
                        onClick={() => saveChatType('account')}
                        className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
                          chatType === 'account'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">{t('chatType.accountChats')}</span>
                          <span className="sm:hidden">Acc</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                    <Input
                      placeholder={t('search.placeholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 sm:pl-10 text-sm h-9 sm:h-10"
                    />
                  </div>
                  {chatType === 'account' && (
                    <Button size="sm" onClick={() => setShowNewChatModal(true)} className="cursor-pointer h-9 w-9 sm:h-10 sm:w-auto sm:px-3">
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Lista de Conversas */}
              <div className="flex-1 overflow-y-auto min-w-0">
                {!hasBot && !hasAccount ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <Bot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <div className="text-gray-500 text-sm mb-2">{t('emptyStates.noConfig')}</div>
                          {userRole !== 'employee' && (
                          <Button variant="outline" size="sm" asChild className="cursor-pointer">
                            <a href={`/${org}/settings/telegram`}>
                              {t('emptyStates.configureTelegram')}
                            </a>
                          </Button>
                          )}
                        </div>
                      </div>
                ) : chatType === 'bot' && !bot ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <Bot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <div className="text-gray-500 text-sm mb-2">{t('emptyStates.noBot')}</div>
                          {userRole !== 'employee' && (
                          <Button variant="outline" size="sm" asChild className="cursor-pointer">
                            <a href={`/${org}/settings/telegram`}>
                              {t('emptyStates.configureBot')}
                            </a>
                          </Button>
                          )}
                        </div>
                      </div>
                ) : chatType === 'account' && !account ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <div className="text-gray-500 text-sm mb-2">{t('emptyStates.noAccount')}</div>
                          {userRole !== 'employee' && (
                          <Button variant="outline" size="sm" asChild className="cursor-pointer">
                            <a href={`/${org}/settings/telegram`}>
                              {t('emptyStates.configureAccount')}
                            </a>
                          </Button>
                          )}
                        </div>
                      </div>
                ) : loading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-gray-500">{t('emptyStates.loading')}</div>
                      </div>
                ) : filteredConversations.length === 0 ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <Bot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <div className="text-gray-500 text-sm">{t('emptyStates.noConversations')}</div>
                          <div className="text-xs text-gray-400 mt-1">{t('emptyStates.noConversationsDesc')}</div>
                        </div>
                      </div>
                ) : filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={async () => {
                        // Selecionar conversa
                        setSelectedChat(conversation.id)
                        
                        // Verificar se há notificações não lidas antes de marcar
                        const unreadCount = (unreadCounts[conversation.id] || 0) + (unreadOverrides[conversation.id] || 0)
                        
                        // Só marcar como lido se houver notificações não lidas
                        if (unreadCount > 0) {
                          // Limpar badge local imediatamente (UX otimista)
                          setUnreadCounts(prev => ({ ...prev, [conversation.id]: 0 }))
                          // Remover override local, se houver
                          try {
                          	const nextOverrides = { ...unreadOverrides }
                          	if (nextOverrides[conversation.id]) {
                          		delete nextOverrides[conversation.id]
                          		setUnreadOverrides(nextOverrides)
                          		persistUnreadOverrides(nextOverrides)
                          	}
                          } catch {}
                          // Marcar como lido no backend apenas se houver notificações
                          try {
                          	await apiCall(`/telegram/conversations/${conversation.id}/mark-read`, { method: 'POST' })
                          } catch (e) {
                          	console.error('Falha ao marcar como lido ao selecionar conversa:', e)
                          }
                        }
                      }}
                      className={`group relative p-2 sm:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${
                        selectedChat === conversation.id ? 'bg-gray-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                            <AvatarFallback className="text-xs sm:text-sm">
                              {getDisplayName(conversation).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {getDisplayName(conversation)}
                            </h3>
                            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                              {effectiveUnread(conversation.id) > 0 && (
                                <div className="bg-blue-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-medium">
                                  {effectiveUnread(conversation.id) > 99 ? '99+' : effectiveUnread(conversation.id)}
                                </div>
                              )}
                              <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                                {formatConversationTimestamp(conversation.last_message_at || conversation.updated_at || conversation.created_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1 gap-2">
                            <div className="flex-1 min-w-0 sm:mr-8">
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                {conversation.last_message_preview ? (
                                  <>
                                    {conversation.last_message_direction === 'outgoing' ? 'You: ' : ''}
                                    {conversation.last_message_preview}
                                  </>
                                ) : ''}
                              </p>
                            </div>
                            <div className="relative flex items-center flex-shrink-0">
                              {/* Pin indicator - same position as chevron, moves left on hover */}
                              {pinned.has(conversation.id) && (
                                <div className="absolute right-0 flex items-center text-yellow-600 transition-all duration-200 group-hover:-translate-x-7 pointer-events-none">
                                  <Pin className="w-4 h-4" />
                                </div>
                              )}

                              {/* Dropdown trigger - appears on hover in the same position */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={t('moreOptions')}
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" sideOffset={8} onClick={(e)=>e.stopPropagation()}>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => markAsUnread(conversation.id)}>
                                    {t('contextMenu.markAsUnread')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => togglePin(conversation.id)}>
                                    {pinned.has(conversation.id) ? t('contextMenu.unpinFromTop') : t('contextMenu.pinToTop')}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600 focus:text-red-700 cursor-pointer" onClick={() => deleteChatLocal(conversation.id)}>
                                    {t('contextMenu.deleteChat')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                  }
              </div>
            </div>

            {/* Área de Chat */}
            <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col max-w-full min-w-0 overflow-hidden`}>
              {selectedConversation ? (
                <>
                  {/* Header do Chat */}
                  <div className="bg-white border-b border-gray-200 p-2 sm:p-4 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                      <button 
                        onClick={() => setSelectedChat(null)}
                        className="md:hidden mr-1 p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                        <AvatarFallback className="text-xs sm:text-sm">
                          {getDisplayName(selectedConversation).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm sm:text-lg font-semibold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                          {selectedConversation.lead_id && currentLinkedLead ? (
                            <button
                              onClick={openLeadPreview}
                              className="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer"
                              title={t('conversation.viewLead')}
                            >
                              {getDisplayName(selectedConversation)}
                              <Badge 
                                variant="outline" 
                                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors text-xs px-2 py-0.5"
                              >
                                <User className="w-3 h-3 mr-1" />
                                Linked
                              </Badge>
                            </button>
                          ) : (
                            <>
                              {getDisplayName(selectedConversation)}
                              {selectedConversation.lead_id && (
                                <Badge 
                                  variant="outline" 
                                  className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0.5"
                                >
                                  <User className="w-3 h-3 mr-1" />
                                  Linked
                                </Badge>
                              )}
                            </>
                          )}
                        </h2>
                        <div className="space-y-1">
                        {selectedConversation.telegram_username && (
                          <p className="text-sm text-gray-500">
                            @{selectedConversation.telegram_username}
                          </p>
                        )}
                          {selectedConversation.phone_number && !selectedConversation.telegram_username && (
                            <p className="text-sm text-blue-600">
                              📞 {selectedConversation.phone_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      {selectedConversation?.lead_id && currentLinkedLead && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="cursor-pointer h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
                          onClick={() => handleEdit(currentLinkedLead)}
                          title={t('conversation.editLead')}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="cursor-pointer h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
                        onClick={() => setIsLinkLeadModalOpen(true)}
                        title={t('conversation.linkToLead')}
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mensagens */}
                          <div className="relative flex-1 overflow-hidden">
                    <div id="messages-container" className={`h-full overflow-y-auto p-2 sm:p-4 space-y-2 bg-gray-50 w-full ${selectedFile ? 'mb-20' : ''}`}>
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
                        {sortedMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'} mb-1`}
                            >
                            <div
                              className={`max-w-[85%] sm:max-w-[80%] px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl break-words overflow-hidden text-sm sm:text-base ${
                                message.direction === 'outgoing'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white text-gray-900 border border-gray-200'
                              }`}
                            >
                              <div className="flex items-end space-x-2">
                                <div className="flex-1 min-w-0">
                                  {message.message_type === 'photo' && (
                                    <div className={message.message_text || message.caption ? '' : 'mt-2'}>
                                        {message.file_id ? (
                                          <div className="space-y-2">
                                            <div className="relative group">
                                              <OptimizedImage
                                                fileId={message.file_id}
                                                onImageLoaded={handleImageLoaded}
                                                onClick={() => {
                                                  if (!message.file_id?.startsWith('mtproto_')) {
                                                    openImageModal(`${getApiBaseUrl()}/telegram/files/${message.file_id}`)
                                                  }
                                                }}
                                              />
                                              {/* Ícone de download no canto superior direito - apenas no hover */}
                                              {!message.file_id.startsWith('mtproto_') && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDownloadFile(message.file_id!, `image_${message.file_id}.jpg`)
                                                  }}
                                                  className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                                  title={t('downloadImage')}
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                  </svg>
                                                </button>
                                              )}
                                            </div>
                                          {/* Texto embaixo da imagem como no Telegram */}
                                          {(message.caption || message.message_text) && (
                                            <p className={`text-sm ${
                                              message.direction === 'outgoing' 
                                                ? 'text-white' 
                                                : 'text-gray-600'
                                            }`}>
                                              {message.caption || message.message_text}
                                            </p>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500">
                                          <p>Imagem não disponível</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {message.message_text && message.message_type !== 'photo' && (
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
                                               <button
                                                 onClick={(e) => {
                                                   e.stopPropagation()
                                                   handleDownloadFile(
                                                     message.file_id!,
                                                     message.message_metadata?.file_name || `video_${message.file_id}.mp4`
                                                   )
                                                 }}
                                                 className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center"
                                                 title={t('downloadVideo')}
                                               >
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                 </svg>
                                               </button>
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
                                               <button
                                                 onClick={(e) => {
                                                   e.stopPropagation()
                                                   handleDownloadFile(
                                                     message.file_id!,
                                                     message.message_metadata?.file_name || `document_${message.file_id}`
                                                   )
                                                 }}
                                                 className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center"
                                                 title={t('downloadDocument')}
                                               >
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                 </svg>
                                               </button>
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
                                          <AudioPlayer
                                            fileId={message.file_id}
                                            fileName={message.message_metadata?.file_name || `audio_${message.file_id}.mp3`}
                                            duration={(() => {
                                              const metadata = message.message_metadata as any;
                                              return metadata?.duration ? Math.floor(metadata.duration) : 0;
                                            })()}
                                            direction={message.direction}
                                          />
                                          {/* Caption */}
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
                                    <div className="mt-2">
                                      {message.file_id && (
                                        <div className="space-y-2">
                                          <AudioPlayer
                                            fileId={message.file_id}
                                            fileName={`voice_${message.file_id}.ogg`}
                                            duration={(() => {
                                              const metadata = message.message_metadata as any;
                                              return metadata?.duration ? Math.floor(metadata.duration) : 0;
                                            })()}
                                            direction={message.direction}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {message.message_type === 'sticker' && (
                                    <div className="text-xs opacity-75">😀 {t('messages.sticker')}</div>
                                  )}
                                  {message.message_type === 'location' && (
                                    <div className="text-xs opacity-75">📍 {t('messages.location')}</div>
                                  )}
                                  {message.message_type === 'contact' && (
                                    <div className="text-xs opacity-75">👤 {t('messages.contact')}</div>
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
                        {/* CRITICAL: Only show queued messages that are NOT already in the database with proper telegram_date */}
                        {filteredQueuedMessages.map((queuedMessage) => (
                            <div
                              key={queuedMessage.id}
                              className="flex justify-end mb-1"
                            >
                              <div className="max-w-xs lg:max-w-md px-3 py-2 rounded-2xl bg-blue-500 text-white break-words overflow-hidden">
                                <div className="flex items-end space-x-2">
                                  <div className="flex-1 min-w-0">
                                    {/* Arquivo/Imagem primeiro */}
                                    {queuedMessage.file ? (
                                      <div className="mt-2">
                                        {/* Para imagens, sempre mostrar preview - criar se necessário */}
                                        {queuedMessage.file.type?.startsWith('image/') ? (
                                          <div className="space-y-2">
                                            <div className="relative group">
                                              <img 
                                                src={queuedMessage.filePreview || URL.createObjectURL(queuedMessage.file)} 
                                                alt="Preview" 
                                                style={{
                                                  opacity: 1,
                                                  transition: 'none'
                                                }}
                                                className="max-w-xs max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90"
                                              />
                                            </div>
                                            {/* Caption embaixo da imagem (se houver) */}
                                            {queuedMessage.text && (
                                              <p className="text-sm text-white">
                                                {queuedMessage.text}
                                              </p>
                                            )}
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
                                            {/* Caption para arquivos não-imagem */}
                                            {queuedMessage.text && (
                                              <p className="text-sm text-white">
                                                {queuedMessage.text}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      /* Texto da mensagem (apenas se não for arquivo) */
                                      queuedMessage.text && (
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
                                      )
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
                                          title={t('messages.retry')}
                                          onClick={() => retryQueuedMessage(queuedMessage.id)}
                                          className="ml-1 p-1 rounded hover:bg-blue-600/30 cursor-pointer"
                                        >
                                          <RotateCcw className="w-3 h-3 text-blue-100" />
                                        </button>
                                        <button
                                          title={t('messages.delete')}
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
                  <div className="bg-white border-t border-gray-200 p-2 sm:p-4">
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
                    
                    {/* Preview de áudio gravado */}
                    {selectedChat && currentConversationState.audioBlob && currentConversationState.audioURL && (
                        <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 h-10">
                            <FileAudio className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <span className="text-sm font-medium text-blue-900 whitespace-nowrap">Voice:</span>
                              <span className="text-xs text-blue-600">
                                {Math.floor(currentConversationState.recordingTime / 60)}:{(currentConversationState.recordingTime % 60).toString().padStart(2, '0')}
                              </span>
                              <audio src={currentConversationState.audioURL} controls className="flex-1 h-6" style={{ maxWidth: '200px' }} />
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={sendAudioMessage}
                                className="cursor-pointer text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                                title={t('input.sendVoice')}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelRecording}
                                className="cursor-pointer text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                title={t('input.cancel')}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      {selectedChat && !currentConversationState.isRecording && !currentConversationState.audioBlob && (
                        <>
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
                              className="cursor-pointer h-8 w-8 sm:h-9 sm:w-auto sm:px-3 p-0"
                            >
                              <Paperclip className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={startRecording}
                            className="cursor-pointer h-8 w-8 sm:h-9 sm:w-auto sm:px-3 p-0"
                            title={t('recordVoice')}
                          >
                            <Mic className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      
                      {selectedChat && currentConversationState.isRecording && (
                        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-50 rounded-lg border border-red-200 flex-1">
                          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                            <div className={`w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full flex-shrink-0 ${!currentConversationState.isPaused ? 'animate-pulse' : ''}`}></div>
                            <span className="text-xs sm:text-sm font-medium text-red-700 truncate">
                              {currentConversationState.isPaused ? 'Paused' : 'Recording'} {Math.floor(currentConversationState.recordingTime / 60)}:{(currentConversationState.recordingTime % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {!currentConversationState.isPaused ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={pauseRecording}
                                className="cursor-pointer text-orange-600 hover:text-orange-700 h-7 w-7 sm:h-8 sm:w-8 p-0"
                                title={t('input.pauseRecording')}
                              >
                                <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={resumeRecording}
                                className="cursor-pointer text-green-600 hover:text-green-700 h-7 w-7 sm:h-8 sm:w-8 p-0"
                                title={t('input.resumeRecording')}
                              >
                                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={stopRecording}
                              className="cursor-pointer bg-red-600 hover:bg-red-700 text-white h-7 w-7 sm:h-8 sm:w-8 p-0"
                              title={t('input.stopRecording')}
                            >
                              <Square className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelRecording}
                              className="cursor-pointer text-red-600 h-7 w-7 sm:h-8 sm:w-8 p-0"
                              title={t('input.cancelRecording')}
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {selectedChat && !currentConversationState.isRecording && !currentConversationState.audioBlob && (
                        <>
                          <div className="flex-1 relative">
                            <textarea
                              id="message-input"
                              placeholder={selectedFile ? t('input.captionPlaceholder') : t('input.typePlaceholder')}
                              value={currentConversationState.messageText}
                              onChange={handleMessageTextChange}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSendMessage()
                                }
                              }}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 pr-8 sm:pr-10 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[36px] sm:min-h-[40px] max-h-[100px] sm:max-h-[120px] break-words overflow-wrap-anywhere text-sm sm:text-base"
                              rows={1}
                              style={{
                                height: 'auto',
                                minHeight: '36px',
                                maxHeight: '100px',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                overflow: 'hidden'
                              }}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement
                                target.style.height = 'auto'
                                const maxH = window.innerWidth < 640 ? 100 : 120
                                const newHeight = Math.min(target.scrollHeight, maxH)
                                target.style.height = newHeight + 'px'
                                
                                // Mostrar scrollbar apenas quando necessário
                                if (target.scrollHeight > maxH) {
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
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 cursor-pointer h-7 w-7 sm:h-8 sm:w-8 p-0"
                              data-emoji-button
                            >
                              <Smile className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                          
                          <Button 
                            onClick={handleSendMessage} 
                            disabled={(!currentConversationState.messageText.trim() && !selectedFile)}
                            className="cursor-pointer h-9 w-9 sm:h-10 sm:w-auto sm:px-3 flex-shrink-0"
                            title={t('input.sendMessage')}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Seletor de Emojis */}
                  {showEmojiPicker && (
                    <div 
                      id="emoji-picker" 
                      className="absolute bottom-16 sm:bottom-20 right-1 sm:right-2 bg-white border border-gray-200 rounded-xl shadow-xl p-2 sm:p-4 z-50 w-[calc(100vw-1rem)] sm:w-80 max-w-sm max-h-64 overflow-y-auto"
                      style={{
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700">{t('emoji.title')}</h3>
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
                          { id: 'faces', label: '😀', name: t('emoji.faces') },
                          { id: 'objects', label: '❤️', name: t('emoji.objects') },
                          { id: 'food', label: '🍎', name: t('emoji.food') },
                          { id: 'activities', label: '⚽', name: t('emoji.activities') }
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('emptyStates.selectConversation')}</h3>
                    <p className="text-gray-500">{t('emptyStates.selectConversationDesc')}</p>
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
            <h3 className="text-lg font-semibold mb-4">{t('newChat.title')}</h3>
            <div className="space-y-3">
              <Input
                placeholder={t('newChat.identifierPlaceholder')}
                value={newChatIdentifier}
                onChange={(e) => setNewChatIdentifier(e.target.value)}
              />
              <Input
                placeholder={t('newChat.messagePlaceholder')}
                value={newChatFirstMessage}
                onChange={(e) => setNewChatFirstMessage(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewChatModal(false)} className="cursor-pointer">{t('newChat.cancel')}</Button>
                <Button onClick={startNewAccountChat} disabled={startingChat || !newChatIdentifier.trim()} className="cursor-pointer">
                  {startingChat ? t('newChat.starting') : t('newChat.startChat')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de imagem com transição suave */}
      {imageModal.isOpen && (
        <>
          <style>{`
            @keyframes imageModalFadeIn {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            @keyframes imageModalFadeOut {
              from {
                opacity: 1;
                transform: scale(1);
              }
              to {
                opacity: 0;
                transform: scale(0.85);
              }
            }
          `}</style>
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              backgroundColor: imageModal.isClosing ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.9)',
              transition: 'background-color 200ms ease-in-out',
              backdropFilter: imageModal.isClosing ? 'none' : 'blur(8px)',
            }}
            onClick={closeImageModal}
          >
            <div 
              className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
              style={{
                animation: imageModal.isClosing 
                  ? 'imageModalFadeOut 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards' 
                  : 'imageModalFadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={imageModal.src}
                alt={t('expandedImageAlt')}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
              />
            
              {/* Botão de fechar */}
              <button
                onClick={closeImageModal}
                className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200 hover:scale-110"
                style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Link to Lead Modal */}
      <LinkLeadModal
        isOpen={isLinkLeadModalOpen}
        onClose={() => setIsLinkLeadModalOpen(false)}
        onLink={handleLinkToLead}
        onUnlink={unlinkConversationFromLead}
        onCreateNew={handleCreateLeadFromContact}
        conversationName={selectedConversation ? getDisplayName(selectedConversation) : undefined}
        currentLinkedLead={currentLinkedLead}
      />

      {/* Edit Lead Modal */}
      <Sheet open={isEditModalOpen} onOpenChange={(open) => setIsEditModalOpen(open)}>
        <SheetContent 
          className="w-full sm:max-w-md border-l border-border p-6 md:p-8 flex flex-col max-h-screen"
          onDragOver={handleAttachmentDragOver}
          onDragLeave={handleAttachmentDragLeave}
          onDrop={(e) => editingId && handleAttachmentDrop(e, editingId)}
        >
          <div className="flex-shrink-0">
            <SheetHeader>
              <SheetTitle>{t('editLead.title')}</SheetTitle>
              <SheetDescription>
                {t('editLead.description')}
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('editLead.dealValue')}</label>
                  <Input
                    type="number"
                    placeholder={t('editLead.dealValuePlaceholder')}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('editLead.expectedCloseDate')}</label>
                  <Input
                    type="date"
                    value={editExpectedCloseDate}
                    onChange={(e) => setEditExpectedCloseDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('editLead.interest')}</label>
                  <Input
                    type="text"
                    placeholder={t('editLead.interestPlaceholder')}
                    value={editInterest}
                    onChange={(e) => setEditInterest(e.target.value.slice(0, 100))}
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t('editLead.notes')}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({editNotes.length}/500)
                    </span>
                  </label>
                  <textarea
                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none min-h-[80px] max-h-[200px] overflow-y-auto"
                    placeholder={t('editLead.notesPlaceholder')}
                    value={editNotes}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setEditNotes(e.target.value)
                      }
                    }}
                    maxLength={500}
                    rows={4}
                  />
                  {editNotes.length >= 450 && (
                    <p className="text-xs text-amber-600 mt-1">
                      {500 - editNotes.length} characters remaining
                    </p>
                  )}
                </div>
              </div>

              {/* Attachments Section */}
              {editingId && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-muted-foreground">Attachments</h3>
                      {(() => {
                        const pending = pendingAttachments[editingId]
                        const pendingToAdd = pending?.toAdd || []
                        const pendingToRemove = pending?.toRemove || []
                        const visibleAttachments = currentLinkedLead?.attachments?.filter((att: any) => !pendingToRemove.includes(att.id)) || []
                        const hasAnyAttachments = visibleAttachments.length > 0 || pendingToAdd.length > 0
                        
                        if (hasAnyAttachments) {
                          return (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => attachmentFileInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Add Files
                            </Button>
                          )
                        }
                        return null
                      })()}
                    </div>
                    
                    <input
                      ref={attachmentFileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleAttachmentFileSelect(e, editingId)}
                    />
                    
                    {/* Upload Zone - Conditional display */}
                    {(() => {
                      const pending = pendingAttachments[editingId]
                      const pendingToAdd = pending?.toAdd || []
                      const pendingToRemove = pending?.toRemove || []
                      const visibleAttachments = currentLinkedLead?.attachments?.filter((att: any) => !pendingToRemove.includes(att.id)) || []
                      const hasAnyAttachments = visibleAttachments.length > 0 || pendingToAdd.length > 0
                      
                      if (!hasAnyAttachments) {
                        return (
                          <div
                            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
                              isAttachmentDragActive
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                            }`}
                            onDragOver={handleAttachmentDragOver}
                            onDragLeave={handleAttachmentDragLeave}
                            onDrop={(e) => handleAttachmentDrop(e, editingId)}
                            onClick={() => attachmentFileInputRef.current?.click()}
                          >
                            <div className="flex flex-col items-center justify-center gap-2">
                              {uploadingAttachments[editingId] ? (
                                <>
                                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                  <p className="text-sm text-muted-foreground">{t('editLead.uploading')}</p>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-8 w-8 text-muted-foreground" />
                                  <div className="text-center">
                                    <p className="text-sm font-medium">
                                      Drag and drop files here
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      or click to browse (max 50MB)
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}

                    {/* Existing Attachments */}
                    {(() => {
                      const pending = pendingAttachments[editingId]
                      const pendingToAdd = pending?.toAdd || []
                      const pendingToRemove = pending?.toRemove || []
                      
                      // Filter out attachments that are marked for removal
                      const visibleAttachments = currentLinkedLead?.attachments?.filter((att: any) => !pendingToRemove.includes(att.id)) || []
                      
                      if (visibleAttachments.length === 0 && pendingToAdd.length === 0) {
                        return null
                      }
                      
                      return (
                        <div className="space-y-2">
                          {/* Existing attachments */}
                          {visibleAttachments.map((attachment: any) => {
                            if (!attachment || !attachment.id || !attachment.mimeType) {
                              console.warn('Invalid attachment object:', attachment)
                              return null
                            }
                            
                            const FileIcon = getFileIcon(attachment.mimeType)
                            return (
                              <div
                                key={attachment.id}
                                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                              >
                                <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {attachment.originalName || t('editLead.unknownFile')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(attachment.size || 0)}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="cursor-pointer text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAttachmentForRemoval(editingId, attachment.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          })}
                          
                          {/* Pending files to add */}
                          {pendingToAdd.map((file, index) => (
                            <div
                              key={`pending-${index}`}
                              className="flex items-center gap-3 p-3 rounded-lg border bg-primary/5 border-primary/20"
                            >
                              <File className="h-5 w-5 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-primary">
                                  {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)} (pending, save to upload)
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="cursor-pointer text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removePendingAttachment(editingId, index)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </>
              )}

              <Separator />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 cursor-pointer">
                  Save
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingId(null)
                    setEditValue("")
                    setEditExpectedCloseDate("")
                    setEditNotes("")
                    setEditInterest("")
                    if (editingId) {
                      setPendingAttachments(prev => {
                        const newPending = { ...prev }
                        delete newPending[editingId]
                        return newPending
                      })
                    }
                  }} 
                  className="cursor-pointer"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Lead Modal */}
      <Sheet open={isCreateLeadModalOpen} onOpenChange={(open) => {
        if (!open) {
          resetCreateLeadForm()
        }
        setIsCreateLeadModalOpen(open)
      }}>
        <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8 flex flex-col max-h-screen">
          <div className="flex-shrink-0">
            <SheetHeader>
              <SheetTitle>{t('createLead.title')}</SheetTitle>
              <SheetDescription>
                {t('createLead.description')}
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <form onSubmit={handleCreateLeadSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t('createLead.name')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder={t('createLead.namePlaceholder')}
                    value={createLeadName}
                    onChange={(e) => setCreateLeadName(e.target.value)}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t('createLead.email')}
                  </label>
                  <Input
                    type="email"
                    placeholder={t('createLead.emailPlaceholder')}
                    value={createLeadEmail}
                    onChange={(e) => setCreateLeadEmail(e.target.value)}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('createLead.phone')}</label>
                  <Input
                    type="tel"
                    placeholder={t('createLead.phonePlaceholder')}
                    value={createLeadPhone}
                    onChange={(e) => setCreateLeadPhone(e.target.value)}
                  />
                </div>

                {/* SSN */}
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('createLead.ssn')}</label>
                  <Input
                    type="text"
                    placeholder={t('createLead.ssnPlaceholder')}
                    value={createLeadSsn}
                    onChange={(e) => setCreateLeadSsn(e.target.value)}
                  />
                </div>

                {/* EIN */}
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('createLead.ein')}</label>
                  <Input
                    type="text"
                    placeholder={t('createLead.einPlaceholder')}
                    value={createLeadEin}
                    onChange={(e) => setCreateLeadEin(e.target.value)}
                  />
                </div>

                {/* Source */}
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('createLead.source')}</label>
                  <Input
                    type="text"
                    placeholder={t('createLead.sourcePlaceholder')}
                    value={createLeadSource}
                    onChange={(e) => setCreateLeadSource(e.target.value)}
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('createLead.status')}</label>
                  <select
                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    value={createLeadStatus}
                    onChange={(e) => setCreateLeadStatus(e.target.value)}
                  >
                    <option value="New">{t('createLead.statusNew')}</option>
                    <option value="Contacted">{t('createLead.statusContacted')}</option>
                    <option value="Qualified">{t('createLead.statusQualified')}</option>
                    <option value="Proposal">{t('createLead.statusProposal')}</option>
                    <option value="Negotiation">{t('createLead.statusNegotiation')}</option>
                    <option value="Won">{t('createLead.statusWon')}</option>
                    <option value="Lost">{t('createLead.statusLost')}</option>
                  </select>
                </div>

                {/* Deal Value */}
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('createLead.dealValue')}</label>
                  <Input
                    type="number"
                    placeholder={t('createLead.dealValuePlaceholder')}
                    value={createLeadValue}
                    onChange={(e) => setCreateLeadValue(e.target.value)}
                    step="0.01"
                  />
                </div>

                {/* Expected Close Date */}
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('createLead.expectedCloseDate')}</label>
                  <Input
                    type="date"
                    value={createLeadEstimatedCloseDate}
                    onChange={(e) => setCreateLeadEstimatedCloseDate(e.target.value)}
                  />
                </div>

                {/* Description/Notes */}
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t('createLead.notes')}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({createLeadDescription.length}/500)
                    </span>
                  </label>
                  <textarea
                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none min-h-[80px] max-h-[200px] overflow-y-auto"
                    placeholder={t('createLead.notesPlaceholder')}
                    value={createLeadDescription}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setCreateLeadDescription(e.target.value)
                      }
                    }}
                    maxLength={500}
                    rows={4}
                  />
                  {createLeadDescription.length >= 450 && (
                    <p className="text-xs text-amber-600 mt-1">
                      {500 - createLeadDescription.length} {t('createLead.charactersRemaining')}
                    </p>
                  )}
                </div>
              </div>

              <Separator />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 cursor-pointer">
                  {t('createLead.createAndLink')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateLeadModalOpen(false)
                    resetCreateLeadForm()
                  }} 
                  className="cursor-pointer"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t('createLead.cancel')}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {/* LEAD DETAILS MODAL - MODERN DESIGN */}
      <Sheet open={leadPreview.open} onOpenChange={(open) => setLeadPreview({ open, lead: open ? leadPreview.lead : null })}>
        <SheetContent className="w-full sm:max-w-3xl border-l border-border p-0 overflow-y-auto">
          {leadPreview.lead && (
            <>
              <SheetTitle className="sr-only">{t('leadPreview.title')}: {leadPreview.lead.name}</SheetTitle>
              <SheetDescription className="sr-only">{t('leadPreview.description')}</SheetDescription>
              {/* Header */}
              <div className="sticky top-0 z-10 bg-background border-b p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-6 w-6" />
                      <h2 className="text-2xl font-bold">{leadPreview.lead.name}</h2>
                    </div>
                    <p className="text-muted-foreground text-sm">{t('leadPreview.description')}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setLeadPreview({ open: false, lead: null })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Status Badge */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium capitalize">{leadPreview.lead.status}</span>
                  </div>
                  {leadPreview.lead.value && (
                    <div className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(leadPreview.lead.value)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Contact Information Card */}
                <div className="bg-muted/50 rounded-xl p-5 border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {t('leadPreview.contactInfo')}
                  </h3>
                  <div className="grid gap-3">
                    {leadPreview.lead.email && (
                      <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-3 flex-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{t('leadPreview.email')}</p>
                            <p className="text-sm font-medium truncate">{leadPreview.lead.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(leadPreview.lead?.email || '')
                            setCopiedKey('email')
                            setTimeout(() => setCopiedKey(null), 2000)
                          }}
                        >
                          {copiedKey === 'email' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                    
                    {leadPreview.lead.phone && (
                      <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-3 flex-1">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{t('leadPreview.phone')}</p>
                            <p className="text-sm font-medium truncate">{leadPreview.lead.phone}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(leadPreview.lead?.phone || '')
                            setCopiedKey('phone')
                            setTimeout(() => setCopiedKey(null), 2000)
                          }}
                        >
                          {copiedKey === 'phone' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Business Information Card */}
                {(leadPreview.lead.ssn || leadPreview.lead.ein || leadPreview.lead.source) && (
                  <div className="bg-muted/50 rounded-xl p-5 border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      {t('leadPreview.businessInfo')}
                    </h3>
                    <div className="grid gap-3">
                      {leadPreview.lead.ssn && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                          <div className="flex items-center gap-3 flex-1">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">{t('leadPreview.ssn')}</p>
                              <p className="text-sm font-medium font-mono">{leadPreview.lead.ssn}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(leadPreview.lead?.ssn || '')
                              setCopiedKey('ssn')
                              setTimeout(() => setCopiedKey(null), 2000)
                            }}
                          >
                            {copiedKey === 'ssn' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                      
                      {leadPreview.lead.ein && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                          <div className="flex items-center gap-3 flex-1">
                            <FileDigit className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">{t('leadPreview.ein')}</p>
                              <p className="text-sm font-medium font-mono">{leadPreview.lead.ein}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(leadPreview.lead?.ein || '')
                              setCopiedKey('ein')
                              setTimeout(() => setCopiedKey(null), 2000)
                            }}
                          >
                            {copiedKey === 'ein' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                      
                      {leadPreview.lead.source && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                          <div className="flex items-center gap-3 flex-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">{t('leadPreview.source')}</p>
                              <p className="text-sm font-medium">{leadPreview.lead.source}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(leadPreview.lead?.source || '')
                              setCopiedKey('source')
                              setTimeout(() => setCopiedKey(null), 2000)
                            }}
                          >
                            {copiedKey === 'source' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Deal Information Card */}
                {leadPreview.lead.estimated_close_date && (
                  <div className="bg-muted/50 rounded-xl p-5 border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {t('leadPreview.dealTimeline')}
                    </h3>
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-3 flex-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{t('leadPreview.estimatedCloseDate')}</p>
                            <p className="text-sm font-medium">{new Date(leadPreview.lead.estimated_close_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(new Date(leadPreview.lead?.estimated_close_date || '').toLocaleDateString())
                            setCopiedKey('close_date')
                            setTimeout(() => setCopiedKey(null), 2000)
                          }}
                        >
                          {copiedKey === 'close_date' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assignment Card */}
                <div className="bg-muted/50 rounded-xl p-5 border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    {t('leadPreview.assignment')}
                  </h3>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                      <div className="flex items-center gap-3 flex-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{t('leadPreview.assignedTo')}</p>
                          <p className="text-sm font-medium">
                            {leadPreview.lead.assigned_user_id ? (assignedUserName || t('leadPreview.loading')) : t('leadPreview.notAssigned')}
                          </p>
                        </div>
                      </div>
                      {leadPreview.lead.assigned_user_id && assignedUserName && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(assignedUserName)
                            setCopiedKey('assigned_user')
                            setTimeout(() => setCopiedKey(null), 2000)
                          }}
                        >
                          {copiedKey === 'assigned_user' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    
                    {leadPreview.lead.assigned_user_id && (
                      <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-3 flex-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{t('leadPreview.assignedSince')}</p>
                            <p className="text-sm font-medium">{new Date(leadPreview.lead.updated_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(new Date(leadPreview.lead?.updated_at || '').toLocaleString())
                            setCopiedKey('assigned_date')
                            setTimeout(() => setCopiedKey(null), 2000)
                          }}
                        >
                          {copiedKey === 'assigned_date' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location & Interest Card */}
                {(leadPreview.lead.location || leadPreview.lead.interest) && (
                  <div className="bg-muted/50 rounded-xl p-5 border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {t('leadPreview.additionalInfo')}
                    </h3>
                    <div className="grid gap-3">
                      {leadPreview.lead.location && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                          <div className="flex items-center gap-3 flex-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">{t('leadPreview.location')}</p>
                              <p className="text-sm font-medium">{leadPreview.lead.location}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(leadPreview.lead?.location || '')
                              setCopiedKey('location')
                              setTimeout(() => setCopiedKey(null), 2000)
                            }}
                          >
                            {copiedKey === 'location' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                      
                      {leadPreview.lead.interest && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                          <div className="flex items-center gap-3 flex-1">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">{t('leadPreview.interest')}</p>
                              <p className="text-sm font-medium">{leadPreview.lead.interest}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(leadPreview.lead?.interest || '')
                              setCopiedKey('interest')
                              setTimeout(() => setCopiedKey(null), 2000)
                            }}
                          >
                            {copiedKey === 'interest' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description Card */}
                {leadPreview.lead.description && (
                  <div className="bg-muted/50 rounded-xl p-5 border">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Description
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(leadPreview.lead?.description || '')
                          setCopiedKey('description')
                          setTimeout(() => setCopiedKey(null), 2000)
                        }}
                      >
                        {copiedKey === 'description' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="bg-background rounded-lg p-4 border">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{leadPreview.lead.description}</p>
                    </div>
                  </div>
                )}

                {/* Metadata Card */}
                <div className="bg-muted/50 rounded-xl p-5 border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Metadata
                  </h3>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                      <div className="flex items-center gap-3 flex-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Created</p>
                          <p className="text-sm font-medium">{new Date(leadPreview.lead.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(new Date(leadPreview.lead?.created_at || '').toLocaleString())
                          setCopiedKey('created_at')
                          setTimeout(() => setCopiedKey(null), 2000)
                        }}
                      >
                        {copiedKey === 'created_at' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {leadPreview.lead.created_by && (
                      <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-3 flex-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{t('createdBy')}</p>
                            <p className="text-sm font-medium">{createdByUserName || t('loading')}</p>
                          </div>
                        </div>
                        {createdByUserName && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(createdByUserName)
                              setCopiedKey('created_by')
                              setTimeout(() => setCopiedKey(null), 2000)
                            }}
                          >
                            {copiedKey === 'created_by' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                      <div className="flex items-center gap-3 flex-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Last Updated</p>
                          <p className="text-sm font-medium">{new Date(leadPreview.lead.updated_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(new Date(leadPreview.lead?.updated_at || '').toLocaleString())
                          setCopiedKey('updated_at')
                          setTimeout(() => setCopiedKey(null), 2000)
                        }}
                      >
                        {copiedKey === 'updated_at' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                      <div className="flex items-center gap-3 flex-1">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Lead ID</p>
                          <p className="text-sm font-medium font-mono text-xs truncate">{leadPreview.lead.id}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(leadPreview.lead?.id || '')
                          setCopiedKey('id')
                          setTimeout(() => setCopiedKey(null), 2000)
                        }}
                      >
                        {copiedKey === 'id' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setLeadPreview({ open: false, lead: null })} 
                    className="w-full cursor-pointer"
                    size="lg"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AuthGuard>
  )
}