"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
import { SiGmail } from "react-icons/si"
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
  Mail,
  Star,
  Archive,
  Trash2,
  Reply,
  Forward,
  Flag
} from 'lucide-react'

// Mock data para emails
const mockEmails = [
  {
    id: 1,
    from: "João Silva",
    fromEmail: "joao@empresa.com",
    subject: "Relatório Mensal - Janeiro 2024",
    preview: "Olá! Segue em anexo o relatório mensal de janeiro. Preciso de sua revisão até sexta-feira...",
    timestamp: "10:30",
    isRead: false,
    isStarred: true,
    isImportant: true,
    avatar: "/avatars/joao.jpg"
  },
  {
    id: 2,
    from: "Maria Santos",
    fromEmail: "maria@empresa.com",
    subject: "Reunião de Equipe - Próxima Segunda",
    preview: "Lembrando que temos reunião de equipe na próxima segunda-feira às 14h. Por favor, confirme sua presença...",
    timestamp: "09:15",
    isRead: true,
    isStarred: false,
    isImportant: false,
    avatar: "/avatars/maria.jpg"
  },
  {
    id: 3,
    from: "Pedro Costa",
    fromEmail: "pedro@empresa.com",
    subject: "Proposta de Projeto - Cliente ABC",
    preview: "Enviei a proposta para o cliente ABC. Aguardando feedback até o final da semana...",
    timestamp: "Ontem",
    isRead: false,
    isStarred: false,
    isImportant: false,
    avatar: "/avatars/pedro.jpg"
  },
  {
    id: 4,
    from: "Ana Oliveira",
    fromEmail: "ana@empresa.com",
    subject: "Férias - Solicitação de Aprovação",
    preview: "Gostaria de solicitar minhas férias para o período de 15 a 30 de março. Seria possível?",
    timestamp: "Ontem",
    isRead: true,
    isStarred: false,
    isImportant: false,
    avatar: "/avatars/ana.jpg"
  },
  {
    id: 5,
    from: "Carlos Lima",
    fromEmail: "carlos@empresa.com",
    subject: "Atualização do Sistema - Manutenção Programada",
    preview: "Informamos que haverá manutenção programada no sistema no próximo domingo das 2h às 6h...",
    timestamp: "Seg",
    isRead: true,
    isStarred: false,
    isImportant: true,
    avatar: "/avatars/carlos.jpg"
  }
]

// Mock data para email selecionado
const mockSelectedEmail = {
  id: 1,
  from: "João Silva",
  fromEmail: "joao@empresa.com",
  subject: "Relatório Mensal - Janeiro 2024",
  content: `
    <p>Olá!</p>
    <p>Segue em anexo o relatório mensal de janeiro de 2024. O documento contém todas as métricas principais do período, incluindo:</p>
    <ul>
      <li>Vendas totais: R$ 150.000</li>
      <li>Novos clientes: 25</li>
      <li>Taxa de conversão: 12.5%</li>
      <li>Ticket médio: R$ 6.000</li>
    </ul>
    <p>Preciso de sua revisão e aprovação até sexta-feira para que possamos apresentar na reunião de diretoria.</p>
    <p>Qualquer dúvida, estou à disposição.</p>
    <p>Abraços,<br>João Silva</p>
  `,
  timestamp: "10:30",
  attachments: [
    { name: "relatorio-janeiro-2024.pdf", size: "2.3 MB" },
    { name: "graficos-vendas.xlsx", size: "1.1 MB" }
  ]
}

function sanitizeEmailHtml(html: string): string {
  if (typeof window === 'undefined') return ''

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Remove elementos com alto risco de execução/injeção
  doc.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach((el) => el.remove())

  // Remove atributos perigosos e URLs javascript:
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim().toLowerCase()

      if (name.startsWith('on')) {
        el.removeAttribute(attr.name)
        continue
      }

      if ((name === 'href' || name === 'src' || name === 'xlink:href') && value.startsWith('javascript:')) {
        el.removeAttribute(attr.name)
      }
    }
  })

  return doc.body.innerHTML
}

export default function EmailPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  const [selectedEmail, setSelectedEmail] = React.useState(1)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [composeOpen, setComposeOpen] = React.useState(false)

  const filteredEmails = mockEmails.filter(email =>
    email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentEmail = mockEmails.find(email => email.id === selectedEmail)
  const safeEmailHtml = React.useMemo(
    () => sanitizeEmailHtml(mockSelectedEmail.content),
    []
  )

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
                  <BreadcrumbPage className="flex items-center gap-2">
                    <SiGmail className="w-4 h-4" />
                    Email
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* MAIN CONTENT */}
          <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
            {/* Lista de Emails */}
            <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
              {/* Header da Lista */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <SiGmail className="w-5 h-5 text-gray-800" />
                    <h1 className="text-xl font-semibold text-gray-800">Email</h1>
                  </div>
                  <Button onClick={() => setComposeOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Mail className="w-4 h-4 mr-2" />
                    Escrever
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Pesquisar emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Lista de Emails */}
              <div className="flex-1 overflow-y-auto">
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email.id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedEmail === email.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={email.avatar} alt={email.from} />
                          <AvatarFallback>{email.from.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <h3 className={`text-sm font-medium truncate ${!email.isRead ? 'font-bold' : ''}`}>
                              {email.from}
                            </h3>
                            {email.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                            {email.isImportant && <Flag className="w-3 h-3 text-red-500" />}
                          </div>
                          <span className="text-xs text-gray-500">{email.timestamp}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate mb-1">
                          {email.subject}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{email.preview}</p>
                        {!email.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Área de Visualização do Email */}
            <div className="flex-1 flex flex-col">
              {currentEmail ? (
                <>
                  {/* Header do Email */}
                  <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">{currentEmail.subject}</h2>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Reply className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Forward className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={currentEmail.avatar} alt={currentEmail.from} />
                        <AvatarFallback>{currentEmail.from.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{currentEmail.from}</p>
                        <p className="text-sm text-gray-500">{currentEmail.fromEmail}</p>
                      </div>
                      <span className="text-sm text-gray-500 ml-auto">{currentEmail.timestamp}</span>
                    </div>
                  </div>

                  {/* Conteúdo do Email */}
                  <div className="flex-1 overflow-y-auto p-6 bg-white">
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: safeEmailHtml }}
                    />
                    
                    {/* Anexos */}
                    {mockSelectedEmail.attachments && mockSelectedEmail.attachments.length > 0 && (
                      <div className="mt-6 border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Anexos</h4>
                        <div className="space-y-2">
                          {mockSelectedEmail.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <Paperclip className="w-4 h-4 text-gray-400" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                                <p className="text-xs text-gray-500">{attachment.size}</p>
                              </div>
                              <Button variant="ghost" size="sm">Download</Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Área de Resposta */}
                  <div className="bg-white border-t border-gray-200 p-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" className="flex-1">
                        <Reply className="w-4 h-4 mr-2" />
                        Responder
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Forward className="w-4 h-4 mr-2" />
                        Encaminhar
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione um email</h3>
                    <p className="text-gray-500">Escolha um email da lista para visualizar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
