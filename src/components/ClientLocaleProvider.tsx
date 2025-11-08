'use client'

import { useState, useEffect } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import enUS from '../../messages/en-US.json'
import ptBR from '../../messages/pt-BR.json'

const messages = {
  'en-US': enUS,
  'pt-BR': ptBR,
}

interface ClientLocaleProviderProps {
  children: React.ReactNode
  defaultLocale: string
}

/**
 * Provider client-side que carrega as mensagens corretas do idioma do usuário
 * Baseado APENAS no localStorage (isolado por usuário)
 * SEM cookies, SEM middleware, SEM reload
 */
export function ClientLocaleProvider({ children, defaultLocale }: ClientLocaleProviderProps) {
  const [locale, setLocale] = useState<'pt-BR' | 'en-US'>(defaultLocale as 'pt-BR' | 'en-US')
  const [isClient, setIsClient] = useState(false)
  const [userToken, setUserToken] = useState<string | null>(null)

  // Monitora mudanças no token (login/logout)
  useEffect(() => {
    setIsClient(true)
    
    // Lê token inicial
    const token = localStorage.getItem('token')
    setUserToken(token)
    
    // Listener para mudanças no localStorage (login/logout em outra aba OU na mesma)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'organization' || e.key === null) {
        const newToken = localStorage.getItem('token')
        setUserToken(newToken)
      }
    }
    
    // Listener customizado para login na MESMA aba (StorageEvent não dispara na mesma aba)
    const handleLoginEvent = () => {
      const newToken = localStorage.getItem('token')
      setUserToken(newToken)
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userLoggedIn', handleLoginEvent)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userLoggedIn', handleLoginEvent)
    }
  }, [])

  useEffect(() => {
    // Função para obter identificador único do usuário
    const getUserIdentifier = () => {
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
        const identifier = `${organization.id}_${userEmail}`.replace(/[^a-zA-Z0-9_-]/g, '_')
        
        return identifier
      } catch (error) {
        console.error('Error getting user identifier:', error)
        return null
      }
    }

    const userId = getUserIdentifier()
    
    if (userId) {
      const localeKey = `user_locale_${userId}`
      const savedLocale = localStorage.getItem(localeKey)
      
      if (savedLocale && (savedLocale === 'pt-BR' || savedLocale === 'en-US')) {
        setLocale(savedLocale)
      } else {
        // Se não existe, salva o padrão
        localStorage.setItem(localeKey, defaultLocale)
      }
    }

    // Listener para mudanças de idioma (quando usuário troca)
    const handleLocaleChange = (event: CustomEvent) => {
      const newLocale = event.detail.locale
      if (newLocale === 'pt-BR' || newLocale === 'en-US') {
        setLocale(newLocale)
      }
    }

    window.addEventListener('localeChange', handleLocaleChange as EventListener)
    
    return () => {
      window.removeEventListener('localeChange', handleLocaleChange as EventListener)
    }
  }, [defaultLocale, userToken]) // Re-executa quando token muda!

  // Enquanto não carrega no cliente, usa o locale padrão
  if (!isClient) {
    return (
      <NextIntlClientProvider 
        locale={defaultLocale} 
        messages={messages[defaultLocale as 'pt-BR' | 'en-US']}
        timeZone="America/Sao_Paulo"
      >
        {children}
      </NextIntlClientProvider>
    )
  }

  return (
    <NextIntlClientProvider 
      locale={locale} 
      messages={messages[locale]}
      timeZone="America/Sao_Paulo"
    >
      {children}
    </NextIntlClientProvider>
  )
}

