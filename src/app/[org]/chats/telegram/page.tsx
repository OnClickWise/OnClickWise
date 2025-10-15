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
  Settings
} from 'lucide-react'
import { useApi } from "@/hooks/useApi"

// Tipos para as interfaces
interface TelegramBot {
  id: string;
  bot_name: string;
  bot_username: string;
  is_active: boolean;
  is_online?: boolean;
  created_at: string;
}

interface TelegramConversation {
  id: string;
  bot_id: string;
  organization_id: string;
  telegram_chat_id: number;
  telegram_user_id: string;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  chat_type: string;
  is_active: boolean;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
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



  // Carregar bot do Telegram
  React.useEffect(() => {
    // Só executar no cliente e quando isClient for true
    if (typeof window === 'undefined' || !isClient) return
    
    const loadBot = async () => {
      try {
        setLoading(true)
        console.log('Carregando bot do Telegram para chat...')
        const response = await apiCall('/telegram/bots')
        console.log('Resposta da API para bots no chat:', response)
        if (response.success && response.bots && response.bots.length > 0) {
          setBot(response.bots[0]) // Usar apenas o primeiro bot
          console.log('Bot carregado para chat:', response.bots[0])
        } else {
          console.log('Nenhum bot encontrado para chat:', response)
        }
      } catch (error) {
        console.error('Erro ao carregar bot:', error)
      } finally {
        setLoading(false)
      }
    }
    loadBot()
  }, [isClient]) // Adicionado isClient como dependência

  // Carregar conversas quando o bot for carregado
  React.useEffect(() => {
    // Só executar no cliente, quando isClient for true e se houver bot
    if (typeof window === 'undefined' || !isClient || !bot) return
    
    const loadConversations = async () => {
      try {
        setLoading(true)
        console.log('Carregando conversas para bot:', bot.id)
        const response = await apiCall(`/telegram/conversations?bot_id=${bot.id}`)
        console.log('Resposta da API para conversas:', response)
        if (response.success && response.conversations) {
          setConversations(response.conversations)
          console.log('Conversas carregadas:', response.conversations.length)
        } else {
          console.error('Erro na resposta da API:', response.error || 'Resposta inválida')
        }
      } catch (error) {
        console.error('Erro ao carregar conversas:', error)
      } finally {
        setLoading(false)
      }
    }
    loadConversations()
  }, [isClient, bot]) // Adicionado isClient como dependência

  // Auto-refresh das conversas a cada 10 segundos
  React.useEffect(() => {
    if (!bot || !isClient) return

    const refreshConversations = async () => {
      try {
        const response = await apiCall(`/telegram/conversations?bot_id=${bot.id}`)
        if (response.success && response.conversations) {
          setConversations(response.conversations)
        }
      } catch (error) {
        console.error('Erro ao atualizar conversas:', error)
      }
    }

    const interval = setInterval(refreshConversations, 10000) // Atualizar a cada 10 segundos
    return () => clearInterval(interval)
  }, [bot, isClient])

