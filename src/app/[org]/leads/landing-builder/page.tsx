"use client"

import * as React from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"

import AuthGuard from "@/components/AuthGuard"
import RoleGuard from "@/components/RoleGuard"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import {
  Layers3,
  Monitor,
  Palette,
  Plus,
  RefreshCcw,
  Save,
  Share2,
  Smartphone,
  Sparkles,
  Wand2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  Download,
  MessageCircle,
  LineChart,
  Eye,
  EyeOff,
  CreditCard,
  Info,
  Edit,
} from "lucide-react"

type SectionType = "hero" | "features" | "testimonials" | "pricing" | "faq" | "cta" | "custom"
type FieldType = "text" | "email" | "phone" | "select" | "textarea"

interface LandingSection {
  id: string
  type: SectionType
  name: string
  enabled: boolean
  data: Record<string, any>
  customColors?: {
    backgroundColor?: string
    textColor?: string
    primaryColor?: string
  }
}

interface LandingFormField {
  id: string
  label: string
  type: FieldType
  placeholder: string
  required: boolean
  options?: string
}

interface FormSettings {
  backgroundColor: string
  textColor: string
  buttonColor: string
  buttonTextColor: string
  borderColor: string
  borderRadius: number
  padding: number
  labelColor: string
}

interface ThemeSettings {
  primary: string
  accent: string
  background: string
  text: string
  fontFamily: string
  radius: number
  sectionSpacing: number
  containerWidth: number
  useGradient: boolean
  gradientAngle: number
}

interface FloatingCTA {
  enabled: boolean
  label: string
  body: string
  button: string
  whatsappLink?: string
  telegramLink?: string
  showWhatsApp: boolean
  showTelegram: boolean
}

interface AutomationSettings {
  autoResponder: boolean
  utmTracking: boolean
  leadScoring: boolean
  aiCopy: boolean
  abTesting: boolean
}

const createId = () => Math.random().toString(36).slice(2, 9)

const defaultTheme: ThemeSettings = {
  primary: "#1d4ed8",
  accent: "#0ea5e9",
  background: "#ffffff",
  text: "#0f172a",
  fontFamily: "Inter, sans-serif",
  radius: 32,
  sectionSpacing: 48,
  containerWidth: 1100,
  useGradient: true,
  gradientAngle: 130,
}

const getDefaultFloatingCta = (): FloatingCTA => ({
  enabled: true,
  label: "Precisa de ajuda?",
  body: "Um especialista responde em até 5 minutos.",
  button: "Conversar com o time",
  whatsappLink: "",
  telegramLink: "",
  showWhatsApp: true,
  showTelegram: true,
})

const defaultAutomations: AutomationSettings = {
  autoResponder: true,
  utmTracking: true,
  leadScoring: true,
  aiCopy: true,
  abTesting: false,
}

const defaultSectionNames: Record<SectionType, string> = {
  hero: "Hero",
  features: "Diferenciais",
  testimonials: "Prova social",
  pricing: "Planos",
  faq: "FAQ",
  cta: "Call to Action",
  custom: "Bloco personalizado",
}

const createSectionTemplate = (type: SectionType): LandingSection => {
  switch (type) {
    case "hero":
      return {
        id: createId(),
        type,
        name: defaultSectionNames[type],
        enabled: true,
        data: {
          eyebrow: "Nova coleção SaaS 2025",
          title: "Transforme tráfego frio em leads qualificados",
          description: "Monte páginas ultra personalizadas, conecte formulários inteligentes e sincronize tudo com seu CRM sem escrever uma linha de código.",
          badge: "✨ Integra com WhatsApp & Telegram",
          primaryCta: "Publicar landing agora",
          secondaryCta: "Visualizar modelos",
          stats: [
            { id: createId(), label: "Taxa média de conversão", value: "28%" },
            { id: createId(), label: "Páginas ativas", value: "37 projetos" },
          ],
          mediaStyle: "glass",
        },
      }
    case "features":
      return {
        id: createId(),
        type,
        name: defaultSectionNames[type],
        enabled: true,
        data: {
          columns: 2,
          items: [
            { id: createId(), emoji: "⚡️", title: "Componentes dinâmicos", description: "Blocos responsivos com timers, abas, accordions e comparativos." },
            { id: createId(), emoji: "🎯", title: "Personalização por audiência", description: "Troque textos e ofertas conforme UTM, localização ou estágio do funil." },
            { id: createId(), emoji: "🧠", title: "Sugestões com IA", description: "Gere variações de texto com base em objetivos de campanha e persona." },
            { id: createId(), emoji: "🔁", title: "Experimentos nativos", description: "Dispare testes A/B, monitore métricas e promova o vencedor em 1 clique." },
          ],
        },
      }
    case "testimonials":
      return {
        id: createId(),
        type,
        name: defaultSectionNames[type],
        enabled: true,
        data: {
          items: [
            { id: createId(), name: "Camila Duarte", role: "Head de Growth • VoeMais", quote: "Em duas semanas substituímos 6 ferramentas. As landing pages ficaram mais leves, com analytics em tempo real." },
            { id: createId(), name: "Pedro Lima", role: "COO • NexClinic", quote: "Duplicamos a taxa de conversão do trial ajustando o conteúdo por jornada diretamente no builder." },
          ],
        },
      }
    case "pricing":
      return {
        id: createId(),
        type,
        name: defaultSectionNames[type],
        enabled: true,
        data: {
          plans: [
            {
              id: createId(),
              name: "Launch",
              price: "R$ 89/mês",
              description: "Ideal para validar ofertas rapidamente.",
              features: ["Até 5 landings publicadas", "Formulários com lógica condicional", "Exportação para CSV/CRM"],
            },
            {
              id: createId(),
              name: "Scale",
              price: "R$ 219/mês",
              description: "Para squads de growth e times de vendas.",
              features: ["Landings ilimitadas", "Biblioteca de blocos compartilhada", "Integrações premium e webhooks"],
            },
          ],
        },
      }
    case "faq":
      return {
        id: createId(),
        type,
        name: defaultSectionNames[type],
        enabled: true,
        data: {
          items: [
            { id: createId(), question: "Posso publicar em domínios diferentes?", answer: "Sim. Configure múltiplos domínios, subdomínios e subpastas com SSL automático." },
            { id: createId(), question: "Existe limite de visitantes?", answer: "Não limitamos visitas nem pageviews. Foque apenas em escalar suas campanhas." },
          ],
        },
      }
    case "cta":
      return {
        id: createId(),
        type,
        name: defaultSectionNames[type],
        enabled: true,
        data: {
          title: "Pronto para lançar a próxima campanha?",
          description: "Crie landing pages, integre formulários, acompanhe métricas e envie cada lead direto para o pipeline.",
          button: "Começar agora",
        },
      }
    case "custom":
    default:
      return {
        id: createId(),
        type: "custom",
        name: defaultSectionNames.custom,
        enabled: true,
        data: {
          content: "Escreva conteúdo personalizado, cole código de widgets externos ou incorpore contadores, mapas e catálogos.",
        },
      }
  }
}

const getInitialSections = () => [
  createSectionTemplate("hero"),
  createSectionTemplate("features"),
  createSectionTemplate("testimonials"),
  createSectionTemplate("pricing"),
  createSectionTemplate("faq"),
  createSectionTemplate("cta"),
]

const getInitialFormFields = (): LandingFormField[] => [
  { id: createId(), label: "Nome completo", type: "text", placeholder: "Digite seu nome", required: true },
  { id: createId(), label: "E-mail corporativo", type: "email", placeholder: "nome@empresa.com", required: true },
  { id: createId(), label: "Telefone/WhatsApp", type: "phone", placeholder: "(11) 99999-9999", required: false },
  { id: createId(), label: "Objetivo da campanha", type: "textarea", placeholder: "Conte como podemos ajudar", required: false },
]

