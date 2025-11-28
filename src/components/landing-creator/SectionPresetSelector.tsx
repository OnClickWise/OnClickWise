"use client"

import * as React from "react"
import { Section } from "@/types/landing-page"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PanelTop, Sparkles, FileText, MessageSquare, List, Layout, ArrowLeft } from "lucide-react"
import { useLandingPageStore } from "@/stores/landing-page-store"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

function createId() {
  return Math.random().toString(36).slice(2, 10)
}

// This will be created inside the component to use translations
const createSectionPresets = (t: any): { type: Section['type']; label: string; icon: React.ReactNode; description: string; priority?: 'high' }[] => [
  { 
    type: 'header', 
    label: t('presets.header.label'), 
    icon: <PanelTop className="w-5 h-5" />, 
    description: t('presets.header.description'),
    priority: 'high'
  },
  { 
    type: 'hero', 
    label: t('presets.hero.label'), 
    icon: <Sparkles className="w-5 h-5" />, 
    description: t('presets.hero.description') 
  },
  { 
    type: 'form', 
    label: t('presets.form.label'), 
    icon: <FileText className="w-5 h-5" />, 
    description: t('presets.form.description') 
  },
  { 
    type: 'testimonials', 
    label: t('presets.testimonials.label'), 
    icon: <MessageSquare className="w-5 h-5" />, 
    description: t('presets.testimonials.description') 
  },
  { 
    type: 'content', 
    label: t('presets.content.label'), 
    icon: <List className="w-5 h-5" />, 
    description: t('presets.content.description') 
  },
  { 
    type: 'footer', 
    label: t('presets.footer.label'), 
    icon: <Layout className="w-5 h-5" />, 
    description: t('presets.footer.description'),
    priority: 'high'
  },
]

function createSectionPreset(type: Section['type']): Section {
  const id = createId()
  
  switch (type) {
    case 'header':
      return {
        id,
        type: 'header',
        elements: [
          {
            id: createId(),
            type: 'title',
            content: 'Logo',
            level: 3,
          },
        ],
        styles: {
          padding: '1rem 2rem',
          backgroundColor: '#ffffff',
        },
      }
    
    case 'hero':
      return {
        id,
        type: 'hero',
        elements: [
          {
            id: createId(),
            type: 'title',
            content: 'Welcome to Our Product',
            level: 1,
          },
          {
            id: createId(),
            type: 'paragraph',
            content: 'Transform your business with our amazing solution.',
          },
          {
            id: createId(),
            type: 'button',
            text: 'Get Started',
            variant: 'primary',
          },
        ],
        styles: {
          padding: '4rem 2rem',
          backgroundColor: '#f3f4f6',
        },
      }
    
    case 'form':
      return {
        id,
        type: 'form',
        elements: [
          {
            id: createId(),
            type: 'title',
            content: 'Get Your Free Guide',
            level: 2,
          },
          {
            id: createId(),
            type: 'form',
            fields: [
              { id: createId(), type: 'text', label: 'Name', required: true },
              { id: createId(), type: 'email', label: 'Email', required: true },
              { id: createId(), type: 'tel', label: 'Phone', required: false },
            ],
            submitText: 'Download Now',
          },
        ],
        styles: {
          padding: '3rem 2rem',
          backgroundColor: '#ffffff',
        },
      }
    
    case 'testimonials':
      return {
        id,
        type: 'testimonials',
        elements: [
          {
            id: createId(),
            type: 'title',
            content: 'What Our Customers Say',
            level: 2,
          },
          {
            id: createId(),
            type: 'testimonial',
            testimonials: [
              {
                id: createId(),
                name: 'John Doe',
                role: 'CEO, Company Inc.',
                content: 'This product has transformed our business. Highly recommended!',
                rating: 5,
              },
              {
                id: createId(),
                name: 'Jane Smith',
                role: 'Marketing Director',
                content: 'Outstanding service and amazing results. We love it!',
                rating: 5,
              },
            ],
            layout: 'cards',
          },
        ],
        styles: {
          padding: '3rem 2rem',
          backgroundColor: '#f9fafb',
        },
      }
    
    case 'content':
      return {
        id,
        type: 'content',
        elements: [
          {
            id: createId(),
            type: 'title',
            content: 'Why Choose Us',
            level: 2,
          },
          {
            id: createId(),
            type: 'icon-list',
            items: [
              { id: createId(), text: 'Feature 1 - Fast and reliable' },
              { id: createId(), text: 'Feature 2 - 24/7 Support' },
              { id: createId(), text: 'Feature 3 - Easy to use' },
              { id: createId(), text: 'Feature 4 - Affordable pricing' },
            ],
            columns: 2,
          },
        ],
        styles: {
          padding: '3rem 2rem',
          backgroundColor: '#ffffff',
        },
      }
    
    case 'footer':
      return {
        id,
        type: 'footer',
        elements: [
          {
            id: createId(),
            type: 'title',
            content: 'Company Name',
            level: 4,
          },
          {
            id: createId(),
            type: 'paragraph',
            content: '© 2024 Company Name. All rights reserved.',
          },
        ],
        styles: {
          padding: '2rem',
          backgroundColor: '#1f2937',
          color: '#ffffff',
        },
      }
    
    default:
      return {
        id,
        type: 'content',
        elements: [],
      }
  }
}

