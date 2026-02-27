"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
import { FaWhatsapp } from "react-icons/fa"
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
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Info,
  MessageCircle,
} from "lucide-react"
import { useApi } from "@/hooks/useapi"



/* ============================
   TYPES
============================ */

interface Conversation {
  id: string
  phone: string
  name?: string
  lastMessage?: string
  unreadCount: number
  updatedAt: string
}

interface Message {
  id: string
  body: string
  direction: "INBOUND" | "OUTBOUND"
  createdAt: string
}

/* ============================
   PAGE
============================ */

export default function WhatsAppPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  const { apiCall } = useApi()

  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [messages, setMessages] = React.useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] =
    React.useState<Conversation | null>(null)

  const [searchTerm, setSearchTerm] = React.useState("")
  const [messageText, setMessageText] = React.useState("")

  /* ============================
     LOAD CONVERSATIONS
  ============================ */
  React.useEffect(() => {
    apiCall("/api/whatsapp/conversations").then((res) => {
      if (res.success) setConversations(res.data)
    })
  }, [])

  /* ============================
     LOAD MESSAGES
  ============================ */
  React.useEffect(() => {
    if (!selectedConversation) return

    apiCall(
      `/api/whatsapp/conversations/${selectedConversation.id}/messages`
    ).then((res) => {
      if (res.success) setMessages(res.data)
    })
  }, [selectedConversation])

  /* ============================
     SEND MESSAGE
  ============================ */
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return

    await apiCall("/api/whatsapp/send", {
      method: "POST",
      body: JSON.stringify({
        to: selectedConversation.phone,
        body: messageText,
      }),
    })

    setMessageText("")

    const refreshed = await apiCall(
      `/api/whatsapp/conversations/${selectedConversation.id}/messages`
    )
    if (refreshed.success) setMessages(refreshed.data)
  }

  const filteredConversations = conversations.filter((c) =>
    (c.name || c.phone)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  /* ============================
     RENDER
  ============================ */

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
          {/* HEADER */}
          <header className="flex h-16 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/${org}/dashboard`}>
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-2">
                    <FaWhatsapp /> WhatsApp
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* CONTENT */}
          <div className="flex h-[calc(100vh-4rem)]">
            {/* CONVERSATIONS */}
            <aside className="w-1/3 border-r bg-white flex flex-col">
              <div className="p-4 bg-green-600">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-white">
                    <FaWhatsapp /> <span className="font-semibold">WhatsApp</span>
                  </div>
                  <MoreVertical className="text-white" />
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4" />
                  <Input
                    placeholder="Pesquisar"
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConversation(c)}
                    className={`p-4 cursor-pointer border-b hover:bg-gray-50 ${
                      selectedConversation?.id === c.id
                        ? "bg-green-50 border-l-4 border-green-500"
                        : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <Avatar>
                        <AvatarFallback>
                          <MessageCircle />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium">
                            {c.name || c.phone}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(c.updatedAt).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500 truncate">
                            {c.lastMessage}
                          </p>
                          {c.unreadCount > 0 && (
                            <Badge>{c.unreadCount}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* CHAT */}
            <main className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* HEADER */}
                  <div className="p-4 border-b flex justify-between bg-white">
                    <div>
                      <h2 className="font-semibold">
                        {selectedConversation.name ||
                          selectedConversation.phone}
                      </h2>
                      <p className="text-sm text-gray-500">
                        WhatsApp
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Phone />
                      <Video />
                      <Info />
                    </div>
                  </div>

                  {/* MESSAGES */}
                  <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${
                          m.direction === "OUTBOUND"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`px-4 py-2 rounded-lg max-w-md ${
                            m.direction === "OUTBOUND"
                              ? "bg-green-500 text-white"
                              : "bg-white border"
                          }`}
                        >
                          <p className="text-sm">{m.body}</p>
                          <span className="text-xs opacity-70">
                            {new Date(m.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* INPUT */}
                  <div className="p-4 border-t bg-white flex gap-2">
                    <Paperclip />
                    <Input
                      placeholder="Digite uma mensagem"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                    />
                    <Smile />
                    <Button onClick={handleSendMessage}>
                      <Send />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Selecione uma conversa
                </div>
              )}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
