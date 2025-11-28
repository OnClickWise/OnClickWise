import { LandingPage, Section, LandingPageElement, ColorPalette } from "@/types/landing-page"

function createId() {
  return Math.random().toString(36).slice(2, 10)
}

function createElement<T extends LandingPageElement>(element: T): T {
  return { ...element, id: element.id || createId() }
}

// Helper functions for responsive values
function responsivePadding(mobile: string, desktop: string): string {
  return `clamp(${mobile}, 5vw, ${desktop})`
}

function responsiveFontSize(mobile: string, desktop: string): string {
  return `clamp(${mobile}, 4vw, ${desktop})`
}

function responsiveSpacing(mobile: string, desktop: string): string {
  return `clamp(${mobile}, 3vw, ${desktop})`
}

// Type for preset translations
type PresetTranslations = {
  [key: string]: any
}

export function createDefaultPage(): LandingPage {
  const now = new Date().toISOString()
  
  return {
    id: createId(),
    name: "New Landing Page",
    sections: [], // Página em branco por padrão
    theme: {
      colorPalette: {
        primary: "#3b82f6",
        secondary: "#eab308",
        background: "#ffffff",
        text: "#000000",
      },
      fontFamily: 'inter',
      globalSpacing: {
        padding: '1rem',
        margin: '0',
      },
    },
    createdAt: now,
    updatedAt: now,
  }
}

