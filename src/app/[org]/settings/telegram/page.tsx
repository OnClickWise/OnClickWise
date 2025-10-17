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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Bot,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Settings,
  User,
  Smartphone,
  MessageSquare,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { useApi } from "@/hooks/useApi"

interface TelegramBot {
  id: string;
  bot_name: string;
  bot_username: string;
  is_active: boolean;
  created_at: string;
}

interface TelegramAccount {
  id: string;
  api_id: string;
  api_hash: string;
  phone_number: string;
  is_active: boolean;
  is_online?: boolean;
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
  const [account, setAccount] = React.useState<TelegramAccount | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [showToken, setShowToken] = React.useState(false)
  const [showApiHash, setShowApiHash] = React.useState(false)
  const [apiType, setApiType] = React.useState<'bot' | 'account'>('bot')
  
  // Bot form
  const [botName, setBotName] = React.useState('')
  const [botUsername, setBotUsername] = React.useState('')
  const [botToken, setBotToken] = React.useState('')
  const [validatingToken, setValidatingToken] = React.useState(false)
  const [tokenValidated, setTokenValidated] = React.useState(false)
  
  // Account form
  const [apiId, setApiId] = React.useState('')
  const [apiHash, setApiHash] = React.useState('')
  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [validatingAccount, setValidatingAccount] = React.useState(false)
  const [accountValidated, setAccountValidated] = React.useState(false)
  const [smsCode, setSmsCode] = React.useState('')
  const [showSmsDialog, setShowSmsDialog] = React.useState(false)
  const [authenticating, setAuthenticating] = React.useState(false)
  const [twoFactorPassword, setTwoFactorPassword] = React.useState('')
  const [rememberTwoFactor, setRememberTwoFactor] = React.useState(false)
  const [showTwoFactorDialog, setShowTwoFactorDialog] = React.useState(false)
  const setupStatusKey = `telegram_account_setup_status_${org}`
  const [setupStatus, setSetupStatus] = React.useState<null | 'awaiting_sms' | '2fa_required'>(null)
  const [authFeedback, setAuthFeedback] = React.useState('')
  const [twoFactorAttempts, setTwoFactorAttempts] = React.useState(0)
  const [smsAttempts, setSmsAttempts] = React.useState(0)

  // Carregar configurações existentes
  React.useEffect(() => {
    // Só executar no cliente e quando isClient for true
    if (typeof window === 'undefined' || !isClient) return
    
    const loadConfigurations = async () => {
      try {
        setLoading(true)
        // Aguardar um pouco para garantir que o token esteja disponível
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log('Carregando configurações do Telegram...')
        
        // Carregar bot
        const botResponse = await apiCall('/telegram/bots')
        console.log('Resposta da API para bots:', botResponse)
        
        if (botResponse.success && botResponse.bots && botResponse.bots.length > 0) {
          const existingBot = botResponse.bots[0]
          console.log('Bot encontrado:', existingBot)
          setBot(existingBot)
          setBotName(existingBot.bot_name)
          setBotUsername(existingBot.bot_username)
          setTokenValidated(true) // Bot já existe, token já foi validado
          // Não mostrar o token por segurança, mas indicar que está configurado
          setBotToken('***CONFIGURED***')
        } else {
          console.log('Nenhum bot encontrado ou resposta inválida:', botResponse)
        }
        
        // Carregar conta
        const accountResponse = await apiCall('/telegram/accounts')
        console.log('Resposta da API para contas:', accountResponse)
        
        if (accountResponse.success && accountResponse.accounts && accountResponse.accounts.length > 0) {
          const existingAccount = accountResponse.accounts[0]
          console.log('Conta encontrada:', existingAccount)
          setAccount(existingAccount)
          setApiId(existingAccount.api_id)
          setPhoneNumber(existingAccount.phone_number)
          setAccountValidated(true) // Conta já existe, credenciais já foram validadas
          // Não mostrar o hash por segurança, mas indicar que está configurado
          setApiHash('***CONFIGURED***')
        } else {
          console.log('Nenhuma conta encontrada ou resposta inválida:', accountResponse)
        }
        // Carregar status de setup pendente do localStorage
        try {
          const stored = localStorage.getItem(setupStatusKey)
          if (stored) setSetupStatus(JSON.parse(stored))
        } catch {}
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      } finally {
        setLoading(false)
      }
    }
    loadConfigurations()
  }, [isClient]) // Adicionado isClient como dependência