const copyDictionary = {
  "pt-BR": {
    pageTitle: "Criador de Landing Pages",
    pageSubtitle: "Construa páginas completas sem sair da área de Leads. Controle o design, blocos, formulários e automações em um único lugar.",
    saveDraft: "Salvar rascunho",
    exportConfig: "Exportar JSON",
    reset: "Resetar layout",
    previewShare: "Copiar link de prévia",
    generalHeading: "Tema e identidade visual",
    generalDescription: "Escolha cores, fontes e espaçamentos para manter a página alinhada à marca.",
    layoutHeading: "Layout",
    themePrimary: "Cor primária",
    themeAccent: "Cor de destaque",
    themeBackground: "Cor de fundo",
    themeText: "Cor do texto",
    themeFont: "Tipografia",
    themeRadius: "Arredondamento global",
    themeSpacing: "Espaçamento entre blocos",
    themeWidth: "Largura máxima",
    themeGradient: "Usar gradiente hero",
    floatingHeading: "Widget de contato rápido",
    floatingLabel: "Título",
    floatingBody: "Mensagem",
    floatingButton: "Texto do botão",
    sectionsHeading: "Seções ativas",
    sectionsDescription: "Reordene, duplique e personalize cada bloco.",
    addSection: "Adicionar seção",
    sectionNameLabel: "Nome da seção",
    sectionStatusEnabled: "Visível",
    sectionStatusDisabled: "Oculto",
    paletteHeading: "Biblioteca de blocos",
    paletteDescription: "Arraste para o canvas ou clique para adicionar rapidamente.",
    dropHint: "Solte aqui para adicionar o bloco selecionado",
    dragHint: "Arraste blocos, clique para editar e mantenha a prévia sempre visível.",
    inlineToolbar: {
      edit: "Editar",
      duplicate: "Duplicar",
      hide: "Ocultar",
      remove: "Remover",
    },
    sectionActions: {
      moveUp: "Subir",
      moveDown: "Descer",
      duplicate: "Duplicar",
      remove: "Remover",
    },
    sectionTypes: {
      hero: "Hero",
      features: "Diferenciais",
      testimonials: "Prova social",
      pricing: "Planos",
      faq: "FAQ",
      cta: "Chamada final",
      custom: "Bloco personalizado",
    },
    sectionDescriptions: {
      hero: "Apresente título, descrição e CTAs principais.",
      features: "Grade com cartões de diferenciais e ícones.",
      testimonials: "Depoimentos e provas sociais.",
      pricing: "Planos e benefícios comparativos.",
      faq: "Perguntas frequentes em acordeão.",
      cta: "Chamada final com botão de conversão.",
      custom: "Bloco livre para qualquer conteúdo.",
    },
    editorHeading: "Editor da seção selecionada",
    editorEmpty: "Selecione ou crie uma seção para editar.",
    hero: {
      eyebrow: "Etiqueta superior",
      title: "Título principal",
      description: "Descrição",
      badge: "Destaque",
      primaryCta: "CTA primário",
      secondaryCta: "CTA secundário",
      stats: "Métricas em destaque",
      addStat: "Adicionar métrica",
    },
    features: {
      columns: "Colunas",
      title: "Título",
      description: "Descrição",
      emoji: "Emoji",
      add: "Adicionar diferencial",
    },
    testimonials: {
      name: "Nome",
      role: "Cargo/empresa",
      quote: "Depoimento",
      add: "Adicionar depoimento",
    },
    pricing: {
      name: "Plano",
      price: "Valor",
      description: "Descrição curta",
      features: "Benefícios (linhas separadas)",
      add: "Adicionar plano",
    },
    faq: {
      question: "Pergunta",
      answer: "Resposta",
      add: "Adicionar pergunta",
    },
    cta: {
      title: "Título",
      description: "Descrição",
      button: "Texto do botão",
    },
    custom: {
      content: "Conteúdo livre",
    },
    formsHeading: "Formulário de captura",
    formsDescription: "Defina campos, obrigatoriedade e placeholders.",
    formFieldLabel: "Rótulo",
    formFieldPlaceholder: "Placeholder",
    formFieldRequired: "Obrigatório",
    formFieldOptions: "Opções (separadas por vírgula)",
    addField: "Adicionar campo",
    fieldTypes: {
      text: "Texto curto",
      email: "E-mail",
      phone: "Telefone",
      textarea: "Texto longo",
      select: "Lista suspensa",
    },
    automationsHeading: "Automação e experimentos",
    automationsDescription: "Ative recursos avançados para a jornada do lead.",
    automations: {
      autoResponder: "Enviar resposta automática",
      utmTracking: "Mapear UTMs automaticamente",
      leadScoring: "Pontuar leads com base no formulário",
      aiCopy: "Sugestões de texto com IA",
      abTesting: "Preparar teste A/B",
    },
    previewHeading: "Pré-visualização em tempo real",
    previewDescription: "Veja como a landing aparece em diferentes dispositivos.",
    deviceDesktop: "Desktop",
    deviceMobile: "Mobile",
    statusSaved: "Rascunho salvo no navegador.",
    statusReset: "Configurações restauradas.",
    statusExported: "Arquivo JSON gerado.",
    shareCopied: "Link copiado para a área de transferência.",
    formPreviewHeading: "Experiência do formulário",
    analyticsHeading: "Insights rápidos",
    analyticsDescription: "Valide hipóteses antes de publicar.",
  },
  "en-US": {
    pageTitle: "Landing Page Builder",
    pageSubtitle: "Design complete pages without leaving Leads. Control branding, blocks, forms and automations from a single workspace.",
    saveDraft: "Save draft",
    exportConfig: "Export JSON",
    reset: "Reset layout",
    previewShare: "Copy preview link",
    generalHeading: "Theme & branding",
    generalDescription: "Pick colors, fonts and spacing to stay on-brand.",
    layoutHeading: "Layout",
    themePrimary: "Primary color",
    themeAccent: "Accent color",
    themeBackground: "Background color",
    themeText: "Text color",
    themeFont: "Typography",
    themeRadius: "Global radius",
    themeSpacing: "Section spacing",
    themeWidth: "Max width",
    themeGradient: "Use gradient hero",
    floatingHeading: "Quick contact widget",
    floatingLabel: "Title",
    floatingBody: "Message",
    floatingButton: "Button label",
    sectionsHeading: "Active sections",
    sectionsDescription: "Reorder, duplicate and customize each block.",
    addSection: "Add section",
    sectionNameLabel: "Section name",
    sectionStatusEnabled: "Visible",
    sectionStatusDisabled: "Hidden",
    paletteHeading: "Block library",
    paletteDescription: "Drag items onto the canvas or click to add instantly.",
    dropHint: "Drop the block here to add it to the page",
    dragHint: "Drag blocks, click to edit, and keep the preview within reach.",
    inlineToolbar: {
      edit: "Edit",
      duplicate: "Duplicate",
      hide: "Hide",
      remove: "Remove",
    },
    sectionActions: {
      moveUp: "Move up",
      moveDown: "Move down",
      duplicate: "Duplicate",
      remove: "Remove",
    },
    sectionTypes: {
      hero: "Hero",
      features: "Highlights",
      testimonials: "Social proof",
      pricing: "Plans",
      faq: "FAQ",
      cta: "CTA",
      custom: "Custom block",
    },
    sectionDescriptions: {
      hero: "Showcase headline, description and CTAs.",
      features: "Grid of highlights with icons.",
      testimonials: "Testimonials and social proof.",
      pricing: "Plans with comparable benefits.",
      faq: "Frequently asked questions accordion.",
      cta: "Final call-to-action with button.",
      custom: "Free-form block for any content.",
    },
    editorHeading: "Selected section editor",
    editorEmpty: "Select or create a section to start editing.",
    hero: {
      eyebrow: "Eyebrow",
      title: "Headline",
      description: "Description",
      badge: "Badge",
      primaryCta: "Primary CTA",
      secondaryCta: "Secondary CTA",
      stats: "Key stats",
      addStat: "Add metric",
    },
    features: {
      columns: "Columns",
      title: "Title",
      description: "Description",
      emoji: "Emoji",
      add: "Add highlight",
    },
    testimonials: {
      name: "Name",
      role: "Role/company",
      quote: "Quote",
      add: "Add testimonial",
    },
    pricing: {
      name: "Plan",
      price: "Price",
      description: "Short description",
      features: "Benefits (one per line)",
      add: "Add plan",
    },
    faq: {
      question: "Question",
      answer: "Answer",
      add: "Add question",
    },
    cta: {
      title: "Title",
      description: "Description",
      button: "Button label",
    },
    custom: {
      content: "Free content",
    },
    formsHeading: "Capture form",
    formsDescription: "Control fields, placeholders and requirements.",
    formFieldLabel: "Label",
    formFieldPlaceholder: "Placeholder",
    formFieldRequired: "Required",
    formFieldOptions: "Options (comma separated)",
    addField: "Add field",
    fieldTypes: {
      text: "Short text",
      email: "Email",
      phone: "Phone",
      textarea: "Long text",
      select: "Dropdown",
    },
    automationsHeading: "Automation & experiments",
    automationsDescription: "Activate advanced capabilities for the lead journey.",
    automations: {
      autoResponder: "Send auto responder",
      utmTracking: "Track UTMs automatically",
      leadScoring: "Score leads based on form",
      aiCopy: "AI copy suggestions",
      abTesting: "Prepare A/B test",
    },
    previewHeading: "Live preview",
    previewDescription: "Validate desktop and mobile experiences instantly.",
    deviceDesktop: "Desktop",
    deviceMobile: "Mobile",
    statusSaved: "Draft saved locally.",
    statusReset: "Layout restored.",
    statusExported: "JSON file generated.",
    shareCopied: "Preview link copied.",
    formPreviewHeading: "Form experience",
    analyticsHeading: "Quick insights",
    analyticsDescription: "Validate hypotheses before publishing.",
  },
}

const fontOptions = [
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "DM Sans", value: "'DM Sans', sans-serif" },
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
]

