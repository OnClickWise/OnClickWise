import { getRequestConfig } from 'next-intl/server'
import { defaultLocale } from '../i18n'

export default getRequestConfig(async () => {
  // Server sempre usa locale padrão
  // Client-side carregará mensagens corretas via ClientLocaleProvider
  const locale = defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'America/Sao_Paulo', // Configuração de timezone para evitar inconsistências
  }
})