  // Função reutilizável para atualizar bot/conta sem recarregar a página
  const refreshConfigs = React.useCallback(async () => {
    try {
      setLoading(true)
      const [botResponse, accountResponse] = await Promise.all([
        apiCall('/telegram/bots'),
        apiCall('/telegram/accounts')
      ])

      if (botResponse.success && botResponse.bots && botResponse.bots.length > 0) {
        const existingBot = botResponse.bots[0]
        setBot(existingBot)
        setBotName(existingBot.bot_name)
        setBotUsername(existingBot.bot_username)
        setTokenValidated(true)
        setBotToken('***CONFIGURED***')
      } else {
        setBot(null)
        setTokenValidated(false)
        setBotToken('')
      }

      if (accountResponse.success && accountResponse.accounts && accountResponse.accounts.length > 0) {
        const existingAccount = accountResponse.accounts[0]
        setAccount(existingAccount)
        setApiId(existingAccount.api_id)
        setPhoneNumber(existingAccount.phone_number)
        setAccountValidated(true)
        setApiHash('***CONFIGURED***')
      } else {
        setAccount(null)
        setApiId('')
        setPhoneNumber('')
        setAccountValidated(false)
        setApiHash('')
      }
    } catch (e) {
      console.error('Erro ao atualizar configurações:', e)
    } finally {
      setLoading(false)
    }
  }, [apiCall])

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

  // Validar credenciais da conta
  const validateAccount = async (apiId: string, apiHash: string) => {
    if (!apiId || !apiHash || apiId.length < 5 || apiHash.length < 10) return

    try {
      setValidatingAccount(true)
      // Validação básica: verificar se os campos têm o formato esperado
      const isApiIdValid = /^\d+$/.test(apiId) && apiId.length >= 5
      const isApiHashValid = /^[a-f0-9]{32}$/i.test(apiHash)
      
      if (isApiIdValid && isApiHashValid) {
        setAccountValidated(true)
      } else {
        setAccountValidated(false)
      }
    } catch (error) {
      console.error('Erro ao validar credenciais:', error)
      setAccountValidated(false)
    } finally {
      setValidatingAccount(false)
    }
  }

  // Autenticar conta com SMS
  const authenticateAccount = async (target?: TelegramAccount) => {
    const acc = target || account
    if (!acc) return
    
    setAuthenticating(true)
    setAuthFeedback('Requesting SMS code...')
    try {
      const response = await apiCall(`/telegram/accounts/${acc.id}/authenticate`, {
        method: 'POST'
      })
      
      if (response.success) {
        if (response.requiresSmsCode) {
          setShowSmsDialog(true)
          setSetupStatus('awaiting_sms')
          try { localStorage.setItem(setupStatusKey, JSON.stringify('awaiting_sms')) } catch {}
          setAuthFeedback('SMS sent. Enter the code received in Telegram.')
        } else {
          setSetupStatus(null)
          try { localStorage.removeItem(setupStatusKey) } catch {}
          // Atualizar conta
          const accResp = await apiCall('/telegram/accounts')
          if (accResp.success && accResp.accounts?.length) setAccount(accResp.accounts[0])
        }
      } else {
        alert(`Erro na autenticação: ${response.error}`)
      }
    } catch (error) {
      console.error('Erro na autenticação:', error)
      alert('Erro na autenticação')
    } finally {
      setAuthenticating(false)
    }
  }

  // Verificar código SMS
  const verifySmsCode = async () => {
    if (!account || !smsCode) return
    
    setAuthenticating(true)
    setAuthFeedback(twoFactorPassword ? 'Verifying 2FA password...' : 'Verifying SMS code...')
    try {
      const response = await apiCall(`/telegram/accounts/${account.id}/verify-sms`, {
        method: 'POST',
        body: JSON.stringify({ 
          smsCode,
          twoFactorPassword: twoFactorPassword || undefined,
          rememberTwoFactor
        })
      })
      
      if (response.success) {
        setShowSmsDialog(false)
        setShowTwoFactorDialog(false)
        setSmsCode('')
        setTwoFactorPassword('')
        setRememberTwoFactor(false)
        setTwoFactorAttempts(0)
        setSmsAttempts(0)
        setAuthFeedback('')
        setSetupStatus(null)
        try { localStorage.removeItem(setupStatusKey) } catch {}
        const accResp = await apiCall('/telegram/accounts')
        if (accResp.success && accResp.accounts?.length) setAccount(accResp.accounts[0])
      } else {
        // Se precisar de 2FA, mostrar o formulário
        if (response.error && response.error.includes('2FA')) {
          setShowTwoFactorDialog(true)
          setSetupStatus('2fa_required')
          try { localStorage.setItem(setupStatusKey, JSON.stringify('2fa_required')) } catch {}
          setAuthFeedback('Two-factor authentication required.')
        } else {
          if (twoFactorPassword) {
            const next = twoFactorAttempts + 1
            setTwoFactorAttempts(next)
            setAuthFeedback(next >= 3 ? 'Wrong 2FA password. Please check and try again.' : 'Invalid 2FA password, try again...')
          } else {
            const nextSms = smsAttempts + 1
            setSmsAttempts(nextSms)
            setAuthFeedback(nextSms >= 2 ? 'Invalid SMS code. Please re-check the code.' : 'Invalid SMS code, try again...')
          }
        }
      }
    } catch (error) {
      console.error('Erro na verificação:', error)
      setAuthFeedback('Network error during verification. Please try again.')
    } finally {
      setAuthenticating(false)
    }
  }

