"use client"

import * as React from "react"
import { ElementType, LandingPageElement } from "@/types/landing-page"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Type,
  Image,
  Video,
  MousePointerClick,
  Clock,
  FileText,
  Zap,
  List,
  Minus,
  MessageSquare,
  HelpCircle,
  Container,
  Columns,
  ArrowLeft,
} from "lucide-react"
import { useTranslations } from "next-intl"

interface ElementSelectorProps {
  open: boolean
  onClose: () => void
  onSelect: (elementType: ElementType) => void
  sectionId: string
  onBack?: () => void
}

// ELEMENT_TYPES will be created inside the component to use translations

function createElement(type: ElementType): LandingPageElement {
  const id = Math.random().toString(36).slice(2, 10)
  
  switch (type) {
    case 'title':
      return { id, type: 'title', content: 'New Title', level: 1 }
    case 'subtitle':
      return { id, type: 'subtitle', content: 'New Subtitle', level: 2 }
    case 'paragraph':
      return { id, type: 'paragraph', content: 'New paragraph text' }
    case 'image':
      return { id, type: 'image', src: '', alt: 'Image' }
    case 'video':
      return { id, type: 'video', src: '' }
    case 'button':
      return { id, type: 'button', text: 'Button', variant: 'primary' }
    case 'countdown':
      return {
        id,
        type: 'countdown',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    case 'form':
      return {
        id,
        type: 'form',
        fields: [
          { id: Math.random().toString(36).slice(2, 10), type: 'text', label: 'Name', required: true },
          { id: Math.random().toString(36).slice(2, 10), type: 'email', label: 'Email', required: true },
        ],
        submitText: 'Submit',
      }
    case 'highlight':
      return { id, type: 'highlight', content: 'Highlight text', variant: 'info' }
    case 'icon-list':
      return {
        id,
        type: 'icon-list',
        items: [
          { id: Math.random().toString(36).slice(2, 10), text: 'Item 1' },
          { id: Math.random().toString(36).slice(2, 10), text: 'Item 2' },
        ],
        columns: 2,
      }
    case 'divider':
      return { id, type: 'divider', variant: 'solid' }
    case 'testimonial':
      return {
        id,
        type: 'testimonial',
        testimonials: [
          {
            id: Math.random().toString(36).slice(2, 10),
            name: 'John Doe',
            content: 'Great product!',
            rating: 5,
          },
        ],
        layout: 'cards',
      }
    case 'faq':
      return {
        id,
        type: 'faq',
        items: [
          {
            id: Math.random().toString(36).slice(2, 10),
            question: 'Question?',
            answer: 'Answer here.',
          },
        ],
      }
    case 'container':
      return { id, type: 'container', children: [] }
    case 'columns':
      return { id, type: 'columns', children: [], columns: 2 }
    default:
      return { id, type: 'paragraph', content: 'New element' }
  }
}

export function ElementSelector({ open, onClose, onSelect, sectionId, onBack }: ElementSelectorProps) {
  const t = useTranslations('LandingPageCreator')
  
  const ELEMENT_TYPES: { type: ElementType; label: string; description: string; icon: React.ReactNode }[] = [
    { type: 'title', label: t('elementTypes.title'), description: t('elementDescriptions.title'), icon: <Type className="w-6 h-6" /> },
    { type: 'subtitle', label: t('elementTypes.subtitle'), description: t('elementDescriptions.subtitle'), icon: <Type className="w-6 h-6" /> },
    { type: 'paragraph', label: t('elementTypes.paragraph'), description: t('elementDescriptions.paragraph'), icon: <FileText className="w-6 h-6" /> },
    { type: 'image', label: t('elementTypes.image'), description: t('elementDescriptions.image'), icon: <Image className="w-6 h-6" /> },
    { type: 'video', label: t('elementTypes.video'), description: t('elementDescriptions.video'), icon: <Video className="w-6 h-6" /> },
    { type: 'button', label: t('elementTypes.button'), description: t('elementDescriptions.button'), icon: <MousePointerClick className="w-6 h-6" /> },
    { type: 'countdown', label: t('elementTypes.countdown'), description: t('elementDescriptions.countdown'), icon: <Clock className="w-6 h-6" /> },
    { type: 'form', label: t('elementTypes.form'), description: t('elementDescriptions.form'), icon: <FileText className="w-6 h-6" /> },
    { type: 'highlight', label: t('elementTypes.highlight'), description: t('elementDescriptions.highlight'), icon: <Zap className="w-6 h-6" /> },
    { type: 'icon-list', label: t('elementTypes.iconList'), description: t('elementDescriptions.iconList'), icon: <List className="w-6 h-6" /> },
    { type: 'divider', label: t('elementTypes.divider'), description: t('elementDescriptions.divider'), icon: <Minus className="w-6 h-6" /> },
    { type: 'testimonial', label: t('elementTypes.testimonial'), description: t('elementDescriptions.testimonial'), icon: <MessageSquare className="w-6 h-6" /> },
    { type: 'faq', label: t('elementTypes.faq'), description: t('elementDescriptions.faq'), icon: <HelpCircle className="w-6 h-6" /> },
    { type: 'container', label: t('elementTypes.container'), description: t('elementDescriptions.container'), icon: <Container className="w-6 h-6" /> },
    { type: 'columns', label: t('elementTypes.columns'), description: t('elementDescriptions.columns'), icon: <Columns className="w-6 h-6" /> },
  ]

  const handleSelect = (elementType: ElementType) => {
    onSelect(elementType)
    onClose()
  }

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
              {t('elementSelector.title')}
            </DialogTitle>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">{t('elementSelector.subtitle')}</p>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-1 sm:pr-2">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 pb-2">
          {ELEMENT_TYPES.map((item) => (
            <Button
              key={item.type}
              variant="outline"
              className="flex flex-col items-center gap-2 sm:gap-3 h-auto py-3 sm:py-5 border-2 border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
              onClick={() => handleSelect(item.type)}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#3b82f6] flex items-center justify-center text-white">
                {item.icon}
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold text-gray-900 text-xs sm:text-sm">{item.label}</span>
                <span className="text-xs text-gray-500 hidden sm:block">{item.description}</span>
              </div>
            </Button>
          ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