  // Carregar mensagens quando uma conversa for selecionada
  React.useEffect(() => {
    // Só executar no cliente, quando isClient for true e se houver conversa selecionada
    if (typeof window === 'undefined' || !isClient || !selectedChat) return
    
    const loadMessages = async () => {
      try {
        const response = await apiCall(`/telegram/conversations/${selectedChat}/messages`)
        if (response.success && response.messages) {
          setMessages(response.messages)
          
          // Scroll para o final após carregar mensagens
          setTimeout(() => {
            const messagesContainer = document.getElementById('messages-container')
            if (messagesContainer) {
              messagesContainer.scrollTop = messagesContainer.scrollHeight
            }
          }, 100)
        } else {
          console.error('Erro na resposta da API para mensagens:', response.error || 'Resposta inválida')
        }
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error)
      }
    }
    loadMessages()
  }, [isClient, selectedChat]) // Adicionado isClient como dependência

  // Auto-refresh das mensagens a cada 3 segundos
  React.useEffect(() => {
    if (!selectedChat || !isClient || isMarkingAsRead) return

    const refreshMessages = async () => {
      if (isRefreshing) return
      
      try {
        setIsRefreshing(true)
        const response = await apiCall(`/telegram/conversations/${selectedChat}/messages`)
        if (response.success && response.messages) {
          setMessages(response.messages)
          
          // Scroll para o final quando novas mensagens chegam
          setTimeout(() => {
            const messagesContainer = document.getElementById('messages-container')
            if (messagesContainer) {
              messagesContainer.scrollTop = messagesContainer.scrollHeight
            }
          }, 100)
        }
      } catch (error) {
        console.error('Erro ao atualizar mensagens:', error)
      } finally {
        setIsRefreshing(false)
      }
    }

    const interval = setInterval(refreshMessages, 3000) // Atualizar a cada 3 segundos
    return () => clearInterval(interval)
  }, [selectedChat, isClient, isRefreshing, isMarkingAsRead])

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
            const response = await apiCall(`/telegram/conversations/${conversation.id}/unread-count`)
            if (response.success) {
              counts[conversation.id] = response.unreadCount || 0
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
  }, [isClient, conversations, isMarkingAsRead])

  // Carregar contagem de mensagens não lidas
  React.useEffect(() => {
    if (!isClient || !conversations.length) return

    const loadUnreadCounts = async () => {
      try {
        const counts: {[key: string]: number} = {}
        for (const conversation of conversations) {
          try {
            const response = await apiCall(`/telegram/conversations/${conversation.id}/unread-count`)
            if (response.success) {
              counts[conversation.id] = response.unreadCount || 0
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
  }, [isClient, conversations])

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

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchTerm.toLowerCase()
    return (
      conv.first_name?.toLowerCase().includes(searchLower) ||
      conv.last_name?.toLowerCase().includes(searchLower) ||
      conv.telegram_username?.toLowerCase().includes(searchLower) ||
      conv.phone_number?.includes(searchTerm)
    )
  })

  const selectedConversation = conversations.find(conv => conv.id === selectedChat)

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

  const handleSendMessage = async () => {
    if ((messageText.trim() || selectedFile) && selectedChat) {
      try {
        setUploading(true)
        
        let response
        
        if (selectedFile) {
          // Enviar arquivo
          const formData = new FormData()
          formData.append('conversation_id', selectedChat)
          formData.append('file', selectedFile)
          formData.append('message_type', getMessageType(selectedFile))
          if (messageText.trim()) {
            formData.append('caption', messageText)
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
              conversation_id: selectedChat,
              message_text: messageText,
              message_type: 'text'
            })
          })
        }
        
        if (response.success) {
          setMessageText('')
          setSelectedFile(null)
          setFilePreview(null)
          // Limpar input de arquivo
          const fileInput = document.getElementById('file-input') as HTMLInputElement
          if (fileInput) fileInput.value = ''
          
          // Recarregar mensagens imediatamente
          const messagesResponse = await apiCall(`/telegram/conversations/${selectedChat}/messages`)
          if (messagesResponse.success && messagesResponse.messages) {
            setMessages(messagesResponse.messages)
          }
        }
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error)
      } finally {
        setUploading(false)
      }
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    // Se for hoje, mostrar apenas o horário
    if (diffInDays === 0) {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    }
    // Se for ontem
    else if (diffInDays === 1) {
      return `Ontem ${date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })}`
    }
    // Se for da semana passada
    else if (diffInDays < 7) {
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      const dayName = dayNames[date.getDay()]
      return `${dayName} ${date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })}`
    }
    // Se for mais antigo
    else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
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
          <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
            {/* Lista de Conversas */}
            <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
              {/* Header da Lista */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-xl font-semibold text-gray-800">Telegram</h1>
                    {bot && (
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${bot.is_online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-sm font-medium ${bot.is_online ? 'text-green-600' : 'text-red-600'}`}>
                          {bot.is_online ? 'Online' : 'Offline'}
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
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Pesquisar conversas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Lista de Conversas */}
              <div className="flex-1 overflow-y-auto">
                {!bot ? (
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
                ) : loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">Loading conversations...</div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Bot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <div className="text-gray-500 text-sm">No conversations found</div>
                    </div>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedChat(conversation.id)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedChat === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
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
                              {unreadCounts[conversation.id] > 0 && (
                                <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                                  {unreadCounts[conversation.id] > 99 ? '99+' : unreadCounts[conversation.id]}
                                </div>
                              )}
                              {conversation.last_message_at && (
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(conversation.last_message_at)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.telegram_username ? `@${conversation.telegram_username}` : 'Conversa privada'}
                            </p>
                            <div className="flex items-center space-x-2">
                              {conversation.chat_type === 'private' && (
                                <Badge variant="secondary" className="text-xs">
                                  Privado
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Área de Chat */}
            <div className="flex-1 flex flex-col">
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
                        <p className="text-sm text-gray-500">
                          {selectedConversation.telegram_username ? `@${selectedConversation.telegram_username}` : 'Conversa privada'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="cursor-pointer">
                        <Info className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div id="messages-container" className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <div className="text-gray-500 text-sm">Nenhuma mensagem ainda</div>
                        </div>
                      </div>
                    ) : (
                      messages
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // Ordenar por data (mais antigas primeiro)
                        .map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'} mb-1`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl ${
                                message.direction === 'outgoing'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white text-gray-900 border border-gray-200'
                              }`}
                            >
                              <div className="flex items-end space-x-2">
                                <div className="flex-1">
                                  {message.message_text && (
                                    <p className="text-sm leading-relaxed">{message.message_text}</p>
                                  )}
                                  {message.message_type === 'photo' && (
                                    <div className="mt-2">
                                        {message.file_id && (
                                          <div className="space-y-2">
                                            <div className="relative group">
                                              <img 
                                                src={`/telegram/files/${message.file_id}`}
                                                alt="Foto"
                                                className="max-w-xs max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => setImageModal({ isOpen: true, src: `/telegram/files/${message.file_id}` })}
                                                onError={(e) => {
                                                  console.error('Erro ao carregar imagem:', e);
                                                  e.currentTarget.style.display = 'none';
                                                }}
                                              />
                                              {/* Ícone de download no canto superior direito - apenas no hover */}
                                              <a
                                                href={`/telegram/files/${message.file_id}`}
                                                download
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                                title="Baixar imagem"
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
                                      )}
                                    </div>
                                  )}
                                  {message.message_type === 'video' && (
                                    <div className="mt-2">
                                        {message.file_id && (
                                          <div className="space-y-2">
                                           <div className={`flex items-center space-x-3 p-3 rounded-lg group relative cursor-pointer ${
                                             message.direction === 'outgoing' 
                                               ? 'bg-blue-50' 
                                               : 'bg-gray-50'
                                           }`}>
                                             <div className="flex-shrink-0 relative">
                                               <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                                 <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                               </svg>
                                               {/* Ícone de download bem em cima do ícone do vídeo - apenas no hover */}
                                               <a
                                                 href={`/telegram/files/${message.file_id}`}
                                                 download
                                                 onClick={(e) => e.stopPropagation()}
                                                 className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center"
                                                 title="Baixar vídeo"
                                               >
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                 </svg>
                                               </a>
                                             </div>
                                             <div className="flex-1 min-w-0">
                                               <p className={`text-sm font-medium ${
                                                 message.direction === 'outgoing' 
                                                   ? 'text-blue-900' 
                                                   : 'text-gray-900'
                                               }`}>
                                                 🎥 Vídeo
                                               </p>
                                               <p className={`text-xs ${
                                                 message.direction === 'outgoing' 
                                                   ? 'text-blue-600' 
                                                   : 'text-gray-500'
                                               }`}>
                                                 Video File
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
                                               ? 'bg-blue-50' 
                                               : 'bg-gray-50'
                                           }`}>
                                             <div className="flex-shrink-0 relative">
                                               <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                 <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                               </svg>
                                               {/* Ícone de download bem em cima do ícone vermelho - apenas no hover */}
                                               <a
                                                 href={`/telegram/files/${message.file_id}`}
                                                 download
                                                 onClick={(e) => e.stopPropagation()}
                                                 className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center"
                                                 title="Baixar documento"
                                               >
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                 </svg>
                                               </a>
                                             </div>
                                             <div className="flex-1 min-w-0">
                                               <p className={`text-sm font-medium truncate ${
                                                 message.direction === 'outgoing' 
                                                   ? 'text-blue-900' 
                                                   : 'text-gray-900'
                                               }`}>
                                                 {message.message_metadata?.file_name || 'Documento'}
                                               </p>
                                               <p className={`text-xs ${
                                                 message.direction === 'outgoing' 
                                                   ? 'text-blue-600' 
                                                   : 'text-gray-500'
                                               }`}>
                                                 69.3 KB
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
                                               ? 'bg-blue-50' 
                                               : 'bg-gray-50'
                                           }`}>
                                             <div className="flex-shrink-0 relative">
                                               <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                 <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                               </svg>
                                               {/* Ícone de download bem em cima do ícone do áudio - apenas no hover */}
                                               <a
                                                 href={`/telegram/files/${message.file_id}`}
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
                                                   ? 'text-blue-900' 
                                                   : 'text-gray-900'
                                               }`}>
                                                 🎵 Áudio
                                               </p>
                                               <p className={`text-xs ${
                                                 message.direction === 'outgoing' 
                                                   ? 'text-blue-600' 
                                                   : 'text-gray-500'
                                               }`}>
                                                 Audio File
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
                                      <div className="text-xs opacity-75">🎤 Mensagem de voz</div>
                                      {message.file_id && (
                                        <a 
                                          href={`/telegram/files/${message.file_id}`}
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
                                    <div className="text-xs opacity-75">📍 Localização</div>
                                  )}
                                  {message.message_type === 'contact' && (
                                    <div className="text-xs opacity-75">👤 Contato</div>
                                  )}
                                </div>
                                
                                {/* Horário e indicadores de status */}
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  <span className={`text-xs ${
                                    message.direction === 'outgoing' ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                    {formatTimestamp(message.created_at)}
                                  </span>
                                  
                                  {message.direction === 'outgoing' && (
                                    <div className="flex items-center space-x-0.5">
                                      {/* Indicadores de status */}
                                      <div className="flex space-x-0.5">
                                        <div className={`w-1 h-1 rounded-full ${
                                          message.is_delivered 
                                            ? 'bg-blue-300' 
                                            : 'bg-gray-400'
                                        }`}></div>
                                        <div className={`w-1 h-1 rounded-full ${
                                          message.is_delivered 
                                            ? 'bg-blue-300' 
                                            : 'bg-gray-400'
                                        }`}></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
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
                            📎 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">
                                📎 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
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
                        <Input
                          placeholder={selectedFile ? "Adicione uma legenda..." : "Digite uma mensagem..."}
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="pr-10"
                          disabled={uploading}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 cursor-pointer"
                        >
                          <Smile className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={(!messageText.trim() && !selectedFile) || uploading}
                        className="cursor-pointer"
                      >
                        {uploading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma conversa</h3>
                    <p className="text-gray-500">Escolha uma conversa da lista para começar a conversar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

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