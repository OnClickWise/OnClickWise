"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLandingPageStore } from "@/stores/landing-page-store"
import { useTranslations } from "next-intl"
import { FileText, Users, ShoppingCart, HelpCircle, Calendar, Rocket, Sparkles, X, ArrowLeft } from "lucide-react"

const PRESETS = [
  { name: 'modern-saas', label: 'Modern SaaS Landing', icon: <Rocket className="w-5 h-5" />, description: 'Página completa e profissional para SaaS' },
  { name: 'product-launch', label: 'Product Launch', icon: <Sparkles className="w-5 h-5" />, description: 'Lançamento de produto com countdown' },
  { name: 'lead-magnet', label: 'Lead Magnet', icon: <Users className="w-5 h-5" />, description: 'Captura de leads com formulário' },
  { name: 'simple', label: 'Simple Landing Page', icon: <FileText className="w-5 h-5" />, description: 'Página simples com headline e CTA' },
  { name: 'sales', label: 'Sales Page', icon: <ShoppingCart className="w-5 h-5" />, description: 'Página de vendas completa' },
  { name: 'faq-testimonials', label: 'FAQ + Testimonials', icon: <HelpCircle className="w-5 h-5" />, description: 'FAQ e depoimentos' },
  { name: 'launch', label: 'Launch/Event', icon: <Calendar className="w-5 h-5" />, description: 'Página "Em Breve"' },
]

export function PresetLoader({ open, onClose, onBack }: { open: boolean; onClose: () => void; onBack?: () => void }) {
  const { loadPreset } = useLandingPageStore()
  const t = useTranslations('LandingPagePresets')
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(null)
  const [companyName, setCompanyName] = React.useState('')
  const [companyLogo, setCompanyLogo] = React.useState('')
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setSelectedPreset(null)
      setCompanyName('')
      setCompanyLogo('')
      setLogoPreview(null)
    }
  }, [open])

  const handlePresetSelect = (presetName: string) => {
    setSelectedPreset(presetName)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setCompanyLogo(url)
    if (url && (url.startsWith('http') || url.startsWith('/'))) {
      setLogoPreview(url)
    } else {
      setLogoPreview(null)
    }
  }

  const handleLoadPreset = () => {
    if (!selectedPreset) return

    // Get all translations for this preset
    const translations: any = {}
    try {
      // Get translations for this specific preset using raw to get nested object
      const presetTranslations = t.raw(selectedPreset)
      if (presetTranslations && typeof presetTranslations === 'object') {
        translations.LandingPagePresets = {
          [selectedPreset]: presetTranslations
        }
      }
    } catch (e) {
      // If translation not found, use empty object (will fallback to Portuguese)
      console.warn('Could not load translations for preset:', selectedPreset, e)
    }
    
    loadPreset(
      selectedPreset, 
      Object.keys(translations).length > 0 ? translations : undefined,
      {
        companyName: companyName || undefined,
        companyLogo: companyLogo || undefined,
      }
    )
    onClose()
  }

  if (selectedPreset) {
    // Show configuration dialog
    const selectedPresetData = PRESETS.find(p => p.name === selectedPreset)
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-[90vw] max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6">
          <DialogHeader className="border-b-2 border-[#3b82f6] pb-3 sm:pb-4 mb-3 sm:mb-4 flex-shrink-0">
            <div className="flex items-center gap-3 mb-2">
              {onBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedPreset(null)
                    onBack()
                  }}
                  className="h-8 w-8 rounded-full hover:bg-gray-100"
                  style={{ cursor: 'pointer' }}
                  title="Voltar"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 flex-1">
                <div className="w-2 h-6 sm:h-8 bg-[#3b82f6] rounded-full"></div>
                Configurar Modelo
              </DialogTitle>
            </div>
            <p className="text-sm text-gray-600 mt-2">Configure as informações da sua empresa</p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-2">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold text-gray-900 mb-2 block">
                  Nome da Empresa
                </Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Minha Empresa"
                  className="border-2 border-gray-200 focus:border-[#3b82f6]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este nome aparecerá no cabeçalho e em outros lugares do modelo
                </p>
              </div>
              <div>
                <Label className="text-base font-semibold text-gray-900 mb-2 block">
                  Logo da Empresa (URL)
                </Label>
                <Input
                  value={companyLogo}
                  onChange={handleLogoChange}
                  placeholder="https://exemplo.com/logo.png ou /logo.png"
                  className="border-2 border-gray-200 focus:border-[#3b82f6]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cole a URL completa da imagem do logo ou um caminho relativo
                </p>
                {logoPreview && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <p className="text-xs text-gray-600 mb-2 font-semibold">Preview do Logo:</p>
                    <div className="flex items-center justify-center p-4 bg-white rounded border border-gray-300">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="max-h-16 max-w-full object-contain"
                        onError={() => setLogoPreview(null)}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Dica:</strong> Você pode deixar esses campos vazios e preencher depois no editor.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t-2 border-[#3b82f6] flex-shrink-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setSelectedPreset(null)}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={handleLoadPreset}
              className="bg-[#3b82f6] text-white hover:bg-[#2563eb] border-2 border-[#3b82f6] shadow-md hover:shadow-lg"
            >
              Carregar Modelo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const tBack = useTranslations('LandingPageCreator')
  
  // Show preset selection
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-[90vw] max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader className="border-b-2 border-[#3b82f6] pb-3 sm:pb-4 mb-3 sm:mb-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onClose()
                  onBack()
                }}
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                style={{ cursor: 'pointer' }}
                title={tBack('back', 'Voltar')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 flex-1">
              <div className="w-2 h-6 sm:h-8 bg-[#3b82f6] rounded-full"></div>
              Carregar Modelo
            </DialogTitle>
          </div>
          <p className="text-sm text-gray-600 mt-2">Escolha um modelo pronto para começar rapidamente</p>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
          <div className="grid grid-cols-1 gap-3 pb-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              className="flex items-start gap-4 h-auto py-5 px-5 justify-start border-2 border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
              onClick={() => handlePresetSelect(preset.name)}
            >
              <div className="w-12 h-12 rounded-lg bg-[#3b82f6] flex items-center justify-center text-white">
                {preset.icon}
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-gray-900 text-base">{preset.label}</span>
                <span className="text-sm text-gray-600 mt-1">{preset.description}</span>
              </div>
            </Button>
          ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

