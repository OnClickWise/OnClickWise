"use client"

import * as React from "react"
import { useEffect, useState, useRef, useMemo } from "react"
import { FaWhatsapp } from "react-icons/fa"
import { Search, Send, Paperclip, Smile, MoreVertical, Phone, Video, Info, MessageCircle, Loader2, UserCircle, MessageSquarePlus, ChevronDown, Trash2, Heart, BellOff } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

import { useApi } from "@/hooks/useApi"
import { getInternalChatSocket } from "@/services/internalChatSocket"
import { motion, AnimatePresence } from "framer-motion";
import { NewChatDrawer } from "@/components/modals/NewChatDrawer";
import { SaveContactModal } from "@/components/modals/SaveContactModal";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


/* ============================
   UTILS & TYPES
============================ */
const cleanPhone = (phone: string | undefined | null) => {
  if (!phone) return "";
  return phone.replace("whatsapp:", "").replace("+", "");
};

interface Conversation {
  id: string
  whatsapp_username: string
  lead_id?: string | null
  last_message_at: string
  is_active: boolean
  name?: string
  contact_name?: string;
  lastMessage?: string
  unread_count: number
  lastMessageDirection?: "incoming" | "outgoing" | null
}

interface Message {
  id: string
  content: string // Remova o 'message.'
  direction: "incoming" | "outgoing"
  whatsapp_date: string
}

const formatDividerDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) return "HOJE";
  if (msgDate.getTime() === yesterday.getTime()) return "ONTEM";

  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
};

const getDisplayName = (c: Conversation) => {
  if (c.name) return c.name;          // 1º Prioridade: Nome do Lead/CRM
  if (c.contact_name) return c.contact_name; // 2º Prioridade: Nome salvo manualmente
  return cleanPhone(c.whatsapp_username); // Fallback: Número limpo
};

/* ============================
   PAGE COMPONENT
============================ */
export default function WhatsAppPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = React.use(params)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [messageText, setMessageText] = useState("")
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const selectedConversationRef = useRef<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { apiCall } = useApi();

  const fetchMessages = async (conversationId: string) => {
  setIsLoadingMessages(true);
  try {
    const response = await apiCall(`/whatsapp/conversations/${conversationId}/messages`);
    const data = response?.data || response;
if (Array.isArray(data)) {
  // Inverte a ordem DESC do banco para ASC na tela
  const toDisplay = [...data].reverse(); 
  setMessages(toDisplay);
}
    
  } catch (error) {
    console.error("Erro ao carregar mensagens:", error);
    setMessages([]);
  } finally {
    setIsLoadingMessages(false);
  }
};


const handleSaveContact = async (newName: string) => {
  if (!selectedConversation) return;

  try {
    // 1. Chamada para a nova rota que criamos no NestJS
    
    await apiCall(`/whatsapp/contacts`, {
      method: 'POST',
      body: JSON.stringify({ 
        wa_id: selectedConversation.whatsapp_username, 
        display_name: newName                         
      })
    });

    // 2. Atualizar o estado da conversa selecionada localmente
    setSelectedConversation(prev => 
      prev ? { ...prev, contact_name: newName } : null
    );

    // 3. Atualizar a lista lateral para o nome mudar instantaneamente sem F5
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id 
        ? { ...conv, contact_name: newName } 
        : conv
    ));

    setIsSaveModalOpen(false); 
  } catch (error) {
    console.error("Erro ao atualizar nome do contato:", error);
    alert("Não foi possível salvar o contato. Tente novamente.");
  }
};



  // Memoize filtered list for performance
  const filteredConversations = useMemo(() => {
  if (!Array.isArray(conversations)) return [];

  return conversations
    .filter((c) => {
      const search = searchTerm.toLowerCase();
      // Usamos strings vazias como fallback para evitar erro de .toLowerCase() em null
      const name = (c.name || "").toLowerCase();
      const username = (c.whatsapp_username || "").toLowerCase();
      
      return name.includes(search) || username.includes(search);
    })
    .sort((a, b) => {
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });
}, [conversations, searchTerm]);

  const scrollToBottom = (force = false) => {
  if (force) {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
};

/* 1. SOCKET LISTENER GLOBAL */
/* 1. INICIALIZAÇÃO DO SOCKET */
const socket = useMemo(() => {
  const instance = getInternalChatSocket();

  // Pegamos o valor puro do localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (instance) {
    // 1. Injetamos o token PURO (sem Bearer)
    instance.auth = { token: token };

    // 2. Se já estiver conectado com o token antigo/errado, forçamos o disconnect
    // Isso garante que a próxima tentativa use o token que acabamos de injetar
    if (instance.connected) {
      instance.disconnect();
    }

    console.log("Tentando conexão Socket com Token:", token ? "Encontrado" : "Não encontrado");
    instance.connect();
  }

  return instance;
}, []);