export default function LandingBuilderPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  const locale = useLocale()
  const copy = React.useMemo(() => copyDictionary[locale as "pt-BR" | "en-US"] ?? copyDictionary["en-US"], [locale])
  const leadsT = useTranslations("Leads")
  const onLabel = locale === "pt-BR" ? "Ativo" : "On"
  const offLabel = locale === "pt-BR" ? "Inativo" : "Off"
  const enabledLabel = locale === "pt-BR" ? "Ligado" : "Enabled"
  const disabledLabel = locale === "pt-BR" ? "Desligado" : "Disabled"
  const gradientHelper = locale === "pt-BR" ? "Gradient + vidro confere mais profundidade ao hero." : "Gradient + glass adds depth to the hero."
  const floatingHelper = locale === "pt-BR" ? "Convide o lead para conversar durante a rolagem." : "Invite leads to chat while scrolling."
  const removeLabel = locale === "pt-BR" ? "Remover" : "Remove"
  const formSubmitLabel = locale === "pt-BR" ? "Enviar formulário" : "Send form"

  const memoizedInitialSections = React.useMemo(() => getInitialSections(), [])
  const memoizedInitialFields = React.useMemo(() => getInitialFormFields(), [])

  const [theme, setTheme] = React.useState<ThemeSettings>(defaultTheme)
  const [sections, setSections] = React.useState<LandingSection[]>(memoizedInitialSections)
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(memoizedInitialSections[0]?.id ?? null)
  const [formFields, setFormFields] = React.useState<LandingFormField[]>(memoizedInitialFields)
  const [floatingCta, setFloatingCta] = React.useState<FloatingCTA>(() => getDefaultFloatingCta())
  const [draggingSectionType, setDraggingSectionType] = React.useState<SectionType | null>(null)
  const [isCanvasDragOver, setIsCanvasDragOver] = React.useState(false)
  const [automations, setAutomations] = React.useState<AutomationSettings>(defaultAutomations)
  const [devicePreview, setDevicePreview] = React.useState<"desktop" | "mobile">("desktop")
  const [feedback, setFeedback] = React.useState<{ type: "success" | "warning"; message: string } | null>(null)
  const [isAddElementModalOpen, setIsAddElementModalOpen] = React.useState(false)
  const [isEditSectionModalOpen, setIsEditSectionModalOpen] = React.useState(false)
  const [isThemeModalOpen, setIsThemeModalOpen] = React.useState(false)
  const [isFormSettingsModalOpen, setIsFormSettingsModalOpen] = React.useState(false)
  const [isFloatingCtaSettingsOpen, setIsFloatingCtaSettingsOpen] = React.useState(false)
  const [formSettings, setFormSettings] = React.useState<FormSettings>({
    backgroundColor: "#ffffff",
    textColor: "#0f172a",
    buttonColor: "#1d4ed8",
    buttonTextColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 24,
    labelColor: "#64748b",
  })

  // CRITICAL: Use uncontrolled input + ref for color pickers (ZERO re-renders during drag!)
  const themePrimaryColorRef = React.useRef<HTMLInputElement>(null)
  const themeAccentColorRef = React.useRef<HTMLInputElement>(null)
  const themeBackgroundColorRef = React.useRef<HTMLInputElement>(null)
  const themeTextColorRef = React.useRef<HTMLInputElement>(null)
  const formBgColorRef = React.useRef<HTMLInputElement>(null)
  const formTextColorRef = React.useRef<HTMLInputElement>(null)
  const formButtonColorRef = React.useRef<HTMLInputElement>(null)
  const formButtonTextColorRef = React.useRef<HTMLInputElement>(null)
  const formBorderColorRef = React.useRef<HTMLInputElement>(null)
  const formLabelColorRef = React.useRef<HTMLInputElement>(null)
  const sectionBgColorRef = React.useRef<HTMLInputElement>(null)
  const sectionTextColorRef = React.useRef<HTMLInputElement>(null)
  const sectionPrimaryColorRef = React.useRef<HTMLInputElement>(null)

  // Debounce timers
  const themePrimaryDebounce = React.useRef<NodeJS.Timeout | null>(null)
  const themeAccentDebounce = React.useRef<NodeJS.Timeout | null>(null)
  const themeBgDebounce = React.useRef<NodeJS.Timeout | null>(null)
  const themeTextDebounce = React.useRef<NodeJS.Timeout | null>(null)
  const formBgDebounce = React.useRef<NodeJS.Timeout | null>(null)
  const formTextDebounce = React.useRef<NodeJS.Timeout | null>(null)
  const formButtonDebounce = React.useRef<NodeJS.Timeout | null>(null)
  const formButtonTextDebounce = React.useRef<NodeJS.Timeout | null>(null)
  const formBorderDebounce = React.useRef<NodeJS.Timeout | null>(null)
  const formLabelDebounce = React.useRef<NodeJS.Timeout | null>(null)
  const sectionBgDebounce = React.useRef<NodeJS.Timeout | null>(null)
  const sectionTextDebounce = React.useRef<NodeJS.Timeout | null>(null)
  const sectionPrimaryDebounce = React.useRef<NodeJS.Timeout | null>(null)

  // Cleanup debounce timers on unmount
  React.useEffect(() => {
    return () => {
      const timers = [
        themePrimaryDebounce, themeAccentDebounce, themeBgDebounce, themeTextDebounce,
        formBgDebounce, formTextDebounce, formButtonDebounce, formButtonTextDebounce,
        formBorderDebounce, formLabelDebounce, sectionBgDebounce, sectionTextDebounce, sectionPrimaryDebounce
      ]
      timers.forEach(timer => {
        if (timer.current) clearTimeout(timer.current)
      })
    }
  }, [])

  // Debounced handlers for theme colors
  const handleThemePrimaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (themePrimaryDebounce.current) clearTimeout(themePrimaryDebounce.current)
    themePrimaryDebounce.current = setTimeout(() => {
      setTheme((prev) => ({ ...prev, primary: value }))
    }, 300)
  }

  const handleThemeAccentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (themeAccentDebounce.current) clearTimeout(themeAccentDebounce.current)
    themeAccentDebounce.current = setTimeout(() => {
      setTheme((prev) => ({ ...prev, accent: value }))
    }, 300)
  }

  const handleThemeBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (themeBgDebounce.current) clearTimeout(themeBgDebounce.current)
    themeBgDebounce.current = setTimeout(() => {
      setTheme((prev) => ({ ...prev, background: value }))
    }, 300)
  }

  const handleThemeTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (themeTextDebounce.current) clearTimeout(themeTextDebounce.current)
    themeTextDebounce.current = setTimeout(() => {
      setTheme((prev) => ({ ...prev, text: value }))
    }, 300)
  }

  // Debounced handlers for form colors
  const handleFormBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (formBgDebounce.current) clearTimeout(formBgDebounce.current)
    formBgDebounce.current = setTimeout(() => {
      setFormSettings((prev) => ({ ...prev, backgroundColor: value }))
    }, 300)
  }

  const handleFormTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (formTextDebounce.current) clearTimeout(formTextDebounce.current)
    formTextDebounce.current = setTimeout(() => {
      setFormSettings((prev) => ({ ...prev, textColor: value }))
    }, 300)
  }

  const handleFormButtonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (formButtonDebounce.current) clearTimeout(formButtonDebounce.current)
    formButtonDebounce.current = setTimeout(() => {
      setFormSettings((prev) => ({ ...prev, buttonColor: value }))
    }, 300)
  }

  const handleFormButtonTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (formButtonTextDebounce.current) clearTimeout(formButtonTextDebounce.current)
    formButtonTextDebounce.current = setTimeout(() => {
      setFormSettings((prev) => ({ ...prev, buttonTextColor: value }))
    }, 300)
  }

  const handleFormBorderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (formBorderDebounce.current) clearTimeout(formBorderDebounce.current)
    formBorderDebounce.current = setTimeout(() => {
      setFormSettings((prev) => ({ ...prev, borderColor: value }))
    }, 300)
  }

  const handleFormLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (formLabelDebounce.current) clearTimeout(formLabelDebounce.current)
    formLabelDebounce.current = setTimeout(() => {
      setFormSettings((prev) => ({ ...prev, labelColor: value }))
    }, 300)
  }

  // Debounced handlers for section colors
  const handleSectionBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const currentSectionId = selectedSectionId
    if (sectionBgDebounce.current) clearTimeout(sectionBgDebounce.current)
    sectionBgDebounce.current = setTimeout(() => {
      if (currentSectionId) {
        setSections((prev) =>
          prev.map((section) =>
            section.id === currentSectionId
              ? {
                  ...section,
                  customColors: {
                    ...section.customColors,
                    backgroundColor: value,
                  },
                }
              : section,
          ),
        )
      }
    }, 300)
  }

  const handleSectionTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const currentSectionId = selectedSectionId
    if (sectionTextDebounce.current) clearTimeout(sectionTextDebounce.current)
    sectionTextDebounce.current = setTimeout(() => {
      if (currentSectionId) {
        setSections((prev) =>
          prev.map((section) =>
            section.id === currentSectionId
              ? {
                  ...section,
                  customColors: {
                    ...section.customColors,
                    textColor: value,
                  },
                }
              : section,
          ),
        )
      }
    }, 300)
  }

  const handleSectionPrimaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const currentSectionId = selectedSectionId
    if (sectionPrimaryDebounce.current) clearTimeout(sectionPrimaryDebounce.current)
    sectionPrimaryDebounce.current = setTimeout(() => {
      if (currentSectionId) {
        setSections((prev) =>
          prev.map((section) =>
            section.id === currentSectionId
              ? {
                  ...section,
                  customColors: {
                    ...section.customColors,
                    primaryColor: value,
                  },
                }
              : section,
          ),
        )
      }
    }, 300)
  }

  // Initialize color picker refs when modals open
  React.useEffect(() => {
    if (isThemeModalOpen) {
      if (themePrimaryColorRef.current) themePrimaryColorRef.current.value = theme.primary
      if (themeAccentColorRef.current) themeAccentColorRef.current.value = theme.accent
      if (themeBackgroundColorRef.current) themeBackgroundColorRef.current.value = theme.background
      if (themeTextColorRef.current) themeTextColorRef.current.value = theme.text
    }
  }, [isThemeModalOpen, theme.primary, theme.accent, theme.background, theme.text])

  React.useEffect(() => {
    if (isFormSettingsModalOpen) {
      if (formBgColorRef.current) formBgColorRef.current.value = formSettings.backgroundColor
      if (formTextColorRef.current) formTextColorRef.current.value = formSettings.textColor
      if (formButtonColorRef.current) formButtonColorRef.current.value = formSettings.buttonColor
      if (formButtonTextColorRef.current) formButtonTextColorRef.current.value = formSettings.buttonTextColor
      if (formBorderColorRef.current) formBorderColorRef.current.value = formSettings.borderColor
      if (formLabelColorRef.current) formLabelColorRef.current.value = formSettings.labelColor
    }
  }, [isFormSettingsModalOpen, formSettings])

  React.useEffect(() => {
    if (isEditSectionModalOpen && selectedSectionId) {
      const section = sections.find((s) => s.id === selectedSectionId)
      if (section) {
        if (sectionBgColorRef.current) sectionBgColorRef.current.value = section.customColors?.backgroundColor || theme.background
        if (sectionTextColorRef.current) sectionTextColorRef.current.value = section.customColors?.textColor || theme.text
        if (sectionPrimaryColorRef.current) sectionPrimaryColorRef.current.value = section.customColors?.primaryColor || theme.primary
      }
    }
  }, [isEditSectionModalOpen, selectedSectionId, sections, theme.background, theme.text, theme.primary])

  const paletteItems = React.useMemo(
    () =>
      (Object.keys(copy.sectionTypes) as SectionType[]).map((type) => ({
        type,
        label: copy.sectionTypes[type],
        description: copy.sectionDescriptions?.[type] ?? "",
      })),
    [copy],
  )

  const paletteIcons: Record<SectionType, JSX.Element> = {
    hero: <Monitor className="h-4 w-4" />,
    features: <Layers3 className="h-4 w-4" />,
    testimonials: <MessageCircle className="h-4 w-4" />,
    pricing: <CreditCard className="h-4 w-4" />,
    faq: <Info className="h-4 w-4" />,
    cta: <Sparkles className="h-4 w-4" />,
    custom: <Wand2 className="h-4 w-4" />,
  }
  const inlineToolbar = copy.inlineToolbar ?? { edit: "Edit", duplicate: "Duplicate", hide: "Hide", remove: "Remove" }

  const storageKey = React.useMemo(() => `landing-builder-${org}`, [org])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.theme) setTheme(parsed.theme)
        if (parsed.sections) {
          setSections(parsed.sections)
          setSelectedSectionId(parsed.sections[0]?.id ?? null)
        }
        if (parsed.formFields) setFormFields(parsed.formFields)
        if (parsed.floatingCta) setFloatingCta(parsed.floatingCta)
        if (parsed.automations) setAutomations(parsed.automations)
      }
    } catch (error) {
      console.error("Failed to load builder draft", error)
    }
  }, [storageKey])

  React.useEffect(() => {
    if (!feedback) return
    const timeout = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timeout)
  }, [feedback])

  const selectedSection = sections.find((section) => section.id === selectedSectionId) ?? sections[0]

  const persistDraft = React.useCallback(() => {
    if (typeof window === "undefined") return
    const payload = {
      theme,
      sections,
      formFields,
      floatingCta,
      automations,
    }
    localStorage.setItem(storageKey, JSON.stringify(payload))
    setFeedback({ type: "success", message: copy.statusSaved })
  }, [theme, sections, formFields, floatingCta, automations, storageKey, copy.statusSaved])

  const resetBuilder = () => {
    setTheme(defaultTheme)
    const initialSections = getInitialSections()
    setSections(initialSections)
    setSelectedSectionId(initialSections[0]?.id ?? null)
    setFormFields(getInitialFormFields())
    setFloatingCta(getDefaultFloatingCta())
    setAutomations(defaultAutomations)
    setFeedback({ type: "warning", message: copy.statusReset })
  }

  const exportJson = () => {
    const payload = {
      theme,
      sections,
      formFields,
      floatingCta,
      automations,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `landing-builder-${org}.json`
    link.click()
    URL.revokeObjectURL(url)
    setFeedback({ type: "success", message: copy.statusExported })
  }

  const copyPreviewLink = () => {
    if (typeof window === "undefined") return
    const previewLink = `${window.location.origin}/${org}/leads/landing-builder?preview=1`
    navigator.clipboard.writeText(previewLink).then(() => {
      setFeedback({ type: "success", message: copy.shareCopied })
    })
  }

  const updateSectionData = (id: string, updater: (data: Record<string, any>) => Record<string, any>) => {
    setSections((prev) =>
      prev.map((section) => (section.id === id ? { ...section, data: updater(section.data) } : section)),
    )
  }

  const updateSectionName = (id: string, name: string) => {
    setSections((prev) => prev.map((section) => (section.id === id ? { ...section, name } : section)))
  }

  const toggleSectionVisibility = (id: string) => {
    setSections((prev) =>
      prev.map((section) => (section.id === id ? { ...section, enabled: !section.enabled } : section)),
    )
  }

  const moveSection = (id: string, direction: "up" | "down") => {
    setSections((prev) => {
      const index = prev.findIndex((section) => section.id === id)
      if (index === -1) return prev
      const targetIndex = direction === "up" ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.length) return prev
      const clone = [...prev]
      const [item] = clone.splice(index, 1)
      clone.splice(targetIndex, 0, item)
      return clone
    })
  }

  const duplicateSection = (id: string) => {
    setSections((prev) => {
      const section = prev.find((item) => item.id === id)
      if (!section) return prev
      const duplicated: LandingSection = {
        ...section,
        id: createId(),
        name: `${section.name}*`,
        data: JSON.parse(JSON.stringify(section.data)),
      }
      const insertIndex = prev.findIndex((item) => item.id === id) + 1
      const draft = [...prev]
      draft.splice(insertIndex, 0, duplicated)
      setSelectedSectionId(duplicated.id)
      return draft
    })
  }

  const removeSection = (id: string) => {
    setSections((prev) => {
      if (prev.length === 1) return prev
      const filtered = prev.filter((section) => section.id !== id)
      if (!filtered.find((section) => section.id === selectedSectionId)) {
        setSelectedSectionId(filtered[0]?.id ?? null)
      }
      return filtered
    })
  }

  const addSection = (type: SectionType) => {
    setSections((prev) => {
      const newSection = createSectionTemplate(type)
      const next = [...prev, newSection]
      setSelectedSectionId(newSection.id)
      return next
    })
  }

  const handlePaletteDragStart = (event: React.DragEvent, type: SectionType) => {
    setDraggingSectionType(type)
    event.dataTransfer.setData("text/plain", type)
    event.dataTransfer.effectAllowed = "copy"
  }

  const handlePaletteDragEnd = () => {
    setDraggingSectionType(null)
    setIsCanvasDragOver(false)
  }

  const handleCanvasDragOver = (event: React.DragEvent) => {
    if (draggingSectionType || event.dataTransfer.types.includes("text/plain")) {
      event.preventDefault()
      if (!isCanvasDragOver) {
        setIsCanvasDragOver(true)
      }
    }
  }

  const handleCanvasDragLeave = () => {
    if (isCanvasDragOver) {
      setIsCanvasDragOver(false)
    }
  }

  const handleCanvasDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const typeFromData = event.dataTransfer.getData("text/plain") as SectionType
    const typeToAdd = draggingSectionType || typeFromData
    if (typeToAdd) {
      addSection(typeToAdd)
    }
    setDraggingSectionType(null)
    setIsCanvasDragOver(false)
  }

  const addFormField = (type: FieldType) => {
    setFormFields((prev) => [
      ...prev,
      {
        id: createId(),
        type,
        label: `${copy.fieldTypes[type]} ${prev.length + 1}`,
        placeholder: copy.formFieldPlaceholder,
        required: false,
      },
    ])
  }

  const deviceButton = (mode: "desktop" | "mobile", label: string, Icon: typeof Monitor) => (
    <Button
      key={mode}
      variant={devicePreview === mode ? "default" : "ghost"}
      size="sm"
      className={cn(
        "gap-2 cursor-pointer transition-all",
        devicePreview === mode 
          ? "bg-slate-900 text-white shadow-sm hover:bg-slate-800" 
          : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
      )}
      onClick={() => setDevicePreview(mode)}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )

  const renderSectionEditor = () => {
    const currentSelectedSection = sections.find((section) => section.id === selectedSectionId) ?? sections[0]
    
    if (!currentSelectedSection) {
      return <p className="text-sm text-muted-foreground">{copy.editorEmpty}</p>
    }

    const { id, type, data, name } = currentSelectedSection

    const updateSectionColors = (colors: Partial<LandingSection["customColors"]>) => {
      setSections((prev) =>
        prev.map((section) =>
          section.id === id
            ? {
                ...section,
                customColors: {
                  ...section.customColors,
                  ...colors,
                },
              }
            : section,
        ),
      )
    }

    return (
      <div className="space-y-4">
        <div>
          <Label>{copy.sectionNameLabel}</Label>
          <Input value={name} onChange={(event) => updateSectionName(id, event.target.value)} />
        </div>
        <Separator />
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Cores Personalizadas</Label>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs">Cor de Fundo</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={sectionBgColorRef}
                  type="color"
                  defaultValue={currentSelectedSection.customColors?.backgroundColor || theme.background}
                  onChange={handleSectionBgChange}
                  className="h-9 w-16 cursor-pointer rounded border border-input"
                />
                <Input
                  type="text"
                  value={currentSelectedSection.customColors?.backgroundColor || theme.background}
                  onChange={(event) => {
                    const value = event.target.value
                    if (/^#[0-9A-F]{6}$/i.test(value)) {
                      updateSectionColors({ backgroundColor: value })
                      if (sectionBgColorRef.current) sectionBgColorRef.current.value = value
                    }
                  }}
                  className="flex-1 text-xs"
                  placeholder="Auto"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cor do Texto</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={sectionTextColorRef}
                  type="color"
                  defaultValue={currentSelectedSection.customColors?.textColor || theme.text}
                  onChange={handleSectionTextChange}
                  className="h-9 w-16 cursor-pointer rounded border border-input"
                />
                <Input
                  type="text"
                  value={currentSelectedSection.customColors?.textColor || theme.text}
                  onChange={(event) => {
                    const value = event.target.value
                    if (/^#[0-9A-F]{6}$/i.test(value)) {
                      updateSectionColors({ textColor: value })
                      if (sectionTextColorRef.current) sectionTextColorRef.current.value = value
                    }
                  }}
                  className="flex-1 text-xs"
                  placeholder="Auto"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cor Primária</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={sectionPrimaryColorRef}
                  type="color"
                  defaultValue={currentSelectedSection.customColors?.primaryColor || theme.primary}
                  onChange={handleSectionPrimaryChange}
                  className="h-9 w-16 cursor-pointer rounded border border-input"
                />
                <Input
                  type="text"
                  value={currentSelectedSection.customColors?.primaryColor || theme.primary}
                  onChange={(event) => {
                    const value = event.target.value
                    if (/^#[0-9A-F]{6}$/i.test(value)) {
                      updateSectionColors({ primaryColor: value })
                      if (sectionPrimaryColorRef.current) sectionPrimaryColorRef.current.value = value
                    }
                  }}
                  className="flex-1 text-xs"
                  placeholder="Auto"
                />
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer text-xs"
            onClick={() => {
              setSections((prev) =>
                prev.map((section) => (section.id === id ? { ...section, customColors: undefined } : section)),
              )
            }}
          >
            Resetar para tema global
          </Button>
        </div>
        <Separator />

        {type === "hero" && (
          <div className="space-y-4">
            <div>
              <Label>{copy.hero.eyebrow}</Label>
              <Input value={data.eyebrow} onChange={(event) => updateSectionData(id, (prev) => ({ ...prev, eyebrow: event.target.value }))} />
            </div>
            <div>
              <Label>{copy.hero.title}</Label>
              <Input value={data.title} onChange={(event) => updateSectionData(id, (prev) => ({ ...prev, title: event.target.value }))} />
            </div>
            <div>
              <Label>{copy.hero.description}</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={data.description}
                onChange={(event) => updateSectionData(id, (prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>{copy.hero.primaryCta}</Label>
                <Input value={data.primaryCta} onChange={(event) => updateSectionData(id, (prev) => ({ ...prev, primaryCta: event.target.value }))} />
              </div>
              <div>
                <Label>{copy.hero.secondaryCta}</Label>
                <Input value={data.secondaryCta} onChange={(event) => updateSectionData(id, (prev) => ({ ...prev, secondaryCta: event.target.value }))} />
              </div>
            </div>
            <div>
              <Label>{copy.hero.badge}</Label>
              <Input value={data.badge} onChange={(event) => updateSectionData(id, (prev) => ({ ...prev, badge: event.target.value }))} />
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{copy.hero.stats}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() =>
                    updateSectionData(id, (prev) => ({
                      ...prev,
                      stats: [...(prev.stats || []), { id: createId(), label: "Nova métrica", value: "0%" }],
                    }))
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {copy.hero.addStat}
                </Button>
              </div>
              {(data.stats || []).map((stat: any) => (
                <div key={stat.id} className="grid gap-3 md:grid-cols-2">
                  <Input
                    value={stat.label}
                    onChange={(event) =>
                      updateSectionData(id, (prev) => ({
                        ...prev,
                        stats: prev.stats.map((item: any) => (item.id === stat.id ? { ...item, label: event.target.value } : item)),
                      }))
                    }
                    placeholder="Indicador"
                  />
                  <Input
                    value={stat.value}
                    onChange={(event) =>
                      updateSectionData(id, (prev) => ({
                        ...prev,
                        stats: prev.stats.map((item: any) => (item.id === stat.id ? { ...item, value: event.target.value } : item)),
                      }))
                    }
                    placeholder="Valor"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {type === "features" && (
          <div className="space-y-4">
            <div>
              <Label>{copy.features.columns}</Label>
              <Input
                type="number"
                min={1}
                max={3}
                value={data.columns}
                onChange={(event) => updateSectionData(id, (prev) => ({ ...prev, columns: Number(event.target.value) }))}
              />
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{copy.sectionsHeading}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() =>
                    updateSectionData(id, (prev) => ({
                      ...prev,
                      items: [
                        ...(prev.items || []),
                        { id: createId(), emoji: "✨", title: "Novo diferencial", description: "Descreva o benefício." },
                      ],
                    }))
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {copy.features.add}
                </Button>
              </div>
              {(data.items || []).map((feature: any) => (
                <Card key={feature.id} className="border-dashed">
                  <CardContent className="space-y-3 pt-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <Label>{copy.features.emoji}</Label>
                        <Input
                          value={feature.emoji}
                          onChange={(event) =>
                            updateSectionData(id, (prev) => ({
                              ...prev,
                              items: prev.items.map((item: any) =>
                                item.id === feature.id ? { ...item, emoji: event.target.value } : item,
                              ),
                            }))
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>{copy.features.title}</Label>
                        <Input
                          value={feature.title}
                          onChange={(event) =>
                            updateSectionData(id, (prev) => ({
                              ...prev,
                              items: prev.items.map((item: any) =>
                                item.id === feature.id ? { ...item, title: event.target.value } : item,
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{copy.features.description}</Label>
                      <textarea
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={feature.description}
                        onChange={(event) =>
                          updateSectionData(id, (prev) => ({
                            ...prev,
                            items: prev.items.map((item: any) =>
                              item.id === feature.id ? { ...item, description: event.target.value } : item,
                            ),
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {type === "testimonials" && (
          <div className="space-y-4">
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer"
              onClick={() =>
                updateSectionData(id, (prev) => ({
                  ...prev,
                  items: [
                    ...(prev.items || []),
                    { id: createId(), name: "Novo cliente", role: "Cargo", quote: "Compartilhe um depoimento." },
                  ],
                }))
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              {copy.testimonials.add}
            </Button>
            {(data.items || []).map((testimonial: any) => (
              <Card key={testimonial.id} className="border-dashed">
                <CardContent className="space-y-3 pt-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>{copy.testimonials.name}</Label>
                      <Input
                        value={testimonial.name}
                        onChange={(event) =>
                          updateSectionData(id, (prev) => ({
                            ...prev,
                            items: prev.items.map((item: any) =>
                              item.id === testimonial.id ? { ...item, name: event.target.value } : item,
                            ),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>{copy.testimonials.role}</Label>
                      <Input
                        value={testimonial.role}
                        onChange={(event) =>
                          updateSectionData(id, (prev) => ({
                            ...prev,
                            items: prev.items.map((item: any) =>
                              item.id === testimonial.id ? { ...item, role: event.target.value } : item,
                            ),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{copy.testimonials.quote}</Label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={testimonial.quote}
                      onChange={(event) =>
                        updateSectionData(id, (prev) => ({
                          ...prev,
                          items: prev.items.map((item: any) =>
                            item.id === testimonial.id ? { ...item, quote: event.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {type === "pricing" && (
          <div className="space-y-4">
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer"
              onClick={() =>
                updateSectionData(id, (prev) => ({
                  ...prev,
                  plans: [
                    ...(prev.plans || []),
                    {
                      id: createId(),
                      name: "Novo plano",
                      price: "R$ 0/mês",
                      description: "Descreva o plano",
                      features: ["Benefício 1", "Benefício 2"],
                    },
                  ],
                }))
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              {copy.pricing.add}
            </Button>
            {(data.plans || []).map((plan: any) => (
              <Card key={plan.id} className="border-dashed">
                <CardContent className="space-y-3 pt-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>{copy.pricing.name}</Label>
                      <Input
                        value={plan.name}
                        onChange={(event) =>
                          updateSectionData(id, (prev) => ({
                            ...prev,
                            plans: prev.plans.map((item: any) =>
                              item.id === plan.id ? { ...item, name: event.target.value } : item,
                            ),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>{copy.pricing.price}</Label>
                      <Input
                        value={plan.price}
                        onChange={(event) =>
                          updateSectionData(id, (prev) => ({
                            ...prev,
                            plans: prev.plans.map((item: any) =>
                              item.id === plan.id ? { ...item, price: event.target.value } : item,
                            ),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{copy.pricing.description}</Label>
                    <Input
                      value={plan.description}
                      onChange={(event) =>
                        updateSectionData(id, (prev) => ({
                          ...prev,
                          plans: prev.plans.map((item: any) =>
                            item.id === plan.id ? { ...item, description: event.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>{copy.pricing.features}</Label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={(plan.features || []).join("\n")}
                      onChange={(event) =>
                        updateSectionData(id, (prev) => ({
                          ...prev,
                          plans: prev.plans.map((item: any) =>
                            item.id === plan.id ? { ...item, features: event.target.value.split("\n") } : item,
                          ),
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {type === "faq" && (
          <div className="space-y-4">
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer"
              onClick={() =>
                updateSectionData(id, (prev) => ({
                  ...prev,
                  items: [...(prev.items || []), { id: createId(), question: "Nova pergunta", answer: "Escreva a resposta." }],
                }))
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              {copy.faq.add}
            </Button>
            {(data.items || []).map((faq: any) => (
              <Card key={faq.id} className="border-dashed">
                <CardContent className="space-y-3 pt-4">
                  <div>
                    <Label>{copy.faq.question}</Label>
                    <Input
                      value={faq.question}
                      onChange={(event) =>
                        updateSectionData(id, (prev) => ({
                          ...prev,
                          items: prev.items.map((item: any) =>
                            item.id === faq.id ? { ...item, question: event.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>{copy.faq.answer}</Label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={faq.answer}
                      onChange={(event) =>
                        updateSectionData(id, (prev) => ({
                          ...prev,
                          items: prev.items.map((item: any) =>
                            item.id === faq.id ? { ...item, answer: event.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {type === "cta" && (
          <div className="space-y-4">
            <div>
              <Label>{copy.cta.title}</Label>
              <Input value={data.title} onChange={(event) => updateSectionData(id, (prev) => ({ ...prev, title: event.target.value }))} />
            </div>
            <div>
              <Label>{copy.cta.description}</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={data.description}
                onChange={(event) => updateSectionData(id, (prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <div>
              <Label>{copy.cta.button}</Label>
              <Input value={data.button} onChange={(event) => updateSectionData(id, (prev) => ({ ...prev, button: event.target.value }))} />
            </div>
          </div>
        )}

        {type === "custom" && (
          <div>
            <Label>{copy.custom.content}</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={6}
              value={data.content}
              onChange={(event) => updateSectionData(id, (prev) => ({ ...prev, content: event.target.value }))}
            />
          </div>
        )}
      </div>
    )
  }

  const renderPreviewSection = (section: LandingSection) => {
    if (!section.enabled) return null
    
    const spacing = { marginTop: theme.sectionSpacing }
    const radiusStyle = { borderRadius: `${theme.radius}px` }
    const data = section.data
    const sectionPrimary = section.customColors?.primaryColor || theme.primary
    const sectionText = section.customColors?.textColor || theme.text
    const sectionBg = section.customColors?.backgroundColor || theme.background
    let block: React.ReactNode = null

    switch (section.type) {
      case "hero":
        const heroBgStyle = theme.useGradient
          ? {
              background: `linear-gradient(${theme.gradientAngle}deg, ${sectionPrimary}15, ${theme.accent}25)`,
            }
          : { backgroundColor: sectionBg }
        block = (
          <section
            style={{ ...spacing, ...radiusStyle, ...heroBgStyle }}
            className={cn("overflow-hidden p-8 shadow-xl", !theme.useGradient && "bg-white/90")}
          >
            <div className="space-y-4">
              {data.badge && (
                <Badge style={{ backgroundColor: `${sectionPrimary}15`, color: sectionPrimary }}>{data.badge}</Badge>
              )}
              {data.eyebrow && <p className="text-sm uppercase tracking-widest" style={{ color: sectionPrimary }}>{data.eyebrow}</p>}
              <h2 className="text-4xl font-semibold leading-tight" style={{ color: sectionText }}>{data.title}</h2>
              <p className="text-base" style={{ color: sectionText + "CC" }}>{data.description}</p>
              <div className="flex flex-wrap gap-3">
                <Button className="gap-2 cursor-pointer" style={{ backgroundColor: sectionPrimary, color: "#ffffff" }}>
                  <Sparkles className="h-4 w-4" />
                  {data.primaryCta}
                </Button>
                <Button variant="ghost" className="gap-2 cursor-pointer" style={{ color: sectionPrimary }}>
                  <Layers3 className="h-4 w-4" />
                  {data.secondaryCta}
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {(data.stats || []).map((stat: any) => (
                  <div key={stat.id} style={radiusStyle} className="border border-slate-200/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
        break
      case "features":
        block = (
          <section style={spacing}>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(data.columns || 2, 3)}, minmax(0, 1fr))` }}>
              {(data.items || []).map((feature: any) => (
                <div key={feature.id} style={radiusStyle} className="border border-slate-200/80 bg-white/80 p-4 shadow-sm">
                  <div className="text-2xl">{feature.emoji}</div>
                  <h3 className="mt-3 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>
        )
        break
      case "testimonials":
        block = (
          <section style={{ ...spacing, ...radiusStyle }} className="bg-slate-900/95 p-6 text-white">
            <div className="grid gap-4 md:grid-cols-2">
              {(data.items || []).map((testimonial: any) => (
                <div key={testimonial.id} style={radiusStyle} className="bg-white/10 p-5">
                  <p className="text-base text-white/90">"{testimonial.quote}"</p>
                  <div className="mt-4">
                    <p className="text-sm font-semibold">{testimonial.name}</p>
                    <p className="text-xs text-white/70">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
        break
      case "pricing":
        block = (
          <section style={spacing}>
            <div className="grid gap-4 md:grid-cols-2">
              {(data.plans || []).map((plan: any) => (
                <div key={plan.id} style={radiusStyle} className="border border-slate-200/70 bg-white/90 p-5 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-slate-500">{plan.description}</p>
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                    </div>
                    <Badge style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}>{plan.price}</Badge>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    {(plan.features || []).map((feature: string, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" style={{ color: theme.primary }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )
        break
      case "faq":
        block = (
          <section style={spacing} className="space-y-3">
            {(data.items || []).map((item: any) => (
              <div key={item.id} style={radiusStyle} className="border border-slate-200/80 bg-white/80 p-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" style={{ color: theme.primary }} />
                  <p className="font-medium">{item.question}</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
              </div>
            ))}
          </section>
        )
        break
      case "cta":
        block = (
          <section style={{ ...spacing, ...radiusStyle, backgroundColor: sectionPrimary }} className="text-white p-8 text-center shadow-2xl">
            <p className="text-sm uppercase tracking-widest text-white/80">{copy.sectionTypes.cta}</p>
            <h3 className="mt-2 text-3xl font-semibold">{data.title}</h3>
            <p className="mt-3 text-base text-white/70">{data.description}</p>
            <Button className="mt-5 cursor-pointer bg-white hover:bg-white/90" style={{ color: sectionPrimary }}>{data.button}</Button>
          </section>
        )
        break
      case "custom":
        block = (
          <section style={{ ...spacing, ...radiusStyle }} className="border border-dashed border-slate-300/80 p-4 text-sm text-slate-600">
            {data.content}
          </section>
        )
        break
      default:
        block = null
    }

    if (!block) return null

    return block
  }

  return (
    <AuthGuard orgSlug={org}>
      <RoleGuard allowedRoles={["admin", "master"]} orgSlug={org}>
        <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/60 bg-white/80 backdrop-blur-sm px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <Link 
                href={`/${org}/leads`} 
                className="group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <ChevronDown className="h-4 w-4 rotate-90 transition-transform group-hover:-translate-x-0.5" />
                {leadsT("breadcrumbLeads")}
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">{copy.pageTitle}</h1>
                  <p className="text-xs text-slate-500">Crie landing pages profissionais em minutos</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isThemeModalOpen} onOpenChange={setIsThemeModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    size="sm" 
                    className="gap-2 cursor-pointer border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Tema</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Personalizar Tema Global</DialogTitle>
                    <DialogDescription>Configure cores, fontes e espaçamentos globais da landing page</DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Cor Primária</Label>
                        <div className="flex items-center gap-2">
                          <input
                            ref={themePrimaryColorRef}
                            type="color"
                            defaultValue={theme.primary}
                            onChange={handleThemePrimaryChange}
                            className="h-10 w-20 cursor-pointer rounded border border-input"
                          />
                          <Input
                            type="text"
                            value={theme.primary}
                            onChange={(event) => {
                              const value = event.target.value
                              if (/^#[0-9A-F]{6}$/i.test(value)) {
                                setTheme((prev) => ({ ...prev, primary: value }))
                                if (themePrimaryColorRef.current) themePrimaryColorRef.current.value = value
                              }
                            }}
                            className="flex-1"
                            placeholder="#1d4ed8"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Cor de Destaque</Label>
                        <div className="flex items-center gap-2">
                          <input
                            ref={themeAccentColorRef}
                            type="color"
                            defaultValue={theme.accent}
                            onChange={handleThemeAccentChange}
                            className="h-10 w-20 cursor-pointer rounded border border-input"
                          />
                          <Input
                            type="text"
                            value={theme.accent}
                            onChange={(event) => {
                              const value = event.target.value
                              if (/^#[0-9A-F]{6}$/i.test(value)) {
                                setTheme((prev) => ({ ...prev, accent: value }))
                                if (themeAccentColorRef.current) themeAccentColorRef.current.value = value
                              }
                            }}
                            className="flex-1"
                            placeholder="#0ea5e9"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Cor de Fundo</Label>
                        <div className="flex items-center gap-2">
                          <input
                            ref={themeBackgroundColorRef}
                            type="color"
                            defaultValue={theme.background}
                            onChange={handleThemeBackgroundChange}
                            className="h-10 w-20 cursor-pointer rounded border border-input"
                          />
                          <Input
                            type="text"
                            value={theme.background}
                            onChange={(event) => {
                              const value = event.target.value
                              if (/^#[0-9A-F]{6}$/i.test(value)) {
                                setTheme((prev) => ({ ...prev, background: value }))
                                if (themeBackgroundColorRef.current) themeBackgroundColorRef.current.value = value
                              }
                            }}
                            className="flex-1"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Cor do Texto</Label>
                        <div className="flex items-center gap-2">
                          <input
                            ref={themeTextColorRef}
                            type="color"
                            defaultValue={theme.text}
                            onChange={handleThemeTextChange}
                            className="h-10 w-20 cursor-pointer rounded border border-input"
                          />
                          <Input
                            type="text"
                            value={theme.text}
                            onChange={(event) => {
                              const value = event.target.value
                              if (/^#[0-9A-F]{6}$/i.test(value)) {
                                setTheme((prev) => ({ ...prev, text: value }))
                                if (themeTextColorRef.current) themeTextColorRef.current.value = value
                              }
                            }}
                            className="flex-1"
                            placeholder="#0f172a"
                          />
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Tipografia</Label>
                        <Select value={theme.fontFamily} onValueChange={(value) => setTheme((prev) => ({ ...prev, fontFamily: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontOptions.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Arredondamento Global: {theme.radius}px</Label>
                        <input
                          type="range"
                          min={12}
                          max={64}
                          value={theme.radius}
                          onChange={(event) => setTheme((prev) => ({ ...prev, radius: Number(event.target.value) }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Espaçamento entre Blocos: {theme.sectionSpacing}px</Label>
                        <input
                          type="range"
                          min={24}
                          max={96}
                          value={theme.sectionSpacing}
                          onChange={(event) => setTheme((prev) => ({ ...prev, sectionSpacing: Number(event.target.value) }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Largura Máxima: {theme.containerWidth}px</Label>
                        <input
                          type="range"
                          min={800}
                          max={1300}
                          value={theme.containerWidth}
                          onChange={(event) => setTheme((prev) => ({ ...prev, containerWidth: Number(event.target.value) }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">Usar Gradiente Hero</p>
                          <p className="text-xs text-muted-foreground">Gradient + vidro confere mais profundidade ao hero.</p>
                        </div>
                        <Button
                          variant={theme.useGradient ? "default" : "outline"}
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => setTheme((prev) => ({ ...prev, useGradient: !prev.useGradient }))}
                        >
                          {theme.useGradient ? onLabel : offLabel}
                        </Button>
                      </div>
                      {theme.useGradient && (
                        <div>
                          <Label className="text-sm font-medium">Ângulo do Gradiente: {theme.gradientAngle}°</Label>
                          <input
                            type="range"
                            min={0}
                            max={360}
                            value={theme.gradientAngle}
                            onChange={(event) => setTheme((prev) => ({ ...prev, gradientAngle: Number(event.target.value) }))}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isAddElementModalOpen} onOpenChange={setIsAddElementModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="gap-2 cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-700 hover:shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Elemento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Elemento</DialogTitle>
                    <DialogDescription>Escolha o tipo de seção que deseja adicionar à sua landing page</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {paletteItems.map((item) => (
                      <div
                        key={item.type}
                        onClick={() => {
                          addSection(item.type)
                          setIsAddElementModalOpen(false)
                        }}
                        className="group flex cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 py-4 transition-all hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-sm"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm transition-transform group-hover:scale-105">
                          {paletteIcons[item.type]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                          <span className="text-xs text-slate-500">{item.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 cursor-pointer text-slate-600 hover:bg-slate-100 hover:text-slate-900" 
                onClick={copyPreviewLink}
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">{copy.previewShare}</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 cursor-pointer border-slate-200 text-slate-600 hover:bg-slate-50" 
                onClick={resetBuilder}
              >
                <RefreshCcw className="h-4 w-4" />
                <span className="hidden sm:inline">{copy.reset}</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 cursor-pointer border-slate-200 text-slate-600 hover:bg-slate-50" 
                onClick={exportJson}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">{copy.exportConfig}</span>
              </Button>
              <Button 
                size="sm" 
                className="gap-2 cursor-pointer bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md hover:from-amber-500 hover:to-amber-600 hover:shadow-lg" 
                onClick={persistDraft}
              >
                <Save className="h-4 w-4" />
                {copy.saveDraft}
              </Button>
            </div>
          </header>

          {feedback && (
            <div
              className={cn(
                "mx-6 mt-4 rounded-xl border px-4 py-3 text-sm",
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800",
              )}
            >
              {feedback.message}
            </div>
          )}

          <div className="flex flex-1 overflow-hidden bg-white">
            {/* FULL SCREEN PREVIEW */}
            <div 
              className="flex-1 overflow-y-auto"
              style={{ 
                backgroundColor: theme.background,
                fontFamily: theme.fontFamily,
                color: theme.text
              }}
            >
              <div className="mx-auto space-y-6 py-12 px-6" style={{ maxWidth: theme.containerWidth }}>
                {sections.length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
                    <Sparkles className="h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Comece criando sua landing page</h3>
                    <p className="text-sm text-slate-500 mb-6">Clique em "Adicionar Elemento" no cabeçalho para começar</p>
                  </div>
                )}
                {sections.map((section) => (
                  <div
                    key={section.id}
                    onClick={() => {
                      setSelectedSectionId(section.id)
                      setIsEditSectionModalOpen(true)
                    }}
                    className="group relative cursor-pointer rounded-xl border-2 border-transparent transition-all hover:border-blue-300 hover:shadow-lg"
                  >
                    {renderPreviewSection(section)}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <div className="flex gap-1 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 p-1 shadow-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer text-slate-600 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            const index = sections.findIndex((s) => s.id === section.id)
                            if (index > 0) moveSection(section.id, "up")
                          }}
                          disabled={sections.findIndex((s) => s.id === section.id) === 0}
                          title="Mover para cima"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer text-slate-600 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            const index = sections.findIndex((s) => s.id === section.id)
                            if (index < sections.length - 1) moveSection(section.id, "down")
                          }}
                          disabled={sections.findIndex((s) => s.id === section.id) === sections.length - 1}
                          title="Mover para baixo"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <div className="w-px h-6 bg-slate-200 mx-0.5" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer text-slate-600 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedSectionId(section.id)
                            setIsEditSectionModalOpen(true)
                          }}
                          title="Editar"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer text-slate-600 hover:text-emerald-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicateSection(section.id)
                          }}
                          title="Duplicar"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer text-slate-600 hover:text-amber-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSectionVisibility(section.id)
                          }}
                          title={section.enabled ? "Ocultar" : "Mostrar"}
                        >
                          {section.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer text-slate-600 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeSection(section.id)
                          }}
                          disabled={sections.length === 1}
                          title="Remover"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Form Section */}
                <section 
                  style={{ 
                    marginTop: theme.sectionSpacing, 
                    borderRadius: `${formSettings.borderRadius}px`,
                    backgroundColor: formSettings.backgroundColor,
                    padding: `${formSettings.padding}px`,
                  }} 
                  className="shadow-md group relative"
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 cursor-pointer text-slate-600 hover:text-blue-600"
                      onClick={() => setIsFormSettingsModalOpen(true)}
                      title="Personalizar formulário"
                    >
                      <Palette className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: formSettings.textColor }}>{copy.formPreviewHeading}</h3>
                  <div className="space-y-4">
                    {formFields.map((field) => (
                      <div key={field.id} className="space-y-1">
                        <label className="text-xs font-medium uppercase tracking-wide" style={{ color: formSettings.labelColor }}>
                          {field.label}
                          {field.required && <span className="text-red-500"> *</span>}
                        </label>
                        {field.type === "textarea" ? (
                          <textarea
                            style={{ 
                              borderRadius: `${formSettings.borderRadius}px`,
                              borderColor: formSettings.borderColor,
                              backgroundColor: formSettings.backgroundColor,
                              color: formSettings.textColor,
                            }}
                            className="w-full border px-3 py-2 text-sm"
                            placeholder={field.placeholder}
                            disabled
                          />
                        ) : field.type === "select" ? (
                          <select
                            style={{ 
                              borderRadius: `${formSettings.borderRadius}px`,
                              borderColor: formSettings.borderColor,
                              backgroundColor: formSettings.backgroundColor,
                              color: formSettings.textColor,
                            }}
                            className="w-full border px-3 py-2 text-sm"
                            disabled
                          >
                            <option>{field.placeholder}</option>
                            {(field.options || "")
                              .split(",")
                              .map((option) => option.trim())
                              .filter(Boolean)
                              .map((option) => (
                                <option key={option}>{option}</option>
                              ))}
                          </select>
                        ) : (
                          <Input 
                            disabled 
                            placeholder={field.placeholder} 
                            style={{ 
                              borderRadius: `${formSettings.borderRadius}px`,
                              borderColor: formSettings.borderColor,
                              backgroundColor: formSettings.backgroundColor,
                              color: formSettings.textColor,
                            }} 
                            className="border" 
                          />
                        )}
                      </div>
                    ))}
                    <Button 
                      className="w-full cursor-pointer" 
                      style={{ 
                        backgroundColor: formSettings.buttonColor, 
                        color: formSettings.buttonTextColor 
                      }}
                    >
                      {formSubmitLabel}
                    </Button>
                  </div>
                </section>
              </div>

              {floatingCta.enabled && (
                <div className="fixed bottom-6 right-6 w-64 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xl z-10 group">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 cursor-pointer text-slate-600 hover:text-blue-600"
                      onClick={() => setIsFloatingCtaSettingsOpen(true)}
                      title="Configurar CTA"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm font-medium">{floatingCta.label}</p>
                  <p className="text-xs text-slate-500 mb-3">{floatingCta.body}</p>
                  <div className="space-y-2">
                    {floatingCta.showWhatsApp && floatingCta.whatsappLink && (
                      <Button 
                        className="w-full gap-2 cursor-pointer" 
                        style={{ backgroundColor: "#25D366", color: "#ffffff" }}
                        onClick={() => window.open(floatingCta.whatsappLink, "_blank")}
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        WhatsApp
                      </Button>
                    )}
                    {floatingCta.showTelegram && floatingCta.telegramLink && (
                      <Button 
                        className="w-full gap-2 cursor-pointer" 
                        style={{ backgroundColor: "#0088cc", color: "#ffffff" }}
                        onClick={() => window.open(floatingCta.telegramLink, "_blank")}
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                        Telegram
                      </Button>
                    )}
                    {((!floatingCta.showWhatsApp || !floatingCta.whatsappLink) && (!floatingCta.showTelegram || !floatingCta.telegramLink)) && (
                      <Button 
                        className="w-full gap-2 cursor-pointer" 
                        style={{ backgroundColor: theme.primary, color: "#ffffff" }}
                        onClick={() => {
                          // Aqui você pode adicionar uma ação padrão, como abrir um formulário ou email
                          console.log("Botão genérico clicado")
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                        {floatingCta.button}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Edit Section Modal */}
            <Dialog open={isEditSectionModalOpen} onOpenChange={setIsEditSectionModalOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Seção</DialogTitle>
                  <DialogDescription>Personalize o conteúdo desta seção</DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  {renderSectionEditor()}
                </div>
              </DialogContent>
            </Dialog>

            {/* Floating CTA Settings Modal */}
            <Dialog open={isFloatingCtaSettingsOpen} onOpenChange={setIsFloatingCtaSettingsOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Configurar CTA Flutuante</DialogTitle>
                  <DialogDescription>Configure o botão flutuante de contato e links do WhatsApp/Telegram</DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-6">
                  <div className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">Ativar CTA Flutuante</p>
                      <p className="text-xs text-muted-foreground">Exibir botão flutuante de contato na página</p>
                    </div>
                    <Button
                      variant={floatingCta.enabled ? "default" : "outline"}
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => setFloatingCta((prev) => ({ ...prev, enabled: !prev.enabled }))}
                    >
                      {floatingCta.enabled ? "Ativado" : "Desativado"}
                    </Button>
                  </div>
                  {floatingCta.enabled && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Título</Label>
                          <Input
                            value={floatingCta.label}
                            onChange={(event) => setFloatingCta((prev) => ({ ...prev, label: event.target.value }))}
                            placeholder="Precisa de ajuda?"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Descrição</Label>
                          <Input
                            value={floatingCta.body}
                            onChange={(event) => setFloatingCta((prev) => ({ ...prev, body: event.target.value }))}
                            placeholder="Um especialista responde em até 5 minutos."
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Texto do Botão (se não usar WhatsApp/Telegram)</Label>
                          <Input
                            value={floatingCta.button}
                            onChange={(event) => setFloatingCta((prev) => ({ ...prev, button: event.target.value }))}
                            placeholder="Conversar com o time"
                          />
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-4">
                        <Label className="text-sm font-semibold">WhatsApp</Label>
                        <div className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2">
                          <div>
                            <p className="text-sm font-medium">Mostrar botão WhatsApp</p>
                            <p className="text-xs text-muted-foreground">Exibir botão do WhatsApp no CTA</p>
                          </div>
                          <Button
                            variant={floatingCta.showWhatsApp ? "default" : "outline"}
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => setFloatingCta((prev) => ({ ...prev, showWhatsApp: !prev.showWhatsApp }))}
                          >
                            {floatingCta.showWhatsApp ? "Ativado" : "Desativado"}
                          </Button>
                        </div>
                        {floatingCta.showWhatsApp && (
                          <div>
                            <Label className="text-sm font-medium">Link do WhatsApp</Label>
                            <Input
                              value={floatingCta.whatsappLink || ""}
                              onChange={(event) => setFloatingCta((prev) => ({ ...prev, whatsappLink: event.target.value }))}
                              placeholder="https://wa.me/5511999999999 ou https://api.whatsapp.com/send?phone=5511999999999"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Use o formato: https://wa.me/5511999999999 ou https://api.whatsapp.com/send?phone=5511999999999
                            </p>
                          </div>
                        )}
                      </div>
                      <Separator />
                      <div className="space-y-4">
                        <Label className="text-sm font-semibold">Telegram</Label>
                        <div className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2">
                          <div>
                            <p className="text-sm font-medium">Mostrar botão Telegram</p>
                            <p className="text-xs text-muted-foreground">Exibir botão do Telegram no CTA</p>
                          </div>
                          <Button
                            variant={floatingCta.showTelegram ? "default" : "outline"}
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => setFloatingCta((prev) => ({ ...prev, showTelegram: !prev.showTelegram }))}
                          >
                            {floatingCta.showTelegram ? "Ativado" : "Desativado"}
                          </Button>
                        </div>
                        {floatingCta.showTelegram && (
                          <div>
                            <Label className="text-sm font-medium">Link do Telegram</Label>
                            <Input
                              value={floatingCta.telegramLink || ""}
                              onChange={(event) => setFloatingCta((prev) => ({ ...prev, telegramLink: event.target.value }))}
                              placeholder="https://t.me/seuusuario ou https://t.me/seugrupo"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Use o formato: https://t.me/seuusuario ou https://t.me/seugrupo
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Form Settings Modal */}
            <Dialog open={isFormSettingsModalOpen} onOpenChange={setIsFormSettingsModalOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Personalizar Formulário</DialogTitle>
                  <DialogDescription>Configure cores, espaçamentos e estilos do formulário de captura</DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cor de Fundo</Label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={formBgColorRef}
                          type="color"
                          defaultValue={formSettings.backgroundColor}
                          onChange={handleFormBgChange}
                          className="h-10 w-20 cursor-pointer rounded border border-input"
                        />
                        <Input
                          type="text"
                          value={formSettings.backgroundColor}
                          onChange={(event) => {
                            const value = event.target.value
                            if (/^#[0-9A-F]{6}$/i.test(value)) {
                              setFormSettings((prev) => ({ ...prev, backgroundColor: value }))
                              if (formBgColorRef.current) formBgColorRef.current.value = value
                            }
                          }}
                          className="flex-1"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cor do Texto</Label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={formTextColorRef}
                          type="color"
                          defaultValue={formSettings.textColor}
                          onChange={handleFormTextChange}
                          className="h-10 w-20 cursor-pointer rounded border border-input"
                        />
                        <Input
                          type="text"
                          value={formSettings.textColor}
                          onChange={(event) => {
                            const value = event.target.value
                            if (/^#[0-9A-F]{6}$/i.test(value)) {
                              setFormSettings((prev) => ({ ...prev, textColor: value }))
                              if (formTextColorRef.current) formTextColorRef.current.value = value
                            }
                          }}
                          className="flex-1"
                          placeholder="#0f172a"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cor do Botão</Label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={formButtonColorRef}
                          type="color"
                          defaultValue={formSettings.buttonColor}
                          onChange={handleFormButtonChange}
                          className="h-10 w-20 cursor-pointer rounded border border-input"
                        />
                        <Input
                          type="text"
                          value={formSettings.buttonColor}
                          onChange={(event) => {
                            const value = event.target.value
                            if (/^#[0-9A-F]{6}$/i.test(value)) {
                              setFormSettings((prev) => ({ ...prev, buttonColor: value }))
                              if (formButtonColorRef.current) formButtonColorRef.current.value = value
                            }
                          }}
                          className="flex-1"
                          placeholder="#1d4ed8"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cor do Texto do Botão</Label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={formButtonTextColorRef}
                          type="color"
                          defaultValue={formSettings.buttonTextColor}
                          onChange={handleFormButtonTextChange}
                          className="h-10 w-20 cursor-pointer rounded border border-input"
                        />
                        <Input
                          type="text"
                          value={formSettings.buttonTextColor}
                          onChange={(event) => {
                            const value = event.target.value
                            if (/^#[0-9A-F]{6}$/i.test(value)) {
                              setFormSettings((prev) => ({ ...prev, buttonTextColor: value }))
                              if (formButtonTextColorRef.current) formButtonTextColorRef.current.value = value
                            }
                          }}
                          className="flex-1"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cor da Borda</Label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={formBorderColorRef}
                          type="color"
                          defaultValue={formSettings.borderColor}
                          onChange={handleFormBorderChange}
                          className="h-10 w-20 cursor-pointer rounded border border-input"
                        />
                        <Input
                          type="text"
                          value={formSettings.borderColor}
                          onChange={(event) => {
                            const value = event.target.value
                            if (/^#[0-9A-F]{6}$/i.test(value)) {
                              setFormSettings((prev) => ({ ...prev, borderColor: value }))
                              if (formBorderColorRef.current) formBorderColorRef.current.value = value
                            }
                          }}
                          className="flex-1"
                          placeholder="#e2e8f0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cor do Label</Label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={formLabelColorRef}
                          type="color"
                          defaultValue={formSettings.labelColor}
                          onChange={handleFormLabelChange}
                          className="h-10 w-20 cursor-pointer rounded border border-input"
                        />
                        <Input
                          type="text"
                          value={formSettings.labelColor}
                          onChange={(event) => {
                            const value = event.target.value
                            if (/^#[0-9A-F]{6}$/i.test(value)) {
                              setFormSettings((prev) => ({ ...prev, labelColor: value }))
                              if (formLabelColorRef.current) formLabelColorRef.current.value = value
                            }
                          }}
                          className="flex-1"
                          placeholder="#64748b"
                        />
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Arredondamento: {formSettings.borderRadius}px</Label>
                      <input
                        type="range"
                        min={0}
                        max={32}
                        value={formSettings.borderRadius}
                        onChange={(event) => setFormSettings((prev) => ({ ...prev, borderRadius: Number(event.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Espaçamento Interno: {formSettings.padding}px</Label>
                      <input
                        type="range"
                        min={12}
                        max={48}
                        value={formSettings.padding}
                        onChange={(event) => setFormSettings((prev) => ({ ...prev, padding: Number(event.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Gerenciar Campos</Label>
                    <div className="space-y-2">
                      {formFields.map((field, index) => (
                        <div key={field.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{field.label}</p>
                              <p className="text-xs text-slate-500">{copy.fieldTypes[field.type]}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 cursor-pointer"
                              onClick={() => {
                                if (index > 0) {
                                  const newFields = [...formFields]
                                  const temp = newFields[index]
                                  newFields[index] = newFields[index - 1]
                                  newFields[index - 1] = temp
                                  setFormFields(newFields)
                                }
                              }}
                              disabled={index === 0}
                              title="Mover para cima"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 cursor-pointer"
                              onClick={() => {
                                if (index < formFields.length - 1) {
                                  const newFields = [...formFields]
                                  const temp = newFields[index]
                                  newFields[index] = newFields[index + 1]
                                  newFields[index + 1] = temp
                                  setFormFields(newFields)
                                }
                              }}
                              disabled={index === formFields.length - 1}
                              title="Mover para baixo"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 cursor-pointer text-red-600"
                              onClick={() => setFormFields((prev) => prev.filter((item) => item.id !== field.id))}
                              title="Remover"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full gap-2 cursor-pointer">
                          <Plus className="h-4 w-4" />
                          {copy.addField}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48">
                        {(Object.keys(copy.fieldTypes) as FieldType[]).map((type) => (
                          <DropdownMenuItem key={type} onClick={() => addFormField(type)}>
                            {copy.fieldTypes[type]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}

