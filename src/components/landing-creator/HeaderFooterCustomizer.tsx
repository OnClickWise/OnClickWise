"use client"

import * as React from "react"
import { Section } from "@/types/landing-page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLandingPageStore } from "@/stores/landing-page-store"
import { ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"

function parseSpacingValue(value: string | undefined): number {
  if (!value) return 0
  const match = value.match(/^(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
}

function formatSpacingValue(value: number): string {
  return value ? `${value}rem` : ''
}

export function HeaderFooterCustomizer({ open, onClose, onBack }: { open: boolean; onClose: () => void; onBack?: () => void }) {
  const { currentPage, updateSection, addSection } = useLandingPageStore()
  const [activeTab, setActiveTab] = React.useState<'header' | 'footer'>('header')

  if (!currentPage) return null

  // Find existing header and footer sections
  const headerSection = currentPage.sections.find(s => s.type === 'header')
  const footerSection = currentPage.sections.find(s => s.type === 'footer')

  // Helper to extract angle from gradient string
  const extractGradientAngle = (gradient: string | undefined): string => {
    if (!gradient) return '135deg'
    // Try to match angle in degrees
    const angleMatch = gradient.match(/(\d+(?:\.\d+)?)deg/)
    if (angleMatch) {
      return `${angleMatch[1]}deg`
    }
    // Try to match CSS keywords
    if (gradient.includes('to top')) return '0deg'
    if (gradient.includes('to right')) return '90deg'
    if (gradient.includes('to bottom')) return '180deg'
    if (gradient.includes('to left')) return '270deg'
    if (gradient.includes('to top right')) return '45deg'
    if (gradient.includes('to bottom right')) return '135deg'
    if (gradient.includes('to bottom left')) return '225deg'
    if (gradient.includes('to top left')) return '315deg'
    return '135deg'
  }

  // Gradient direction options
  const gradientDirections = [
    { value: '315deg', label: '↖', desc: 'Top Left', angle: 315 },
    { value: '0deg', label: '↑', desc: 'Top', angle: 0 },
    { value: '45deg', label: '↗', desc: 'Top Right', angle: 45 },
    { value: '270deg', label: '←', desc: 'Left', angle: 270 },
    { value: 'custom', label: '○', desc: 'Personalizado', angle: null },
    { value: '90deg', label: '→', desc: 'Right', angle: 90 },
    { value: '225deg', label: '↙', desc: 'Bottom Left', angle: 225 },
    { value: '180deg', label: '↓', desc: 'Bottom', angle: 180 },
    { value: '135deg', label: '↘', desc: 'Bottom Right', angle: 135 },
  ]

  const initialHeaderDirection = extractGradientAngle(headerSection?.styles?.backgroundGradient)
  const initialHeaderIsCustom = !gradientDirections.some(d => d.value === initialHeaderDirection)

  const [headerStyles, setHeaderStyles] = React.useState({
    useGradient: !!headerSection?.styles?.backgroundGradient,
    backgroundColor: headerSection?.styles?.backgroundColor || '#ffffff',
    backgroundGradient: headerSection?.styles?.backgroundGradient || '',
    gradientColor1: headerSection?.styles?.backgroundGradient 
      ? (headerSection.styles.backgroundGradient.match(/#[0-9a-fA-F]{6}/)?.[0] || '#ffffff')
      : '#ffffff',
    gradientColor2: headerSection?.styles?.backgroundGradient 
      ? (headerSection.styles.backgroundGradient.match(/#[0-9a-fA-F]{6}/g)?.[1] || '#f0f0f0')
      : '#f0f0f0',
    gradientDirection: initialHeaderIsCustom ? 'custom' : initialHeaderDirection,
    useCustomAngle: initialHeaderIsCustom,
    customAngle: initialHeaderDirection,
    padding: parseSpacingValue(headerSection?.styles?.padding) || 1,
    height: headerSection?.styles?.minHeight ? parseSpacingValue(headerSection.styles.minHeight) : 0,
    width: headerSection?.styles?.width || '100%',
  })

  const initialFooterDirection = extractGradientAngle(footerSection?.styles?.backgroundGradient)
  const initialFooterIsCustom = !gradientDirections.some(d => d.value === initialFooterDirection)

  const [footerStyles, setFooterStyles] = React.useState({
    useGradient: !!footerSection?.styles?.backgroundGradient,
    backgroundColor: footerSection?.styles?.backgroundColor || '#1f2937',
    backgroundGradient: footerSection?.styles?.backgroundGradient || '',
    gradientColor1: footerSection?.styles?.backgroundGradient 
      ? (footerSection.styles.backgroundGradient.match(/#[0-9a-fA-F]{6}/)?.[0] || '#1f2937')
      : '#1f2937',
    gradientColor2: footerSection?.styles?.backgroundGradient 
      ? (footerSection.styles.backgroundGradient.match(/#[0-9a-fA-F]{6}/g)?.[1] || '#374151')
      : '#374151',
    gradientDirection: initialFooterIsCustom ? 'custom' : initialFooterDirection,
    useCustomAngle: initialFooterIsCustom,
    customAngle: initialFooterDirection,
    padding: parseSpacingValue(footerSection?.styles?.padding) || 2,
    height: footerSection?.styles?.minHeight ? parseSpacingValue(footerSection.styles.minHeight) : 0,
    width: footerSection?.styles?.width || '100%',
  })

  // Helper to generate gradient string
  const generateGradient = (color1: string, color2: string, direction: string) => {
    // If direction is a number, use it as degrees
    const angle = direction.includes('deg') ? direction : `${direction}deg`
    return `linear-gradient(${angle}, ${color1} 0%, ${color2} 100%)`
  }

  // Update state when sections change
  React.useEffect(() => {
    const header = currentPage.sections.find(s => s.type === 'header')
    const footer = currentPage.sections.find(s => s.type === 'footer')
    
    if (header) {
      const hasGradient = !!header.styles?.backgroundGradient
      const gradient = header.styles?.backgroundGradient || ''
      const color1 = gradient ? (gradient.match(/#[0-9a-fA-F]{6}/)?.[0] || '#ffffff') : '#ffffff'
      const color2 = gradient ? (gradient.match(/#[0-9a-fA-F]{6}/g)?.[1] || '#f0f0f0') : '#f0f0f0'
      const direction = extractGradientAngle(gradient)
      const isCustom = !gradientDirections.some(d => d.value === direction)
      
      setHeaderStyles({
        useGradient: hasGradient,
        backgroundColor: header.styles?.backgroundColor || '#ffffff',
        backgroundGradient: gradient,
        gradientColor1: color1,
        gradientColor2: color2,
        gradientDirection: isCustom ? 'custom' : direction,
        useCustomAngle: isCustom,
        customAngle: direction,
        padding: parseSpacingValue(header.styles?.padding) || 1,
        height: header.styles?.minHeight ? parseSpacingValue(header.styles.minHeight) : 0,
        width: header.styles?.width || '100%',
      })
    }
    
    if (footer) {
      const hasGradient = !!footer.styles?.backgroundGradient
      const gradient = footer.styles?.backgroundGradient || ''
      const color1 = gradient ? (gradient.match(/#[0-9a-fA-F]{6}/)?.[0] || '#1f2937') : '#1f2937'
      const color2 = gradient ? (gradient.match(/#[0-9a-fA-F]{6}/g)?.[1] || '#374151') : '#374151'
      const direction = extractGradientAngle(gradient)
      const isCustom = !gradientDirections.some(d => d.value === direction)
      
      setFooterStyles({
        useGradient: hasGradient,
        backgroundColor: footer.styles?.backgroundColor || '#1f2937',
        backgroundGradient: gradient,
        gradientColor1: color1,
        gradientColor2: color2,
        gradientDirection: isCustom ? 'custom' : direction,
        useCustomAngle: isCustom,
        customAngle: direction,
        padding: parseSpacingValue(footer.styles?.padding) || 2,
        height: footer.styles?.minHeight ? parseSpacingValue(footer.styles.minHeight) : 0,
        width: footer.styles?.width || '100%',
      })
    }
  }, [currentPage.sections])

  const handleSave = () => {
    // Only save the section that is currently active (visible tab)
    if (activeTab === 'header') {
      // Generate gradient if useGradient is true
      const headerDirection = headerStyles.gradientDirection === 'custom' 
        ? headerStyles.customAngle || '135deg'
        : headerStyles.gradientDirection
      const headerGradient = headerStyles.useGradient 
        ? generateGradient(headerStyles.gradientColor1, headerStyles.gradientColor2, headerDirection)
        : undefined

      // Update or create header section
      if (headerSection) {
        updateSection(headerSection.id, {
          styles: {
            ...headerSection.styles,
            backgroundColor: headerStyles.useGradient ? undefined : headerStyles.backgroundColor,
            backgroundGradient: headerGradient,
            padding: formatSpacingValue(headerStyles.padding),
            minHeight: headerStyles.height > 0 ? formatSpacingValue(headerStyles.height) : undefined,
            width: headerStyles.width,
            position: 'sticky',
            top: '0',
            zIndex: '50',
          }
        })
      } else {
        // Create new header section if it doesn't exist
        const newHeader: Section = {
          id: Math.random().toString(36).slice(2, 10),
          type: 'header',
          elements: [],
          styles: {
            backgroundColor: headerStyles.useGradient ? undefined : headerStyles.backgroundColor,
            backgroundGradient: headerGradient,
            padding: formatSpacingValue(headerStyles.padding),
            minHeight: headerStyles.height > 0 ? formatSpacingValue(headerStyles.height) : undefined,
            width: headerStyles.width,
            position: 'sticky',
            top: '0',
            zIndex: '50',
          }
        }
        addSection(newHeader)
      }
    } else if (activeTab === 'footer') {
      // Generate gradient if useGradient is true
      const footerDirection = footerStyles.gradientDirection === 'custom'
        ? footerStyles.customAngle || '135deg'
        : footerStyles.gradientDirection
      const footerGradient = footerStyles.useGradient 
        ? generateGradient(footerStyles.gradientColor1, footerStyles.gradientColor2, footerDirection)
        : undefined

      // Update or create footer section
      if (footerSection) {
        updateSection(footerSection.id, {
          styles: {
            ...footerSection.styles,
            backgroundColor: footerStyles.useGradient ? undefined : footerStyles.backgroundColor,
            backgroundGradient: footerGradient,
            padding: formatSpacingValue(footerStyles.padding),
            minHeight: footerStyles.height > 0 ? formatSpacingValue(footerStyles.height) : undefined,
            width: footerStyles.width,
          }
        })
      } else {
        // Create new footer section if it doesn't exist
        const newFooter: Section = {
          id: Math.random().toString(36).slice(2, 10),
          type: 'footer',
          elements: [],
          styles: {
            backgroundColor: footerStyles.useGradient ? undefined : footerStyles.backgroundColor,
            backgroundGradient: footerGradient,
            padding: formatSpacingValue(footerStyles.padding),
            minHeight: footerStyles.height > 0 ? formatSpacingValue(footerStyles.height) : undefined,
            width: footerStyles.width,
          }
        }
        addSection(newFooter)
      }
    }

    onClose()
  }

  const t = useTranslations('LandingPageCreator')
  
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
                title={t('back', 'Voltar')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 flex-1">
              <div className="w-2 h-6 sm:h-8 bg-[#3b82f6] rounded-full"></div>
              Personalizar Cabeçalho e Rodapé
            </DialogTitle>
          </div>
          <p className="text-sm text-gray-600 mt-2">Configure as cores, tamanhos e espaçamentos do cabeçalho e rodapé da sua página</p>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-2">
          <div className="space-y-4 pb-2">
          {/* Tab-like buttons */}
          <div className="flex gap-2 border-b-2 border-[#3b82f6]">
            <button
              className={`px-6 py-3 font-bold transition-all rounded-t-lg cursor-pointer ${
                activeTab === 'header'
                  ? 'border-b-4 border-[#3b82f6] text-[#3b82f6] bg-blue-50'
                  : 'text-gray-600 hover:text-[#3b82f6] hover:bg-gray-50'
              }`}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTab('header')}
            >
              Cabeçalho
            </button>
            <button
              className={`px-6 py-3 font-bold transition-all rounded-t-lg cursor-pointer ${
                activeTab === 'footer'
                  ? 'border-b-4 border-[#3b82f6] text-[#3b82f6] bg-blue-50'
                  : 'text-gray-600 hover:text-[#3b82f6] hover:bg-gray-50'
              }`}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTab('footer')}
            >
              Rodapé
            </button>
          </div>

          {activeTab === 'header' && (
            <div className="space-y-4">
              {/* Background Type Selection */}
              <div>
                <Label>Tipo de Fundo</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={!headerStyles.useGradient ? "default" : "outline"}
                    onClick={() => setHeaderStyles({ ...headerStyles, useGradient: false })}
                    className="flex-1"
                  >
                    Cor Sólida
                  </Button>
                  <Button
                    type="button"
                    variant={headerStyles.useGradient ? "default" : "outline"}
                    onClick={() => setHeaderStyles({ ...headerStyles, useGradient: true })}
                    className="flex-1"
                  >
                    Gradiente
                  </Button>
                </div>
              </div>

              {!headerStyles.useGradient ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Cor de Fundo</Label>
                    <span className="text-sm text-muted-foreground font-medium">
                      {headerStyles.backgroundColor}
                    </span>
                  </div>
                  <Input
                    type="color"
                    value={headerStyles.backgroundColor}
                    onChange={(e) => setHeaderStyles({ ...headerStyles, backgroundColor: e.target.value })}
                    className="w-full h-12"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Cor Inicial</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <Input
                        type="color"
                        value={headerStyles.gradientColor1}
                        onChange={(e) => setHeaderStyles({ ...headerStyles, gradientColor1: e.target.value })}
                        className="w-20 h-12"
                      />
                      <Input
                        type="text"
                        value={headerStyles.gradientColor1}
                        onChange={(e) => setHeaderStyles({ ...headerStyles, gradientColor1: e.target.value })}
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Cor Final</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <Input
                        type="color"
                        value={headerStyles.gradientColor2}
                        onChange={(e) => setHeaderStyles({ ...headerStyles, gradientColor2: e.target.value })}
                        className="w-20 h-12"
                      />
                      <Input
                        type="text"
                        value={headerStyles.gradientColor2}
                        onChange={(e) => setHeaderStyles({ ...headerStyles, gradientColor2: e.target.value })}
                        placeholder="#f0f0f0"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Direção do Gradiente</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {gradientDirections.map((dir) => (
                        <Button
                          key={dir.value}
                          type="button"
                          variant={headerStyles.gradientDirection === dir.value ? "default" : "outline"}
                          onClick={() => {
                            if (dir.value === 'custom') {
                              setHeaderStyles({ 
                                ...headerStyles, 
                                gradientDirection: 'custom',
                                useCustomAngle: true
                              })
                            } else {
                              setHeaderStyles({ 
                                ...headerStyles, 
                                gradientDirection: dir.value,
                                useCustomAngle: false
                              })
                            }
                          }}
                          className="flex flex-col items-center gap-1 h-auto py-3"
                          title={dir.desc}
                        >
                          <span className="text-lg">{dir.label}</span>
                          <span className="text-xs">{dir.desc}</span>
                        </Button>
                      ))}
                    </div>
                    {headerStyles.gradientDirection === 'custom' && (
                      <div className="mt-3">
                        <Label>Ângulo Personalizado (0-360)</Label>
                        <div className="flex gap-2 items-center mt-2">
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="1"
                            value={parseFloat(headerStyles.customAngle?.replace('deg', '') || '135')}
                            onChange={(e) => {
                              const angle = `${e.target.value}deg`
                              setHeaderStyles({ 
                                ...headerStyles, 
                                customAngle: angle
                              })
                            }}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <Input
                            type="number"
                            min="0"
                            max="360"
                            step="1"
                            value={parseFloat(headerStyles.customAngle?.replace('deg', '') || '135')}
                            onChange={(e) => {
                              const value = Math.min(360, Math.max(0, parseFloat(e.target.value) || 0))
                              const angle = `${value}deg`
                              setHeaderStyles({ 
                                ...headerStyles, 
                                customAngle: angle
                              })
                            }}
                            className="w-24"
                          />
                          <span className="text-sm text-gray-600">°</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Ângulo atual: {headerStyles.customAngle}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Gradient Preview */}
                  <div>
                    <Label>Preview do Gradiente</Label>
                    <div
                      className="w-full h-24 rounded-lg border-2 border-gray-200 mt-2"
                      style={{
                        background: generateGradient(
                          headerStyles.gradientColor1, 
                          headerStyles.gradientColor2, 
                          headerStyles.gradientDirection === 'custom' 
                            ? headerStyles.customAngle || '135deg'
                            : headerStyles.gradientDirection
                        )
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Padding</Label>
                  <span className="text-sm text-muted-foreground font-medium">
                    {headerStyles.padding}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={headerStyles.padding}
                    onChange={(e) => setHeaderStyles({ ...headerStyles, padding: parseFloat(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(headerStyles.padding / 10) * 100}%, #e5e7eb ${(headerStyles.padding / 10) * 100}%)`
                    }}
                  />
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={headerStyles.padding}
                    onChange={(e) => setHeaderStyles({ ...headerStyles, padding: Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)) })}
                    className="w-20"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Altura Mínima</Label>
                  <span className="text-sm text-muted-foreground font-medium">
                    {headerStyles.height > 0 ? headerStyles.height : 'Automático'}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={headerStyles.height}
                    onChange={(e) => setHeaderStyles({ ...headerStyles, height: parseFloat(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(headerStyles.height / 20) * 100}%, #e5e7eb ${(headerStyles.height / 20) * 100}%)`
                    }}
                  />
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={headerStyles.height}
                    onChange={(e) => setHeaderStyles({ ...headerStyles, height: Math.min(20, Math.max(0, parseFloat(e.target.value) || 0)) })}
                    className="w-20"
                    placeholder="0 = Auto"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">0 = Automático (ajusta automaticamente)</p>
              </div>

              <div>
                <Label className="text-base font-semibold text-gray-900">Largura</Label>
                <p className="text-xs text-gray-500 mb-2">Largura do cabeçalho (em pixels, ou use 100 para 100%)</p>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={(() => {
                      const width = headerStyles.width || '100%'
                      if (width.includes('%')) {
                        const match = width.match(/(\d+)/)
                        return match ? parseFloat(match[1]) : 100
                      }
                      if (width.includes('px')) {
                        const match = width.match(/(\d+)/)
                        return match ? parseFloat(match[1]) : 1200
                      }
                      return 100
                    })()}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value) || 100
                      // If it's 100, use percentage, otherwise use pixels
                      const width = num === 100 ? '100%' : `${num}px`
                      setHeaderStyles({ ...headerStyles, width })
                    }}
                    placeholder="100"
                    min="0"
                    className="border-2 border-gray-200 focus:border-[#3b82f6] flex-1"
                  />
                  <Select
                    value={(() => {
                      const width = headerStyles.width || '100%'
                      return width.includes('%') ? 'percent' : 'pixels'
                    })()}
                    onValueChange={(value) => {
                      const currentNum = (() => {
                        const width = headerStyles.width || '100%'
                        const match = width.match(/(\d+)/)
                        return match ? parseFloat(match[1]) : 100
                      })()
                      const newWidth = value === 'percent' ? `${currentNum}%` : `${currentNum}px`
                      setHeaderStyles({ ...headerStyles, width: newWidth })
                    }}
                  >
                    <SelectTrigger className="w-32 border-2 border-gray-200 focus:border-[#3b82f6]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">% (Porcentagem)</SelectItem>
                      <SelectItem value="pixels">px (Pixels)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {headerStyles.width || '100%'} - {headerStyles.width?.includes('%') ? 'Largura relativa' : 'Largura fixa'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="space-y-4">
              {/* Background Type Selection */}
              <div>
                <Label>Tipo de Fundo</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={!footerStyles.useGradient ? "default" : "outline"}
                    onClick={() => setFooterStyles({ ...footerStyles, useGradient: false })}
                    className="flex-1"
                  >
                    Cor Sólida
                  </Button>
                  <Button
                    type="button"
                    variant={footerStyles.useGradient ? "default" : "outline"}
                    onClick={() => setFooterStyles({ ...footerStyles, useGradient: true })}
                    className="flex-1"
                  >
                    Gradiente
                  </Button>
                </div>
              </div>

              {!footerStyles.useGradient ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Cor de Fundo</Label>
                    <span className="text-sm text-muted-foreground font-medium">
                      {footerStyles.backgroundColor}
                    </span>
                  </div>
                  <Input
                    type="color"
                    value={footerStyles.backgroundColor}
                    onChange={(e) => setFooterStyles({ ...footerStyles, backgroundColor: e.target.value })}
                    className="w-full h-12"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Cor Inicial</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <Input
                        type="color"
                        value={footerStyles.gradientColor1}
                        onChange={(e) => setFooterStyles({ ...footerStyles, gradientColor1: e.target.value })}
                        className="w-20 h-12"
                      />
                      <Input
                        type="text"
                        value={footerStyles.gradientColor1}
                        onChange={(e) => setFooterStyles({ ...footerStyles, gradientColor1: e.target.value })}
                        placeholder="#1f2937"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Cor Final</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <Input
                        type="color"
                        value={footerStyles.gradientColor2}
                        onChange={(e) => setFooterStyles({ ...footerStyles, gradientColor2: e.target.value })}
                        className="w-20 h-12"
                      />
                      <Input
                        type="text"
                        value={footerStyles.gradientColor2}
                        onChange={(e) => setFooterStyles({ ...footerStyles, gradientColor2: e.target.value })}
                        placeholder="#374151"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Direção do Gradiente</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {gradientDirections.map((dir) => (
                        <Button
                          key={dir.value}
                          type="button"
                          variant={footerStyles.gradientDirection === dir.value ? "default" : "outline"}
                          onClick={() => {
                            if (dir.value === 'custom') {
                              setFooterStyles({ 
                                ...footerStyles, 
                                gradientDirection: 'custom',
                                useCustomAngle: true
                              })
                            } else {
                              setFooterStyles({ 
                                ...footerStyles, 
                                gradientDirection: dir.value,
                                useCustomAngle: false
                              })
                            }
                          }}
                          className="flex flex-col items-center gap-1 h-auto py-3"
                          title={dir.desc}
                        >
                          <span className="text-lg">{dir.label}</span>
                          <span className="text-xs">{dir.desc}</span>
                        </Button>
                      ))}
                    </div>
                    {footerStyles.gradientDirection === 'custom' && (
                      <div className="mt-3">
                        <Label>Ângulo Personalizado (0-360)</Label>
                        <div className="flex gap-2 items-center mt-2">
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="1"
                            value={parseFloat(footerStyles.customAngle?.replace('deg', '') || '135')}
                            onChange={(e) => {
                              const angle = `${e.target.value}deg`
                              setFooterStyles({ 
                                ...footerStyles, 
                                customAngle: angle
                              })
                            }}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <Input
                            type="number"
                            min="0"
                            max="360"
                            step="1"
                            value={parseFloat(footerStyles.customAngle?.replace('deg', '') || '135')}
                            onChange={(e) => {
                              const value = Math.min(360, Math.max(0, parseFloat(e.target.value) || 0))
                              const angle = `${value}deg`
                              setFooterStyles({ 
                                ...footerStyles, 
                                customAngle: angle
                              })
                            }}
                            className="w-24"
                          />
                          <span className="text-sm text-gray-600">°</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Ângulo atual: {footerStyles.customAngle}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Gradient Preview */}
                  <div>
                    <Label>Preview do Gradiente</Label>
                    <div
                      className="w-full h-24 rounded-lg border-2 border-gray-200 mt-2"
                      style={{
                        background: generateGradient(
                          footerStyles.gradientColor1, 
                          footerStyles.gradientColor2, 
                          footerStyles.gradientDirection === 'custom'
                            ? footerStyles.customAngle || '135deg'
                            : footerStyles.gradientDirection
                        )
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Padding</Label>
                  <span className="text-sm text-muted-foreground font-medium">
                    {footerStyles.padding}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={footerStyles.padding}
                    onChange={(e) => setFooterStyles({ ...footerStyles, padding: parseFloat(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(footerStyles.padding / 10) * 100}%, #e5e7eb ${(footerStyles.padding / 10) * 100}%)`
                    }}
                  />
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={footerStyles.padding}
                    onChange={(e) => setFooterStyles({ ...footerStyles, padding: Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)) })}
                    className="w-20"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Altura Mínima</Label>
                  <span className="text-sm text-muted-foreground font-medium">
                    {footerStyles.height > 0 ? footerStyles.height : 'Automático'}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={footerStyles.height}
                    onChange={(e) => setFooterStyles({ ...footerStyles, height: parseFloat(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(footerStyles.height / 20) * 100}%, #e5e7eb ${(footerStyles.height / 20) * 100}%)`
                    }}
                  />
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={footerStyles.height}
                    onChange={(e) => setFooterStyles({ ...footerStyles, height: Math.min(20, Math.max(0, parseFloat(e.target.value) || 0)) })}
                    className="w-20"
                    placeholder="0 = Auto"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">0 = Automático (ajusta automaticamente)</p>
              </div>

              <div>
                <Label className="text-base font-semibold text-gray-900">Largura</Label>
                <p className="text-xs text-gray-500 mb-2">Largura do rodapé (em pixels, ou use 100 para 100%)</p>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={(() => {
                      const width = footerStyles.width || '100%'
                      if (width.includes('%')) {
                        const match = width.match(/(\d+)/)
                        return match ? parseFloat(match[1]) : 100
                      }
                      if (width.includes('px')) {
                        const match = width.match(/(\d+)/)
                        return match ? parseFloat(match[1]) : 1200
                      }
                      return 100
                    })()}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value) || 100
                      // If it's 100, use percentage, otherwise use pixels
                      const width = num === 100 ? '100%' : `${num}px`
                      setFooterStyles({ ...footerStyles, width })
                    }}
                    placeholder="100"
                    min="0"
                    className="border-2 border-gray-200 focus:border-[#3b82f6] flex-1"
                  />
                  <Select
                    value={(() => {
                      const width = footerStyles.width || '100%'
                      return width.includes('%') ? 'percent' : 'pixels'
                    })()}
                    onValueChange={(value) => {
                      const currentNum = (() => {
                        const width = footerStyles.width || '100%'
                        const match = width.match(/(\d+)/)
                        return match ? parseFloat(match[1]) : 100
                      })()
                      const newWidth = value === 'percent' ? `${currentNum}%` : `${currentNum}px`
                      setFooterStyles({ ...footerStyles, width: newWidth })
                    }}
                  >
                    <SelectTrigger className="w-32 border-2 border-gray-200 focus:border-[#3b82f6]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">% (Porcentagem)</SelectItem>
                      <SelectItem value="pixels">px (Pixels)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {footerStyles.width || '100%'} - {footerStyles.width?.includes('%') ? 'Largura relativa' : 'Largura fixa'}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-[#3b82f6] flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold shadow-md hover:shadow-lg border-2 border-[#2563eb]"
            >
              Salvar Alterações
            </Button>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
