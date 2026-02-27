"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
import RoleGuard from "@/components/RoleGuard";
import { useTranslations, useLocale } from 'next-intl'
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
import { useApi } from "@/hooks/useapi";


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
  api_hash: string;
  phone_number: string;
  is_active: boolean;
  is_online?: boolean;
  is_authenticated?: boolean;
  needs_sms_code?: boolean;
  needs_2fa?: boolean;
  created_at: string;
}

export default function TelegramSettingsPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  const { apiCall, isClient } = useApi()
  const t = useTranslations('TelegramSettings')
  const locale = useLocale()
  
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
    setAuthFeedback(t('authFeedback.requestingSms'))
    try {
      const response = await apiCall(`/telegram/accounts/${acc.id}/authenticate`, {
        method: 'POST'
      })
      
      if (response.success) {
        if (response.requiresSmsCode) {
          setShowSmsDialog(true)
          setSetupStatus('awaiting_sms')
          try { localStorage.setItem(setupStatusKey, JSON.stringify('awaiting_sms')) } catch {}
          setAuthFeedback(t('authFeedback.smsSent'))
        } else {
          setSetupStatus(null)
          try { localStorage.removeItem(setupStatusKey) } catch {}
          // Atualizar conta
          const accResp = await apiCall('/telegram/accounts')
          if (accResp.success && accResp.accounts?.length) setAccount(accResp.accounts[0])
        }
      } else {
        alert(`${t('errors.authenticationError')}: ${response.error}`)
      }
    } catch (error) {
      console.error('Erro na autenticação:', error)
      alert(t('errors.authenticationError'))
    } finally {
      setAuthenticating(false)
    }
  }

  // Verificar código SMS
  const verifySmsCode = async () => {
    if (!account || !smsCode) return
    
    setAuthenticating(true)
    setAuthFeedback(twoFactorPassword ? t('authFeedback.verifying2FA') : t('authFeedback.verifyingSms'))
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
          setAuthFeedback(t('authFeedback.twoFactorRequired'))
        } else {
          if (twoFactorPassword) {
            const next = twoFactorAttempts + 1
            setTwoFactorAttempts(next)
            setAuthFeedback(next >= 3 ? t('authFeedback.wrong2FAPassword') : t('authFeedback.invalid2FAPassword'))
          } else {
            const nextSms = smsAttempts + 1
            setSmsAttempts(nextSms)
            setAuthFeedback(nextSms >= 2 ? t('authFeedback.invalidSmsCodeRetry') : t('authFeedback.invalidSmsCode'))
          }
        }
      }
    } catch (error) {
      console.error('Erro na verificação:', error)
      setAuthFeedback(t('authFeedback.networkError'))
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
      ? t('botConfig.deleteConfirm')
      : t('accountConfig.deleteConfirm')
    
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
    <RoleGuard allowedRoles={["admin", "master"]} orgSlug={org}>
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
                  <BreadcrumbLink href={`/${org}/settings`} className="text-sm sm:text-base">
                    {t('breadcrumb.settings')}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm sm:text-base">{t('breadcrumb.telegram')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* MAIN CONTENT */}
          <div className="flex-1 space-y-2 sm:space-y-4 p-2 sm:p-4 pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{t('pageTitle')}</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t('pageDescription')}
                </p>
              </div>
            </div>

            {/* API Type Selector */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-base sm:text-lg">{t('integrationTypeTitle')}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t('integrationTypeDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                  <div 
                    className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      apiType === 'bot' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setApiType('bot')}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold">{t('botApi.title')}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {t('botApi.description')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      apiType === 'account' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setApiType('account')}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold">{t('accountApi.title')}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {t('accountApi.description')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:gap-6">
              {/* Status Cards */}
              {apiType === 'bot' && bot && (
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                      {t('botStatus.title')}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {t('botStatus.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      {(() => {
                        // Bot inativo
                        if (!bot.is_active) {
                          return (
                            <>
                              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                              <span className="text-sm sm:text-base font-medium text-red-700">
                                {t('botStatus.inactive')}
                              </span>
                            </>
                          )
                        }
                        
                        // Bot ativo mas não online
                        if (bot.is_active && bot.is_online === false) {
                          return (
                            <>
                              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                              <span className="text-sm sm:text-base font-medium text-yellow-700">
                                {t('botStatus.notOnline')}
                              </span>
                            </>
                          )
                        }
                        
                        // Bot ativo e online
                        return (
                          <>
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                            <span className="text-sm sm:text-base font-medium text-green-700">
                              {t('botStatus.active')}
                            </span>
                          </>
                        )
                      })()}
                    </div>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div><strong>{t('botStatus.name')}:</strong> {bot.bot_name}</div>
                      <div><strong>{t('botStatus.username')}:</strong> @{bot.bot_username}</div>
                      <div><strong>{t('botStatus.created')}:</strong> {new Date(bot.created_at).toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US')}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {apiType === 'account' && account && (
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      {t('accountStatus.title')}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {t('accountStatus.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      {(() => {
                        // Prioridade 1: Status de setup pendente (SMS ou 2FA)
                        if (setupStatus) {
                          if (setupStatus === 'awaiting_sms') {
                            return (
                              <>
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                                <span className="text-sm sm:text-base font-medium text-orange-700">
                                  {t('accountStatus.awaitingSms')}
                                </span>
                              </>
                            )
                          }
                          if (setupStatus === '2fa_required') {
                            return (
                              <>
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                                <span className="text-sm sm:text-base font-medium text-orange-700">
                                  {t('accountStatus.twoFaRequired')}
                                </span>
                              </>
                            )
                          }
                        }
                        
                        // Prioridade 2: Verificar se a conta não está autenticada
                        if (!account.is_authenticated) {
                          if (account.needs_sms_code) {
                            return (
                              <>
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                                <span className="text-sm sm:text-base font-medium text-red-700">
                                  {t('accountStatus.needsAuthenticationSms')}
                                </span>
                              </>
                            )
                          }
                          if (account.needs_2fa) {
                            return (
                              <>
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                                <span className="text-sm sm:text-base font-medium text-red-700">
                                  {t('accountStatus.needsAuthentication2FA')}
                                </span>
                              </>
                            )
                          }
                          // Não autenticado, mas sem informação específica
                          return (
                            <>
                              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                              <span className="text-sm sm:text-base font-medium text-red-700">
                                {t('accountStatus.needsAuthentication')}
                              </span>
                            </>
                          )
                        }
                        
                        // Prioridade 3: Verificar se está online
                        if (account.is_active && account.is_online === false) {
                          return (
                            <>
                              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                              <span className="text-sm sm:text-base font-medium text-yellow-700">
                                {t('accountStatus.notOnline')}
                              </span>
                            </>
                          )
                        }
                        
                        // Prioridade 4: Status normal (ativo/inativo)
                        if (account.is_active && account.is_authenticated) {
                          return (
                            <>
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                              <span className="text-sm sm:text-base font-medium text-green-700">
                                {t('accountStatus.active')}
                              </span>
                            </>
                          )
                        }
                        
                        // Conta inativa
                        return (
                          <>
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                            <span className="text-sm sm:text-base font-medium text-red-700">
                              {t('accountStatus.inactive')}
                            </span>
                          </>
                        )
                      })()}
                    </div>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div><strong>{t('accountStatus.phone')}:</strong> {account.phone_number}</div>
                      <div><strong>{t('accountStatus.apiId')}:</strong> {account.api_id}</div>
                      <div><strong>{t('accountStatus.created')}:</strong> {new Date(account.created_at).toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US')}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Configuration Form */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                    {apiType === 'bot' 
                      ? (bot ? t('botConfig.editTitle') : t('botConfig.configureTitle'))
                      : (account ? t('accountConfig.editTitle') : t('accountConfig.configureTitle'))
                    }
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {apiType === 'bot' 
                      ? (bot 
                          ? t('botConfig.editDescription')
                          : t('botConfig.configureDescription')
                        )
                      : (account 
                          ? t('accountConfig.editDescription')
                          : t('accountConfig.configureDescription')
                        )
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                  {apiType === 'bot' ? (
                    // Bot API Configuration
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="botToken" className="text-sm sm:text-base">{t('botConfig.tokenLabel')}</Label>
                        <div className="relative">
                          <Input
                            id="botToken"
                            type={showToken ? "text" : "password"}
                            placeholder={t('botConfig.tokenPlaceholder')}
                            value={botToken}
                            onChange={(e) => setBotToken(e.target.value)}
                            disabled={botToken === '***CONFIGURED***'}
                            className={`text-sm sm:text-base ${botToken === '***CONFIGURED***' ? 'bg-green-50 border-green-200' : ''}`}
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
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              {t('botConfig.tokenConfigured')}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setBotToken('')
                                setTokenValidated(false)
                              }}
                              className="text-xs h-7 sm:h-9"
                            >
                              {t('botConfig.changeToken')}
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {t('botConfig.getTokenFrom')} <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@BotFather</a>
                          </p>
                        )}
                        
                        {/* Status da validação do token */}
                        {validatingToken && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600"></div>
                            {t('botConfig.validatingToken')}
                          </div>
                        )}
                        
                        {tokenValidated && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            {t('botConfig.tokenValid')}
                          </div>
                        )}
                        
                        {botToken && botToken.length > 10 && !validatingToken && !tokenValidated && botToken !== '***CONFIGURED***' && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600">
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            {t('botConfig.invalidToken')}
                          </div>
                        )}
                      </div>

                      {/* Campos do bot - só aparecem após validação do token */}
                      {tokenValidated && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="botName" className="text-sm sm:text-base">{t('botConfig.nameLabel')}</Label>
                            <Input
                              id="botName"
                              placeholder={t('botConfig.namePlaceholder')}
                              value={botName}
                              onChange={(e) => setBotName(e.target.value)}
                              className="text-sm sm:text-base"
                            />
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {t('botConfig.nameAutoFilled')}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="botUsername" className="text-sm sm:text-base">{t('botConfig.usernameLabel')}</Label>
                            <Input
                              id="botUsername"
                              placeholder={t('botConfig.usernamePlaceholder')}
                              value={botUsername}
                              onChange={(e) => setBotUsername(e.target.value)}
                              className="text-sm sm:text-base"
                            />
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {t('botConfig.usernameAutoFilled')}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Account API Configuration
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="apiId" className="text-sm sm:text-base">{t('accountConfig.apiIdLabel')}</Label>
                          <Input
                            id="apiId"
                            placeholder={t('accountConfig.apiIdPlaceholder')}
                            value={apiId}
                            onChange={(e) => setApiId(e.target.value)}
                            disabled={!!(apiId && account)}
                            className="text-sm sm:text-base"
                          />
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {t('accountConfig.apiIdInfo')} <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">my.telegram.org</a>
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber" className="text-sm sm:text-base">{t('accountConfig.phoneLabel')}</Label>
                          <Input
                            id="phoneNumber"
                            placeholder={t('accountConfig.phonePlaceholder')}
                            value={phoneNumber}
                            onChange={(e) => {
                              const value = e.target.value
                              // Permite apenas números e opcionalmente um + no início
                              if (value.startsWith('+')) {
                                // Se começar com +, mantém apenas + seguido de números
                                const numbers = value.slice(1).replace(/\D/g, '')
                                setPhoneNumber('+' + numbers)
                              } else {
                                // Se não começar com +, permite apenas números
                                setPhoneNumber(value.replace(/\D/g, ''))
                              }
                            }}
                            disabled={!!(phoneNumber && account)}
                            className="text-sm sm:text-base"
                          />
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {t('accountConfig.phoneInfo')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 w-full md:w-1/2">
                        <Label htmlFor="apiHash" className="text-sm sm:text-base">{t('accountConfig.apiHashLabel')}</Label>
                        <div className="relative">
                          <Input
                            id="apiHash"
                            type={showApiHash ? "text" : "password"}
                            placeholder={t('accountConfig.apiHashPlaceholder')}
                            value={apiHash}
                            onChange={(e) => setApiHash(e.target.value)}
                            disabled={apiHash === '***CONFIGURED***'}
                            className={`text-sm sm:text-base ${apiHash === '***CONFIGURED***' ? 'bg-green-50 border-green-200' : ''}`}
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
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              {t('accountConfig.apiHashConfigured')}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setApiHash('')
                                setAccountValidated(false)
                              }}
                              className="text-xs h-7 sm:h-9"
                            >
                              {t('accountConfig.changeApiHash')}
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {t('accountConfig.apiHashInfo')} <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">my.telegram.org</a>
                          </p>
                        )}
                        
                        {/* Status da validação da conta */}
                        {validatingAccount && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600"></div>
                            {t('botConfig.validatingToken')}
                          </div>
                        )}
                        
                        {accountValidated && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            {t('botConfig.tokenValid')}
                          </div>
                        )}
                        
                        {apiId && apiHash && apiHash !== '***CONFIGURED***' && !validatingAccount && !accountValidated && apiId.length > 0 && apiHash.length > 0 && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600">
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            {t('accountConfig.invalidCredentials')}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={handleSave} 
                      disabled={
                        saving || 
                        (apiType === 'bot' && (!tokenValidated || !botName || !botUsername || !botToken)) ||
                        (apiType === 'account' && (!accountValidated || !apiId || !apiHash || !phoneNumber))
                      }
                      className="flex items-center gap-2 cursor-pointer w-full sm:w-auto"
                    >
                      <Save className="w-4 h-4" />
                      <span className="text-sm sm:text-base">
                        {saving ? t('saving') : (
                          apiType === 'bot' 
                            ? (bot ? t('botConfig.updateButton') : t('botConfig.createButton'))
                            : (account ? t('accountConfig.updateButton') : t('accountConfig.createButton'))
                        )}
                      </span>
                    </Button>
                    
                    {((apiType === 'bot' && bot) || (apiType === 'account' && account)) && (
                      <Button 
                        variant="destructive" 
                        onClick={handleDelete}
                        disabled={saving}
                        className="cursor-pointer w-full sm:w-auto text-sm sm:text-base"
                      >
                        {apiType === 'bot' ? t('botConfig.deleteButton') : t('accountConfig.deleteButton')}
                      </Button>
                    )}
                    
                    {/* Botão de autenticação para contas */}
                    {apiType === 'account' && account && (
                      <Button 
                        variant="outline" 
                        onClick={() => authenticateAccount()}
                        disabled={authenticating}
                        className="cursor-pointer w-full sm:w-auto text-sm sm:text-base"
                      >
                        {authenticating ? t('accountConfig.authenticating') : t('accountConfig.reAuthenticateButton')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SMS Dialog */}
              <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
                <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-lg p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">{t('smsModal.title')}</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">{t('smsModal.description')}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      placeholder={t('smsModal.codePlaceholder')}
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      disabled={authenticating}
                      className="text-sm sm:text-base"
                    />
                    {authFeedback && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        {authenticating && (<div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600"></div>)}
                        <span className="text-gray-600">{authFeedback}</span>
                      </div>
                    )}
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button onClick={verifySmsCode} disabled={!smsCode || authenticating} className="cursor-pointer w-full sm:w-auto text-sm sm:text-base">
                      {authenticating ? t('smsModal.verifying') : t('smsModal.verifyButton')}
                    </Button>
                    <Button variant="outline" onClick={() => setShowSmsDialog(false)} disabled={authenticating} className="w-full sm:w-auto text-sm sm:text-base">{t('smsModal.cancelButton')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* 2FA Dialog */}
              <Dialog open={showTwoFactorDialog} onOpenChange={(open)=>{setShowTwoFactorDialog(open); if(!open){setTwoFactorPassword(''); setTwoFactorAttempts(0); setAuthFeedback('')}}}>
                <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-lg p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">{t('twoFaModal.title')}</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">{t('twoFaModal.description')}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      type="password"
                      placeholder={t('twoFaModal.passwordPlaceholder')}
                      value={twoFactorPassword}
                      onChange={(e) => setTwoFactorPassword(e.target.value)}
                      disabled={authenticating}
                      className="text-sm sm:text-base"
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
                      <Label htmlFor="rememberTwoFactor" className="text-xs sm:text-sm">{t('twoFaModal.rememberLabel')}</Label>
                    </div>
                    {authFeedback && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        {authenticating && (<div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600"></div>)}
                        <span className={twoFactorAttempts>=3 ? 'text-red-600' : 'text-gray-600'}>{authFeedback}</span>
                      </div>
                    )}
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button onClick={verifySmsCode} disabled={!twoFactorPassword || authenticating} className="cursor-pointer w-full sm:w-auto text-sm sm:text-base">
                      {authenticating ? t('twoFaModal.verifying') : t('twoFaModal.verifyButton')}
                    </Button>
                    <Button variant="outline" onClick={() => setShowTwoFactorDialog(false)} disabled={authenticating} className="w-full sm:w-auto text-sm sm:text-base">{t('twoFaModal.cancelButton')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {apiType === 'bot' 
                      ? t('instructions.bot.title')
                      : t('instructions.account.title')
                    }
                  </CardTitle>
                  <CardDescription>
                    {apiType === 'bot' 
                      ? t('instructions.bot.description')
                      : t('instructions.account.description')
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {apiType === 'bot' ? (
                    <ol className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      <li className="flex gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium">1</span>
                        <div className="min-w-0">
                          <strong>{t('instructions.bot.step1')} <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@BotFather</a></strong> {t('instructions.bot.step1Detail')}
                        </div>
                      </li>
                      <li className="flex gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium">2</span>
                        <div className="min-w-0">
                          <strong>{t('instructions.bot.step2')}</strong> {t('instructions.bot.step2Detail')}
                        </div>
                      </li>
                      <li className="flex gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium">3</span>
                        <div className="min-w-0">
                          <strong>{t('instructions.bot.step3')}</strong> {t('instructions.bot.step3Detail')}
                        </div>
                      </li>
                      <li className="flex gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium">4</span>
                        <div className="min-w-0">
                          <strong>{t('instructions.bot.step4')}</strong> {t('instructions.bot.step4Detail')}
                        </div>
                      </li>
                      <li className="flex gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium">5</span>
                        <div className="min-w-0">
                          <strong>{t('instructions.bot.step5')}</strong> {t('instructions.bot.step5Detail')}
                        </div>
                      </li>
                      <li className="flex gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium">✓</span>
                        <div className="min-w-0">
                          <strong>{t('instructions.bot.step6')}</strong> {t('instructions.bot.step6Detail')}
                        </div>
                      </li>
                    </ol>
                  ) : (
                    <ol className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      <li className="flex gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium">1</span>
                        <div className="min-w-0">
                          <strong>{t('instructions.account.step1')}</strong> <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">my.telegram.org/apps</a>
                        </div>
                      </li>
                      <li className="flex gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium">2</span>
                        <div className="min-w-0">
                          <strong>{t('instructions.account.step2')}</strong> {t('instructions.account.step2Detail')}
                        </div>
                      </li>
                      <li className="flex gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium">3</span>
                        <div className="min-w-0">
                          <strong>{t('instructions.account.step3')}</strong> {t('instructions.account.step3Detail')}
                        </div>
                      </li>
                      <li className="flex gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium">4</span>
                        <div className="min-w-0">
                          <strong>{t('instructions.account.step4')}</strong> {t('instructions.account.step4Detail')}
                        </div>
                      </li>
                      <li className="flex gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium">5</span>
                        <div className="min-w-0">
                          <strong>{t('instructions.account.step5')}</strong> {t('instructions.account.step5Detail')}
                        </div>
                      </li>
                      <li className="flex gap-2 sm:gap-3">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium">✓</span>
                        <div className="min-w-0">
                          <strong>{t('instructions.account.step6')}</strong> {t('instructions.account.step6Detail')}
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
    </RoleGuard>
  )
}