/* 2. SINCRONIZAÇÃO DE REFERÊNCIA */
useEffect(() => {
  const previousConvId = selectedConversationRef.current;
  selectedConversationRef.current = selectedConversation?.id || null;
  
  if (selectedConversation?.id && socket) {
    // 1. Busca o histórico
    fetchMessages(selectedConversation.id);

    // 2. Lógica de Salas (Nomes devem bater com o log do Backend)
    if (previousConvId && previousConvId !== selectedConversation.id) {
      socket.emit('channel:leave', { 
        channelId: previousConvId, 
        organizationId: org // Importante passar a org
      });
    }

    console.log("Entrando na sala da conversa:", selectedConversation.id);
    socket.emit('channel:join', { 
      channelId: selectedConversation.id,
      organizationId: org 
    });
  }
}, [selectedConversation?.id, socket, org]);

/* 3. ESCUTA GLOBAL DE EVENTOS */
useEffect(() => {
  if (!socket) return;

  const handleNewMessage = (data: any) => {
  const newMessage = Array.isArray(data) ? data[0] : data;
  if (!newMessage) return;

  const incomingConvId = String(newMessage.conversation_id || newMessage.whatsapp_conversation_id);
  const currentOpenConvId = String(selectedConversationRef.current);

  if (incomingConvId === currentOpenConvId) {
    setMessages((prev) => {
      // 1. Evita duplicados reais (se a mesma mensagem chegar 2x pelo socket)
      if (prev.some(m => m.id === newMessage.id)) return prev;

      // 2. Se for uma mensagem RECEBIDA (incoming), apenas adicionamos ao array
      if (newMessage.direction === 'incoming') {
        return [...prev, {
          id: newMessage.id,
          content: newMessage.content,
          direction: newMessage.direction,
          whatsapp_date: newMessage.whatsapp_date || new Date().toISOString()
        }];
      }

      // 3. Se for uma mensagem ENVIADA (outgoing), limpamos QUALQUER temp antes de adicionar a oficial
      // Isso evita que a mensagem "pule" ou seja substituída incorretamente
      const filtered = prev.filter(m => !m.id.toString().startsWith('temp-'));

      return [...filtered, {
        id: newMessage.id,
        content: newMessage.content,
        direction: newMessage.direction,
        whatsapp_date: newMessage.whatsapp_date || new Date().toISOString()
      }];
    });
  }

  // ... resto da lógica de setConversations (está correta)
};

  const handleConversationUpdate = (updatedConv: any) => {
    setConversations((prev) => {
      const existing = prev.find(c => String(c.id) === String(updatedConv.id));
      
      // Mescla os dados sem tentar inventar propriedades que não existem no tipo
      const merged: Conversation = {
        ...(existing || ({} as Conversation)),
        ...updatedConv,
        lastMessage: updatedConv.lastMessage || updatedConv.last_content || existing?.lastMessage || ""
      };

      const otherConversations = prev.filter((c) => String(c.id) !== String(updatedConv.id));
      return [merged, ...otherConversations];
    });
  };

  socket.on('message:new', handleNewMessage);
  socket.on('whatsapp:conversation_updated', handleConversationUpdate); 
  
  return () => {
    socket.off('message:new', handleNewMessage);
    socket.off('whatsapp:conversation_updated', handleConversationUpdate);
  };
}, [socket]);


