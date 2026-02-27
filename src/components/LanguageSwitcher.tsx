'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Globe, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { locales, RouteLocale } from '@/i18n/i18n'

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full'
}

const languages = [
  { code: 'pt', name: 'Português', flag: '🇧🇷', description: 'Portuguese (Brazil)' },
  { code: 'en', name: 'English', flag: '🇺🇸', description: 'English' },
  { code: 'es', name: 'Español', flag: '🇪🇸', description: 'Spanish' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', description: 'French' }
] as const

export function LanguageSwitcher({ variant = 'compact' }: LanguageSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLanguage(newLocale: RouteLocale) {
    if (!pathname) return

    const segments = pathname.split('/')

    // Substitui o primeiro segmento (locale)
    segments[1] = newLocale

    router.replace(segments.join('/'))
  }

  const currentLanguage =
    languages.find(lang => lang.code === locale) || languages[0]

  // 🔹 Versão compacta
  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">
              {currentLanguage.flag} {currentLanguage.name}
            </span>
            <span className="sm:hidden">{currentLanguage.flag}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => switchLanguage(lang.code as RouteLocale)}
              className={`cursor-pointer ${
                locale === lang.code ? 'bg-accent' : ''
              }`}
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

  // 🔹 Versão full
  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {languages.map((lang) => {
        const isActive = locale === lang.code

        return (
          <button
            key={lang.code}
            onClick={() => switchLanguage(lang.code as RouteLocale)}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg border transition-all
              ${
                isActive
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/30 hover:bg-accent'
              }
            `}
          >
            <div className="text-2xl">{lang.flag}</div>

            <div className="flex-1 text-left">
              <div className="font-medium text-sm">{lang.name}</div>
              <div className="text-xs text-muted-foreground">
                {lang.description}
              </div>
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