  // Validar token quando o campo for alterado
  React.useEffect(() => {
    if (botToken && botToken.length > 10 && botToken !== '***CONFIGURED***') {
      const timeoutId = setTimeout(() => {
        validateToken(botToken)
      }, 2000) // Debounce de 2 segundos para dar tempo de digitar

      return () => clearTimeout(timeoutId)
    } else if (botToken === '***CONFIGURED***') {
      setTokenValidated(true)
    } else if (botToken.length === 0) {
      // Só marcar como inválido se o campo estiver vazio
      setTokenValidated(false)
    }
    // Não marcar como inválido se o usuário ainda está digitando
  }, [botToken])

  // Validar credenciais quando os campos forem alterados
  React.useEffect(() => {
    if (apiId && apiHash && apiHash !== '***CONFIGURED***') {
      const timeoutId = setTimeout(() => {
        validateAccount(apiId, apiHash)
      }, 2000) // Debounce de 2 segundos para dar tempo de digitar

      return () => clearTimeout(timeoutId)
    } else if (apiHash === '***CONFIGURED***') {
      setAccountValidated(true)
    } else if (apiId.length === 0 || apiHash.length === 0) {
      // Só marcar como inválido se os campos estiverem vazios
      setAccountValidated(false)
    }
    // Não marcar como inválido se o usuário ainda está digitando
  }, [apiId, apiHash])

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (apiType === 'bot') {
        if (bot) {
          // Atualizar bot existente
          const response = await apiCall(`/telegram/bots/${bot.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              bot_name: botName,
              bot_username: botUsername,
              token: botToken !== '***CONFIGURED***' ? botToken : undefined,
              is_active: true
            })
          })
          
          if (response.success) {
            await refreshConfigs()
          }
        } else {
          // Criar novo bot
          const requestData: any = {
            bot_name: botName,
            bot_username: botUsername
          }
          
          if (botToken !== '***CONFIGURED***') {
            requestData.token = botToken
          }
          
          const response = await apiCall('/telegram/bots', {
            method: 'POST',
            body: JSON.stringify(requestData)
          })
          
          if (response.success) {
            await refreshConfigs()
          }
        }
      } else {
        // Account API
        if (account) {
          // Atualizar conta existente
          const response = await apiCall(`/telegram/accounts/${account.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              api_id: apiId,
              api_hash: apiHash !== '***CONFIGURED***' ? apiHash : undefined,
              phone_number: phoneNumber,
              is_active: true
            })
          })
          
