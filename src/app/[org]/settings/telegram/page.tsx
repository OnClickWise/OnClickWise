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
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { 
  Bot,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react'
import { useApi } from "@/hooks/useApi"

interface TelegramBot {
  id: string;
  bot_name: string;
  bot_username: string;
  is_active: boolean;
  created_at: string;
}

export default function TelegramSettingsPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  const { apiCall, isClient } = useApi()
  
  const [bot, setBot] = React.useState<TelegramBot | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [showToken, setShowToken] = React.useState(false)
  
  // Formulário
  const [botName, setBotName] = React.useState('')
  const [botUsername, setBotUsername] = React.useState('')
  const [botToken, setBotToken] = React.useState('')
  const [validatingToken, setValidatingToken] = React.useState(false)
  const [tokenValidated, setTokenValidated] = React.useState(false)

  // Carregar bot existente
  React.useEffect(() => {
    // Só executar no cliente e quando isClient for true
    if (typeof window === 'undefined' || !isClient) return
    
    const loadBot = async () => {
      try {
        setLoading(true)
        // Aguardar um pouco para garantir que o token esteja disponível
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log('Carregando bot do Telegram...')
        const response = await apiCall('/telegram/bots')
        console.log('Resposta da API para bots:', response)
        
        if (response.success && response.bots && response.bots.length > 0) {
          const existingBot = response.bots[0]
          console.log('Bot encontrado:', existingBot)
          setBot(existingBot)
          setBotName(existingBot.bot_name)
          setBotUsername(existingBot.bot_username)
          setTokenValidated(true) // Bot já existe, token já foi validado
          // Não mostrar o token por segurança, mas indicar que está configurado
          setBotToken('***CONFIGURED***')
        } else {
          console.log('Nenhum bot encontrado ou resposta inválida:', response)
        }
      } catch (error) {
        console.error('Erro ao carregar bot:', error)
      } finally {
        setLoading(false)
      }
    }
    loadBot()
  }, [isClient]) // Adicionado isClient como dependência

  // Validar token do Telegram
  const validateToken = async (token: string) => {
    if (!token || token.length < 10) return

    try {
      setValidatingToken(true)
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.ok) {
          setBotName(data.result.first_name)
          setBotUsername(data.result.username)
          setTokenValidated(true)
        } else {
          setTokenValidated(false)
        }
      } else {
        setTokenValidated(false)
      }
    } catch (error) {
      console.error('Erro ao validar token:', error)
      setTokenValidated(false)
    } finally {
      setValidatingToken(false)
    }
  }

  // Validar token quando o campo for alterado
  React.useEffect(() => {
    if (botToken && botToken.length > 10 && botToken !== '***CONFIGURED***') {
      const timeoutId = setTimeout(() => {
        validateToken(botToken)
      }, 1000) // Debounce de 1 segundo

      return () => clearTimeout(timeoutId)
    } else if (botToken === '***CONFIGURED***') {
      setTokenValidated(true)
    } else {
      setTokenValidated(false)
    }
  }, [botToken])

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (bot) {
        // Atualizar bot existente
        const response = await apiCall(`/telegram/bots/${bot.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            bot_name: botName,
            bot_username: botUsername,
            token: botToken || undefined, // Só enviar se foi alterado
            is_active: true
          })
        })
        
        if (response.success) {
          // Recarregar página para mostrar sucesso
          window.location.reload()
        }
      } else {
        // Criar novo bot
        const requestData: any = {
          bot_name: botName,
          bot_username: botUsername
        }
        
        // Só enviar token se não for o token configurado
        if (botToken !== '***CONFIGURED***') {
          requestData.token = botToken
        }
        
        const response = await apiCall('/telegram/bots', {
          method: 'POST',
          body: JSON.stringify(requestData)
        })
        
        if (response.success) {
          // Recarregar página para mostrar sucesso
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('Erro ao salvar bot:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!bot || !confirm('Tem certeza que deseja deletar o bot? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setSaving(true)
      const response = await apiCall(`/telegram/bots/${bot.id}`, {
        method: 'DELETE'
      })
      
      if (response.success) {
        // Recarregar página
        window.location.reload()
      }
    } catch (error) {
      console.error('Erro ao deletar bot:', error)
    } finally {
      setSaving(false)
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
                  <BreadcrumbLink href={`/${org}/settings`}>
                    Configurações
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
          <div className="flex-1 space-y-4 p-4 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Telegram Configuration</h2>
                <p className="text-muted-foreground">
                  Configure your Telegram bot to receive and send messages
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              {/* Status do Bot */}
              {bot && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5" />
                      Bot Status
                    </CardTitle>
                    <CardDescription>
                      Information about your Telegram bot
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      {bot.is_active ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`font-medium ${bot.is_active ? 'text-green-700' : 'text-red-700'}`}>
                        {bot.is_active ? 'Bot Active' : 'Bot Inactive'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><strong>Name:</strong> {bot.bot_name}</div>
                      <div><strong>Username:</strong> @{bot.bot_username}</div>
                      <div><strong>Created:</strong> {new Date(bot.created_at).toLocaleDateString('en-US')}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Configuração do Bot */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    {bot ? 'Edit Bot' : 'Configure Bot'}
                  </CardTitle>
                  <CardDescription>
                    {bot 
                      ? 'Update your Telegram bot settings'
                      : 'Configure a new Telegram bot to start receiving messages'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="botToken">Bot Token</Label>
                      <div className="relative">
                        <Input
                          id="botToken"
                          type={showToken ? "text" : "password"}
                          placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                          value={botToken}
                          onChange={(e) => setBotToken(e.target.value)}
                          disabled={botToken === '***CONFIGURED***'}
                          className={botToken === '***CONFIGURED***' ? 'bg-green-50 border-green-200' : ''}
                        />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {botToken === '***CONFIGURED***' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Bot token is configured and webhook is active
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBotToken('')
                            setTokenValidated(false)
                          }}
                          className="text-xs"
                        >
                          Change Token
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Get your bot token from <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@BotFather</a>
                      </p>
                    )}
                    
                    {/* Status da validação do token */}
                    {validatingToken && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Validating token...
                      </div>
                    )}
                    
                    {tokenValidated && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Token valid! Bot data loaded automatically.
                      </div>
                    )}
                    
                    {botToken && botToken.length > 10 && !validatingToken && !tokenValidated && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        Invalid token. Please check if the token is correct.
                      </div>
                    )}
                  </div>

                  {/* Campos do bot - só aparecem após validação do token */}
                  {tokenValidated && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="botName">Bot Name</Label>
                        <Input
                          id="botName"
                          placeholder="Ex: Support Bot"
                          value={botName}
                          onChange={(e) => setBotName(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                          Name filled automatically by Telegram
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="botUsername">Bot Username</Label>
                        <Input
                          id="botUsername"
                          placeholder="Ex: my_support_bot"
                          value={botUsername}
                          onChange={(e) => setBotUsername(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                          Username filled automatically by Telegram
                        </p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSave} 
                      disabled={saving || !tokenValidated || !botName || !botUsername || !botToken}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : (bot ? 'Update Bot' : 'Create Bot')}
                    </Button>
                    
                    {bot && (
                      <Button 
                        variant="destructive" 
                        onClick={handleDelete}
                        disabled={saving}
                        className="cursor-pointer"
                      >
                        Delete Bot
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Instruções */}
              <Card>
                <CardHeader>
                  <CardTitle>How to configure your bot</CardTitle>
                  <CardDescription>
                    Follow these steps to configure your Telegram bot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                      <div>
                        <strong>Access @BotFather</strong> on Telegram
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                      <div>
                        <strong>Type /newbot</strong> to create a new bot
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                      <div>
                        <strong>Choose a name</strong> for your bot (ex: "Support Bot")
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                      <div>
                        <strong>Choose a username</strong> for your bot (ex: "my_support_bot")
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">5</span>
                      <div>
                        <strong>Copy the token</strong> provided by BotFather and paste it in the field above
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">✓</span>
                      <div>
                        <strong>Bot data</strong> will be filled automatically after token validation
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