/* 4. CARREGAMENTO INICIAL DAS CONVERSAS (LISTA LATERAL) */
useEffect(() => {
  const fetchConversations = async () => {
    try {
      const response = await apiCall(`/whatsapp/conversations`);
      console.log("Resposta da API:", response); // VEJA O QUE APARECE NO CONSOLE
      
      // Se a resposta vier como { data: [...] }, use response.data
      const data = response?.data || response; 
      
      if (Array.isArray(data)) {
        setConversations(data);
      } else {
        console.error("Dados recebidos não são um array:", data);
      }
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    }
  };
  fetchConversations();
}, []);

  /* 4. SCROLL AUTO */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /* 5. SEND MESSAGE */
  const handleSendMessage = async () => {
  if (!messageText.trim() || !selectedConversation) return;

  const textToSend = messageText; // Salva o texto antes de limpar o input
  const currentConvId = selectedConversation.id
  setMessageText(""); // Limpa o input instantaneamente para dar sensação de velocidade

  // 1. CRIAÇÃO DA MENSAGEM OTIMISTA (Aparece na hora)
  const optimisticMsg: Message = {
    id: `temp-${Date.now()}`, // ID temporário
    content: textToSend,
    direction: "outgoing",
    whatsapp_date: new Date().toISOString(),
  };

  // Adiciona na tela antes mesmo da API responder
  setMessages((prev) => [...prev, optimisticMsg]);

  setConversations((prev) => {
    const updated = prev.map((conv): Conversation => {
      if (String(conv.id) === String(currentConvId)) {
        return {
          ...conv,
          lastMessage: textToSend,
          last_message_at: optimisticMsg.whatsapp_date,
          lastMessageDirection: "outgoing",
          unread_count: 0, // Ao enviar, garantimos que está lida
        };
      }
      return conv;
    });

    // Reordena para o topo
    return [...updated].sort((a, b) => 
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );
  });

  try {
    const payload = {
      to: selectedConversation.whatsapp_username,
      text: textToSend,
    };

    await apiCall('/whatsapp/messages/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // O Socket vai chegar em seguida com a mensagem oficial (id real do banco).
    // O seu código do useEffect já tem um "find" que evita duplicados, 
    // mas como o ID temporário é diferente, você pode ver a mensagem "pular" 
    // ou duplicar se não filtrarmos o 'temp-'.
    
  } catch (error) {
    console.error("Erro ao enviar:", error);
    // Opcional: Remover a mensagem otimista se der erro e devolver o texto ao input
    setMessages((prev) => prev.filter(m => m.id !== optimisticMsg.id));
    setMessageText(textToSend); 
    alert("Falha ao enviar mensagem.");
  }

  
};
const handleStartNewChat = async (phone: string, name: string) => {
  try {
    // 1. Chamada ao backend que acabamos de criar
    const response = await apiCall(`/whatsapp/conversations`, {
      method: "POST",
      body: JSON.stringify({ 
        whatsapp_username: phone, 
        name: name 
      })
    });
    
    const newConv = response?.data || response;

    // 2. Atualiza a lista lateral
    setConversations(prev => {
      // Evita duplicados se o usuário tentar criar algo que já apareceu via socket
      const exists = prev.find(c => c.id === newConv.id);
      if (exists) return prev;
      return [newConv, ...prev];
    });

    // 3. Seleciona a conversa para abrir o chat na hora
    setSelectedConversation(newConv);
    
    // 4. Fecha o modal
    setIsModalOpen(false);

  } catch (error) {
    console.error("Erro ao iniciar conversa:", error);
    alert("Não foi possível iniciar a conversa. Verifique o número.");
    throw error; 
  }
};

const handleDeleteConversation = async (conversationId: string) => {
  // 1. Confirmação para evitar cliques acidentais
  if (!confirm("Tem certeza que deseja apagar esta conversa? Todo o histórico será perdido.")) {
    return;
  }

  try {
    // 2. Chamada para o seu backend (usando o padrão apiCall que você já tem)
    const response = await apiCall(`/whatsapp/conversations/${conversationId}`, {
      method: 'DELETE',
      body: JSON.stringify({})
    });

    if (response.success) {
      // 3. Atualizar a UI: Remover a conversa da lista lateral
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));

      // 4. Se a conversa apagada for a que está aberta, desmantele o chat
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }

      // Opcional: toast.success("Conversa removida!");
    }
  } catch (error) {
    console.error("Erro ao apagar conversa:", error);
    // Opcional: toast.error("Não foi possível apagar a conversa.");
  }
};


  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
          <header className="flex h-16 items-center gap-2 border-b px-4 bg-white">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/${org}/dashboard`}>Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-2">
                    <FaWhatsapp className="text-green-600" /> WhatsApp
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white">
            {/* CONVERSATIONS SIDEBAR */}
            <aside className="w-100 border-r bg-white flex flex-col shrink-0 relative overflow-hidden">
  
              {/* O Drawer agora vive aqui dentro */}
              <AnimatePresence>
                {isModalOpen && (
                  <NewChatDrawer 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)}
                    onSelectContact={handleStartNewChat}
                    contacts={[]} // Passe aqui sua lista de contatos do CRM se tiver
                  />
                )}
              </AnimatePresence>
              {/* Header da Sidebar - Estilo Web */}
              <div className="p-3 bg-white flex items-center justify-between shrink-0">
                <h1 className="text-[#36b360] text-xl font-bold tracking-tight">
                    WhatsApp
                  </h1>
                <div className="flex gap-5 text-[#54656f]">
                  <span title="Nova conversa" className="cursor-pointer" onClick={() => setIsModalOpen(true)}>
                  <MessageSquarePlus size={22} className="cursor-pointer hover:text-[#00a884] transition-colors"/>
                </span>
                  <MoreVertical size={22} className="cursor-pointer" />
                </div>
              </div>

              {/* Busca - Estilo Web */}
              <div className="px-3 py-2 bg-white shrink-0">
                {/* A DIV pai controla o visual da "pílula" */}
                <div className="flex items-center bg-[#f0f2f5] rounded-full px-4 h-10 border border-transparent hover:border-[#dee1e3] transition-all">
                  <Search size={16} className="text-[#54656f] shrink-0" />
                  
                  {/* Input nativo: Sem bordas, sem anéis de foco, sem segredos */}
                  <input
                    type="text"
                    placeholder="Pesquisar ou começar uma nova conversa"
                    className="bg-transparent border-none outline-none focus:ring-0 w-full h-full ml-3 text-[14.5px] text-[#111b21] placeholder:text-[#667781] placeholder:font-light"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Lista de Conversas */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-white px-2"> 
                <AnimatePresence mode="popLayout">
                {filteredConversations.map((c) => (
                  <motion.div
                    layout
                    key={c.id}
                    className={`group relative flex items-center px-3 h-18 cursor-pointer transition-colors duration-200 mx-1 rounded-lg hover:bg-[#f5f6f6] ${
                      selectedConversation?.id === c.id ? "bg-[#ebebeb]" : ""
                    }`}
                    onClick={async () => {
                      // 1. Seleciona a conversa para abrir o chat
                      setSelectedConversation(c);

                      // 2. Se houver mensagens não lidas, limpamos
                      if ((c.unread_count || 0) > 0) {
                        // Atualização Otimista: Zera no front na hora
                        setConversations(prev => prev.map(conv => 
                          conv.id === c.id ? { ...conv, unread_count: 0 } : conv
                        ));

                        try {
                          // 3. Avisa o backend para zerar no banco
                          await apiCall(`/whatsapp/conversations/${c.id}/read`, { 
                            method: 'PATCH', 
                            body: JSON.stringify({}) 
                          });
                        } catch (error) {
                          console.error("Erro ao zerar contador no servidor:", error);
                        }
                      }
                    }}
                  >
                  {/* AVATAR */}
                  <Avatar className="h-12 w-12 shrink-0 mr-3">
                    <AvatarFallback className="bg-[#dfe5e7] text-[#54656f]">
                      <UserCircle size={30} strokeWidth={1.2} />
                    </AvatarFallback>
                  </Avatar>

                  {/* CONTEÚDO */}
                  <div className="flex-1 min-w-0 border-b border-[#f2f2f2] h-full flex flex-col justify-center pr-2">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-[16px] text-[#111b21] truncate font-normal">
                        {getDisplayName(c)}
                      </h3>
                      
                      {/* Lógica da Hora vs Setinha */}
                      <div className="relative">
                        {/* A hora some no hover se a setinha aparecer (comportamento original do Whats) */}
                        <span className="text-[12px] text-[#667781] group-hover:hidden">
                          {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {/* Botão de Dropdown que só aparece no Hover */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button 
                                onClick={(e) => e.stopPropagation()} // Importante: não abrir o chat ao clicar na seta
                                className="text-[#8696a0] hover:text-[#54656f] transition-colors outline-none"
                              >
                                <ChevronDown size={20} />
                              </button>
                            </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                side="bottom"
                                sideOffset={4}
                                className="..."
                                forceMount
                              >
                                {/*Botão de silenciar*/}
                                <DropdownMenuItem 
                                  className="px-4 py-2 text-sm text-[#111b21] cursor-pointer hover:bg-[#f5f6f6] outline-none flex items-center gap-3"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("Silenciar:", c.id);
                                  }}
                                >
                                  <BellOff size={18} className="text-[#54656f]" />
                                  <span>Silenciar notificações</span>
                                </DropdownMenuItem>
                                
                                {/*Botão de favoritar*/}
                                  <DropdownMenuItem 
                                    className="px-4 py-2 text-sm text-[#111b21] cursor-pointer hover:bg-[#f5f6f6] outline-none flex items-center gap-3"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log("Favoritar:", c.id);
                                    }}
                                  >
                                    <Heart size={18} className="text-[#54656f]" />
                                    <span>Favoritar</span>
                                  </DropdownMenuItem>
                                    
                              <DropdownMenuItem 
                                className="px-4 py-2 text-sm text-red-600 cursor-pointer hover:bg-red-50 outline-none"
                                onClick={(e) => {
                                  e.stopPropagation(); 
                                  handleDeleteConversation(c.id);
  
                                }}
                              >
                                <Trash2 size={16} /> 
                                <span>Apagar conversa</span>
                              </DropdownMenuItem>

                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-0.5">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {/* Verificamos se existe a mensagem E se a direção é estritamente outgoing */}
                          {c.lastMessage && c.lastMessageDirection?.trim().toLowerCase() === "outgoing" && (
                            <span className="text-[#8696a0] shrink-0 mr-1">
                              <svg viewBox="0 0 16 15" width="16" height="15" fill="currentColor">
                                <path d="M15.01 3.31L5.93 12.39l-4.94-4.94 1.41-1.41 3.53 3.53 7.67-7.67 1.41 1.41z" />
                              </svg>
                            </span>
                          )}
                        <p className="text-[14px] text-[#667781] truncate">
                          {c.lastMessage || "Nenhuma mensagem"}
                        </p>
                      </div>

                      {c.unread_count > 0 && (
                        <div className="bg-[#25d366] text-white rounded-full h-5 min-w-5 flex items-center justify-center text-[11px] font-bold px-1 ml-2">
                          {c.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
                ))}
                </AnimatePresence>
              </div>
            </aside>

            {/* CHAT AREA */}
            <main className="flex-1 flex flex-col relative bg-[#efeae2] dark:bg-slate-900">
              {/* Wallpaper Pattern (Opcional, mas dá o toque final) */}
              <div className="absolute inset-0 opacity-[0.06] pointer-events-none z-0" 
                   style={{ backgroundImage: `url('https://w0.peakpx.com/wallpaper/580/650/壓-whatsapp-background-dark-pattern.jpg')`, backgroundSize: '400px' }} />

              {selectedConversation ? (
                <div className="relative z-10 flex flex-col h-full">
                  {/* Header do Chat */}
                  <div className="h-15 px-4 flex justify-between items-center bg-[#f0f2f5] dark:bg-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                      
                      <Avatar className="h-10 w-10 cursor-pointer">
                        <AvatarFallback className="bg-[#dfe5e7] text-[#54656f]">
                          <UserCircle size={30} strokeWidth={1.2} />
                        </AvatarFallback>
                      </Avatar>
                      <div className="cursor-pointer">
                        <h2 className="text-[16px] font-medium text-[#111b21] leading-tight">
                          {selectedConversation ? getDisplayName(selectedConversation) : ""}
                        </h2>
                        {/*<span className="text-[12px] text-gray-500">visto por último hoje às...</span>*/}
                      </div>
                    </div>
                    <div className="flex gap-6 text-[#54656f]">
                      <Search size={20} className="cursor-pointer" />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                          <div className="hover:bg-black/5 rounded-full cursor-pointer transition-colors flex items-center justify-center outline-none">
                            <MoreVertical size={20} />
                          </div>
                        </DropdownMenuTrigger>
                        
                        <DropdownMenuContent align="end" className="w-48 bg-white shadow-md border rounded-md py-1">
                          <DropdownMenuItem 
                            className="px-4 py-2 text-sm text-[#111b21] cursor-pointer hover:bg-[#f5f6f6] outline-none font-medium"
                            onClick={() => setIsSaveModalOpen(true)} // <--- AGORA ABRE O MODAL
                          >
                            {selectedConversation?.contact_name ? "Editar contato" : "Salvar contato"}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem className="px-4 py-2 text-sm text-[#111b21] cursor-pointer hover:bg-[#f5f6f6] outline-none">
                            Dados do contato
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem className="px-4 py-2 text-sm text-red-500 cursor-pointer hover:bg-red-50 outline-none">
                            Apagar conversa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col">
  
                        {/* ESTE É O SEGREDO: 
                            Uma div que cresce (flex-1) e empurra todo o conteúdo para baixo. 
                            Se houver poucas mensagens, ela ocupa o espaço vazio. 
                            Se houver muitas, ela simplesmente some no topo do scroll.
                        */}
                        <div className="flex-1" />

                        {isLoadingMessages ? (
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="animate-spin text-[#00a884]" />
                          </div>
                        ) : (
                          <div className="space-y-1"> {/* Wrapper para manter o espaçamento consistente */}
                            {messages.map((m, index) => {
                              const showDivider =
                                index === 0 ||
                                new Date(m.whatsapp_date).toDateString() !==
                                  new Date(messages[index - 1].whatsapp_date).toDateString();
                              const isOutgoing = m.direction === "outgoing";

                              return (
                                <React.Fragment key={m.id}>
                                  {showDivider && (
                                    <div className="flex justify-center my-4">
                                      <span className="bg-white px-3 py-1.5 rounded-lg text-[12.5px] text-[#54656f] shadow-sm uppercase">
                                        {formatDividerDate(m.whatsapp_date)}
                                      </span>
                                    </div>
                                  )}

                                  <div className={`flex mb-1 ${isOutgoing ? "justify-end" : "justify-start"}`}>
                                    <div
                                      className={`relative max-w-[65%] px-2 py-1.5 rounded-[7.5px] ${
                                        isOutgoing
                                          ? "bg-[#d9fdd3] rounded-tr-none"
                                          : "bg-white rounded-tl-none"
                                      }`}
                                      style={{ boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)" }}
                                    >
                                      {/* TEXTO */}
                                      <span className="block text-[14.2px] text-[#111b21] leading-4.75 wrap-break-words">
                                        {m.content}
                                        {/* Espaço invisível para a hora não sobrepor o texto */}
                                        <span className={`inline-block ${isOutgoing ? "w-13" : "w-10"}`} />
                                      </span>

                                      {/* HORA + STATUS */}
                                      <div className="absolute bottom-0.5 right-1.5 flex items-center gap-1 text-[11px] text-[#667781] select-none">
                                        <span className="whitespace-nowrap">
                                          {new Date(m.whatsapp_date).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>

                                        {isOutgoing && (
                                          <span className="text-[#8696a0] flex items-center">
                                            <svg viewBox="0 0 16 15" width="16" height="15" fill="currentColor">
                                              <path d="M15.01 3.31L5.93 12.39l-4.94-4.94 1.41-1.41 3.53 3.53 7.67-7.67 1.41 1.41z" />
                                            </svg>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                  {/* Footer / Input */}
                  <div className="min-h-15.5 px-4 py-2 bg-[#f0f2f5] dark:bg-slate-800 flex items-center gap-4 shrink-0">
                    <div className="flex gap-4 text-[#54656f]">
                      <Smile size={26} className="cursor-pointer" />
                      <Paperclip size={26} className="cursor-pointer" />
                    </div>
                    <Input
                      placeholder="Digite uma mensagem"
                      className="flex-1 bg-white dark:bg-slate-700 border-none focus-visible:ring-0 h-10 text-[15px]"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    {messageText.trim() ? (
                      <Button size="icon" className="bg-transparent hover:bg-transparent text-[#54656f]" onClick={handleSendMessage}>
                        <Send size={24} />
                      </Button>
                    ) : (
                       <div className="text-[#54656f] cursor-pointer">🎤</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center z-10">
                  <div className="mb-6 opacity-20"><FaWhatsapp size={120} /></div>
                  <h1 className="text-[32px] font-light text-[#41525d] mt-4">WhatsApp Web</h1>
                  <p className="text-[14px] text-[#667781] max-w-md">
                    Envie e receba mensagens sem precisar manter seu celular conectado.<br/>
                    Use o WhatsApp em até quatro dispositivos conectados e um celular ao mesmo tempo.
                  </p>
                </div>
              )}
            </main>
          </div>
          
        </SidebarInset>
      </SidebarProvider>

      {selectedConversation && (
        <SaveContactModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSaveContact}
          // Se o lead_id existir (nome do CRM), podemos sugerir ele ou manter o contact_name
          currentName={selectedConversation.contact_name || selectedConversation.name}
          // Aqui usamos o helper para remover o "whatsapp:" da visualização do modal
          phoneNumber={cleanPhone(selectedConversation.whatsapp_username)}
        />
)}
    </AuthGuard>
  )
}