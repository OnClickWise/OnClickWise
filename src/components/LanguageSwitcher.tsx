'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useCallback, useState } from 'react'
import { Globe, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full'
}

export function LanguageSwitcher({ variant = 'compact' }: LanguageSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  // Função para obter identificador único e persistente do usuário (igual ao Telegram)
  const getUserIdentifier = useCallback(() => {
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
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  const switchLanguage = (newLocale: 'pt-BR' | 'en-US') => {
    // Salva no localStorage específico do usuário (como pin to top do Telegram)
    const userId = getUserIdentifier()
    
    if (userId) {
      const localeKey = `user_locale_${userId}`
      
      // Salva no localStorage
      localStorage.setItem(localeKey, newLocale)
      
      // Dispara evento customizado para o ClientLocaleProvider atualizar
      const event = new CustomEvent('localeChange', { detail: { locale: newLocale } })
      window.dispatchEvent(event)
      
      // NÃO recarrega mais! O provider atualiza automaticamente
    }
  }

  const languages = [
    { 
      code: 'pt-BR', 
      name: 'Português', 
      flag: '🇧🇷',
      description: 'Portuguese (Brazil)'
    },
    { 
      code: 'en-US', 
      name: 'English', 
      flag: '🇺🇸',
      description: 'English (United States)'
    },
    // Idiomas futuros (descomente quando implementar):
    // { 
    //   code: 'es-ES', 
    //   name: 'Español', 
    //   flag: '🇪🇸',
    //   description: 'Spanish (Spain)'
    // },
    // { 
    //   code: 'fr-FR', 
    //   name: 'Français', 
    //   flag: '🇫🇷',
    //   description: 'French (France)'
    // },
    // { 
    //   code: 'de-DE', 
    //   name: 'Deutsch', 
    //   flag: '🇩🇪',
    //   description: 'German (Germany)'
    // },
    // { 
    //   code: 'it-IT', 
    //   name: 'Italiano', 
    //   flag: '🇮🇹',
    //   description: 'Italian (Italy)'
    // },
    // { 
    //   code: 'ja-JP', 
    //   name: '日本語', 
    //   flag: '🇯🇵',
    //   description: 'Japanese (Japan)'
    // },
    // { 
    //   code: 'zh-CN', 
    //   name: '中文', 
    //   flag: '🇨🇳',
    //   description: 'Chinese (Simplified)'
    // },
  ]

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  // Versão compacta (para headers, sidebars, etc)
  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
            <span className="sm:hidden">{currentLanguage.flag}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => switchLanguage(lang.code as 'pt-BR' | 'en-US')}
              className={locale === lang.code ? 'bg-accent' : ''}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
              {locale === lang.code && (
                <Check className="ml-auto w-4 h-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Versão completa (para páginas de settings)
  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {languages.map((lang) => {
        const isActive = locale === lang.code
        return (
          <button
            key={lang.code}
            onClick={() => switchLanguage(lang.code as 'pt-BR' | 'en-US')}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg border transition-all
              ${isActive 
                ? 'border-primary bg-primary/5 shadow-sm' 
                : 'border-border hover:border-primary/30 hover:bg-accent'
              }
            `}
          >
            <div className="text-2xl">{lang.flag}</div>
            <div className="flex-1 text-left">
              <div className="font-medium text-sm">{lang.name}</div>
              <div className="text-xs text-muted-foreground">{lang.description}</div>
            </div>
            {isActive && (
              <div className="bg-primary text-primary-foreground rounded-full p-1">
                <Check className="w-3 h-3" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