export function createPresetPage(
  presetName: string, 
  translations?: PresetTranslations,
  companyInfo?: { companyName?: string; companyLogo?: string }
): LandingPage | null {
  const now = new Date().toISOString()
  const baseId = createId()
  
  // Helper to get translation with fallback
  const t = (path: string, fallback: string = '') => {
    if (!translations) return fallback
    const keys = path.split('.')
    let value: any = translations
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) return fallback
    }
    return value || fallback
  }

  // Helper to get theme-aware color (will be applied dynamically)
  // Returns a special marker that will be replaced by theme colors at render time
  const themeColor = (type: 'primary' | 'secondary' | 'background' | 'text' | 'accent') => {
    return `var(--theme-${type})`
  }

  // Helper to get company name or default
  const getCompanyName = () => {
    return companyInfo?.companyName || t('LandingPagePresets.modern-saas.header.logo', 'SaaSPro')
  }

  // Helper to create professional header with logo and company name
  const createProfessionalHeader = (includeCTA: boolean = false, formId?: string) => {
    const headerElements = []
    
    // Logo/Company Name Container
    if (companyInfo?.companyLogo) {
      headerElements.push(
        createElement({
          id: createId(),
          type: 'image',
          src: companyInfo.companyLogo,
          alt: getCompanyName(),
          styles: {
            height: 'clamp(2rem, 5vw, 2.5rem)',
            maxHeight: 'clamp(2rem, 5vw, 2.5rem)',
            width: 'auto',
            objectFit: 'contain',
            margin: '0',
            display: 'block',
          },
        })
      )
    } else {
      headerElements.push(
        createElement({
          id: createId(),
          type: 'title',
          content: getCompanyName(),
          level: 3,
          styles: { 
            fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', 
            fontWeight: '700', 
            margin: '0',
            letterSpacing: '-0.02em',
            color: 'USE_THEME_TEXT'
          },
        })
      )
    }
    
    // Optional CTA button on the right
    if (includeCTA) {
      headerElements.push(
        createElement({
          id: createId(),
          type: 'button',
          text: 'Começar Agora',
          variant: 'primary',
          href: formId ? `#form-${formId}` : undefined,
          styles: {
            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
            padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
            margin: '0 0 0 auto',
            borderRadius: 'clamp(0.375rem, 1vw, 0.5rem)',
            fontWeight: '600',
            display: 'block',
            border: 'none',
          },
        })
      )
    }
    
    return headerElements
  }
  
  // Helper to create footer with company name
  const createProfessionalFooter = () => {
    return [
      createElement({
        id: createId(),
        type: 'paragraph',
        content: `© ${new Date().getFullYear()} ${getCompanyName()}. Todos os direitos reservados.`,
        styles: { 
          textAlign: 'center', 
          color: 'USE_THEME_TEXT',
          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
          margin: '0',
          fontWeight: '400'
        },
      }),
    ]
  }

  switch (presetName) {
    case 'modern-saas': {
      // Preset profissional inspirado em Stripe/Linear/Vercel - SaaS Moderno
      const heroFormId = createId()
      const sections = [
          // Header Minimalista
          {
            id: createId(),
            type: 'header',
            elements: createProfessionalHeader(true, heroFormId),
            styles: { 
              padding: '1rem clamp(1.5rem, 4vw, 3rem)', 
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(12px) saturate(180%)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              position: 'sticky',
              top: 0,
              zIndex: '50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: '100%',
              margin: '0 auto'
            },
          },
          // Hero Section - Minimalista e Profissional
          {
            id: createId(),
            type: 'hero',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.modern-saas.hero.title', 'A Plataforma que Transforma Seu Negócio'),
                level: 1,
                styles: { 
                  fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', 
                  fontWeight: '700', 
                  textAlign: 'center', 
                  margin: '0 auto 1.5rem', 
                  lineHeight: '1.1',
                  letterSpacing: '-0.03em',
                  maxWidth: 'min(100%, 900px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  color: 'USE_THEME_TEXT'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: t('LandingPagePresets.modern-saas.hero.subtitle', 'Gerencie seu negócio de forma inteligente. Mais de 10.000 empresas confiam em nossa plataforma para crescer exponencialmente.'),
                styles: { 
                  fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)', 
                  textAlign: 'center', 
                  color: 'USE_THEME_TEXT',
                  opacity: '0.7',
                  margin: '0 auto 3rem', 
                  maxWidth: 'min(100%, 680px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  lineHeight: '1.6',
                  fontWeight: '400',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                },
              }),
              createElement({
                id: heroFormId,
                type: 'form',
                fields: [
                  { id: createId(), type: 'email', label: 'Email', required: true, placeholder: 'seu@email.com' },
                  { id: createId(), type: 'text', label: 'Nome', required: true, placeholder: 'Seu nome' },
                ],
                submitText: t('LandingPagePresets.modern-saas.hero.ctaPrimary', 'Começar Grátis'),
                styles: { 
                  maxWidth: 'min(100%, 500px)', 
                  margin: '0 auto', 
                  padding: '0 clamp(1rem, 3vw, 2rem)', 
                  wordWrap: 'break-word'
                },
              }),
            ],
            styles: { 
              padding: 'clamp(6rem, 12vw, 10rem) clamp(1rem, 3vw, 2rem) clamp(5rem, 10vw, 8rem)',
              backgroundColor: '#ffffff',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            },
          },
          // Social Proof - Minimalista
          {
            id: createId(),
            type: 'content',
            elements: [
              createElement({
                id: createId(),
                type: 'paragraph',
                content: 'Mais de 10.000 empresas confiam em nós',
                styles: { 
                  textAlign: 'center', 
                  color: 'USE_THEME_TEXT',
                  opacity: '0.6',
                  fontSize: 'clamp(0.8125rem, 1.8vw, 0.9375rem)',
                  fontWeight: '500',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  margin: '0 auto',
                  maxWidth: 'min(100%, 600px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word'
                },
              }),
            ],
            styles: { 
              padding: '3rem clamp(1rem, 3vw, 2rem)', 
              backgroundColor: '#fafafa',
              borderTop: '1px solid rgba(0, 0, 0, 0.05)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              maxWidth: '100%',
              margin: '0 auto',
            },
          },
          // Features Grid - Profissional
          {
            id: createId(),
            type: 'content',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.modern-saas.features.title', 'Tudo que você precisa em um só lugar'),
                level: 2,
                styles: { 
                  textAlign: 'center', 
                  margin: '0 auto 1rem', 
                  fontSize: 'clamp(2rem, 4.5vw, 3rem)', 
                  fontWeight: '600',
                  letterSpacing: '-0.02em',
                  maxWidth: 'min(100%, 800px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  color: 'USE_THEME_TEXT'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: t('LandingPagePresets.modern-saas.features.subtitle', 'Recursos poderosos projetados para impulsionar seu crescimento e otimizar seus processos.'),
                styles: { 
                  textAlign: 'center', 
                  color: 'USE_THEME_TEXT',
                  opacity: '0.7',
                  margin: '0 auto 4rem', 
                  fontSize: 'clamp(1rem, 2.2vw, 1.1875rem)',
                  maxWidth: 'min(100%, 600px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  lineHeight: '1.6',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                },
              }),
              createElement({
                id: createId(),
                type: 'icon-list',
                items: [
                  { id: createId(), text: '⚡ Setup em 5 minutos - Configure tudo rapidamente sem complicações' },
                  { id: createId(), text: '📊 Analytics em tempo real - Acompanhe métricas importantes do seu negócio' },
                  { id: createId(), text: '🔒 Segurança máxima - Dados protegidos com criptografia de nível bancário' },
                  { id: createId(), text: '🤝 Suporte 24/7 - Equipe especializada sempre disponível para ajudar' },
                  { id: createId(), text: '📱 App mobile nativo - Gerencie seu negócio de qualquer lugar, a qualquer hora' },
                  { id: createId(), text: '🔌 Integrações ilimitadas - Conecte com todas as suas ferramentas favoritas' },
                ],
                columns: 3,
                styles: { 
                  padding: '0 clamp(1rem, 3vw, 2rem)', 
                  gap: '2rem',
                  maxWidth: 'min(100%, 1200px)',
                  margin: '0 auto'
                },
              }),
            ],
            styles: { 
              padding: 'clamp(5rem, 10vw, 8rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: '#ffffff',
              maxWidth: '100%', 
              margin: '0 auto',
            },
          },
          // Testimonials - Cards Profissionais
          {
            id: createId(),
            type: 'testimonials',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.modern-saas.testimonials.title', 'O que nossos clientes dizem'),
                level: 2,
                styles: { 
                  textAlign: 'center', 
                  margin: '0 auto 1rem', 
                  fontSize: 'clamp(2rem, 4.5vw, 3rem)', 
                  fontWeight: '600',
                  letterSpacing: '-0.02em',
                  maxWidth: 'min(100%, 800px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  color: 'USE_THEME_TEXT'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: 'Junte-se a milhares de empresas que já transformaram seus negócios',
                styles: { 
                  textAlign: 'center', 
                  color: 'USE_THEME_TEXT',
                  opacity: '0.7',
                  margin: '0 auto 3rem',
                  fontSize: 'clamp(1rem, 2.2vw, 1.125rem)',
                  maxWidth: 'min(100%, 600px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word'
                },
              }),
              createElement({
                id: createId(),
                type: 'testimonial',
                testimonials: [
                  {
                    id: createId(),
                    name: 'Ana Silva',
                    role: 'CEO, TechStart',
                    content: 'Aumentamos nossa produtividade em 300% em apenas 3 meses. A melhor decisão que tomamos! A plataforma é intuitiva e os resultados foram imediatos.',
                    rating: 5,
                  },
                  {
                    id: createId(),
                    name: 'Carlos Mendes',
                    role: 'Diretor, InovaçãoCorp',
                    content: 'Interface intuitiva e recursos poderosos. Nossa equipe se adaptou rapidamente e os resultados superaram todas as expectativas. ROI impressionante!',
                    rating: 5,
                  },
                  {
                    id: createId(),
                    name: 'Mariana Costa',
                    role: 'Fundadora, GrowthLab',
                    content: 'O suporte é excepcional e a plataforma superou todas as expectativas. Recomendo para qualquer empresa que busca crescimento acelerado.',
                    rating: 5,
                  },
                ],
                layout: 'cards',
              }),
            ],
            styles: { 
              padding: 'clamp(5rem, 10vw, 8rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: '#fafafa',
              maxWidth: '100%',
              margin: '0 auto'
            },
          },
          // Pricing Section - Minimalista
          {
            id: createId(),
            type: 'content',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: 'Planos que Crescem com Você',
                level: 2,
                styles: { 
                  textAlign: 'center', 
                  margin: '0 auto 1rem', 
                  fontSize: 'clamp(2rem, 4.5vw, 3rem)', 
                  fontWeight: '600',
                  letterSpacing: '-0.02em',
                  maxWidth: 'min(100%, 800px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  color: 'USE_THEME_TEXT'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: 'Escolha o plano ideal para o seu negócio. Todos incluem suporte e atualizações.',
                styles: { 
                  textAlign: 'center', 
                  color: 'USE_THEME_TEXT',
                  opacity: '0.7',
                  margin: '0 auto 3rem',
                  fontSize: 'clamp(1rem, 2.2vw, 1.1875rem)',
                  maxWidth: 'min(100%, 600px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  lineHeight: '1.6',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                },
              }),
              createElement({
                id: createId(),
                type: 'icon-list',
                items: [
                  { id: createId(), text: '💼 Plano Starter - Ideal para pequenas equipes\nR$ 99/mês - Recursos essenciais' },
                  { id: createId(), text: '🚀 Plano Professional - Para empresas em crescimento\nR$ 299/mês - Recursos avançados + suporte prioritário' },
                  { id: createId(), text: '🏢 Plano Enterprise - Solução completa\nSob consulta - Personalizado para sua empresa' },
                ],
                columns: 1,
                styles: { 
                  padding: '0 clamp(1rem, 3vw, 2rem)', 
                  gap: '1.5rem',
                  maxWidth: 'min(100%, 800px)',
                  margin: '0 auto'
                },
              }),
            ],
            styles: { 
              padding: 'clamp(5rem, 10vw, 8rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: '#ffffff',
              maxWidth: '100%',
              margin: '0 auto'
            },
          },
          // CTA Final - Minimalista
          {
            id: createId(),
            type: 'content',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.modern-saas.cta.title', 'Pronto para transformar seu negócio?'),
                level: 2,
                styles: { 
                  textAlign: 'center', 
                  margin: '0 auto 1rem', 
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)', 
                  fontWeight: '600',
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                  maxWidth: 'min(100%, 700px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: t('LandingPagePresets.modern-saas.cta.subtitle', 'Comece grátis hoje. Sem cartão de crédito. Cancele quando quiser.'),
                styles: { 
                  textAlign: 'center', 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  margin: '0 auto 2.5rem', 
                  fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                  maxWidth: 'min(100%, 600px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  lineHeight: '1.6',
                  fontWeight: '400'
                },
              }),
              createElement({
                id: createId(),
                type: 'button',
                text: t('LandingPagePresets.modern-saas.cta.button', 'Começar Agora - Grátis'),
                variant: 'primary',
                href: `#form-${heroFormId}`,
                styles: {
                  fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                  padding: '1rem 2.5rem',
                  margin: '0 auto',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  display: 'inline-block',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                },
              }),
            ],
            styles: { 
              padding: 'clamp(5rem, 10vw, 8rem) clamp(1rem, 3vw, 2rem)', 
              backgroundGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              backgroundColor: 'USE_THEME_PRIMARY',
              textAlign: 'center',
              maxWidth: '100%',
              margin: '0 auto',
            },
          },
          // Footer - Minimalista
          {
            id: createId(),
            type: 'footer',
            elements: createProfessionalFooter(),
            styles: { 
              padding: '3rem clamp(1rem, 3vw, 2rem) 2rem', 
              backgroundColor: '#0f172a',
              color: 'rgba(255, 255, 255, 0.8)',
              marginTop: '0',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            },
          },
        ]
      
      return {
        id: baseId,
        name: t('LandingPagePresets.modern-saas.name', 'SaaS Moderno - Completo'),
        sections,
        theme: {
          colorPalette: {
            primary: "#3b82f6",
            secondary: "#6366f1",
            background: "#ffffff",
            text: "#111827",
            primaryGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
            backgroundGradient: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
          },
          fontFamily: 'inter',
          globalSpacing: { padding: '0', margin: '0' },
        },
        createdAt: now,
        updatedAt: now,
      }
    }

    case 'product-launch': {
      // Preset completo inspirado em Apple/Product Launches
      const heroFormId = createId()
      const sections = [
          {
            id: createId(),
            type: 'header',
            elements: createProfessionalHeader(true, heroFormId),
            styles: { 
              padding: '1.5rem clamp(1rem, 3vw, 2rem)', 
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(20px)',
              position: 'sticky',
              top: 0,
              zIndex: '50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: '100%',
              margin: '0 auto'
            },
          },
          {
            id: createId(),
            type: 'hero',
            elements: [
              createElement({
                id: createId(),
                type: 'highlight',
                content: t('LandingPagePresets.product-launch.hero.badge', '🚀 LANÇAMENTO EXCLUSIVO'),
                variant: 'warning',
                styles: { 
                  textAlign: 'center', 
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', 
                  fontWeight: '700', 
                  padding: '0.875rem 2rem', 
                  margin: '0 auto 2.5rem', 
                  display: 'inline-block', 
                  borderRadius: '9999px', 
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  backgroundColor: 'rgba(251, 191, 36, 0.2)',
                  color: '#fbbf24',
                  border: '2px solid rgba(251, 191, 36, 0.4)',
                  boxShadow: '0 4px 20px rgba(251, 191, 36, 0.3)'
                },
              }),
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.product-launch.hero.title', 'O Futuro Chegou. Seja o Primeiro.'),
                level: 1,
                styles: { 
                  fontSize: 'clamp(3rem, 7vw, 6rem)', 
                  fontWeight: '900', 
                  textAlign: 'center', 
                  margin: '0 auto 2rem', 
                  lineHeight: '1.05',
                  letterSpacing: '-0.05em',
                  color: '#ffffff', // White for contrast on colored backgrounds
                  maxWidth: 'min(100%, 1000px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  textShadow: '0 4px 30px rgba(0, 0, 0, 0.3)'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: t('LandingPagePresets.product-launch.hero.subtitle', 'Descubra a inovação que vai revolucionar sua forma de trabalhar. Reserve seu lugar agora e ganhe acesso exclusivo com benefícios especiais.'),
                styles: { 
                  fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', 
                  textAlign: 'center', 
                  margin: '0 auto clamp(2rem, 5vw, 4rem)', 
                  maxWidth: 'min(100%, 700px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  color: 'rgba(255, 255, 255, 0.95)',
                  lineHeight: '1.7',
                  fontWeight: '400'
                },
              }),
              createElement({
                id: createId(),
                type: 'countdown',
                targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                styles: { margin: '0 auto 4rem', maxWidth: '700px' },
              }),
              createElement({
                id: heroFormId,
                type: 'form',
                fields: [
                  { id: createId(), type: 'email', label: t('LandingPagePresets.product-launch.hero.form.email', 'Email'), required: true, placeholder: 'seu@email.com' },
                  { id: createId(), type: 'text', label: t('LandingPagePresets.product-launch.hero.form.name', 'Nome'), required: true, placeholder: 'Seu nome' },
                ],
                submitText: t('LandingPagePresets.product-launch.hero.form.submit', 'Reservar Minha Vaga'),
                styles: { maxWidth: 'min(100%, 550px)', margin: '0 auto', padding: '0 clamp(1rem, 3vw, 2rem)', wordWrap: 'break-word' },
              }),
            ],
            styles: { 
              padding: 'clamp(4rem, 12vw, 10rem) clamp(1rem, 3vw, 2rem) clamp(6rem, 15vw, 12rem)',
              backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              backgroundColor: 'USE_THEME_PRIMARY',
              color: '#ffffff', 
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            },
          },
          {
            id: createId(),
            type: 'content',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.product-launch.benefits.title', 'Por que escolher nosso produto?'),
                level: 2,
                styles: { 
                  textAlign: 'center', 
                  margin: '0 auto 1rem', 
                  fontSize: 'clamp(2rem, 4.5vw, 3rem)', 
                  fontWeight: '700',
                  letterSpacing: '-0.03em',
                  maxWidth: 'min(100%, 800px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  color: 'USE_THEME_TEXT'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: 'Recursos inovadores que fazem a diferença',
                styles: { 
                  textAlign: 'center', 
                  color: 'USE_THEME_TEXT', // Will use theme text with reduced opacity for muted effect 
                  margin: '0 auto clamp(2rem, 5vw, 4rem)',
                  fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                  maxWidth: 'min(100%, 600px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  lineHeight: '1.6'
                },
              }),
              createElement({
                id: createId(),
                type: 'icon-list',
                items: [
                  { id: createId(), text: '✨ Design revolucionário que impressiona desde o primeiro uso' },
                  { id: createId(), text: '⚡ Performance excepcional e velocidade incomparável' },
                  { id: createId(), text: '🛡️ Segurança de nível empresarial com certificações internacionais' },
                  { id: createId(), text: '📱 Funciona perfeitamente em todos os dispositivos e plataformas' },
                  { id: createId(), text: '🎯 Fácil de usar, mesmo para iniciantes - sem curva de aprendizado' },
                  { id: createId(), text: '💎 Qualidade premium garantida com suporte vitalício' },
                ],
                columns: 2,
                styles: { padding: '2rem 0', gap: '2rem' },
              }),
            ],
            styles: { 
              padding: 'clamp(3rem, 10vw, 8rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: 'USE_THEME_BACKGROUND',
              maxWidth: 'min(100%, 1400px)',
              margin: '0 auto'
            },
          },
          {
            id: createId(),
            type: 'content',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.product-launch.offer.title', 'Oferta Especial de Lançamento'),
                level: 2,
                styles: { 
                  textAlign: 'center', 
                  margin: '0 auto 1.5rem', 
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', 
                  fontWeight: '700',
                  maxWidth: 'min(100%, 800px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  color: 'USE_THEME_TEXT'
                },
              }),
              createElement({
                id: createId(),
                type: 'highlight',
                content: t('LandingPagePresets.product-launch.offer.highlight', '🔥 50% OFF apenas para os primeiros 100 clientes!'),
                variant: 'error',
                styles: { 
                  textAlign: 'center', 
                  fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)', 
                  fontWeight: '700', 
                  padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 4vw, 3rem)', 
                  margin: '0 auto clamp(1.5rem, 4vw, 3rem)',
                  borderRadius: 'clamp(0.75rem, 2vw, 1rem)',
                  maxWidth: 'min(100%, 700px)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  backgroundColor: 'USE_THEME_SECONDARY',
                  color: 'USE_THEME_TEXT',
                  border: '3px solid #fbbf24',
                  boxShadow: '0 10px 30px -5px rgba(251, 191, 36, 0.4)'
                },
              }),
              createElement({
                id: createId(),
                type: 'button',
                text: t('LandingPagePresets.product-launch.offer.button', 'Garantir Minha Oferta Agora'),
                variant: 'primary',
                href: `#form-${heroFormId}`,
                styles: {
                  fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                  padding: '1rem 2.5rem',
                  margin: '0 auto',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  display: 'inline-block',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                },
              }),
            ],
            styles: { 
              padding: 'clamp(3rem, 10vw, 8rem) clamp(1rem, 3vw, 2rem)', 
              backgroundGradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
              backgroundColor: 'USE_THEME_SECONDARY',
              textAlign: 'center',
              borderRadius: '1.5rem',
              margin: '6rem auto',
              maxWidth: '1200px',
              boxShadow: '0 25px 60px -15px rgba(251, 191, 36, 0.4), 0 10px 20px -5px rgba(251, 191, 36, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            },
          },
        ]
      
      return {
        id: baseId,
        name: t('LandingPagePresets.product-launch.name', 'Lançamento de Produto'),
        sections,
        theme: {
          colorPalette: {
            primary: "#667eea",
            secondary: "#764ba2",
            background: "#ffffff",
            text: "#111827",
          },
          fontFamily: 'inter',
          globalSpacing: { padding: '0', margin: '0' },
        },
        createdAt: now,
        updatedAt: now,
      }
    }

    case 'lead-magnet': {
      // Preset completo para captura de leads
      const formSectionId = createId()
      const formElementId = createId()
      const sections = [
          {
            id: createId(),
            type: 'header',
            elements: createProfessionalHeader(false, formElementId),
            styles: { 
              padding: 'clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
              position: 'sticky',
              top: 0,
              zIndex: '50',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              maxWidth: '100%',
              margin: '0 auto'
            },
          },
          {
            id: createId(),
            type: 'hero',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.lead-magnet.hero.title', 'Guia Gratuito Exclusivo'),
                level: 1,
                styles: { 
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
                  fontWeight: '800', 
                  textAlign: 'center', 
                  margin: '0 auto 1rem',
                  letterSpacing: '-0.03em',
                  maxWidth: '900px',
                  lineHeight: '1.2',
                  color: 'USE_THEME_TEXT'
                },
              }),
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.lead-magnet.hero.subtitle', 'Os 10 Segredos dos Profissionais de Sucesso'),
                level: 2,
                styles: { 
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', 
                  fontWeight: '600', 
                  textAlign: 'center', 
                  margin: '0 auto 1.5rem',
                  color: 'USE_THEME_PRIMARY',
                  maxWidth: 'min(100%, 800px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  lineHeight: '1.3'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: t('LandingPagePresets.lead-magnet.hero.description', 'Descubra as estratégias comprovadas que profissionais de alto nível usam para alcançar resultados extraordinários. Baixe agora, 100% grátis!'),
                styles: { 
                  fontSize: 'clamp(1.125rem, 2vw, 1.375rem)', 
                  textAlign: 'center', 
                  color: 'USE_THEME_TEXT', // Will use theme text with reduced opacity for muted effect 
                  margin: '0 auto clamp(1.5rem, 4vw, 3rem)',
                  maxWidth: 'min(100%, 700px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  lineHeight: '1.7',
                  fontWeight: '400'
                },
              }),
            ],
            styles: { 
              padding: 'clamp(3rem, 10vw, 8rem) clamp(1rem, 3vw, 2rem) clamp(3rem, 8vw, 6rem)',
              backgroundGradient: 'linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #e0f2fe 100%)',
              backgroundColor: 'USE_THEME_BACKGROUND',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            },
          },
          {
            id: formSectionId,
            type: 'form',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.lead-magnet.form.title', 'Preencha e receba agora'),
                level: 3,
                styles: { 
                  textAlign: 'center', 
                  margin: '0 auto 2rem', 
                  fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)',
                  fontWeight: '600',
                  maxWidth: '550px',
                  color: 'USE_THEME_TEXT'
                },
              }),
              createElement({
                id: formElementId,
                type: 'form',
                fields: [
                  { id: createId(), type: 'text', label: t('LandingPagePresets.lead-magnet.form.fields.name', 'Nome Completo'), required: true, placeholder: 'Seu nome completo' },
                  { id: createId(), type: 'email', label: t('LandingPagePresets.lead-magnet.form.fields.email', 'Email'), required: true, placeholder: 'seu@email.com' },
                  { id: createId(), type: 'tel', label: t('LandingPagePresets.lead-magnet.form.fields.phone', 'Telefone (opcional)'), required: false, placeholder: '(00) 00000-0000' },
                ],
                submitText: t('LandingPagePresets.lead-magnet.form.submit', 'Baixar Guia Grátis Agora'),
                styles: { maxWidth: 'min(100%, 550px)', margin: '0 auto', padding: '0 clamp(1rem, 3vw, 2rem)', wordWrap: 'break-word' },
              }),
            ],
            styles: { 
              padding: 'clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 3rem)',
              backgroundColor: '#ffffff',
              backgroundGradient: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
              borderRadius: '1.5rem',
              margin: '-4rem auto 0',
              maxWidth: '650px',
              boxShadow: '0 25px 80px -15px rgba(59, 130, 246, 0.25), 0 10px 30px -5px rgba(59, 130, 246, 0.15)',
              position: 'relative',
              zIndex: 10,
              border: '2px solid rgba(59, 130, 246, 0.1)'
            },
          },
          {
            id: createId(),
            type: 'content',
            elements: [
              createElement({
                id: createId(),
                type: 'icon-list',
                items: [
                  { id: createId(), text: '✅ 100% Gratuito - Sem custos ocultos ou surpresas' },
                  { id: createId(), text: '✅ Acesso Imediato - Receba em segundos após o cadastro' },
                  { id: createId(), text: '✅ Sem Spam - Respeitamos sua privacidade completamente' },
                  { id: createId(), text: '✅ Conteúdo Exclusivo - Não encontrado em outro lugar' },
                ],
                columns: 2,
                styles: { padding: 'clamp(1.5rem, 4vw, 3rem) 0', gap: 'clamp(1rem, 2vw, 1.5rem)' },
              }),
            ],
            styles: { 
              padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: 'USE_THEME_BACKGROUND',
              maxWidth: '1000px',
              margin: '0 auto'
            },
          },
          {
            id: createId(),
            type: 'testimonials',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.lead-magnet.socialProof.title', 'Mais de 50.000 pessoas já baixaram'),
                level: 3,
                styles: { 
                  textAlign: 'center', 
                  margin: '0 auto clamp(1.5rem, 4vw, 3rem)', 
                  fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                  color: 'USE_THEME_TEXT', // Will use theme text with reduced opacity for muted effect
                  fontWeight: '500',
                  maxWidth: '700px'
                },
              }),
              createElement({
                id: createId(),
                type: 'testimonial',
                testimonials: [
                  {
                    id: createId(),
                    name: 'Roberto Alves',
                    role: 'Empreendedor',
                    content: 'O guia mudou completamente minha perspectiva. Apliquei as estratégias e os resultados foram imediatos! Recomendo para todos.',
                    rating: 5,
                  },
                  {
                    id: createId(),
                    name: 'Juliana Ferreira',
                    role: 'Consultora',
                    content: 'Conteúdo de altíssima qualidade. Vale muito a pena o download, recomendo para todos que buscam crescimento profissional.',
                    rating: 5,
                  },
                ],
                layout: 'cards',
              }),
            ],
            styles: { 
              padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: 'USE_THEME_BACKGROUND',
              maxWidth: '1200px',
              margin: '0 auto'
            },
          },
          {
            id: createId(),
            type: 'footer',
            elements: createProfessionalFooter(),
            styles: { 
              padding: 'clamp(2rem, 6vw, 4rem) clamp(1rem, 3vw, 2rem) clamp(1.5rem, 4vw, 3rem)', 
              backgroundColor: '#f9fafb',
              borderTop: '1px solid rgba(229, 231, 235, 0.8)',
              marginTop: '4rem'
            },
          },
        ]
      
      return {
        id: baseId,
        name: t('LandingPagePresets.lead-magnet.name', 'Captura de Leads'),
        sections,
        theme: {
          colorPalette: {
            primary: "#3b82f6",
            secondary: "#10b981",
            background: "#ffffff",
            text: "#111827",
          },
          fontFamily: 'inter',
          globalSpacing: { padding: '0', margin: '0' },
        },
        createdAt: now,
        updatedAt: now,
      }
    }

    case 'simple': {
      const heroFormId = createId()
      const sections = [
          {
            id: createId(),
            type: 'header',
            elements: createProfessionalHeader(false, heroFormId),
            styles: { 
              padding: 'clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
              position: 'sticky',
              top: 0,
              zIndex: '50',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              maxWidth: '100%',
              margin: '0 auto'
            },
          },
          {
            id: createId(),
            type: 'hero',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.simple.hero.title', 'Sua Headline Poderosa Aqui'),
                level: 1,
                styles: { 
                  fontSize: 'clamp(2.5rem, 6vw, 5rem)', 
                  fontWeight: '800', 
                  textAlign: 'center', 
                  margin: '0 auto 1.5rem',
                  letterSpacing: '-0.04em',
                  lineHeight: '1.1',
                  maxWidth: 'min(100%, 1000px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  color: 'USE_THEME_TEXT'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: t('LandingPagePresets.simple.hero.subtitle', 'Adicione uma descrição convincente que explique claramente o valor único do seu produto ou serviço e por que as pessoas devem escolher você.'),
                styles: { 
                  fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)', 
                  textAlign: 'center', 
                  color: 'USE_THEME_TEXT', // Will use theme text with reduced opacity for muted effect 
                  margin: '0 auto 2.5rem',
                  maxWidth: '750px',
                  lineHeight: '1.7',
                  fontWeight: '400'
                },
              }),
              createElement({
                id: heroFormId,
                type: 'form',
                fields: [
                  { id: createId(), type: 'email', label: 'Email', required: true, placeholder: 'seu@email.com' },
                  { id: createId(), type: 'text', label: 'Nome', required: true, placeholder: 'Seu nome' },
                ],
                submitText: t('LandingPagePresets.simple.hero.cta', 'Chamada para Ação'),
                styles: { 
                  maxWidth: 'min(100%, 500px)', 
                  margin: '0 auto', 
                  padding: '0 clamp(1rem, 3vw, 2rem)', 
                  wordWrap: 'break-word' 
                },
              }),
            ],
            styles: { 
              padding: 'clamp(4rem, 15vw, 12rem) clamp(1rem, 3vw, 2rem)',
              backgroundGradient: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
              backgroundColor: 'USE_THEME_BACKGROUND',
              textAlign: 'center',
              minHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            },
          },
          {
            id: createId(),
            type: 'footer',
            elements: createProfessionalFooter(),
            styles: { 
              padding: 'clamp(2rem, 6vw, 4rem) clamp(1rem, 3vw, 2rem) clamp(1.5rem, 4vw, 3rem)', 
              backgroundColor: '#f9fafb',
              borderTop: '1px solid rgba(229, 231, 235, 0.8)',
              marginTop: '4rem'
            },
          },
        ]
      
      return {
        id: baseId,
        name: t('LandingPagePresets.simple.name', 'Landing Page Simples'),
        sections,
        theme: {
          colorPalette: {
            primary: "#3b82f6",
            secondary: "#eab308",
            background: "#ffffff",
            text: "#111827",
            primaryGradient: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
            backgroundGradient: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
          },
          fontFamily: 'inter',
          globalSpacing: { padding: '0', margin: '0' },
        },
        createdAt: now,
        updatedAt: now,
      }
    }

    case 'sales': {
      // Preset completo de página de vendas
      const heroFormId = createId()
      const sections = [
          {
            id: createId(),
            type: 'header',
            elements: createProfessionalHeader(true, heroFormId),
            styles: { 
              padding: 'clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: 'rgba(30, 64, 175, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'sticky',
              top: 0,
              zIndex: '50',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: '100%',
              margin: '0 auto'
            },
          },
          {
            id: createId(),
            type: 'hero',
            elements: [
              createElement({
                id: createId(),
                type: 'highlight',
                content: t('LandingPagePresets.sales.hero.badge', '🔥 OFERTA POR TEMPO LIMITADO'),
                variant: 'error',
                styles: { 
                  textAlign: 'center', 
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', 
                  fontWeight: '700', 
                  padding: '0.875rem 2rem', 
                  margin: '0 auto 2.5rem', 
                  display: 'inline-block', 
                  borderRadius: '9999px', 
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  backgroundColor: 'USE_THEME_PRIMARY', // Will use primary with light tint for warning
                  color: 'USE_THEME_TEXT',
                  border: '2px solid #fca5a5',
                  boxShadow: '0 4px 20px rgba(220, 38, 38, 0.3)'
                },
              }),
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.sales.hero.title', 'Transforme Seu Negócio Hoje Mesmo'),
                level: 1,
                styles: { 
                  fontSize: 'clamp(2.5rem, 6vw, 5.5rem)', 
                  fontWeight: '900', 
                  textAlign: 'center', 
                  margin: '0 auto 1.5rem',
                  lineHeight: '1.05',
                  letterSpacing: '-0.05em',
                  color: '#ffffff', // White for contrast on colored backgrounds
                  maxWidth: 'min(100%, 1000px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  textShadow: '0 4px 30px rgba(0, 0, 0, 0.3)'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: t('LandingPagePresets.sales.hero.subtitle', 'A solução completa que milhares de empresas já estão usando para crescer e aumentar seus lucros. Junte-se a eles agora!'),
                styles: { 
                  fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)', 
                  textAlign: 'center', 
                  margin: '0 auto 2.5rem',
                  maxWidth: '750px',
                  color: 'rgba(255, 255, 255, 0.95)',
                  lineHeight: '1.7',
                  fontWeight: '400'
                },
              }),
              createElement({
                id: heroFormId,
                type: 'form',
                fields: [
                  { id: createId(), type: 'text', label: 'Nome Completo', required: true, placeholder: 'Seu nome completo' },
                  { id: createId(), type: 'email', label: 'Email', required: true, placeholder: 'seu@email.com' },
                  { id: createId(), type: 'tel', label: 'Telefone', required: true, placeholder: '(00) 00000-0000' },
                ],
                submitText: t('LandingPagePresets.sales.hero.cta', 'Quero Transformar Meu Negócio'),
                styles: { 
                  maxWidth: 'min(100%, 550px)', 
                  margin: '0 auto', 
                  padding: '0 clamp(1rem, 3vw, 2rem)', 
                  wordWrap: 'break-word' 
                },
              }),
            ],
            styles: { 
              padding: 'clamp(4rem, 12vw, 10rem) clamp(1rem, 3vw, 2rem) clamp(6rem, 15vw, 12rem)',
              backgroundGradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
              backgroundColor: 'USE_THEME_PRIMARY',
              color: '#ffffff', 
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            },
          },
          {
            id: createId(),
            type: 'content',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.sales.benefits.title', 'O que você vai receber'),
                level: 2,
                styles: { 
                  textAlign: 'center', 
                  margin: '0 auto 1rem', 
                  fontSize: 'clamp(2rem, 4.5vw, 3rem)', 
                  fontWeight: '700',
                  letterSpacing: '-0.03em',
                  maxWidth: 'min(100%, 800px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  color: 'USE_THEME_TEXT'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: 'Tudo que você precisa para ter sucesso',
                styles: { 
                  textAlign: 'center', 
                  color: 'USE_THEME_TEXT', // Will use theme text with reduced opacity for muted effect 
                  margin: '0 auto clamp(2rem, 5vw, 4rem)',
                  fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                  maxWidth: 'min(100%, 600px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  lineHeight: '1.6'
                },
              }),
              createElement({
                id: createId(),
                type: 'icon-list',
                items: [
                  { id: createId(), text: '✅ Acesso completo a todos os recursos premium sem limitações' },
                  { id: createId(), text: '✅ Suporte prioritário 24/7 com resposta em menos de 1 hora' },
                  { id: createId(), text: '✅ Garantia incondicional de 30 dias - devolvemos 100% do seu dinheiro' },
                  { id: createId(), text: '✅ Atualizações gratuitas para sempre - sempre terá a versão mais recente' },
                  { id: createId(), text: '✅ Treinamento completo incluso com vídeos e materiais exclusivos' },
                  { id: createId(), text: '✅ Bônus exclusivos no valor de R$ 1.000 - totalmente grátis para você' },
                ],
                columns: 2,
                styles: { padding: '2rem 0', gap: '2rem' },
              }),
            ],
            styles: { 
              padding: 'clamp(3rem, 10vw, 8rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: 'USE_THEME_BACKGROUND',
              maxWidth: 'min(100%, 1400px)',
              margin: '0 auto'
            },
          },
          {
            id: createId(),
            type: 'testimonials',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.sales.testimonials.title', 'Resultados Reais de Clientes Reais'),
                level: 2,
                styles: { 
                  textAlign: 'center', 
                  margin: '0 auto 1rem', 
                  fontSize: 'clamp(2rem, 4.5vw, 3rem)', 
                  fontWeight: '700',
                  letterSpacing: '-0.03em',
                  maxWidth: 'min(100%, 800px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  color: 'USE_THEME_TEXT'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: 'Veja o que nossos clientes estão dizendo',
                styles: { 
                  textAlign: 'center', 
                  color: 'USE_THEME_TEXT', // Will use theme text with reduced opacity for muted effect 
                  margin: '0 auto clamp(2rem, 5vw, 4rem)',
                  fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                  maxWidth: 'min(100%, 600px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word'
                },
              }),
              createElement({
                id: createId(),
                type: 'testimonial',
                testimonials: [
                  {
                    id: createId(),
                    name: 'Paulo Santos',
                    role: 'CEO, EmpresaXYZ',
                    content: 'Aumentamos nossa receita em 250% nos primeiros 6 meses. O melhor investimento que fizemos! A plataforma é incrível.',
                    rating: 5,
                  },
                  {
                    id: createId(),
                    name: 'Fernanda Lima',
                    role: 'Diretora, GrowthCo',
                    content: 'ROI imediato e resultados que superaram todas as expectativas. Recomendo sem hesitação para qualquer empresa séria.',
                    rating: 5,
                  },
                  {
                    id: createId(),
                    name: 'Ricardo Oliveira',
                    role: 'Fundador, StartupTech',
                    content: 'Transformou completamente nosso negócio. A equipe de suporte é excepcional e sempre disponível quando precisamos.',
                    rating: 5,
                  },
                ],
                layout: 'cards',
              }),
            ],
            styles: { 
              padding: 'clamp(3rem, 10vw, 8rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: 'USE_THEME_BACKGROUND',
              maxWidth: 'min(100%, 1400px)',
              margin: '0 auto'
            },
          },
          {
            id: createId(),
            type: 'content',
            elements: [
              createElement({
                id: createId(),
                type: 'highlight',
                content: t('LandingPagePresets.sales.offer.highlight', '💰 De R$ 997 por apenas R$ 497 - Apenas hoje!'),
                variant: 'warning',
                styles: { 
                  textAlign: 'center', 
                  fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', 
                  fontWeight: '700', 
                  padding: '2.5rem 3rem', 
                  margin: '0 auto clamp(1.5rem, 4vw, 3rem)',
                  borderRadius: '1rem',
                  maxWidth: '750px',
                  backgroundColor: 'USE_THEME_SECONDARY',
                  color: 'USE_THEME_TEXT',
                  border: '3px solid #fbbf24',
                  boxShadow: '0 15px 40px -10px rgba(251, 191, 36, 0.4)'
                },
              }),
              createElement({
                id: createId(),
                type: 'button',
                text: t('LandingPagePresets.sales.offer.button', 'Garantir Minha Vaga Agora'),
                variant: 'primary',
                href: `#form-${heroFormId}`,
                styles: {
                  fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                  padding: '1rem 2.5rem',
                  margin: '0 auto',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  display: 'inline-block',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: t('LandingPagePresets.sales.offer.guarantees', '⚡ Pagamento seguro • 🔒 Garantia de 30 dias • 💳 Parcelamento em até 12x'),
                styles: { 
                  textAlign: 'center', 
                  margin: '2.5rem auto 0', 
                  fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', 
                  color: 'USE_THEME_TEXT',
                  opacity: '0.7',
                  maxWidth: 'min(100%, 700px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  lineHeight: '1.6'
                },
              }),
            ],
            styles: { 
              padding: 'clamp(3rem, 10vw, 8rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: 'USE_THEME_BACKGROUND',
              textAlign: 'center',
              maxWidth: '1200px',
              margin: '0 auto',
              borderRadius: '1.5rem'
            },
          },
          {
            id: createId(),
            type: 'footer',
            elements: createProfessionalFooter(),
            styles: { 
              padding: 'clamp(2rem, 6vw, 4rem) clamp(1rem, 3vw, 2rem) clamp(1.5rem, 4vw, 3rem)', 
              backgroundGradient: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
              backgroundColor: '#1f2937',
              color: '#f9fafb',
              marginTop: '6rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            },
          },
        ]
      
      return {
        id: baseId,
        name: t('LandingPagePresets.sales.name', 'Página de Vendas Completa'),
        sections,
        theme: {
          colorPalette: {
            primary: "#1e40af",
            secondary: "#eab308",
            background: "#ffffff",
            text: "#111827",
            primaryGradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
            backgroundGradient: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          },
          fontFamily: 'inter',
          globalSpacing: { padding: '0', margin: '0' },
        },
        createdAt: now,
        updatedAt: now,
      }
    }

    case 'faq-testimonials': {
      const contactFormId = createId()
      const sections = [
          {
            id: createId(),
            type: 'header',
            elements: createProfessionalHeader(false, contactFormId),
            styles: { 
              padding: 'clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
              position: 'sticky',
              top: 0,
              zIndex: '50',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              maxWidth: '100%',
              margin: '0 auto'
            },
          },
          {
            id: createId(),
            type: 'hero',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.faq-testimonials.hero.title', 'Perguntas Frequentes'),
                level: 1,
                styles: { 
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
                  fontWeight: '800', 
                  textAlign: 'center', 
                  margin: '0 auto 1rem',
                  letterSpacing: '-0.03em',
                  maxWidth: '900px',
                  lineHeight: '1.2',
                  color: 'USE_THEME_TEXT'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: t('LandingPagePresets.faq-testimonials.hero.subtitle', 'Tire todas as suas dúvidas antes de começar'),
                styles: { 
                  fontSize: 'clamp(1.125rem, 2vw, 1.375rem)', 
                  textAlign: 'center', 
                  color: 'USE_THEME_TEXT', // Will use theme text with reduced opacity for muted effect 
                  margin: '0 auto clamp(2rem, 5vw, 4rem)',
                  maxWidth: 'min(100%, 700px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  lineHeight: '1.6',
                  fontWeight: '400'
                },
              }),
            ],
            styles: { 
              padding: 'clamp(3rem, 10vw, 8rem) clamp(1rem, 3vw, 2rem) clamp(3rem, 8vw, 6rem)',
              backgroundColor: 'USE_THEME_BACKGROUND',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            },
          },
          {
            id: createId(),
            type: 'content',
            elements: [
              createElement({
                id: createId(),
                type: 'faq',
                items: [
                  {
                    id: createId(),
                    question: 'Como funciona o processo?',
                    answer: 'É muito simples! Após o cadastro, você recebe acesso imediato à plataforma. Nossa interface intuitiva permite que você comece a usar em minutos, sem necessidade de treinamento extensivo. Oferecemos tutoriais completos e suporte dedicado.',
                  },
                  {
                    id: createId(),
                    question: 'Quais são os planos e preços disponíveis?',
                    answer: 'Oferecemos planos flexíveis para todos os tamanhos de negócio. Temos opções desde o plano básico gratuito até planos empresariais com recursos avançados. Todos os planos incluem suporte e atualizações regulares.',
                  },
                  {
                    id: createId(),
                    question: 'Preciso ter conhecimento técnico para usar?',
                    answer: 'Não! Nossa plataforma foi projetada para ser usada por qualquer pessoa, independente do nível técnico. A interface é intuitiva e oferecemos tutoriais completos para guiá-lo em cada etapa.',
                  },
                  {
                    id: createId(),
                    question: 'Há suporte disponível?',
                    answer: 'Sim! Oferecemos suporte 24/7 por email, chat ao vivo e telefone para todos os nossos clientes. Nossa equipe está sempre pronta para ajudar você a ter sucesso e resolver qualquer dúvida rapidamente.',
                  },
                  {
                    id: createId(),
                    question: 'Posso cancelar a qualquer momento?',
                    answer: 'Absolutamente! Não há contratos de longo prazo. Você pode cancelar sua assinatura a qualquer momento, sem taxas ou penalidades. Sua conta permanecerá ativa até o final do período pago.',
                  },
                  {
                    id: createId(),
                    question: 'Os dados estão seguros?',
                    answer: 'Sim! Utilizamos criptografia de nível bancário e seguimos os mais altos padrões de segurança da indústria. Seus dados estão completamente protegidos e nunca são compartilhados com terceiros. Realizamos auditorias regulares de segurança.',
                  },
                ],
              }),
            ],
            styles: { 
              padding: 'clamp(2rem, 6vw, 4rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: 'USE_THEME_BACKGROUND',
              maxWidth: '1000px', 
              margin: '0 auto',
              borderRadius: '1rem'
            },
          },
          {
            id: createId(),
            type: 'testimonials',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.faq-testimonials.testimonials.title', 'O que nossos clientes dizem'),
                level: 2,
                styles: { 
                  textAlign: 'center', 
                  margin: '0 auto 1rem', 
                  fontSize: 'clamp(2rem, 4.5vw, 3rem)', 
                  fontWeight: '700',
                  letterSpacing: '-0.03em',
                  maxWidth: 'min(100%, 800px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  color: 'USE_THEME_TEXT'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: 'Junte-se a milhares de clientes satisfeitos',
                styles: { 
                  textAlign: 'center', 
                  color: 'USE_THEME_TEXT', // Will use theme text with reduced opacity for muted effect 
                  margin: '0 auto clamp(2rem, 5vw, 4rem)',
                  fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                  maxWidth: 'min(100%, 600px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word'
                },
              }),
              createElement({
                id: createId(),
                type: 'testimonial',
                testimonials: [
                  {
                    id: createId(),
                    name: 'João Silva',
                    role: 'CEO, EmpresaXYZ',
                    content: 'Produto incrível! Mudou completamente a forma como trabalhamos. A equipe adorou e os resultados foram imediatos. Recomendo para todos!',
                    rating: 5,
                  },
                  {
                    id: createId(),
                    name: 'Maria Santos',
                    role: 'Diretora, TechCorp',
                    content: 'Melhor investimento que fizemos este ano. ROI imediato e equipe de suporte excepcional. Não consigo imaginar trabalhar sem isso agora.',
                    rating: 5,
                  },
                  {
                    id: createId(),
                    name: 'Pedro Almeida',
                    role: 'Fundador, StartupInov',
                    content: 'Interface intuitiva, recursos poderosos e suporte que realmente se importa. Transformou completamente nosso fluxo de trabalho.',
                    rating: 5,
                  },
                ],
                layout: 'cards',
              }),
            ],
            styles: { 
              padding: 'clamp(3rem, 10vw, 8rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: 'USE_THEME_BACKGROUND',
              maxWidth: 'min(100%, 1400px)',
              margin: '0 auto'
            },
          },
          {
            id: createId(),
            type: 'content',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: 'Entre em Contato Conosco',
                level: 2,
                styles: { 
                  textAlign: 'center', 
                  margin: '0 auto 1rem', 
                  fontSize: 'clamp(2rem, 4.5vw, 3rem)', 
                  fontWeight: '700',
                  letterSpacing: '-0.03em',
                  maxWidth: 'min(100%, 800px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  color: 'USE_THEME_TEXT'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: 'Tem alguma dúvida ou quer saber mais? Preencha o formulário abaixo e nossa equipe entrará em contato.',
                styles: { 
                  textAlign: 'center', 
                  color: 'USE_THEME_TEXT',
                  margin: '0 auto clamp(2rem, 5vw, 4rem)',
                  fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                  maxWidth: 'min(100%, 600px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  lineHeight: '1.6'
                },
              }),
              createElement({
                id: contactFormId,
                type: 'form',
                fields: [
                  { id: createId(), type: 'text', label: 'Nome Completo', required: true, placeholder: 'Seu nome completo' },
                  { id: createId(), type: 'email', label: 'Email', required: true, placeholder: 'seu@email.com' },
                  { id: createId(), type: 'tel', label: 'Telefone (opcional)', required: false, placeholder: '(00) 00000-0000' },
                  { id: createId(), type: 'textarea', label: 'Mensagem (opcional)', required: false, placeholder: 'Como podemos ajudar?' },
                ],
                submitText: 'Enviar Mensagem',
                styles: { 
                  maxWidth: 'min(100%, 550px)', 
                  margin: '0 auto', 
                  padding: '0 clamp(1rem, 3vw, 2rem)', 
                  wordWrap: 'break-word' 
                },
              }),
            ],
            styles: { 
              padding: 'clamp(3rem, 10vw, 8rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: 'USE_THEME_BACKGROUND',
              maxWidth: 'min(100%, 1400px)',
              margin: '0 auto'
            },
          },
          {
            id: createId(),
            type: 'footer',
            elements: createProfessionalFooter(),
            styles: { 
              padding: 'clamp(2rem, 6vw, 4rem) clamp(1rem, 3vw, 2rem) clamp(1.5rem, 4vw, 3rem)', 
              backgroundColor: '#f9fafb',
              borderTop: '1px solid rgba(229, 231, 235, 0.8)',
              marginTop: '4rem'
            },
          },
        ]
      
      return {
        id: baseId,
        name: t('LandingPagePresets.faq-testimonials.name', 'FAQ + Depoimentos'),
        sections,
        theme: {
          colorPalette: {
            primary: "#3b82f6",
            secondary: "#eab308",
            background: "#ffffff",
            text: "#111827",
          },
          fontFamily: 'inter',
          globalSpacing: { padding: '0', margin: '0' },
        },
        createdAt: now,
        updatedAt: now,
      }
    }

    case 'launch': {
      const heroFormId = createId()
      const sections = [
          {
            id: createId(),
            type: 'header',
            elements: createProfessionalHeader(false, heroFormId),
            styles: { 
              padding: 'clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 3vw, 2rem)', 
              backgroundColor: 'rgba(102, 126, 234, 0.3)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'sticky',
              top: 0,
              zIndex: '50',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              maxWidth: '100%',
              margin: '0 auto'
            },
          },
          {
            id: createId(),
            type: 'hero',
            elements: [
              createElement({
                id: createId(),
                type: 'title',
                content: t('LandingPagePresets.launch.hero.title', 'Em Breve'),
                level: 1,
                styles: { 
                  fontSize: 'clamp(4rem, 10vw, 8rem)', 
                  fontWeight: '900', 
                  textAlign: 'center', 
                  margin: '0 auto 2rem',
                  lineHeight: '1',
                  letterSpacing: '-0.06em',
                  color: '#ffffff', // White for contrast on colored backgrounds
                  textShadow: '0 6px 40px rgba(0, 0, 0, 0.4)'
                },
              }),
              createElement({
                id: createId(),
                type: 'paragraph',
                content: t('LandingPagePresets.launch.hero.subtitle', 'Algo incrível está chegando. Seja o primeiro a saber quando lançarmos!'),
                styles: { 
                  fontSize: 'clamp(1.375rem, 3.5vw, 1.75rem)', 
                  textAlign: 'center', 
                  margin: '0 auto clamp(2rem, 5vw, 4rem)',
                  maxWidth: 'min(100%, 700px)',
                  padding: '0 clamp(1rem, 3vw, 2rem)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  color: 'rgba(255, 255, 255, 0.95)',
                  lineHeight: '1.7',
                  fontWeight: '400'
                },
              }),
              createElement({
                id: createId(),
                type: 'countdown',
                targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                styles: { margin: '0 auto 5rem', maxWidth: '700px' },
              }),
              createElement({
                id: heroFormId,
                type: 'form',
                fields: [
                  { id: createId(), type: 'email', label: t('LandingPagePresets.launch.hero.form.email', 'Email'), required: true, placeholder: 'seu@email.com' },
                ],
                submitText: t('LandingPagePresets.launch.hero.form.submit', 'Me Avisar Quando Lançar'),
                styles: { maxWidth: '450px', margin: '0 auto' },
              }),
            ],
            styles: { 
              padding: 'clamp(4rem, 18vw, 14rem) clamp(1rem, 3vw, 2rem)',
              backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              backgroundColor: 'USE_THEME_PRIMARY',
              color: '#ffffff', 
              textAlign: 'center',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              width: '100%'
            },
          },
          {
            id: createId(),
            type: 'footer',
            elements: createProfessionalFooter(),
            styles: { 
              padding: 'clamp(2rem, 6vw, 4rem) clamp(1rem, 3vw, 2rem) clamp(1.5rem, 4vw, 3rem)', 
              backgroundGradient: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
              backgroundColor: '#1f2937',
              color: '#f9fafb',
              marginTop: '0',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            },
          },
        ]
      
      return {
        id: baseId,
        name: t('LandingPagePresets.launch.name', 'Página "Em Breve"'),
        sections,
        theme: {
          colorPalette: {
            primary: "#667eea",
            secondary: "#764ba2",
            background: "#ffffff",
            text: "#111827",
            primaryGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          },
          fontFamily: 'inter',
          globalSpacing: { padding: '0', margin: '0' },
        },
        createdAt: now,
        updatedAt: now,
      }
    }

    default:
      return null
  }
}

