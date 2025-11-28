"use client"

import * as React from "react"
import { ColorPalette, FontFamily } from "@/types/landing-page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { COLOR_PALETTES } from "@/lib/landing-page-presets"
import { useLandingPageStore } from "@/stores/landing-page-store"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"

export function ThemeCustomizer({ open, onClose, onBack }: { open: boolean; onClose: () => void; onBack?: () => void }) {
  const { currentPage, updateTheme } = useLandingPageStore()

  if (!currentPage) return null

  const [colorPalette, setColorPalette] = React.useState(currentPage.theme.colorPalette)
  const [fontFamily, setFontFamily] = React.useState(currentPage.theme.fontFamily)
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(null)

  const handlePresetSelect = (presetName: string) => {
    const preset = COLOR_PALETTES[presetName]
    if (preset) {
      setColorPalette(preset)
      setSelectedPreset(presetName)
    }
  }

  const handleSave = () => {
    updateTheme({
      colorPalette,
      fontFamily,
    })
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
                title={t('back')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 flex-1">
              <div className="w-2 h-6 sm:h-8 bg-[#3b82f6] rounded-full"></div>
              Personalizar Tema
            </DialogTitle>
          </div>
          <p className="text-sm text-gray-600 mt-2">Escolha as cores e fontes da sua página</p>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
          <div className="space-y-6 pb-2">
          {/* Color Palette Presets */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[#3b82f6] rounded-full"></div>
              <Label className="text-lg font-bold text-gray-900">Paletas de Cores</Label>
            </div>
            
            {/* Light Themes */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-[#eab308] rounded-full"></div>
                <Label className="text-base font-semibold text-gray-800">Temas Claros</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(COLOR_PALETTES)
                  .filter(([name]) => !name.startsWith('dark-'))
                  .map(([name, palette]) => (
                    <Button
                      key={name}
                      variant={selectedPreset === name ? "default" : "outline"}
                      className={cn(
                        "flex flex-col items-start gap-2 h-auto py-4 border-2 transition-all shadow-sm hover:shadow-md",
                        selectedPreset === name 
                          ? "border-[#3b82f6] bg-blue-50" 
                          : "border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50"
                      )}
                      onClick={() => handlePresetSelect(name)}
                    >
                      <div className="flex gap-2">
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                          style={{ backgroundColor: palette.primary }}
                        />
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                          style={{ backgroundColor: palette.secondary }}
                        />
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                          style={{ backgroundColor: palette.background }}
                        />
                      </div>
                      <span className="text-sm font-semibold capitalize text-gray-900">{name.replace(/-/g, ' ')}</span>
                    </Button>
                  ))}
              </div>
            </div>

            {/* Dark Themes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-[#eab308] rounded-full"></div>
                <Label className="text-base font-semibold text-gray-800">Temas Escuros</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(COLOR_PALETTES)
                  .filter(([name]) => name.startsWith('dark-'))
                  .map(([name, palette]) => (
                    <Button
                      key={name}
                      variant={selectedPreset === name ? "default" : "outline"}
                      className={cn(
                        "flex flex-col items-start gap-2 h-auto py-4 border-2 transition-all shadow-sm hover:shadow-md",
                        selectedPreset === name 
                          ? "border-[#3b82f6] bg-blue-50" 
                          : "border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50"
                      )}
                      onClick={() => handlePresetSelect(name)}
                    >
                      <div className="flex gap-2">
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                          style={{ backgroundColor: palette.primary }}
                        />
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                          style={{ backgroundColor: palette.secondary }}
                        />
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-gray-600 shadow-sm"
                          style={{ backgroundColor: palette.background }}
                        />
                      </div>
                      <span className="text-sm font-semibold capitalize text-gray-900">{name.replace('dark-', '').replace(/-/g, ' ')}</span>
                    </Button>
                  ))}
              </div>
            </div>
          </div>

          {/* Custom Colors */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Custom Colors</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={colorPalette.primary}
                    onChange={(e) => setColorPalette({ ...colorPalette, primary: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={colorPalette.primary}
                    onChange={(e) => setColorPalette({ ...colorPalette, primary: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={colorPalette.secondary}
                    onChange={(e) => setColorPalette({ ...colorPalette, secondary: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={colorPalette.secondary}
                    onChange={(e) => setColorPalette({ ...colorPalette, secondary: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={colorPalette.background}
                    onChange={(e) => setColorPalette({ ...colorPalette, background: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={colorPalette.background}
                    onChange={(e) => setColorPalette({ ...colorPalette, background: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={colorPalette.text}
                    onChange={(e) => setColorPalette({ ...colorPalette, text: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={colorPalette.text}
                    onChange={(e) => setColorPalette({ ...colorPalette, text: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Gradients */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Gradients (opcional)</Label>
            <div className="space-y-4">
              <div>
                <Label>Primary Gradient</Label>
                <Input
                  placeholder="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                  value={colorPalette.primaryGradient || ''}
                  onChange={(e) => setColorPalette({ ...colorPalette, primaryGradient: e.target.value || undefined })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe vazio para usar cor sólida. Ex: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)
                </p>
              </div>
              <div>
                <Label>Secondary Gradient</Label>
                <Input
                  placeholder="linear-gradient(135deg, #eab308 0%, #fbbf24 100%)"
                  value={colorPalette.secondaryGradient || ''}
                  onChange={(e) => setColorPalette({ ...colorPalette, secondaryGradient: e.target.value || undefined })}
                />
              </div>
              <div>
                <Label>Background Gradient</Label>
                <Input
                  placeholder="linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)"
                  value={colorPalette.backgroundGradient || ''}
                  onChange={(e) => setColorPalette({ ...colorPalette, backgroundGradient: e.target.value || undefined })}
                />
              </div>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <Label className="text-base font-semibold mb-2 block">Font Family</Label>
            <Select value={fontFamily} onValueChange={(value) => setFontFamily(value as FontFamily)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">Inter</SelectItem>
                <SelectItem value="poppins">Poppins</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="geist-sans">Geist Sans</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              Aplicar Tema
            </Button>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