          if (response.success) {
            await refreshConfigs()
          }
        } else {
          // Criar nova conta
          const requestData: any = {
            api_id: apiId,
            phone_number: phoneNumber
          }
          
          if (apiHash !== '***CONFIGURED***') {
            requestData.api_hash = apiHash
          }
          
          const response = await apiCall('/telegram/accounts', {
            method: 'POST',
            body: JSON.stringify(requestData)
          })
          
          if (response.success) {
            await refreshConfigs()
            const accResp = await apiCall('/telegram/accounts')
            if (accResp.success && accResp.accounts?.length) {
              await authenticateAccount(accResp.accounts[0])
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const confirmMessage = apiType === 'bot' 
      ? 'Tem certeza que deseja deletar o bot? Esta ação não pode ser desfeita.'
      : 'Tem certeza que deseja deletar a conta? Esta ação não pode ser desfeita.'
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setSaving(true)
      let response
      
      if (apiType === 'bot' && bot) {
        response = await apiCall(`/telegram/bots/${bot.id}`, {
          method: 'DELETE'
        })
      } else if (apiType === 'account' && account) {
        response = await apiCall(`/telegram/accounts/${account.id}`, {
          method: 'DELETE'
        })
      }
      
      if (response?.success) {
        await refreshConfigs()
      }
    } catch (error) {
      console.error('Erro ao deletar configuração:', error)
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
                  Configure your Telegram integration using Bot API or Account API
                </p>
              </div>
            </div>

            {/* API Type Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Integration Type</CardTitle>
                <CardDescription>
                  Select how you want to integrate with Telegram
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      apiType === 'bot' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setApiType('bot')}
                  >
                    <div className="flex items-center space-x-3">
                      <Bot className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">Bot API</h3>
                        <p className="text-sm text-gray-600">
                          Create a bot that can receive and send messages
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      apiType === 'account' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setApiType('account')}
                  >
                    <div className="flex items-center space-x-3">
                      <User className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">Account API</h3>
                        <p className="text-sm text-gray-600">
                          Use your personal Telegram account to send messages
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6">
              {/* Status Cards */}
              {apiType === 'bot' && bot && (
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

              {apiType === 'account' && account && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Account Status
                    </CardTitle>
                    <CardDescription>
                      Information about your Telegram account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      {(() => {
                        if (setupStatus && !account.is_active) {
                          return (
                            <>
                              <AlertCircle className="w-5 h-5 text-orange-500" />
                              <span className="font-medium text-orange-700">
                                {setupStatus === 'awaiting_sms' ? 'Awaiting SMS code' : '2FA required'}
                              </span>
                            </>
                          )
                        }
                        if (account.is_active && account.is_online === false) {
                          return (
                            <>
                              <AlertCircle className="w-5 h-5 text-red-500" />
                              <span className="font-medium text-red-700">API not running, authenticate</span>
                            </>
                          )
                        }
                        return (
                          <>
                            {account.is_active ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className={`font-medium ${account.is_active ? 'text-green-700' : 'text-red-700'}`}>
                              {account.is_active ? 'Account Active' : 'Account Inactive'}
                            </span>
                          </>
                        )
                      })()}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><strong>Phone:</strong> {account.phone_number}</div>
                      <div><strong>API ID:</strong> {account.api_id}</div>
                      <div><strong>Created:</strong> {new Date(account.created_at).toLocaleDateString('en-US')}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Configuration Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    {apiType === 'bot' 
                      ? (bot ? 'Edit Bot' : 'Configure Bot')
                      : (account ? 'Edit Account' : 'Configure Account')
                    }
                  </CardTitle>
                  <CardDescription>
                    {apiType === 'bot' 
                      ? (bot 
                          ? 'Update your Telegram bot settings'
                          : 'Configure a new Telegram bot to start receiving messages'
                        )
                      : (account 
                          ? 'Update your Telegram account settings'
                          : 'Configure your Telegram account to send messages'
                        )
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {apiType === 'bot' ? (
                    // Bot API Configuration
                    <>
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
                        
                        {botToken && botToken.length > 10 && !validatingToken && !tokenValidated && botToken !== '***CONFIGURED***' && (
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
                    </>
                  ) : (
                    // Account API Configuration
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="apiId">API ID</Label>
                          <Input
                            id="apiId"
                            placeholder="api id"
                            value={apiId}
                            onChange={(e) => setApiId(e.target.value)}
                            disabled={!!(apiId && account)}
                          />
                          <p className="text-sm text-muted-foreground">
                            Get your API ID from <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">my.telegram.org</a>
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber">Phone Number</Label>
                          <Input
                            id="phoneNumber"
                            placeholder="+1234567890"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            disabled={!!(phoneNumber && account)}
                          />
                          <p className="text-sm text-muted-foreground">
                            Your Telegram phone number with country code
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 md:w-1/2">
                        <Label htmlFor="apiHash">API Hash</Label>
                        <div className="relative">
                          <Input
                            id="apiHash"
                            type={showApiHash ? "text" : "password"}
                            placeholder="api hash"
                            value={apiHash}
                            onChange={(e) => setApiHash(e.target.value)}
                            disabled={apiHash === '***CONFIGURED***'}
                            className={apiHash === '***CONFIGURED***' ? 'bg-green-50 border-green-200' : ''}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowApiHash(!showApiHash)}
                          >
                            {showApiHash ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {apiHash === '***CONFIGURED***' ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              API Hash is configured and account is active
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setApiHash('')
                                setAccountValidated(false)
                              }}
                              className="text-xs"
                            >
                              Change API Hash
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Get your API Hash from <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">my.telegram.org</a>
                          </p>
                        )}
                        
                        {/* Status da validação da conta */}
                        {validatingAccount && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            Validating credentials...
                          </div>
                        )}
                        
                        {accountValidated && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Credentials valid! Account ready to use.
                          </div>
                        )}
                        
                        {apiId && apiHash && apiHash !== '***CONFIGURED***' && !validatingAccount && !accountValidated && apiId.length > 0 && apiHash.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            Invalid credentials. Please check your API ID and Hash.
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSave} 
                      disabled={
                        saving || 
                        (apiType === 'bot' && (!tokenValidated || !botName || !botUsername || !botToken)) ||
                        (apiType === 'account' && (!accountValidated || !apiId || !apiHash || !phoneNumber))
                      }
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : (
                        apiType === 'bot' 
                          ? (bot ? 'Update Bot' : 'Create Bot')
                          : (account ? 'Update Account' : 'Create Account')
                      )}
                    </Button>
                    
                    {((apiType === 'bot' && bot) || (apiType === 'account' && account)) && (
                      <Button 
                        variant="destructive" 
                        onClick={handleDelete}
                        disabled={saving}
                        className="cursor-pointer"
                      >
                        Delete {apiType === 'bot' ? 'Bot' : 'Account'}
                      </Button>
                    )}
                    
                    {/* Botão de autenticação para contas */}
                    {apiType === 'account' && account && (
                      <Button 
                        variant="outline" 
                        onClick={() => authenticateAccount()}
                        disabled={authenticating}
                        className="cursor-pointer"
                      >
                        {authenticating ? 'Authenticating...' : 'Authenticate Account'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SMS Dialog */}
              <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>SMS Authentication</DialogTitle>
                    <DialogDescription>Enter the SMS code sent to telegram account</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      placeholder="Enter SMS code"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      disabled={authenticating}
                    />
                    {authFeedback && (
                      <div className="flex items-center gap-2 text-sm">
                        {authenticating && (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>)}
                        <span className="text-gray-600">{authFeedback}</span>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={verifySmsCode} disabled={!smsCode || authenticating} className="cursor-pointer">
                      {authenticating ? 'Verifying...' : 'Verify Code'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowSmsDialog(false)} disabled={authenticating}>Cancel</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* 2FA Dialog */}
              <Dialog open={showTwoFactorDialog} onOpenChange={(open)=>{setShowTwoFactorDialog(open); if(!open){setTwoFactorPassword(''); setTwoFactorAttempts(0); setAuthFeedback('')}}}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Two Factor Authentication</DialogTitle>
                    <DialogDescription>Your Telegram account has 2FA enabled. Enter your 2FA password to continue.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      type="password"
                      placeholder="Enter your 2FA password"
                      value={twoFactorPassword}
                      onChange={(e) => setTwoFactorPassword(e.target.value)}
                      disabled={authenticating}
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="rememberTwoFactor"
                        checked={rememberTwoFactor}
                        onChange={(e) => setRememberTwoFactor(e.target.checked)}
                        disabled={authenticating}
                        className="rounded"
                      />
                      <Label htmlFor="rememberTwoFactor" className="text-sm">Remember 2FA password for future authentications</Label>
                    </div>
                    {authFeedback && (
                      <div className="flex items-center gap-2 text-sm">
                        {authenticating && (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>)}
                        <span className={twoFactorAttempts>=3 ? 'text-red-600' : 'text-gray-600'}>{authFeedback}</span>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={verifySmsCode} disabled={!twoFactorPassword || authenticating} className="cursor-pointer">
                      {authenticating ? 'Verifying...' : 'Verify 2FA'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowTwoFactorDialog(false)} disabled={authenticating}>Cancel</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {apiType === 'bot' 
                      ? 'How to configure your bot'
                      : 'How to configure your account'
                    }
                  </CardTitle>
                  <CardDescription>
                    {apiType === 'bot' 
                      ? 'Follow these steps to configure your Telegram bot'
                      : 'Follow these steps to configure your Telegram account'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {apiType === 'bot' ? (
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
                  ) : (
                    <ol className="space-y-3 text-sm">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                        <div>
                          <strong>Visit</strong> <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">my.telegram.org/apps</a>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                        <div>
                          <strong>Log in</strong> with your Telegram account
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                        <div>
                          <strong>Create a new application</strong> and fill in the required fields
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                        <div>
                          <strong>Copy your API ID and API Hash</strong> from the application details
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">5</span>
                        <div>
                          <strong>Enter your phone number</strong> with country code (e.g., +1234567890)
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">✓</span>
                        <div>
                          <strong>Account will be configured</strong> and ready to send messages
                        </div>
                      </li>
                    </ol>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
