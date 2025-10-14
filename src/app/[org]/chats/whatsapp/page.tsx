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
  MessageCircle
} from 'lucide-react'

// Mock data para conversas do WhatsApp
const mockConversations = [
  {
    id: 1,
    name: "Grupo - Desenvolvimento",
    lastMessage: "João: Vamos fazer a reunião às 15h",
    timestamp: "10:30",
    unread: 3,
    avatar: "/avatars/grupo-dev.jpg",
    isGroup: true,
    participants: 8
  },
  {
    id: 2,
    name: "Maria Santos",
    lastMessage: "Obrigada pela ajuda! 🙏",
    timestamp: "09:15",
    unread: 0,
    avatar: "/avatars/maria.jpg",
    isGroup: false,
    isOnline: true
  },
  {
    id: 3,
    name: "Pedro Costa",
    lastMessage: "Enviando os arquivos agora",
    timestamp: "Ontem",
    unread: 1,
    avatar: "/avatars/pedro.jpg",
    isGroup: false,
    isOnline: false
  },
  {
    id: 4,
    name: "Grupo - Marketing",
    lastMessage: "Ana: Nova campanha aprovada!",
    timestamp: "Ontem",
    unread: 0,
    avatar: "/avatars/grupo-marketing.jpg",
    isGroup: true,
    participants: 12
  }
]

// Mock data para mensagens
const mockMessages = [
  {
    id: 1,
    text: "Olá! Como posso ajudá-lo hoje?",
    timestamp: "10:25",
    isFromUser: false,
    sender: "João Silva"
  },
  {
    id: 2,
    text: "Oi João! Preciso de ajuda com o relatório mensal",
    timestamp: "10:26",
    isFromUser: true,
    sender: "Você"
  },
  {
    id: 3,
    text: "Claro! Qual parte específica você está com dificuldade?",
    timestamp: "10:27",
    isFromUser: false,
    sender: "João Silva"
  },
  {
    id: 4,
    text: "Principalmente na seção de métricas de vendas",
    timestamp: "10:28",
    isFromUser: true,
    sender: "Você"
  },
  {
    id: 5,
    text: "Perfeito! Vou te enviar um template que uso para isso",
    timestamp: "10:30",
    isFromUser: false,
    sender: "João Silva"
  }
]

export default function WhatsAppPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  const [selectedChat, setSelectedChat] = React.useState(1)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [messageText, setMessageText] = React.useState('')

  const filteredConversations = mockConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedConversation = mockConversations.find(conv => conv.id === selectedChat)
  const selectedMessages = mockMessages

  const handleSendMessage = () => {
    if (messageText.trim()) {
      console.log('Enviando mensagem:', messageText)
      setMessageText('')
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
                  <BreadcrumbPage>WhatsApp</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* MAIN CONTENT */}
          <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Lista de Conversas */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header da Lista */}
        <div className="p-4 border-b border-gray-200 bg-green-600">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-white">WhatsApp</h1>
            <Button variant="ghost" size="sm" className="text-white hover:bg-green-700">
              <MoreVertical className="w-4 h-4" />
            </Button>
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
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedChat(conversation.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedChat === conversation.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conversation.avatar} alt={conversation.name} />
                    <AvatarFallback>
                      {conversation.isGroup ? <MessageCircle className="w-6 h-6" /> : conversation.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {!conversation.isGroup && conversation.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {conversation.name}
                    </h3>
                    <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                    {conversation.unread > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unread}
                      </Badge>
                    )}
                  </div>
                  {conversation.isGroup && (
                    <p className="text-xs text-gray-500 mt-1">
                      {conversation.participants} participantes
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
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
                  <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
                  <AvatarFallback>
                    {selectedConversation.isGroup ? <MessageCircle className="w-5 h-5" /> : selectedConversation.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedConversation.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.isGroup 
                      ? `${selectedConversation.participants} participantes`
                      : selectedConversation.isOnline ? 'Online' : 'Última vez visto há 2 horas'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Info className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {selectedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isFromUser
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.isFromUser ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input de Mensagem */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma conversa</h3>
              <p className="text-gray-500">Escolha uma conversa da lista para começar a conversar</p>
            </div>
          </div>
        )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
