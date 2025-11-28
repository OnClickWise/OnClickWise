"use client"

import * as React from "react"
import { LandingPageElement } from "@/types/landing-page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
// Using native textarea for now

interface ElementPanelProps {
  element: LandingPageElement
  onUpdate: (element: LandingPageElement) => void
  onClose: () => void
  onDelete?: () => void
}

export function ElementPanel({ element, onUpdate, onClose, onDelete }: ElementPanelProps) {
  const t = useTranslations('LandingPageCreator.elementPanel')
  // Color picker refs (uncontrolled to prevent re-renders during drag)
  const bgColorPickerRef = React.useRef<HTMLInputElement>(null)
  const gradientColor1PickerRef = React.useRef<HTMLInputElement>(null)
  const gradientColor2PickerRef = React.useRef<HTMLInputElement>(null)
  const textColorPickerRef = React.useRef<HTMLInputElement>(null)
  
  // Debounce/animation timers
  const bgColorDebounceTimer = React.useRef<NodeJS.Timeout | null>(null)
  const textColorDebounceTimer = React.useRef<NodeJS.Timeout | null>(null)
  const gradientUpdateFrame = React.useRef<number | null>(null)
  const latestGradientRef = React.useRef<string | null>(null)
  
  // Track last click time for color pickers
  const bgPickerLastClickRef = React.useRef(0)
  const textPickerLastClickRef = React.useRef(0)
  
  // Extract gradient colors from gradient string
  const getGradientColors = (gradient: string | undefined) => {
    if (!gradient) return { color1: '#3b82f6', color2: '#2563eb' }
    const match1 = gradient.match(/#[0-9A-Fa-f]{6}/g)
    if (match1 && match1.length >= 2) {
      return { color1: match1[0], color2: match1[1] }
    }
    return { color1: '#3b82f6', color2: '#2563eb' }
  }
  
  const gradientColors = getGradientColors(element.styles?.backgroundGradient)
  const [gradientColor1, setGradientColor1] = React.useState(gradientColors.color1)
  const [gradientColor2, setGradientColor2] = React.useState(gradientColors.color2)
  const gradientColorsRef = React.useRef({ color1: gradientColors.color1, color2: gradientColors.color2 })
  
  // Extract gradient direction from gradient string
  const getGradientDirection = (gradient: string | undefined): string => {
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

  const initialDirection = getGradientDirection(element.styles?.backgroundGradient)
  const initialIsCustom = !gradientDirections.some(d => d.value === initialDirection)
  
  const [gradientDirection, setGradientDirection] = React.useState(initialIsCustom ? 'custom' : initialDirection)
  const [useCustomAngle, setUseCustomAngle] = React.useState(initialIsCustom)
  const [customAngle, setCustomAngle] = React.useState(initialDirection)
  
  // Initialize color picker values and gradient direction
  React.useEffect(() => {
    if (bgColorPickerRef.current && element.styles?.backgroundColor) {
      bgColorPickerRef.current.value = element.styles.backgroundColor
    }
    const gradientColors = getGradientColors(element.styles?.backgroundGradient)
    setGradientColor1(gradientColors.color1)
    setGradientColor2(gradientColors.color2)
    gradientColorsRef.current = {
      color1: gradientColors.color1,
      color2: gradientColors.color2,
    }
    if (gradientColor1PickerRef.current) {
      gradientColor1PickerRef.current.value = gradientColors.color1
    }
    if (gradientColor2PickerRef.current) {
      gradientColor2PickerRef.current.value = gradientColors.color2
    }
    const direction = getGradientDirection(element.styles?.backgroundGradient)
    const isCustom = !gradientDirections.some(d => d.value === direction)
    setGradientDirection(isCustom ? 'custom' : direction)
    setUseCustomAngle(isCustom)
    setCustomAngle(direction)
    if (textColorPickerRef.current && element.styles?.color) {
      textColorPickerRef.current.value = element.styles.color
    }
  }, [element.styles?.backgroundColor, element.styles?.color, element.styles?.backgroundGradient])
  
  React.useEffect(() => {
    gradientColorsRef.current.color1 = gradientColor1
  }, [gradientColor1])

  React.useEffect(() => {
    gradientColorsRef.current.color2 = gradientColor2
  }, [gradientColor2])

  // Cleanup timers / animation frames
  React.useEffect(() => {
    return () => {
      if (bgColorDebounceTimer.current) clearTimeout(bgColorDebounceTimer.current)
      if (textColorDebounceTimer.current) clearTimeout(textColorDebounceTimer.current)
      if (gradientUpdateFrame.current !== null) cancelAnimationFrame(gradientUpdateFrame.current)
    }
  }, [])

  const handleUpdate = (updates: Partial<LandingPageElement>) => {
    onUpdate({ ...element, ...updates })
  }

  const parseSpacingValue = (value: string | undefined): number => {
    if (!value) return 0
    const match = value.match(/^(\d+(?:\.\d+)?)/)
    return match ? parseFloat(match[1]) : 0
  }

  const formatSpacingValue = (value: number): string => {
    return value ? `${value}rem` : ''
  }
  
  // Helper to parse numeric value from string (rem, px, or plain number)
  const parseNumericValue = (value: string | undefined): number => {
    if (!value) return 0
    const match = value.match(/(\d+(?:\.\d+)?)/)
    if (match) {
      const num = parseFloat(match[1])
      // If it's already in rem, return the number directly
      if (value.includes('rem')) return num
      // If it's in px, convert to rem (divide by 16)
      if (value.includes('px')) return num / 16
      // If it's just a number, assume it's already in rem scale
      return num
    }
    return 0
  }
  
  // Helper to format number to rem string
  const formatToRem = (value: number): string => {
    return value > 0 ? `${value}rem` : ''
  }
  
  // Debounced color change handlers
  const handleBgColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (bgColorDebounceTimer.current) {
      clearTimeout(bgColorDebounceTimer.current)
    }
    bgColorDebounceTimer.current = setTimeout(() => {
      handleUpdate({
        styles: { 
          ...element.styles, 
          backgroundColor: value,
          backgroundGradient: undefined
        }
      })
    }, 300)
  }
  
  const scheduleGradientUpdate = (gradient: string) => {
    latestGradientRef.current = gradient
    if (gradientUpdateFrame.current !== null) {
      cancelAnimationFrame(gradientUpdateFrame.current)
    }
    gradientUpdateFrame.current = requestAnimationFrame(() => {
      gradientUpdateFrame.current = null
      handleUpdate({
        styles: {
          ...element.styles,
          backgroundGradient: latestGradientRef.current || gradient,
          backgroundColor: undefined,
        },
      })
    })
  }

  const buildGradient = (color1: string, color2: string, directionOverride?: string) => {
    const direction = directionOverride ?? (gradientDirection === 'custom' ? customAngle : gradientDirection)
    return `linear-gradient(${direction}, ${color1} 0%, ${color2} 100%)`
  }

  const handleGradientColor1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setGradientColor1(value)
    gradientColorsRef.current.color1 = value
    const gradient = buildGradient(value, gradientColorsRef.current.color2)
    scheduleGradientUpdate(gradient)
  }

  const handleGradientColor2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setGradientColor2(value)
    gradientColorsRef.current.color2 = value
    const gradient = buildGradient(gradientColorsRef.current.color1, value)
    scheduleGradientUpdate(gradient)
  }
  
  const handleGradientDirectionChange = (direction: string) => {
    if (direction === 'custom') {
      setGradientDirection('custom')
      setUseCustomAngle(true)
    } else {
      setGradientDirection(direction)
      setUseCustomAngle(false)
      setCustomAngle(direction)
      const newGradient = buildGradient(gradientColor1, gradientColor2, direction)
      scheduleGradientUpdate(newGradient)
    }
  }

  const handleCustomAngleChange = (angle: string) => {
    setCustomAngle(angle)
    const newGradient = buildGradient(gradientColor1, gradientColor2, angle)
    scheduleGradientUpdate(newGradient)
  }
  
  const handleBgColorTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      if (bgColorPickerRef.current) {
        bgColorPickerRef.current.value = value
      }
      handleUpdate({
        styles: { 
          ...element.styles, 
          backgroundColor: value,
          backgroundGradient: undefined
        }
      })
    }
  }
  
  const handleGradientColor1TextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      setGradientColor1(value)
      if (gradientColor1PickerRef.current) {
        gradientColor1PickerRef.current.value = value
      }
      const direction = gradientDirection === 'custom' ? customAngle : gradientDirection
      const newGradient = buildGradient(value, gradientColor2)
      scheduleGradientUpdate(newGradient)
    }
  }
  
  const handleGradientColor2TextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      setGradientColor2(value)
      if (gradientColor2PickerRef.current) {
        gradientColor2PickerRef.current.value = value
      }
      const direction = gradientDirection === 'custom' ? customAngle : gradientDirection
      const newGradient = buildGradient(gradientColor1, value)
      scheduleGradientUpdate(newGradient)
    }
  }
  
  const handleTextColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (textColorDebounceTimer.current) {
      clearTimeout(textColorDebounceTimer.current)
    }
    textColorDebounceTimer.current = setTimeout(() => {
      handleUpdate({
        styles: { ...element.styles, color: value }
      })
    }, 300)
  }
  
  const handleTextColorTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      if (textColorPickerRef.current) {
        textColorPickerRef.current.value = value
      }
      handleUpdate({
        styles: { ...element.styles, color: value }
      })
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] sm:w-[90vw] max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader className="border-b-2 border-[#3b82f6] pb-3 sm:pb-4 mb-3 sm:mb-4 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-2 h-6 sm:h-8 bg-[#3b82f6] rounded-full"></div>
            Editar Elemento
          </DialogTitle>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">Personalize o conteúdo e estilo do seu elemento</p>
        </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1 sm:pr-2">
          <div className="space-y-4 pb-2">
          {/* Title/Subtitle */}
          {(element.type === 'title' || element.type === 'subtitle') && (
            <>
              <div>
                <Label className="text-base font-semibold text-gray-900">Texto do Título</Label>
                <p className="text-xs text-gray-500 mb-2">Digite o texto que aparecerá como título</p>
                <textarea
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg resize-none focus:border-[#3b82f6] focus:outline-none"
                  value={element.content || ''}
                  onChange={(e) => handleUpdate({ content: e.target.value })}
                  rows={3}
                  placeholder="Ex: Bem-vindo ao nosso produto"
                />
              </div>
              <div>
                <Label className="text-base font-semibold text-gray-900">Tamanho do Título</Label>
                <p className="text-xs text-gray-500 mb-2">Escolha o tamanho: 1 é o maior, 6 é o menor</p>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min="1"
                    max="6"
                    value={element.level || 1}
                    onChange={(e) => handleUpdate({ level: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6 })}
                    className="w-20 border-2 border-gray-200 focus:border-[#3b82f6]"
                  />
                  <div className="flex-1 text-sm text-gray-600">
                    {element.level === 1 && "Título Principal (Maior)"}
                    {element.level === 2 && "Subtítulo Grande"}
                    {element.level === 3 && "Subtítulo Médio"}
                    {element.level === 4 && "Subtítulo Pequeno"}
                    {element.level === 5 && "Título Muito Pequeno"}
                    {element.level === 6 && "Título Menor"}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Paragraph */}
          {element.type === 'paragraph' && (
            <div>
              <Label className="text-base font-semibold text-gray-900">Texto do Parágrafo</Label>
              <p className="text-xs text-gray-500 mb-2">Digite o texto que aparecerá no parágrafo</p>
              <textarea
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg resize-none focus:border-[#3b82f6] focus:outline-none"
                value={element.content || ''}
                onChange={(e) => handleUpdate({ content: e.target.value })}
                rows={6}
                placeholder="Ex: Este é um parágrafo de exemplo que explica algo importante sobre o seu produto ou serviço."
              />
            </div>
          )}

          {/* Button */}
          {element.type === 'button' && (
            <>
              <div>
                <Label className="text-base font-semibold text-gray-900">Texto do Botão</Label>
                <p className="text-xs text-gray-500 mb-2">O texto que aparecerá dentro do botão</p>
                <Input
                  value={element.text || ''}
                  onChange={(e) => handleUpdate({ text: e.target.value })}
                  placeholder="Ex: Comprar Agora"
                  className="border-2 border-gray-200 focus:border-[#3b82f6]"
                />
              </div>
              <div>
                <Label className="text-base font-semibold text-gray-900">Estilo do Botão</Label>
                <p className="text-xs text-gray-500 mb-2">Escolha a aparência do botão</p>
                <Select
                  value={element.variant || 'primary'}
                  onValueChange={(value) => handleUpdate({ variant: value as 'primary' | 'secondary' | 'outline' })}
                >
                  <SelectTrigger className="border-2 border-gray-200 focus:border-[#3b82f6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">🔵 Principal (Azul preenchido)</SelectItem>
                    <SelectItem value="secondary">🟡 Secundário (Amarelo preenchido)</SelectItem>
                    <SelectItem value="outline">⚪ Contorno (Apenas borda)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-base font-semibold text-gray-900">Link do Botão</Label>
                <p className="text-xs text-gray-500 mb-2">Onde o botão levará quando clicado (opcional)</p>
                <Input
                  value={element.href || ''}
                  onChange={(e) => handleUpdate({ href: e.target.value })}
                  placeholder="https://exemplo.com"
                  className="border-2 border-gray-200 focus:border-[#3b82f6]"
                />
              </div>
            </>
          )}

          {/* Image */}
          {element.type === 'image' && (
            <>
              <div>
                <Label className="text-base font-semibold text-gray-900">Imagem</Label>
                <p className="text-xs text-gray-500 mb-2">Cole o link da imagem ou faça upload de um arquivo</p>
                <div className="flex gap-2">
                  <Input
                    value={element.src || ''}
                    onChange={(e) => handleUpdate({ src: e.target.value })}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="border-2 border-gray-200 focus:border-[#3b82f6]"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          const result = event.target?.result as string
                          handleUpdate({ src: result })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="border-2 border-[#3b82f6] text-[#3b82f6] hover:bg-blue-50 font-semibold"
                  >
                    📤 Enviar
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-base font-semibold text-gray-900">Texto Alternativo</Label>
                <p className="text-xs text-gray-500 mb-2">Descrição da imagem para acessibilidade (aparece se a imagem não carregar)</p>
                <Input
                  value={element.alt || ''}
                  onChange={(e) => handleUpdate({ alt: e.target.value })}
                  placeholder="Ex: Logo da empresa"
                  className="border-2 border-gray-200 focus:border-[#3b82f6]"
                />
              </div>
              {element.src && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <p className="text-xs text-gray-600 mb-2 font-semibold">📷 Prévia:</p>
                  <img
                    src={element.src}
                    alt={element.alt || 'Preview'}
                    className="max-w-full h-auto max-h-48 rounded border-2 border-gray-300"
                  />
                </div>
              )}
            </>
          )}

          {/* Video */}
          {element.type === 'video' && (
            <>
              <div>
                <Label className="text-base font-semibold text-gray-900">Link do Vídeo</Label>
                <p className="text-xs text-gray-500 mb-2">Cole o link do vídeo (YouTube, Vimeo, etc.)</p>
                <Input
                  value={element.src || ''}
                  onChange={(e) => handleUpdate({ src: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="border-2 border-gray-200 focus:border-[#3b82f6]"
                />
              </div>
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <input
                    type="checkbox"
                    id="autoplay"
                    checked={element.autoplay || false}
                    onChange={(e) => handleUpdate({ autoplay: e.target.checked })}
                    className="w-5 h-5 text-[#3b82f6] border-2 border-gray-300 rounded focus:ring-[#3b82f6]"
                  />
                  <Label htmlFor="autoplay" className="text-sm font-medium text-gray-900 cursor-pointer">
                    ▶️ Reproduzir automaticamente
                  </Label>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <input
                    type="checkbox"
                    id="controls"
                    checked={element.controls !== false}
                    onChange={(e) => handleUpdate({ controls: e.target.checked })}
                    className="w-5 h-5 text-[#3b82f6] border-2 border-gray-300 rounded focus:ring-[#3b82f6]"
                  />
                  <Label htmlFor="controls" className="text-sm font-medium text-gray-900 cursor-pointer">
                    🎮 Mostrar controles (play, pause, volume)
                  </Label>
                </div>
              </div>
            </>
          )}

          {/* Form */}
          {element.type === 'form' && (
            <>
              <div>
                <Label className="text-base font-semibold text-gray-900">Texto do Botão de Enviar</Label>
                <p className="text-xs text-gray-500 mb-2">O texto que aparecerá no botão de enviar do formulário</p>
                <Input
                  value={element.submitText || 'Enviar'}
                  onChange={(e) => handleUpdate({ submitText: e.target.value })}
                  placeholder="Ex: Enviar Mensagem"
                  className="border-2 border-gray-200 focus:border-[#3b82f6]"
                />
              </div>
              <div>
                <Label className="text-base font-semibold text-gray-900">URL de Envio (Opcional)</Label>
                <p className="text-xs text-gray-500 mb-2">Onde os dados do formulário serão enviados (deixe vazio se não souber)</p>
                <Input
                  value={element.action || ''}
                  onChange={(e) => handleUpdate({ action: e.target.value })}
                  placeholder="https://exemplo.com/enviar"
                  className="border-2 border-gray-200 focus:border-[#3b82f6]"
                />
              </div>
              <div>
                <Label className="text-base font-semibold text-gray-900">Campos do Formulário</Label>
                <p className="text-xs text-gray-500 mb-2">Adicione ou remova campos que o visitante preencherá</p>
                <div className="space-y-3 mt-2">
                  {element.fields?.map((field, index) => (
                    <div key={field.id} className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">Campo {index + 1}</span>
                          {field.required && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded">
                              Obrigatório
                            </span>
                          )}
                          {!field.required && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-gray-200 text-gray-600 rounded">
                              Opcional
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newFields = element.fields?.filter(f => f.id !== field.id) || []
                            handleUpdate({ fields: newFields })
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1 block">Rótulo do Campo</Label>
                          <Input
                            placeholder="Ex: Nome Completo"
                            value={field.label}
                            onChange={(e) => {
                              const newFields = element.fields?.map(f =>
                                f.id === field.id ? { ...f, label: e.target.value } : f
                              ) || []
                              handleUpdate({ fields: newFields })
                            }}
                            className="border-2 border-gray-200 focus:border-[#3b82f6]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1 block">Tipo de Campo</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value) => {
                              const newFields = element.fields?.map(f =>
                                f.id === field.id ? { ...f, type: value as any } : f
                              ) || []
                              handleUpdate({ fields: newFields })
                            }}
                          >
                            <SelectTrigger className="border-2 border-gray-200 focus:border-[#3b82f6]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="tel">Telefone</SelectItem>
                              <SelectItem value="textarea">Área de Texto</SelectItem>
                              <SelectItem value="select">Seleção (Dropdown)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1 block">Placeholder (Texto de Exemplo)</Label>
                          <Input
                            placeholder="Ex: Digite seu nome completo"
                            value={field.placeholder || ''}
                            onChange={(e) => {
                              const newFields = element.fields?.map(f =>
                                f.id === field.id ? { ...f, placeholder: e.target.value } : f
                              ) || []
                              handleUpdate({ fields: newFields })
                            }}
                            className="border-2 border-gray-200 focus:border-[#3b82f6]"
                          />
                          <p className="text-xs text-gray-500 mt-1">Este texto aparecerá dentro do campo antes do usuário digitar</p>
                        </div>
                        {field.type === 'select' && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1 block">Opções do Dropdown</Label>
                            <div className="space-y-2">
                              {field.options?.map((option, optIndex) => (
                                <div key={optIndex} className="flex gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...(field.options || [])]
                                      newOptions[optIndex] = e.target.value
                                      const newFields = element.fields?.map(f =>
                                        f.id === field.id ? { ...f, options: newOptions } : f
                                      ) || []
                                      handleUpdate({ fields: newFields })
                                    }}
                                    className="border-2 border-gray-200 focus:border-[#3b82f6]"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newOptions = field.options?.filter((_, i) => i !== optIndex) || []
                                      const newFields = element.fields?.map(f =>
                                        f.id === field.id ? { ...f, options: newOptions } : f
                                      ) || []
                                      handleUpdate({ fields: newFields })
                                    }}
                                    className="text-red-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newOptions = [...(field.options || []), 'Nova Opção']
                                  const newFields = element.fields?.map(f =>
                                    f.id === field.id ? { ...f, options: newOptions } : f
                                  ) || []
                                  handleUpdate({ fields: newFields })
                                }}
                                className="w-full"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Opção
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200">
                          <input
                            type="checkbox"
                            id={`required-${field.id}`}
                            checked={field.required || false}
                            onChange={(e) => {
                              const newFields = element.fields?.map(f =>
                                f.id === field.id ? { ...f, required: e.target.checked } : f
                              ) || []
                              handleUpdate({ fields: newFields })
                            }}
                            className="w-5 h-5 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6] cursor-pointer"
                          />
                          <Label 
                            htmlFor={`required-${field.id}`}
                            className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
                          >
                            Campo Obrigatório
                          </Label>
                          <span className="text-xs text-gray-500">
                            {field.required ? 'O usuário deve preencher este campo' : 'Este campo pode ficar vazio'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newField = {
                        id: Math.random().toString(36).slice(2, 10),
                        type: 'text' as const,
                        label: 'Novo Campo',
                        placeholder: '',
                        required: false,
                      }
                      handleUpdate({ fields: [...(element.fields || []), newField] })
                    }}
                    className="w-full border-2 border-dashed border-gray-300 hover:border-[#3b82f6] hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Campo
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Highlight */}
          {element.type === 'highlight' && (
            <>
              <div>
                <Label className="text-base font-semibold text-gray-900">Texto de Destaque</Label>
                <p className="text-xs text-gray-500 mb-2">O texto que aparecerá na caixa de destaque</p>
                <textarea
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg resize-none focus:border-[#3b82f6] focus:outline-none"
                  value={element.content || ''}
                  onChange={(e) => handleUpdate({ content: e.target.value })}
                  rows={4}
                  placeholder="Ex: Atenção! Esta é uma informação importante..."
                />
              </div>
              <div>
                <Label className="text-base font-semibold text-gray-900">Tipo de Destaque</Label>
                <p className="text-xs text-gray-500 mb-2">Escolha a cor e estilo da caixa de destaque</p>
                <Select
                  value={element.variant || 'info'}
                  onValueChange={(value) => handleUpdate({ variant: value as 'info' | 'success' | 'warning' | 'error' })}
                >
                  <SelectTrigger className="border-2 border-gray-200 focus:border-[#3b82f6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">ℹ️ Informação (Azul)</SelectItem>
                    <SelectItem value="success">✅ Sucesso (Verde)</SelectItem>
                    <SelectItem value="warning">⚠️ Aviso (Amarelo)</SelectItem>
                    <SelectItem value="error">❌ Erro (Vermelho)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Icon List */}
          {element.type === 'icon-list' && (
            <>
              <div>
                <Label>Columns</Label>
                <Select
                  value={String(element.columns || 2)}
                  onValueChange={(value) => handleUpdate({ columns: parseInt(value) as 1 | 2 | 3 })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Column</SelectItem>
                    <SelectItem value="2">2 Columns</SelectItem>
                    <SelectItem value="3">3 Columns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Items</Label>
                <div className="space-y-2 mt-2">
                  {element.items?.map((item, index) => (
                    <div key={item.id} className="flex gap-2">
                      <Input
                        value={item.text}
                        onChange={(e) => {
                          const newItems = element.items?.map(i =>
                            i.id === item.id ? { ...i, text: e.target.value } : i
                          ) || []
                          handleUpdate({ items: newItems })
                        }}
                        placeholder={`Item ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newItems = element.items?.filter(i => i.id !== item.id) || []
                          handleUpdate({ items: newItems })
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newItem = {
                        id: Math.random().toString(36).slice(2, 10),
                        text: 'New Item',
                      }
                      handleUpdate({ items: [...(element.items || []), newItem] })
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Testimonial */}
          {element.type === 'testimonial' && (
            <>
              <div>
                <Label className="text-base font-semibold text-gray-900">Estilo de Exibição</Label>
                <p className="text-xs text-gray-500 mb-2">Como os depoimentos serão mostrados</p>
                <Select
                  value={element.layout || 'cards'}
                  onValueChange={(value) => handleUpdate({ layout: value as 'cards' | 'list' })}
                >
                  <SelectTrigger className="border-2 border-gray-200 focus:border-[#3b82f6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cards">🃏 Cards (Cartões)</SelectItem>
                    <SelectItem value="list">📋 Lista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-base font-semibold text-gray-900">Depoimentos</Label>
                <p className="text-xs text-gray-500 mb-2">Adicione ou edite os depoimentos dos clientes</p>
                <div className="space-y-3 mt-2">
                  {element.testimonials?.map((testimonial, index) => (
                    <div key={testimonial.id} className="p-3 border rounded-md">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">Testimonial {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newTestimonials = element.testimonials?.filter(t => t.id !== testimonial.id) || []
                            handleUpdate({ testimonials: newTestimonials })
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Name"
                          value={testimonial.name}
                          onChange={(e) => {
                            const newTestimonials = element.testimonials?.map(t =>
                              t.id === testimonial.id ? { ...t, name: e.target.value } : t
                            ) || []
                            handleUpdate({ testimonials: newTestimonials })
                          }}
                        />
                        <Input
                          placeholder="Role"
                          value={testimonial.role || ''}
                          onChange={(e) => {
                            const newTestimonials = element.testimonials?.map(t =>
                              t.id === testimonial.id ? { ...t, role: e.target.value } : t
                            ) || []
                            handleUpdate({ testimonials: newTestimonials })
                          }}
                        />
                        <textarea
                          className="w-full px-3 py-2 border rounded-md resize-none"
                          placeholder="Content"
                          value={testimonial.content}
                          onChange={(e) => {
                            const newTestimonials = element.testimonials?.map(t =>
                              t.id === testimonial.id ? { ...t, content: e.target.value } : t
                            ) || []
                            handleUpdate({ testimonials: newTestimonials })
                          }}
                          rows={3}
                        />
                        <div>
                          <Label>Rating (1-5)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            value={testimonial.rating || 5}
                            onChange={(e) => {
                              const newTestimonials = element.testimonials?.map(t =>
                                t.id === testimonial.id ? { ...t, rating: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 } : t
                              ) || []
                              handleUpdate({ testimonials: newTestimonials })
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newTestimonial = {
                        id: Math.random().toString(36).slice(2, 10),
                        name: 'John Doe',
                        content: 'Great product!',
                        rating: 5 as const,
                      }
                      handleUpdate({ testimonials: [...(element.testimonials || []), newTestimonial] })
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Testimonial
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* FAQ */}
          {element.type === 'faq' && (
            <div>
              <Label className="text-base font-semibold text-gray-900">Perguntas Frequentes</Label>
              <p className="text-xs text-gray-500 mb-2">Adicione perguntas e respostas que os visitantes podem ver</p>
              <div className="space-y-2 mt-2">
                {element.items?.map((item, index) => (
                  <div key={item.id} className="p-3 border rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">FAQ {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newItems = element.items?.filter(i => i.id !== item.id) || []
                          handleUpdate({ items: newItems })
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Question"
                        value={item.question}
                        onChange={(e) => {
                          const newItems = element.items?.map(i =>
                            i.id === item.id ? { ...i, question: e.target.value } : i
                          ) || []
                          handleUpdate({ items: newItems })
                        }}
                      />
                      <textarea
                        className="w-full px-3 py-2 border rounded-md resize-none"
                        placeholder="Answer"
                        value={item.answer}
                        onChange={(e) => {
                          const newItems = element.items?.map(i =>
                            i.id === item.id ? { ...i, answer: e.target.value } : i
                          ) || []
                          handleUpdate({ items: newItems })
                        }}
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newItem = {
                      id: Math.random().toString(36).slice(2, 10),
                      question: 'Question?',
                      answer: 'Answer here.',
                    }
                    handleUpdate({ items: [...(element.items || []), newItem] })
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add FAQ Item
                </Button>
              </div>
            </div>
          )}

          {/* Countdown */}
          {element.type === 'countdown' && (
            <div>
              <Label className="text-base font-semibold text-gray-900">⏰ Data e Hora Final</Label>
              <p className="text-xs text-gray-500 mb-2">Escolha quando o contador deve chegar a zero</p>
              <Input
                type="datetime-local"
                value={element.targetDate ? new Date(element.targetDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  const date = new Date(e.target.value)
                  handleUpdate({ targetDate: date.toISOString() })
                }}
                className="border-2 border-gray-200 focus:border-[#3b82f6]"
              />
              {element.targetDate && (
                <p className="text-xs text-blue-600 mt-2">
                  📅 O contador mostrará o tempo restante até {new Date(element.targetDate).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          )}

          {/* Common style options for all elements */}
          <div className="pt-4 border-t-2 border-[#3b82f6]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[#3b82f6] rounded-full"></div>
              <h3 className="font-bold text-lg text-gray-900">Estilos</h3>
            </div>
            <div className="space-y-3">
              {/* Size controls - especially important for images and videos */}
              {(element.type === 'image' || element.type === 'video') && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Largura</Label>
                      <span className="text-sm text-muted-foreground font-medium">
                        {(() => {
                          const currentValue = element.type === 'image' 
                            ? (element.width || element.styles?.width || '100%') 
                            : (element.styles?.width || '100%')
                          // Parse current value to get a number (1-100)
                          if (currentValue.includes('%')) {
                            const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                            return match ? Math.round(parseFloat(match[1])) : 100
                          }
                          if (currentValue.includes('rem')) {
                            const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                            if (match) {
                              // Convert rem to our scale: 1rem = 10, 10rem = 100
                              return Math.min(100, Math.max(1, Math.round(parseFloat(match[1]) * 10)))
                            }
                          }
                          if (currentValue.includes('px')) {
                            const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                            if (match) {
                              // Rough conversion: 100px = 10, 1000px = 100
                              return Math.min(100, Math.max(1, Math.round(parseFloat(match[1]) / 10)))
                            }
                          }
                          return 100
                        })()}
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        value={(() => {
                          const currentValue = element.type === 'image' 
                            ? (element.width || element.styles?.width || '100%') 
                            : (element.styles?.width || '100%')
                          // Extract number from value
                          const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                          if (match) {
                            const num = parseFloat(match[1])
                            // If it's a percentage, return the number directly
                            if (currentValue.includes('%')) {
                              return Math.min(100, Math.max(1, num))
                            }
                            // If it's rem, convert to our scale: 1rem = 10, 10rem = 100
                            if (currentValue.includes('rem')) {
                              return Math.min(100, Math.max(1, Math.round(num * 10)))
                            }
                            // If it's px, convert roughly (100px = 10, 1000px = 100)
                            if (currentValue.includes('px')) {
                              return Math.min(100, Math.max(1, Math.round(num / 10)))
                            }
                            return Math.min(100, Math.max(1, num))
                          }
                          return 100
                        })()}
                        onChange={(e) => {
                          const value = parseInt(e.target.value)
                          // Convert to rem (1-100 range becomes 1rem-100rem, but we'll use percentage for simplicity)
                          // Actually, let's use rem: value 10-100 becomes 1rem-10rem
                          const remValue = `${value / 10}rem`
                          if (element.type === 'image') {
                            handleUpdate({ 
                              width: remValue, 
                              styles: { 
                                ...element.styles, 
                                width: remValue,
                                maxWidth: remValue // Set maxWidth to same value
                              } 
                            })
                          } else {
                            handleUpdate({ 
                              styles: { 
                                ...element.styles, 
                                width: remValue,
                                maxWidth: remValue
                              } 
                            })
                          }
                        }}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(() => {
                            const currentValue = element.type === 'image' 
                              ? (element.width || element.styles?.width || '100%') 
                              : (element.styles?.width || '100%')
                            if (currentValue.includes('%')) {
                              const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                              return match ? parseFloat(match[1]) : 100
                            }
                            if (currentValue.includes('rem')) {
                              const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                              if (match) return Math.min(100, Math.max(0, parseFloat(match[1]) * 10))
                            }
                            if (currentValue.includes('px')) {
                              const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                              if (match) return Math.min(100, Math.max(0, parseFloat(match[1]) / 10))
                            }
                            return 100
                          })()}%, #e5e7eb ${(() => {
                            const currentValue = element.type === 'image' 
                              ? (element.width || element.styles?.width || '100%') 
                              : (element.styles?.width || '100%')
                            if (currentValue.includes('%')) {
                              const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                              return match ? parseFloat(match[1]) : 100
                            }
                            if (currentValue.includes('rem')) {
                              const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                              if (match) return Math.min(100, Math.max(0, parseFloat(match[1]) * 10))
                            }
                            if (currentValue.includes('px')) {
                              const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                              if (match) return Math.min(100, Math.max(0, parseFloat(match[1]) / 10))
                            }
                            return 100
                          })()}%)`
                        }}
                      />
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={(() => {
                          const currentValue = element.type === 'image' 
                            ? (element.width || element.styles?.width || '100%') 
                            : (element.styles?.width || '100%')
                          const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                          if (match) {
                            const num = parseFloat(match[1])
                            if (currentValue.includes('%')) return Math.round(num)
                            if (currentValue.includes('rem')) return Math.round(num * 10)
                            if (currentValue.includes('px')) return Math.round(num / 10)
                            return Math.round(num)
                          }
                          return 100
                        })()}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 100
                          const remValue = `${value / 10}rem`
                          if (element.type === 'image') {
                            handleUpdate({ 
                              width: remValue, 
                              styles: { 
                                ...element.styles, 
                                width: remValue,
                                maxWidth: remValue
                              } 
                            })
                          } else {
                            handleUpdate({ 
                              styles: { 
                                ...element.styles, 
                                width: remValue,
                                maxWidth: remValue
                              } 
                            })
                          }
                        }}
                        className="w-20"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Label className="text-base font-semibold text-gray-900">Altura</Label>
                        <p className="text-xs text-gray-500">Quão alto o elemento será (0 = automático)</p>
                      </div>
                      <span className="text-sm text-muted-foreground font-medium">
                        {(() => {
                          const currentValue = element.type === 'image' 
                            ? (element.height || element.styles?.height || 'auto') 
                            : (element.styles?.height || 'auto')
                          if (currentValue === 'auto') return 'Auto'
                          if (currentValue.includes('rem')) {
                            const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                            if (match) return Math.min(100, Math.max(0, Math.round(parseFloat(match[1]) * 10)))
                          }
                          if (currentValue.includes('px')) {
                            const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                            if (match) return Math.min(100, Math.max(0, Math.round(parseFloat(match[1]) / 10)))
                          }
                          return 0
                        })() || 'Auto'}
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={(() => {
                          const currentValue = element.type === 'image' 
                            ? (element.height || element.styles?.height || 'auto') 
                            : (element.styles?.height || 'auto')
                          if (currentValue === 'auto') return 0
                          const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                          if (match) {
                            const num = parseFloat(match[1])
                            if (currentValue.includes('rem')) return Math.min(100, Math.max(0, Math.round(num * 10)))
                            if (currentValue.includes('px')) return Math.min(100, Math.max(0, Math.round(num / 10)))
                            return Math.min(100, Math.max(0, Math.round(num)))
                          }
                          return 0
                        })()}
                        onChange={(e) => {
                          const value = parseInt(e.target.value)
                          if (value === 0) {
                            const autoValue = 'auto'
                            if (element.type === 'image') {
                              handleUpdate({ 
                                height: autoValue, 
                                styles: { 
                                  ...element.styles, 
                                  height: autoValue,
                                  maxHeight: autoValue
                                } 
                              })
                            } else {
                              handleUpdate({ 
                                styles: { 
                                  ...element.styles, 
                                  height: autoValue,
                                  maxHeight: autoValue
                                } 
                              })
                            }
                          } else {
                            const remValue = `${value / 10}rem`
                            if (element.type === 'image') {
                              handleUpdate({ 
                                height: remValue, 
                                styles: { 
                                  ...element.styles, 
                                  height: remValue,
                                  maxHeight: remValue
                                } 
                              })
                            } else {
                              handleUpdate({ 
                                styles: { 
                                  ...element.styles, 
                                  height: remValue,
                                  maxHeight: remValue
                                } 
                              })
                            }
                          }
                        }}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(() => {
                            const currentValue = element.type === 'image' 
                              ? (element.height || element.styles?.height || 'auto') 
                              : (element.styles?.height || 'auto')
                            if (currentValue === 'auto') return 0
                            if (currentValue.includes('rem')) {
                              const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                              if (match) return Math.min(100, Math.max(0, parseFloat(match[1]) * 10))
                            }
                            if (currentValue.includes('px')) {
                              const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                              if (match) return Math.min(100, Math.max(0, parseFloat(match[1]) / 10))
                            }
                            return 0
                          })()}%, #e5e7eb ${(() => {
                            const currentValue = element.type === 'image' 
                              ? (element.height || element.styles?.height || 'auto') 
                              : (element.styles?.height || 'auto')
                            if (currentValue === 'auto') return 0
                            if (currentValue.includes('rem')) {
                              const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                              if (match) return Math.min(100, Math.max(0, parseFloat(match[1]) * 10))
                            }
                            if (currentValue.includes('px')) {
                              const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                              if (match) return Math.min(100, Math.max(0, parseFloat(match[1]) / 10))
                            }
                            return 0
                          })()}%)`
                        }}
                      />
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={(() => {
                          const currentValue = element.type === 'image' 
                            ? (element.height || element.styles?.height || 'auto') 
                            : (element.styles?.height || 'auto')
                          if (currentValue === 'auto') return 0
                          const match = currentValue.match(/(\d+(?:\.\d+)?)/)
                          if (match) {
                            const num = parseFloat(match[1])
                            if (currentValue.includes('rem')) return Math.round(num * 10)
                            if (currentValue.includes('px')) return Math.round(num / 10)
                            return Math.round(num)
                          }
                          return 0
                        })()}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          if (value === 0) {
                            const autoValue = 'auto'
                            if (element.type === 'image') {
                              handleUpdate({ 
                                height: autoValue, 
                                styles: { 
                                  ...element.styles, 
                                  height: autoValue,
                                  maxHeight: autoValue
                                } 
                              })
                            } else {
                              handleUpdate({ 
                                styles: { 
                                  ...element.styles, 
                                  height: autoValue,
                                  maxHeight: autoValue
                                } 
                              })
                            }
                          } else {
                            const remValue = `${value / 10}rem`
                            if (element.type === 'image') {
                              handleUpdate({ 
                                height: remValue, 
                                styles: { 
                                  ...element.styles, 
                                  height: remValue,
                                  maxHeight: remValue
                                } 
                              })
                            } else {
                              handleUpdate({ 
                                styles: { 
                                  ...element.styles, 
                                  height: remValue,
                                  maxHeight: remValue
                                } 
                              })
                            }
                          }
                        }}
                        className="w-20"
                        placeholder="0 = Auto"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">0 = Automático (ajusta automaticamente)</p>
                  </div>
                </>
              )}

              {/* Padding and Margin - for all elements */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Label className="text-base font-semibold text-gray-900">Espaçamento Interno</Label>
                    <p className="text-xs text-gray-500">Espaço entre o conteúdo e a borda do elemento</p>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    {parseSpacingValue(element.styles?.padding) || 0}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={parseSpacingValue(element.styles?.padding) || 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      handleUpdate({
                        styles: { ...element.styles, padding: formatSpacingValue(value) }
                      })
                    }}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((parseSpacingValue(element.styles?.padding) || 0) / 50) * 100}%, #e5e7eb ${((parseSpacingValue(element.styles?.padding) || 0) / 50) * 100}%)`
                    }}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={parseSpacingValue(element.styles?.padding) || 0}
                    onChange={(e) => {
                      const value = Math.min(50, Math.max(0, parseFloat(e.target.value) || 0))
                      handleUpdate({
                        styles: { ...element.styles, padding: formatSpacingValue(value) }
                      })
                    }}
                    className="w-20"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Label className="text-base font-semibold text-gray-900">Espaçamento Externo</Label>
                    <p className="text-xs text-gray-500">Espaço entre este elemento e outros elementos</p>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    {parseSpacingValue(element.styles?.margin) || 0}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={parseSpacingValue(element.styles?.margin) || 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      handleUpdate({
                        styles: { ...element.styles, margin: formatSpacingValue(value) }
                      })
                    }}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((parseSpacingValue(element.styles?.margin) || 0) / 50) * 100}%, #e5e7eb ${((parseSpacingValue(element.styles?.margin) || 0) / 50) * 100}%)`
                    }}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={parseSpacingValue(element.styles?.margin) || 0}
                    onChange={(e) => {
                      const value = Math.min(50, Math.max(0, parseFloat(e.target.value) || 0))
                      handleUpdate({
                        styles: { ...element.styles, margin: formatSpacingValue(value) }
                      })
                    }}
                    className="w-20"
                  />
                </div>
              </div>

              {/* Text-related styles - only for text elements */}
              {element.type !== 'image' && element.type !== 'video' && (
                <>
                  <div>
                    <Label className="text-base font-semibold text-gray-900">Tamanho da Fonte</Label>
                    <p className="text-xs text-gray-500 mb-2">Quão grande o texto será</p>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="10"
                      value={parseNumericValue(element.styles?.fontSize) || ''}
                      onChange={(e) => {
                        const num = parseFloat(e.target.value) || 0
                        handleUpdate({
                          styles: { ...element.styles, fontSize: num > 0 ? formatToRem(num) : '' }
                        })
                      }}
                      placeholder="Ex: 1.5"
                      className="border-2 border-gray-200 focus:border-[#3b82f6]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {element.styles?.fontSize ? `Atual: ${element.styles.fontSize}` : 'Exemplo: 1.5 = texto médio'}
                    </p>
                  </div>
                  <div>
                    <Label>Font Weight</Label>
                    <Select
                      value={element.styles?.fontWeight || 'normal'}
                      onValueChange={(value) => handleUpdate({
                        styles: { ...element.styles, fontWeight: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="300">300</SelectItem>
                        <SelectItem value="400">400</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="600">600</SelectItem>
                        <SelectItem value="700">700</SelectItem>
                        <SelectItem value="800">800</SelectItem>
                        <SelectItem value="900">900</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Text Align</Label>
                    <Select
                      value={element.styles?.textAlign || 'left'}
                      onValueChange={(value) => handleUpdate({
                        styles: { ...element.styles, textAlign: value as 'left' | 'center' | 'right' }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-base font-semibold text-gray-900">Cor do Texto</Label>
                    <p className="text-xs text-gray-500 mb-2">A cor do texto</p>
                    <div className="flex gap-2">
                      <input
                        ref={textColorPickerRef}
                        type="color"
                        defaultValue={element.styles?.color || '#000000'}
                        onChange={handleTextColorPickerChange}
                        onClick={(e) => {
                          const now = Date.now()
                          const lastClick = textPickerLastClickRef.current
                          if (now - lastClick < 500) {
                            e.preventDefault()
                            e.currentTarget.blur()
                            textPickerLastClickRef.current = 0
                          } else {
                            textPickerLastClickRef.current = now
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            textPickerLastClickRef.current = 0
                          }, 600)
                        }}
                        className="h-10 w-20 cursor-pointer rounded-lg border-2 border-gray-300 focus:border-[#3b82f6]"
                      />
                      <Input
                        type="text"
                        value={element.styles?.color || '#000000'}
                        onChange={handleTextColorTextChange}
                        placeholder="#000000"
                        maxLength={7}
                        className="flex-1 border-2 border-gray-200 focus:border-[#3b82f6]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Background Color/Gradient - for all elements */}
              <div className="space-y-3">
                <div>
                  <Label className="mb-2 block">Fundo</Label>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant={!element.styles?.backgroundGradient ? "default" : "outline"}
                      className={!element.styles?.backgroundGradient ? "bg-[#3b82f6] text-white" : ""}
                      onClick={() => handleUpdate({
                        styles: { 
                          ...element.styles, 
                          backgroundGradient: undefined,
                          backgroundColor: element.styles?.backgroundColor || '#ffffff'
                        }
                      })}
                    >
                      Cor Sólida
                    </Button>
                    <Button
                      type="button"
                      variant={element.styles?.backgroundGradient ? "default" : "outline"}
                      className={element.styles?.backgroundGradient ? "bg-[#3b82f6] text-white" : ""}
                      onClick={() => {
                        const defaultGradient = `linear-gradient(${gradientDirection}, ${gradientColor1} 0%, ${gradientColor2} 100%)`
                        handleUpdate({
                          styles: { 
                            ...element.styles, 
                            backgroundColor: undefined,
                            backgroundGradient: element.styles?.backgroundGradient || defaultGradient
                          }
                        })
                      }}
                    >
                      Gradiente
                    </Button>
                  </div>
                </div>
                
                {!element.styles?.backgroundGradient ? (
                  <div>
                    <Label className="text-base font-semibold text-gray-900">Cor de Fundo</Label>
                    <p className="text-xs text-gray-500 mb-2">Escolha uma cor sólida para o fundo</p>
                    <div className="flex gap-2">
                      <input
                        ref={bgColorPickerRef}
                        type="color"
                        defaultValue={element.styles?.backgroundColor || '#ffffff'}
                        onChange={handleBgColorPickerChange}
                        onClick={(e) => {
                          const now = Date.now()
                          const lastClick = bgPickerLastClickRef.current
                          if (now - lastClick < 500) {
                            e.preventDefault()
                            e.currentTarget.blur()
                            bgPickerLastClickRef.current = 0
                          } else {
                            bgPickerLastClickRef.current = now
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            bgPickerLastClickRef.current = 0
                          }, 600)
                        }}
                        className="h-10 w-20 cursor-pointer rounded-lg border-2 border-gray-300 focus:border-[#3b82f6]"
                      />
                      <Input
                        type="text"
                        value={element.styles?.backgroundColor || '#ffffff'}
                        onChange={handleBgColorTextChange}
                        placeholder="#ffffff"
                        maxLength={7}
                        className="flex-1 border-2 border-gray-200 focus:border-[#3b82f6]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-base font-semibold text-gray-900">Cor Inicial do Gradiente</Label>
                      <p className="text-xs text-gray-500 mb-2">A primeira cor do gradiente</p>
                      <div className="flex gap-2">
                        <input
                          ref={gradientColor1PickerRef}
                          type="color"
                          defaultValue={gradientColor1}
                          onChange={handleGradientColor1Change}
                          className="h-10 w-20 cursor-pointer rounded-lg border-2 border-gray-300 focus:border-[#3b82f6]"
                        />
                        <Input
                          type="text"
                          value={gradientColor1}
                          onChange={handleGradientColor1TextChange}
                          placeholder="#3b82f6"
                          maxLength={7}
                          className="flex-1 border-2 border-gray-200 focus:border-[#3b82f6]"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-base font-semibold text-gray-900">Cor Final do Gradiente</Label>
                      <p className="text-xs text-gray-500 mb-2">A segunda cor do gradiente</p>
                      <div className="flex gap-2">
                        <input
                          ref={gradientColor2PickerRef}
                          type="color"
                          defaultValue={gradientColor2}
                          onChange={handleGradientColor2Change}
                          className="h-10 w-20 cursor-pointer rounded-lg border-2 border-gray-300 focus:border-[#3b82f6]"
                        />
                        <Input
                          type="text"
                          value={gradientColor2}
                          onChange={handleGradientColor2TextChange}
                          placeholder="#2563eb"
                          maxLength={7}
                          className="flex-1 border-2 border-gray-200 focus:border-[#3b82f6]"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-base font-semibold text-gray-900">Direção do Gradiente</Label>
                      <p className="text-xs text-gray-500 mb-2">Escolha a direção do gradiente</p>
                      <div className="grid grid-cols-3 gap-2">
                        {gradientDirections.map((dir) => (
                          <button
                            key={dir.value}
                            type="button"
                            onClick={() => handleGradientDirectionChange(dir.value)}
                            className={cn(
                              "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all cursor-pointer",
                              gradientDirection === dir.value
                                ? "bg-[#3b82f6] text-white border-[#3b82f6] shadow-md"
                                : "bg-white text-gray-700 border-gray-300 hover:border-[#3b82f6] hover:bg-blue-50"
                            )}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className="text-xl font-bold">{dir.label}</span>
                            <span className="text-xs">{dir.desc}</span>
                          </button>
                        ))}
                      </div>
                      {gradientDirection === 'custom' && (
                        <div className="mt-3">
                          <Label className="text-sm font-semibold text-gray-900">Ângulo Personalizado (0-360)</Label>
                          <div className="flex gap-2 items-center mt-2">
                            <input
                              type="range"
                              min="0"
                              max="360"
                              step="1"
                              value={parseFloat(customAngle?.replace('deg', '') || '135')}
                              onChange={(e) => {
                                const angle = `${e.target.value}deg`
                                handleCustomAngleChange(angle)
                              }}
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <Input
                              type="number"
                              min="0"
                              max="360"
                              step="1"
                              value={parseFloat(customAngle?.replace('deg', '') || '135')}
                              onChange={(e) => {
                                const value = Math.min(360, Math.max(0, parseFloat(e.target.value) || 0))
                                const angle = `${value}deg`
                                handleCustomAngleChange(angle)
                              }}
                              className="w-24 border-2 border-gray-200 focus:border-[#3b82f6]"
                            />
                            <span className="text-sm text-gray-600">°</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Ângulo atual: {customAngle}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                      <p className="text-xs text-gray-600 mb-2 font-semibold">Preview do Gradiente:</p>
                      <div 
                        className="h-16 rounded-lg border-2 border-gray-300"
                        style={{ 
                          background: `linear-gradient(${
                            gradientDirection === 'custom' ? customAngle : gradientDirection
                          }, ${gradientColor1} 0%, ${gradientColor2} 100%)` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Border Radius - for all elements */}
              <div>
                <Label className="text-base font-semibold text-gray-900">Bordas Arredondadas</Label>
                <p className="text-xs text-gray-500 mb-2">Quanto mais arredondado, mais suave fica</p>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={(() => {
                      const value = element.styles?.borderRadius || ''
                      const match = value.match(/(\d+(?:\.\d+)?)/)
                      if (match) {
                        const num = parseFloat(match[1])
                        // If it's in rem, convert to px (multiply by 16)
                        if (value.includes('rem')) return Math.round(num * 16)
                        // If it's in px or just a number, return as is
                        return num
                      }
                      return 0
                    })()}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value) || 0
                      handleUpdate({
                        styles: { ...element.styles, borderRadius: num > 0 ? `${num}px` : '' }
                      })
                    }}
                    placeholder="0"
                    min="0"
                    className="border-2 border-gray-200 focus:border-[#3b82f6] w-24"
                  />
                  <span className="text-sm text-gray-500">(pixels)</span>
                  <div className="flex-1 flex gap-2">
                    {[0, 4, 8, 16, 50].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleUpdate({
                          styles: { ...element.styles, borderRadius: val === 50 ? '50%' : `${val}px` }
                        })}
                        className={cn(
                          "px-3 py-1 text-xs rounded border-2 transition-all cursor-pointer",
                          element.styles?.borderRadius?.includes(`${val}`) || (val === 0 && !element.styles?.borderRadius)
                            ? "bg-[#3b82f6] text-white border-[#3b82f6]"
                            : "bg-white text-gray-700 border-gray-300 hover:border-[#3b82f6]"
                        )}
                        style={{ cursor: 'pointer' }}
                      >
                        {val === 50 ? '●' : val === 0 ? '□' : '▢'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t-2 border-[#3b82f6] flex-shrink-0">
            {onDelete && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (confirm(t('deleteConfirm'))) {
                    onDelete()
                    onClose()
                  }
                }}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white border-2 border-red-600 shadow-md hover:shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
                Excluir Elemento
              </Button>
            )}
            {!onDelete && <div />}
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-2 border-[#3b82f6] text-[#3b82f6] hover:bg-blue-50 font-semibold shadow-sm hover:shadow-md"
            >
              Fechar
            </Button>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    )
  }