interface SectionPresetSelectorProps {
  open: boolean
  onClose: () => void
  onBack?: () => void
}

export function SectionPresetSelector({ open, onClose, onBack }: SectionPresetSelectorProps) {
  const t = useTranslations('LandingPageCreator.sectionPreset')
  const { addSection, currentPage } = useLandingPageStore()
  const SECTION_PRESETS = createSectionPresets(t)

  const handleSelectPreset = (presetType: Section['type']) => {
    const section = createSectionPreset(presetType)
    addSection(section)
    onClose()
  }

  // Check if header/footer already exist
  const hasHeader = currentPage?.sections.some(s => s.type === 'header') || false
  const hasFooter = currentPage?.sections.some(s => s.type === 'footer') || false

  // Separate presets by priority
  const priorityPresets = SECTION_PRESETS.filter(p => p.priority === 'high')
  const regularPresets = SECTION_PRESETS.filter(p => p.priority !== 'high')

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
              {t('title')}
            </DialogTitle>
          </div>
          <p className="text-sm text-gray-600 mt-2">{t('subtitle')}</p>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-2">
        {/* Priority sections (Header/Footer) */}
        {priorityPresets.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('essentialSections')}</h3>
            <div className="grid grid-cols-1 gap-3">
              {priorityPresets.map((preset) => {
                const alreadyExists = (preset.type === 'header' && hasHeader) || (preset.type === 'footer' && hasFooter)
                return (
                  <Button
                    key={preset.type}
                    variant={alreadyExists ? "secondary" : "outline"}
                    className={cn(
                      "flex items-start gap-4 h-auto py-5 px-5 justify-start border-2 transition-all shadow-sm hover:shadow-md",
                      alreadyExists 
                        ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed" 
                        : "border-[#3b82f6] hover:bg-blue-50 hover:border-[#2563eb]"
                    )}
                    onClick={() => handleSelectPreset(preset.type)}
                    disabled={alreadyExists}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
                      alreadyExists ? "bg-gray-200" : "bg-[#3b82f6]"
                    )}>
                      <div className={alreadyExists ? "text-gray-400" : "text-white"}>
                        {preset.icon}
                      </div>
                    </div>
                    <div className="flex flex-col items-start flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-base">{preset.label}</span>
                        {alreadyExists && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">{t('alreadyAdded')}</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-600 mt-1">{preset.description}</span>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Regular sections */}
        {regularPresets.length > 0 && (
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-[#3b82f6] rounded-full"></div>
              <h3 className="text-base font-bold text-gray-900">{t('contentSections')}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {regularPresets.map((preset) => (
                <Button
                  key={preset.type}
                  variant="outline"
                  className="flex items-start gap-4 h-auto py-5 px-5 justify-start border-2 border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                  onClick={() => handleSelectPreset(preset.type)}
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
        )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