export const COLOR_PALETTES: Record<string, ColorPalette> = {
  // Light Themes
  'blue-white-gray': {
    primary: '#3b82f6',
    secondary: '#6b7280',
    background: '#ffffff',
    text: '#1f2937',
    accent: '#e5e7eb',
  },
  'black-yellow': {
    primary: '#000000',
    secondary: '#eab308',
    background: '#ffffff',
    text: '#000000',
    accent: '#fbbf24',
  },
  'purple-pink': {
    primary: '#8b5cf6',
    secondary: '#ec4899',
    background: '#ffffff',
    text: '#1f2937',
    accent: '#f3e8ff',
  },
  'green-white': {
    primary: '#10b981',
    secondary: '#ffffff',
    background: '#ffffff',
    text: '#1f2937',
    accent: '#d1fae5',
  },
  'orange-black': {
    primary: '#f97316',
    secondary: '#000000',
    background: '#ffffff',
    text: '#000000',
    accent: '#fed7aa',
  },
  // Dark Themes
  'dark-blue': {
    primary: '#60a5fa',
    secondary: '#818cf8',
    background: '#0f172a',
    text: '#f1f5f9',
    accent: '#1e293b',
    primaryGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    backgroundGradient: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
  },
  'dark-purple': {
    primary: '#a78bfa',
    secondary: '#ec4899',
    background: '#1e1b4b',
    text: '#e9d5ff',
    accent: '#312e81',
    primaryGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    backgroundGradient: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
  },
  'dark-green': {
    primary: '#34d399',
    secondary: '#10b981',
    background: '#064e3b',
    text: '#d1fae5',
    accent: '#065f46',
    primaryGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    backgroundGradient: 'linear-gradient(180deg, #064e3b 0%, #065f46 100%)',
  },
  'dark-orange': {
    primary: '#fb923c',
    secondary: '#f97316',
    background: '#7c2d12',
    text: '#fed7aa',
    accent: '#9a3412',
    primaryGradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    backgroundGradient: 'linear-gradient(180deg, #7c2d12 0%, #9a3412 100%)',
  },
  'dark-gray': {
    primary: '#94a3b8',
    secondary: '#64748b',
    background: '#0f172a',
    text: '#f8fafc',
    accent: '#1e293b',
    primaryGradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    backgroundGradient: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
  },
  'dark-pink': {
    primary: '#f472b6',
    secondary: '#ec4899',
    background: '#831843',
    text: '#fce7f3',
    accent: '#9f1239',
    primaryGradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    backgroundGradient: 'linear-gradient(180deg, #831843 0%, #9f1239 100%)',
  },
  'dark-cyber': {
    primary: '#00f5ff',
    secondary: '#00d4ff',
    background: '#0a0e27',
    text: '#e0f2fe',
    accent: '#1e293b',
    primaryGradient: 'linear-gradient(135deg, #00f5ff 0%, #00d4ff 100%)',
    backgroundGradient: 'linear-gradient(180deg, #0a0e27 0%, #1e293b 100%)',
  },
  'dark-elegant': {
    primary: '#c084fc',
    secondary: '#a855f7',
    background: '#1a1a2e',
    text: '#f3e8ff',
    accent: '#16213e',
    primaryGradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
    backgroundGradient: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
  },
}
