"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Search, Plus, Download, Upload, Trash2, Edit, X, ChevronDown, CheckCircle2, AlertTriangle, AlertCircle, Check, Filter, XCircle, ArrowUp, ArrowDown, Eye, Phone, Mail, Calendar, User, Building2, File, FileText, Image, FileImage, FileVideo, FileAudio, Archive, Loader2, Trash, MessageCircle, Send, Info, Settings2, DollarSign, Briefcase, CreditCard, FileDigit, MapPin, Tag, Clock, Hash, UserPlus, Copy, MoreVertical, Bot, KanbanSquare } from "lucide-react"
import * as XLSX from "xlsx"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// IMPORTANTE: Interface Attachment foi importada para resolver os problemas de tipagem (Implicit any type)
import { apiService, Lead, UpdateLeadRequest, Attachment } from "@/services/LeadService"
import { useApi } from "@/hooks/useApi"
import { pipelineService } from "@/services/pipelineService"
import { getAccessTokenFromCookie } from "@/lib/cookies"
import { formatDate } from "@/lib/formatDate"
type PipelineStage = {
  id: string
  name: string
  slug: string
  translation_key?: string
  color: string
  order: number
  stage_type?: 'entry' | 'progress' | 'won' | 'lost' | null
  leads: Lead[]
}

function createId() {
  return Math.random().toString(36).slice(2, 10)
}

// HELPER: Garante que os anexos sempre sejam iteráveis, mesmo se vierem como string do BD
export const safeGetAttachments = (attachments: any): Attachment[] => {
  if (!attachments) return [];
  if (typeof attachments === 'string') {
    try { return JSON.parse(attachments); } catch(e) { return []; }
  }
  if (Array.isArray(attachments)) return attachments;
  return [];
};


// ============================================================================
// STAGE FORM MODAL - 100% Isolated Component with its own state
// ============================================================================
const StageFormModal = React.memo(({
  isOpen,
  onClose,
  editingStage,
  onSave,
  isSaving,
  t
}: {
  isOpen: boolean
  onClose: () => void
  editingStage: PipelineStage | null
  onSave: (name: string, color: string, stageType: string) => void
  isSaving: boolean
  t: any
}) => {
  const [stageName, setStageName] = React.useState('')
  const [stageColor, setStageColor] = React.useState('bg-blue-100 border-blue-200 text-blue-800')
  const [stageType, setStageType] = React.useState<'entry' | 'progress' | 'won' | 'lost' | ''>('')
  const [useCustomColor, setUseCustomColor] = React.useState(false)
  const [customBgColor, setCustomBgColor] = React.useState('#3B82F6')
  const [customTextColor, setCustomTextColor] = React.useState('#FFFFFF')
  
  const bgColorPickerRef = React.useRef<HTMLInputElement>(null)
  const textColorPickerRef = React.useRef<HTMLInputElement>(null)
  const bgColorDebounceTimer = React.useRef<NodeJS.Timeout | null>(null)
  const textColorDebounceTimer = React.useRef<NodeJS.Timeout | null>(null)
  const renderCount = React.useRef(0)
  
  const bgPickerLastClickRef = React.useRef(0)
  const textPickerLastClickRef = React.useRef(0)
  
  renderCount.current++
  
  React.useEffect(() => {
    if (isOpen) {
      if (editingStage) {
        setStageName(editingStage.name)
        setStageType(editingStage.stage_type || '')
        
        try {
          const parsed = JSON.parse(editingStage.color)
          if (parsed.bg && parsed.text) {
            setUseCustomColor(true)
            setCustomBgColor(parsed.bg)
            setCustomTextColor(parsed.text)
            if (bgColorPickerRef.current) bgColorPickerRef.current.value = parsed.bg
            if (textColorPickerRef.current) textColorPickerRef.current.value = parsed.text
            setStageColor('bg-blue-100 border-blue-200 text-blue-800')
            return
          }
        } catch {
          const isHex = /^#[0-9A-F]{6}$/i.test(editingStage.color)
          if (isHex) {
            setUseCustomColor(true)
            setCustomBgColor(editingStage.color)
            setCustomTextColor('#FFFFFF')
            if (bgColorPickerRef.current) bgColorPickerRef.current.value = editingStage.color
            if (textColorPickerRef.current) textColorPickerRef.current.value = '#FFFFFF'
            setStageColor('bg-blue-100 border-blue-200 text-blue-800')
          } else {
            setUseCustomColor(false)
            setStageColor(editingStage.color)
          }
        }
      } else {
        setStageName('')
        setStageType('')
        setStageColor('bg-blue-100 border-blue-200 text-blue-800')
        setUseCustomColor(false)
        setCustomBgColor('#3B82F6')
        setCustomTextColor('#FFFFFF')
        if (bgColorPickerRef.current) bgColorPickerRef.current.value = '#3B82F6'
        if (textColorPickerRef.current) textColorPickerRef.current.value = '#FFFFFF'
      }
    }
  }, [isOpen, editingStage])
  
  React.useEffect(() => {
    return () => {
      if (bgColorDebounceTimer.current) clearTimeout(bgColorDebounceTimer.current)
      if (textColorDebounceTimer.current) clearTimeout(textColorDebounceTimer.current)
    }
  }, [])
  
  const handleColorSelectChange = (value: string) => {
    if (value === 'custom') {
      setUseCustomColor(true)
    } else {
      setUseCustomColor(false)
      setStageColor(value)
    }
  }
  
  const handleBgColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (bgColorDebounceTimer.current) clearTimeout(bgColorDebounceTimer.current)
    bgColorDebounceTimer.current = setTimeout(() => setCustomBgColor(value), 300)
  }

  const handleTextColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (textColorDebounceTimer.current) clearTimeout(textColorDebounceTimer.current)
    textColorDebounceTimer.current = setTimeout(() => setCustomTextColor(value), 300)
  }
  
  const handleBgColorTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
      setCustomBgColor(value)
      if (bgColorPickerRef.current && /^#[0-9A-F]{6}$/i.test(value)) bgColorPickerRef.current.value = value
    }
  }
  
  const handleTextColorTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
      setCustomTextColor(value)
      if (textColorPickerRef.current && /^#[0-9A-F]{6}$/i.test(value)) textColorPickerRef.current.value = value
    }
  }
  
  const handleSave = () => {
    const finalColor = useCustomColor 
      ? JSON.stringify({ bg: customBgColor, text: customTextColor })
      : stageColor
    onSave(stageName, finalColor, stageType)
  }
  
  const previewColorStyle = React.useMemo(() => {
    if (useCustomColor) {
      return {
        backgroundColor: customBgColor,
        color: customTextColor,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: customBgColor,
        padding: '0.25rem 0.5rem',
        borderRadius: '0.375rem',
        fontSize: '0.75rem',
        fontWeight: '500',
        display: 'inline-block'
      }
    }
    return {}
  }, [useCustomColor, customBgColor, customTextColor])

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* SOLUÇÃO RADIX ARIA-HIDDEN: onOpenAutoFocus para evitar bloqueio de scroll/foco ao abrir */}
      <SheetContent 
        className="w-full sm:max-w-md border-l border-border p-3 sm:p-6"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle className="text-base sm:text-lg">
            {editingStage ? t('stageManagement.editStage') : t('stageManagement.addStage')}
          </SheetTitle>
          <SheetDescription className="sr-only">Gerencie as propriedades desta etapa do funil</SheetDescription>
        </SheetHeader>
        
        <Separator className="my-3 sm:my-4" />
        
        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('stageManagement.nameLabel')}</label>
            <Input
              placeholder={t('stageManagement.namePlaceholder')}
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('stageManagement.stageTypeLabel')}</label>
            <select
              className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-10 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              value={stageType}
              onChange={(e) => setStageType(e.target.value as any)}
            >
              <option value="">{t('stageManagement.stageTypeNone')}</option>
              <option value="entry">{t('stageManagement.stageTypes.entry')}</option>
              <option value="progress">{t('stageManagement.stageTypes.progress')}</option>
              <option value="won">{t('stageManagement.stageTypes.won')}</option>
              <option value="lost">{t('stageManagement.stageTypes.lost')}</option>
            </select>
            <p className="text-xs text-muted-foreground">{t('stageManagement.stageTypeHint')}</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('stageManagement.colorLabel')}</label>
            <select
              className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-10 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              value={useCustomColor ? 'custom' : stageColor}
              onChange={(e) => handleColorSelectChange(e.target.value)}
            >
              <option value="bg-blue-100 border-blue-200 text-blue-800">{t('stageManagement.colors.blue')}</option>
              <option value="bg-yellow-100 border-yellow-200 text-yellow-800">{t('stageManagement.colors.yellow')}</option>
              <option value="bg-green-100 border-green-200 text-green-800">{t('stageManagement.colors.green')}</option>
              <option value="bg-red-100 border-red-200 text-red-800">{t('stageManagement.colors.red')}</option>
              <option value="bg-purple-100 border-purple-200 text-purple-800">{t('stageManagement.colors.purple')}</option>
              <option value="bg-orange-100 border-orange-200 text-orange-800">{t('stageManagement.colors.orange')}</option>
              <option value="bg-pink-100 border-pink-200 text-pink-800">{t('stageManagement.colors.pink')}</option>
              <option value="bg-indigo-100 border-indigo-200 text-indigo-800">{t('stageManagement.colors.indigo')}</option>
              <option value="custom">{t('stageManagement.customColor')}</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('stageManagement.preview')}</label>
            <div className="p-3 bg-muted/30 rounded-md">
              <span
                className={useCustomColor ? "" : `${stageColor} rounded-md border px-2 py-1 text-xs font-medium`}
                style={useCustomColor ? previewColorStyle : undefined}
              >
                {stageName || t('stageManagement.namePlaceholder')}
              </span>
            </div>
          </div>
          
          {useCustomColor && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">{t('stageManagement.backgroundColor')}</label>
                <div className="flex gap-2 mt-1">
                  <input
                    ref={bgColorPickerRef}
                    type="color"
                    defaultValue={customBgColor}
                    onChange={handleBgColorPickerChange}
                    className="h-10 w-20 cursor-pointer rounded border border-input"
                  />
                  <Input
                    type="text"
                    value={customBgColor}
                    onChange={handleBgColorTextChange}
                    placeholder="#3B82F6"
                    maxLength={7}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">{t('stageManagement.textColor')}</label>
                <div className="flex gap-2 mt-1">
                  <input
                    ref={textColorPickerRef}
                    type="color"
                    defaultValue={customTextColor}
                    onChange={handleTextColorPickerChange}
                    className="h-10 w-20 cursor-pointer rounded border border-input"
                  />
                  <Input
                    type="text"
                    value={customTextColor}
                    onChange={handleTextColorTextChange}
                    placeholder="#FFFFFF"
                    maxLength={7}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 cursor-pointer" disabled={isSaving}>
              {t('stageManagement.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!stageName.trim() || isSaving} className="flex-1 cursor-pointer">
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('stageManagement.saving')}</> : editingStage ? t('stageManagement.saveChanges') : t('stageManagement.createStage')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
})
StageFormModal.displayName = 'StageFormModal'


// ============================================================================
// LEAD CARD - Isolated Component to prevent re-renders
// ============================================================================
const LeadCard = React.memo(({ 
  lead, onDragStart, onContact, onPreview, onEdit, onLinkLead, userRole, locale, hasConversation
}: { 
  lead: Lead, 
  onDragStart: (e: React.DragEvent, lead: Lead) => void,
  onContact: (lead: Lead) => void,
  onPreview: (lead: Lead) => void,
  onEdit: (lead: Lead) => void,
  onLinkLead?: (lead: Lead) => void,
  userRole: string,
  locale: string,
  hasConversation?: boolean
}) => {
  const t = useTranslations('Pipeline')
  
  const formatCurrency = React.useCallback((value: number) => {
    return new Intl.NumberFormat(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
      style: 'currency', currency: locale === 'pt-BR' ? 'BRL' : 'USD',
    }).format(value)
  }, [locale])

  const formatDate = React.useCallback((dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    }).format(date)
  }, [locale])
  
  const touchStartPosRef = React.useRef<{ x: number; y: number; leadId: string } | null>(null)
  const isDraggingRef = React.useRef(false)
  const cardRef = React.useRef<HTMLDivElement>(null)
  
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('[role="menuitem"]')) return
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY, leadId: lead.id }
      isDraggingRef.current = false
    }
  }, [lead.id])
  
  React.useEffect(() => {
    const element = cardRef.current
    if (!element) return

    const touchMoveHandler = (e: TouchEvent) => {
      if (!touchStartPosRef.current || e.touches.length !== 1) return
      const touch = e.touches[0]
      const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x)
      const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y)
      
      if (!isDraggingRef.current && (deltaX > 10 || deltaY > 10)) {
        isDraggingRef.current = true
        e.preventDefault()
        
        const fakeEvent = {
          preventDefault: () => {}, stopPropagation: () => {},
          dataTransfer: { effectAllowed: 'move' as const, dropEffect: 'move' as const, setData: () => {}, getData: () => lead.id }
        } as unknown as React.DragEvent
        onDragStart(fakeEvent, lead)
        element.style.touchAction = 'none'
      }
      
      if (isDraggingRef.current) e.preventDefault()
    }

    element.addEventListener('touchmove', touchMoveHandler, { passive: false })
    return () => element.removeEventListener('touchmove', touchMoveHandler)
  }, [lead, onDragStart])
  
  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {}, [])
  
  const handleTouchEnd = React.useCallback((e: React.TouchEvent) => {
    if (isDraggingRef.current && touchStartPosRef.current) {
      const touch = e.changedTouches[0]
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      const stageElement = elementBelow?.closest('[data-stage-id]') as HTMLElement
      if (stageElement) {
        const stageId = stageElement.getAttribute('data-stage-id')
        if (stageId) {
          const dropEvent = new CustomEvent('leadTouchDrop', {
            detail: { leadId: lead.id, stageId: stageId, touch: { x: touch.clientX, y: touch.clientY } },
            bubbles: true, cancelable: true
          })
          if (cardRef.current) cardRef.current.dispatchEvent(dropEvent)
        }
      }
    }
    
    if (cardRef.current) cardRef.current.style.touchAction = 'pan-y'
    touchStartPosRef.current = null
    isDraggingRef.current = false
  }, [lead.id])
  
  return (
    <div
      ref={cardRef} key={lead.id}
      className="bg-background border rounded-lg p-2 sm:p-2.5 cursor-move hover:shadow-md transition-shadow select-none"
      draggable onDragStart={(e) => onDragStart(e, lead)}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd}
      style={{ touchAction: 'pan-y', WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      <div className="flex items-start justify-between mb-1.5 sm:mb-2 gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h4 className="font-semibold text-xs sm:text-sm truncate" title={lead.name}>{lead.name}</h4>
            {(userRole === 'admin' || userRole === 'master') && lead.assigned_user_id && (
              <span className="inline-flex items-center justify-center rounded-full bg-blue-100 p-0.5 flex-shrink-0" title={t('leadCard.assignedToUser')}>
                <UserPlus className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-700" />
              </span>
            )}
            {hasConversation && (
              <span className="inline-flex items-center justify-center rounded-full bg-green-100 p-0.5 flex-shrink-0" title={t('leadCard.hasConversation')}>
                <MessageCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-700" />
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5" title={lead.email}>{lead.email}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="ghost" className="h-5 w-5 sm:h-6 sm:w-6 p-0 cursor-pointer hover:bg-muted flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 sm:w-48">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPreview(lead); }} className="cursor-pointer text-xs sm:text-sm">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />{t('leadCard.viewDetails')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(lead); }} className="cursor-pointer text-xs sm:text-sm">
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />{t('leadCard.editLead')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onContact(lead); }} className="cursor-pointer text-xs sm:text-sm">
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />{t('leadCard.startConversation')}
            </DropdownMenuItem>
            {(userRole === 'admin' || userRole === 'master') && onLinkLead && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLinkLead(lead); }} className="cursor-pointer text-xs sm:text-sm">
                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />{t('leadCard.linkToUser')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {lead.value && (
        <div className="mb-1 sm:mb-1.5">
          <div className="text-xs sm:text-sm font-bold text-green-600 truncate">{formatCurrency(lead.value)}</div>
        </div>
      )}
      <div className="space-y-0.5 sm:space-y-1">
        {lead.source && (
          <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center">
            <Building2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
            <span className="truncate">{lead.source}</span>
          </div>
        )}
        {lead.estimated_close_date && (
          <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center">
            <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
            <span className="truncate">{formatDate(lead.estimated_close_date)}</span>
          </div>
        )}
      </div>
      {lead.description && (
        <div className="mt-1 sm:mt-1.5 p-1 sm:p-1.5 bg-muted/30 rounded text-[10px] sm:text-xs text-muted-foreground">
          <div className="line-clamp-2" title={lead.description}>📝 {lead.description}</div>
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.lead.id === nextProps.lead.id &&
    prevProps.lead.name === nextProps.lead.name &&
    prevProps.lead.email === nextProps.lead.email &&
    prevProps.lead.value === nextProps.lead.value &&
    prevProps.lead.source === nextProps.lead.source &&
    prevProps.lead.estimated_close_date === nextProps.lead.estimated_close_date &&
    prevProps.lead.description === nextProps.lead.description &&
    prevProps.lead.assigned_user_id === nextProps.lead.assigned_user_id &&
    prevProps.locale === nextProps.locale &&
    prevProps.userRole === nextProps.userRole &&
    prevProps.hasConversation === nextProps.hasConversation &&
    prevProps.onDragStart === nextProps.onDragStart &&
    prevProps.onContact === nextProps.onContact &&
    prevProps.onPreview === nextProps.onPreview &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onLinkLead === nextProps.onLinkLead
  )
})
LeadCard.displayName = 'LeadCard'
  
export default function PipelinePage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  const { isClient, apiCall } = useApi()
  const t = useTranslations('Pipeline')
  const locale = useLocale()
  
  const formatCurrency = React.useCallback((value: number) => {
    return new Intl.NumberFormat(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
      style: 'currency', currency: locale === 'pt-BR' ? 'BRL' : 'USD',
    }).format(value)
  }, [locale])

  const [userRole, setUserRole] = React.useState<string>('')
  const [userId, setUserId] = React.useState<string>('')
  
  React.useEffect(() => {
    try {
      const token = getAccessTokenFromCookie()
      if (token) {
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]))
          const role = payload.role || payload.type || payload.userType || payload.user_type || ''
          const id = payload.user?.id || payload.userId || payload.id || ''
          setUserRole(role)
          setUserId(id)
        }
      }
    } catch (error) {
      console.error('❌ [Pipeline] Error decoding token:', error)
    }
  }, [])
  const canManageStages = userRole === 'admin' || userRole === 'master'

  const addEmployeeFilter = React.useCallback((params: any = {}) => {
    if (userRole === 'employee' && userId) {
      return { ...params, assigned_user_id: userId }
    }
    return params
  }, [userRole, userId])
  
  const [isStageManagementOpen, setIsStageManagementOpen] = React.useState(false)
  const [editingStage, setEditingStage] = React.useState<PipelineStage | null>(null)
  const [isStageFormOpen, setIsStageFormOpen] = React.useState(false)
  const [isDeletingStage, setIsDeletingStage] = React.useState<PipelineStage | null>(null)
  const [isSavingStage, setIsSavingStage] = React.useState(false)
  const [draggedStage, setDraggedStage] = React.useState<PipelineStage | null>(null)
  const [draggedOverStageId, setDraggedOverStageId] = React.useState<string | null>(null)
  
  const [migrationModal, setMigrationModal] = React.useState<{ open: boolean, stage: PipelineStage | null, targetStageId: string | null, action: 'move' | 'remove' | 'uncategorize' | null }>({ open: false, stage: null, targetStageId: null, action: null })
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [pipelineStages, setPipelineStages] = React.useState<PipelineStage[]>([])
  const [leadsWithConversations, setLeadsWithConversations] = React.useState<Set<string>>(new Set())
  
  const loadLinkedConversations = React.useCallback(async (leadIds: string[]) => {
    if (!isClient || leadIds.length === 0) return
    try {
      const linkedLeadIds = new Set<string>()
      // Implementação futura das APIs omitida.
      if (linkedLeadIds.size > 0) {
        setLeadsWithConversations(prev => {
          const updated = new Set(prev)
          linkedLeadIds.forEach(id => updated.add(id))
          leadIds.forEach(id => { if (!linkedLeadIds.has(id)) updated.delete(id) })
          return updated
        })
      } else {
        setLeadsWithConversations(prev => {
          const updated = new Set(prev)
          leadIds.forEach(id => updated.delete(id))
          return updated
        })
      }
    } catch (error) {
      console.error('Error loading linked conversations:', error)
    }
  }, [isClient])
  
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filters, setFilters] = React.useState({ name: '', email: '', phone: '', ssn: '', ein: '', source: '', location: '', interest: '', status: '' })
  const [valueRange, setValueRange] = React.useState({ min: '', max: '' })
  const [dateRange, setDateRange] = React.useState({ min: '', max: '' })

  const validateDate = (dateString: string): boolean => {
    if (!dateString) return true 
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    const year = parseInt(dateString.split('-')[0]);
    if (year < 1000 || year > 9999) return false;
    const dateObj = new Date(dateString);
    return !isNaN(dateObj.getTime());
  }

  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draggedLead, setDraggedLead] = React.useState<Lead | null>(null)
  const [draggedOverStage, setDraggedOverStage] = React.useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [isFilterOpen, setIsFilterOpen] = React.useState(false)
  
  const pipelineScrollRef = React.useRef<HTMLDivElement>(null)
  const scrollIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

  const [editValue, setEditValue] = React.useState("")
  const [editExpectedCloseDate, setEditExpectedCloseDate] = React.useState("")
  const [editNotes, setEditNotes] = React.useState("")
  const [editInterest, setEditInterest] = React.useState("")

  const [toasts, setToasts] = React.useState<{ id: string, text: string, type: "success" | "warning" | "error" }[]>([])

  const [preview, setPreview] = React.useState<{ open: boolean, lead: Lead | null }>({ open: false, lead: null })
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const [assignedUserName, setAssignedUserName] = React.useState<string>("")
  const [createdByUserName, setCreatedByUserName] = React.useState<string>("")
  
  React.useEffect(() => {
    async function fetchUsers() {
      if ((userRole === 'admin' || userRole === 'master') && preview.open && preview.lead && (preview.lead.assigned_user_id || preview.lead.created_by)) {
        try {
          const response = await apiService.getOrganizationUsers(true)
          if (response.success && response.data) {
            const employees = response.data.employees
            if (preview.lead.assigned_user_id) {
              const assignedUser = employees.find((emp: any) => emp.id === preview.lead!.assigned_user_id)
              setAssignedUserName(assignedUser ? assignedUser.name : t('previewModal.unknownUser'))
            }
            if (preview.lead.created_by) {
              const createdByUser = employees.find((emp: any) => emp.id === preview.lead!.created_by)
              setCreatedByUserName(createdByUser ? createdByUser.name : t('previewModal.unknownUser'))
            }
          }
        } catch (error) {
          console.error('Error fetching users:', error)
          if (preview.lead?.assigned_user_id) setAssignedUserName(t('previewModal.unknownUser'))
          if (preview.lead?.created_by) setCreatedByUserName(t('previewModal.unknownUser'))
        }
      } else {
        setAssignedUserName("")
        setCreatedByUserName("")
      }
    }
    fetchUsers()
  }, [preview.open, preview.lead?.assigned_user_id, preview.lead?.created_by, userRole, t])
  
  const [contactModal, setContactModal] = React.useState<{ open: boolean, lead: Lead | null }>({ open: false, lead: null })
  const [sendMessageModal, setSendMessageModal] = React.useState<{ open: boolean, lead: Lead | null, method: 'whatsapp' | 'telegram' | 'email' | null }>({ open: false, lead: null, method: null })
  const [messageText, setMessageText] = React.useState("")
  const [isSendingMessage, setIsSendingMessage] = React.useState(false)
  const [telegramAccounts, setTelegramAccounts] = React.useState<any[]>([])
  const [selectedAccountId, setSelectedAccountId] = React.useState<string>("")
  const [telegramBots, setTelegramBots] = React.useState<any[]>([])
  const [showTelegramWarning, setShowTelegramWarning] = React.useState(false)
  const [telegramWarningMessage, setTelegramWarningMessage] = React.useState("")
  const [botConversations, setBotConversations] = React.useState<any[]>([])
  const [showBotConversationsModal, setShowBotConversationsModal] = React.useState(false)
  const [loadingBotConversations, setLoadingBotConversations] = React.useState(false)
  const [showTelegramApiSelector, setShowTelegramApiSelector] = React.useState(false)
  const [showNoLinkedConversationWarning, setShowNoLinkedConversationWarning] = React.useState(false)
  const [linkedTelegramUsername, setLinkedTelegramUsername] = React.useState<string | null>(null)
  const [linkedTelegramConversation, setLinkedTelegramConversation] = React.useState<any | null>(null)
  const [isUsingBotApi, setIsUsingBotApi] = React.useState(false)
  
  const [linkLeadModal, setLinkLeadModal] = React.useState<{ open: boolean, lead: Lead | null }>({ open: false, lead: null })
  const [selectedUserId, setSelectedUserId] = React.useState<string>("")
  const [availableUsers, setAvailableUsers] = React.useState<any[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false)
  const [loadingStages, setLoadingStages] = React.useState(true)
  const [isLinkingLead, setIsLinkingLead] = React.useState(false)

  const [isAttachmentDragActive, setIsAttachmentDragActive] = React.useState(false)
  const [uploadingAttachments, setUploadingAttachments] = React.useState<{ [leadId: string]: boolean }>({})
  const [attachmentProgress, setAttachmentProgress] = React.useState<{ [leadId: string]: number }>({})
  const attachmentFileInputRef = React.useRef<HTMLInputElement | null>(null)
  
  const [pendingAttachments, setPendingAttachments] = React.useState<{ [leadId: string]: { toAdd: File[], toRemove: string[] } }>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  
  const [originalFormValues, setOriginalFormValues] = React.useState<{ value: string, expectedCloseDate: string, notes: string, interest: string } | null>(null)
  
  const [unsavedChangesToast, setUnsavedChangesToast] = React.useState<{ show: boolean, message: string }>({ show: false, message: '' })
  
  const [bulkMoveNotification, setBulkMoveNotification] = React.useState<{ show: boolean, progress: { current: number, total: number, batch: number, totalBatches: number } }>({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 } })
  
  const hasFormChanges = () => {
    if (!originalFormValues) return false
    return ( editValue !== originalFormValues.value || editExpectedCloseDate !== originalFormValues.expectedCloseDate || editNotes !== originalFormValues.notes || editInterest !== originalFormValues.interest )
  }
  
  const handleModalClose = () => {
    const hasAttachmentChanges = Object.keys(pendingAttachments).length > 0 && Object.values(pendingAttachments).some(p => p.toAdd.length > 0 || p.toRemove.length > 0)
    const hasFieldChanges = hasFormChanges()
    if (hasAttachmentChanges || hasFieldChanges) {
      setUnsavedChangesToast({ show: true, message: t('editModal.unsavedChanges') })
      setTimeout(() => setUnsavedChangesToast({ show: false, message: '' }), 3000)
    } else {
      setIsEditModalOpen(false)
      setEditingId(null)
      setPreview({ open: false, lead: null })
    }
  }
  
  const confirmDiscardChanges = () => {
    setPendingAttachments({})
    setHasUnsavedChanges(false)
    setUnsavedChangesToast({ show: false, message: '' })
    setOriginalFormValues(null)
    setIsEditModalOpen(false)
    setEditingId(null)
    setPreview({ open: false, lead: null })
    setEditValue("")
    setEditExpectedCloseDate("")
    setEditNotes("")
    setEditInterest("")
  }

  const stagesLoadedRef = React.useRef(false)

  React.useEffect(() => {
    const loadStages = async () => {
      if (!isClient || stagesLoadedRef.current) return
      setLoadingStages(true)
      try {
        const response = await pipelineService.getStages()
        if (!response || response.success === false) {
          console.error('❌ [Pipeline] Failed to load stages:', response?.error)
          stagesLoadedRef.current = true
          return
        }
        const stagesData = response.data || response
        if (stagesData && Array.isArray(stagesData)) {
          // Always mark as loaded even if empty
          stagesLoadedRef.current = true
          if (stagesData.length === 0) {
            setPipelineStages([])
            return
          }
          const stagesWithLeads = stagesData.map((stage: any) => ({ ...stage, leads: [] }))
          const defaultStageTypes: { [key: string]: 'entry' | 'progress' | 'won' | 'lost' } = {
            'new': 'entry', 'novos-leads': 'entry', 'new-leads': 'entry', 'contact': 'progress', 'em-contato': 'progress', 'in-contact': 'progress', 'qualified': 'progress', 'qualificados': 'progress', 'won': 'won', 'ganhos': 'won', 'fechados': 'won', 'closed': 'won', 'lost': 'lost', 'perdidos': 'lost'
          }
          const stagesToUpdate: any[] = []
          stagesWithLeads.forEach((stage: any) => {
            if (!stage.stage_type && defaultStageTypes[stage.slug]) {
              stagesToUpdate.push({ id: stage.id, slug: stage.slug, suggestedType: defaultStageTypes[stage.slug] })
            }
          })
          if (stagesToUpdate.length > 0 && canManageStages) {
            for (const stageToUpdate of stagesToUpdate) {
              try {
                await pipelineService.updateStage(stageToUpdate.id, {stage_type: stageToUpdate.suggestedType })
              } catch (error) {
                console.error(`❌ [Pipeline] Failed to auto-set type for stage "${stageToUpdate.slug}":`, error)
              }
            }
            const updatedResponse = await pipelineService.getStages()
            const updatedStagesData = updatedResponse.data || updatedResponse
            if (updatedStagesData && Array.isArray(updatedStagesData)) {
              const updatedStagesWithLeads = updatedStagesData.map((stage: any) => ({ ...stage, leads: [] }))
              setPipelineStages(updatedStagesWithLeads)
            }
          } else {
            setPipelineStages(stagesWithLeads)
          }
        } else {
          stagesLoadedRef.current = true
        }
      } catch (error) {
        console.error('❌ [Pipeline] Error loading stages:', error)
        stagesLoadedRef.current = true
      } finally {
        setLoadingStages(false)
      }
    }
    loadStages()
  }, [isClient, canManageStages, apiCall])

  const [stagesLoaded, setStagesLoaded] = React.useState(false)
  React.useEffect(() => {
    if (pipelineStages.length > 0 && !stagesLoaded) setStagesLoaded(true)
  }, [pipelineStages.length, stagesLoaded])

  const searchLeads = React.useCallback(async (searchParams: any) => {
    try {
      const response = await apiService.searchLeads(searchParams)
      if (response.success && response.data) {
        setLeads(response.data.leads)
        updatePipelineStages(response.data.leads)
        const leadIds = response.data.leads.map((l: Lead) => l.id)
        loadLinkedConversations(leadIds)
        return response.data.leads
      } else {
        pushToast(t('notifications.errorSearching'), 'error')
        return []
      }
    } catch (error) {
      pushToast('Erro ao buscar leads', 'error')
      return []
    }
  }, [loadLinkedConversations, t])

  const clearFilters = () => {
    setSearchTerm('')
    setFilters({ name: '', email: '', phone: '', ssn: '', ein: '', source: '', location: '', interest: '', status: '' })
    setValueRange({ min: '', max: '' })
    setDateRange({ min: '', max: '' })
    const loadAllLeads = async () => {
      try {
        const params = addEmployeeFilter({ show_on_pipeline: true })
        const response = await apiService.searchLeads(params)
        if (response.success && response.data) {
          setLeads(response.data.leads)
          updatePipelineStages(response.data.leads)
          const leadIds = response.data.leads.map((l: Lead) => l.id)
          loadLinkedConversations(leadIds)
        }
      } catch (error) { console.error('Error loading all leads:', error) }
    }
    loadAllLeads()
  }

  const debouncedSearch = React.useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return (searchParams: any) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => { searchLeads(searchParams) }, 300)
    }
  }, [searchLeads])

  React.useEffect(() => {
    if (!isClient || !stagesLoaded || !userRole) return
    if (searchTerm) {
      const searchParams = addEmployeeFilter({ search: searchTerm, show_on_pipeline: true })
      debouncedSearch(searchParams)
    } else {
      const loadAllLeads = async () => {
        try {
          const params = addEmployeeFilter({ show_on_pipeline: true })
          const response = await apiService.searchLeads(params)
          if (response.success && response.data) {
            setLeads(response.data.leads)
            updatePipelineStages(response.data.leads)
            const leadIds = response.data.leads.map((l: Lead) => l.id)
            loadLinkedConversations(leadIds)
          }
        } catch (error) { console.error('Error loading all leads:', error) }
      }
      loadAllLeads()
    }
  }, [searchTerm, debouncedSearch, isClient, stagesLoaded, userRole, addEmployeeFilter])

  const applyModalFilters = React.useCallback(async () => {
    if (!isClient) return
    const hasFilters = filters.name || filters.email || filters.phone || filters.ssn || filters.ein || filters.source || filters.location || filters.interest || filters.status || valueRange.min || valueRange.max || dateRange.min || dateRange.max
    if (hasFilters) {
      try {
        let searchParams: any = { show_on_pipeline: true }
        if (filters.name) searchParams.name = filters.name
        if (filters.email) searchParams.email = filters.email
        if (filters.phone) searchParams.phone = filters.phone
        if (filters.ssn) searchParams.ssn = filters.ssn
        if (filters.ein) searchParams.ein = filters.ein
        if (filters.source) searchParams.source = filters.source
        if (filters.location) searchParams.location = filters.location
        if (filters.interest) searchParams.interest = filters.interest
        if (filters.status) searchParams.status = filters.status
        if (valueRange.min && !isNaN(parseFloat(valueRange.min))) searchParams.value_min = parseFloat(valueRange.min)
        if (valueRange.max && !isNaN(parseFloat(valueRange.max))) searchParams.value_max = parseFloat(valueRange.max)
        if (dateRange.min) searchParams.date_min = dateRange.min
        if (dateRange.max) searchParams.date_max = dateRange.max
        searchParams = addEmployeeFilter(searchParams)

        const response = await apiService.searchLeads(searchParams)
        if (response.success && response.data) {
          setLeads(response.data.leads)
          updatePipelineStages(response.data.leads)
          const leadIds = response.data.leads.map((l: Lead) => l.id)
          loadLinkedConversations(leadIds)
        }
      } catch (error) {
        pushToast(t('notifications.errorApplyingFilters'), 'error')
      }
    } else {
      const loadAllLeads = async () => {
        try {
          const params = addEmployeeFilter({ show_on_pipeline: true })
          const response = await apiService.searchLeads(params)
          if (response.success && response.data) {
            setLeads(response.data.leads)
            updatePipelineStages(response.data.leads)
            const leadIds = response.data.leads.map((l: Lead) => l.id)
            loadLinkedConversations(leadIds)
          }
        } catch (error) { console.error('Error loading all leads:', error) }
      }
      loadAllLeads()
    }
  }, [filters, valueRange, dateRange, isClient, addEmployeeFilter])

  function updatePipelineStages(leadsList: Lead[]) {
    setPipelineStages(prev => {
      const realStages = prev.filter(stage => stage.id !== '__uncategorized__')
      const newStages = realStages.map(stage => {
        const stageLeads = leadsList.filter(lead => {
          const leadStatus = lead.status?.toLowerCase().replace(/\s+/g, '')
          const stageSlug = stage.slug.toLowerCase()
          if (stage.translation_key) {
            const statusMap: { [key: string]: string } = {
              'new': 'new', 'incontact': 'contact', 'qualified': 'qualified', 'lost': 'lost', 'closedlost': 'lost', 'proposalsent': 'qualified', 'negotiation': 'qualified', 'contacted': 'contact', 'closedwon': 'qualified'
            }
            return statusMap[leadStatus] === stageSlug || leadStatus === stageSlug
          }
          return leadStatus === stageSlug || leadStatus.replace(/-/g, '') === stageSlug.replace(/-/g, '')
        })
        return { ...stage, leads: stageLeads }
      })
      const assignedLeadIds = new Set(newStages.flatMap(stage => stage.leads.map(lead => lead.id)))
      const orphanedLeads = leadsList.filter(lead => !assignedLeadIds.has(lead.id))
      
      if (orphanedLeads.length > 0) {
        const uncategorizedStage: PipelineStage = {
          id: '__uncategorized__', name: t('stageManagement.uncategorized'), slug: '__uncategorized__', color: JSON.stringify({ bg: '#FEF3C7', text: '#92400E' }), order: -1, leads: orphanedLeads
        }
        return [uncategorizedStage, ...newStages]
      }
      return newStages
    })
  }

  function pushToast(message: string, type: "success" | "warning" | "error" = "success", timeoutMs = 4000) {
    const id = createId()
    setToasts((prev) => [...prev, { id, text: message, type }])
    window.setTimeout(() => { setToasts((prev) => prev.filter((t) => t.id !== id)) }, timeoutMs)
  }

  async function updateLeadWithRetry(lead: Lead, updateData: any, maxRetries: number = 5): Promise<{ success: boolean, lead: Lead, error?: string }> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await apiService.updateLead(updateData)
        if (result.success) return { success: true, lead }
        else if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, attempt)))
          continue
        } else return { success: false, lead, error: result.error }
      } catch (error) {
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, attempt)))
          continue
        } else return { success: false, lead, error: String(error) }
      }
    }
    return { success: false, lead, error: 'Max retries exceeded' }
  }

  const isHexColor = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color)
  
  const getTextColorForBg = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128 ? '#1F2937' : '#FFFFFF' 
  }

  const renderStageBadge = (stage: PipelineStage, className: string = "inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-semibold") => {
    const stageName = stage.translation_key ? t(`stage.${stage.translation_key.replace('pipeline.stage.', '')}`) : stage.name
    try {
      const parsed = JSON.parse(stage.color)
      if (parsed.bg && parsed.text) {
        return (
          <div className={className} style={{ backgroundColor: parsed.bg, borderColor: parsed.bg, color: parsed.text }}>
            {stageName}
          </div>
        )
      }
    } catch { }
    if (isHexColor(stage.color)) {
      return (
        <div className={className} style={{ backgroundColor: stage.color, borderColor: stage.color, color: getTextColorForBg(stage.color) }}>
          {stageName}
        </div>
      )
    }
    return <div className={`${className} ${stage.color}`}>{stageName}</div>
  }

  const handleContactLead = React.useCallback((lead: Lead) => { setContactModal({ open: true, lead }) }, [])
  const handlePreviewLead = React.useCallback((lead: Lead) => { setPreview({ open: true, lead }) }, [])
  
  const filteredStages = React.useMemo(() => {
    return pipelineStages.map(stage => ({
      ...stage,
      filteredLeads: stage.leads.filter(lead => 
        !searchTerm || lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || (lead.source || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
  }, [pipelineStages, searchTerm])

  const openStageForm = (stage?: PipelineStage) => { setEditingStage(stage || null); setIsStageFormOpen(true); }
  const closeStageForm = () => { setIsStageFormOpen(false); setEditingStage(null); }

  const handleSaveStage = async (name: string, color: string, stageType: string) => {
    if (isSavingStage) return
    const finalName = name.trim()
    if (!finalName) { pushToast(t('stageManagement.nameRequired'), 'error'); return }
    if (!color.trim()) { pushToast(t('stageManagement.colorRequired'), 'error'); return }
    const newSlug = finalName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const duplicateStage = pipelineStages.find(stage => {
      if (editingStage && stage.id === editingStage.id) return false
      return stage.slug === newSlug || stage.name.toLowerCase() === finalName.toLowerCase()
    })
    
    if (duplicateStage) { pushToast(t('stageManagement.duplicateStage'), 'error'); return }
    setIsSavingStage(true)
    
    try {
      if (editingStage) {
        const oldSlug = editingStage.slug
        const slugChanged = newSlug !== oldSlug
        const response = await pipelineService.updateStage(editingStage.id, { name: finalName, color:color, stage_type: stageType || null }) 
        const isSuccess = response && response.success !== false && !response.error
        
        if (isSuccess) {
          if (slugChanged) {
            const leadsToUpdate = editingStage.leads
            if (leadsToUpdate.length > 0) {
              let newStatus: string
              if (editingStage.translation_key) {
                const statusMap: { [key: string]: string } = { 'new': 'New', 'contact': 'In Contact', 'qualified': 'Qualified', 'lost': 'Lost' }
                newStatus = statusMap[newSlug] || newSlug
              } else { newStatus = newSlug }
              const batchSize = 10
              const totalBatches = Math.ceil(leadsToUpdate.length / batchSize)
              let successCount = 0
              let errorCount = 0
              
              for (let i = 0; i < totalBatches; i++) {
                const start = i * batchSize
                const end = Math.min(start + batchSize, leadsToUpdate.length)
                const batch = leadsToUpdate.slice(start, end)
                pushToast(t('stageManagement.migration.processingBatch', { current: i + 1, total: totalBatches }), 'warning', 2000)
                const batchPromises = batch.map((lead: Lead) => apiService.updateLead({ id: lead.id, status: newStatus }).then(() => { successCount++; return true }).catch(() => { errorCount++; return false }))
                await Promise.all(batchPromises)
              }
              if (errorCount > 0) pushToast(t('stageManagement.migration.partialSuccess', { success: successCount, errors: errorCount }), 'warning')
              else pushToast(t('stageManagement.leadsUpdated', { count: successCount, stageName: finalName }), 'success')
            }
          }
          const stagesResponse = await pipelineService.getStages()
          const stagesData = stagesResponse.data || stagesResponse
          if (stagesData && Array.isArray(stagesData)) {
            const stagesWithLeads = stagesData.map((stage: any) => ({ ...stage, leads: [] }))
            setPipelineStages(stagesWithLeads)
            updatePipelineStages(leads)
          }
          pushToast(t('stageManagement.stageUpdated', { name: finalName }), 'success')
          closeStageForm()
        } else {
          const errorMessage = response?.error || response?.message || ''
          if (errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('já existe')) pushToast(t('stageManagement.duplicateStage'), 'error')
          else if (errorMessage) pushToast(errorMessage, 'error')
          else pushToast(t('stageManagement.errorUpdating'), 'error')
        }
      } else {

        const response = await pipelineService.createStage({ 
          name: finalName, 
          slug: newSlug, 
          color, 
          stage_type: stageType || null, 
          order: pipelineStages.length 
        })

        if (response && response.success !== false && !response.error) {
          const stagesResponse = await pipelineService.getStages()
          const stagesData = stagesResponse.data || stagesResponse
          if (stagesData && Array.isArray(stagesData)) {
            const stagesWithLeads = stagesData.map((stage: any) => ({ ...stage, leads: [] }))
            setPipelineStages(stagesWithLeads)
            
            updatePipelineStages(leads)
          }
          pushToast(t('stageManagement.stageCreated', { name: finalName }), 'success')
          closeStageForm()
        } else {
          const errorMessage = response?.error || response?.message || ''
          if (errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('já existe')) pushToast(t('stageManagement.duplicateStage'), 'error')
          else if (errorMessage) pushToast(errorMessage, 'error')
          else pushToast(t('stageManagement.errorCreating'), 'error')
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.error || error?.toString() || ''
      if (errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('já existe')) pushToast(t('stageManagement.duplicateStage'), 'error')
      else if (errorMessage && errorMessage !== '[object Object]') pushToast(errorMessage, 'error')
      else pushToast(editingStage ? t('stageManagement.errorUpdating') : t('stageManagement.errorCreating'), 'error')
    } finally {
      setIsSavingStage(false)
    }
  }

  const handleDeleteStage = async (stage: PipelineStage) => {
    if (stage.leads.length > 0) {
      setMigrationModal({ open: true, stage, targetStageId: null, action: null })
      return
    }
    setIsDeletingStage(stage)
  }

  const confirmLeadMigration = async () => {
    if (!migrationModal.stage || !migrationModal.action) { pushToast(t('stageManagement.selectAction'), 'error'); return }
    if (migrationModal.action === 'move' && !migrationModal.targetStageId) { pushToast(t('stageManagement.selectTargetStage'), 'error'); return }
    
    setIsSavingStage(true)
    try {
      const leadsToUpdate = migrationModal.stage.leads
      if (migrationModal.action === 'move' && migrationModal.targetStageId) {
        const targetStage = pipelineStages.find(s => s.id === migrationModal.targetStageId)
        if (!targetStage) { pushToast(t('stageManagement.targetStageNotFound'), 'error'); setIsSavingStage(false); return }
        
        let newStatus: string
        if (targetStage.translation_key) {
          const statusMap: { [key: string]: string } = { 'new': 'New', 'contact': 'In Contact', 'qualified': 'Qualified', 'lost': 'Lost' }
          newStatus = statusMap[targetStage.slug] || targetStage.slug
        } else { newStatus = targetStage.slug }
        
        const totalLeads = leadsToUpdate.length
        const batchSize = 1000 
        const totalBatches = Math.ceil(totalLeads / batchSize)
        const parallelLimit = 30
        
        setBulkMoveNotification({ show: true, progress: { current: 0, total: totalLeads, batch: 0, totalBatches } })
        
        try {
          let successCount = 0
          const failedUpdates: Array<{ lead: Lead, error: string }> = []
          for (let i = 0; i < totalBatches; i++) {
            const startIndex = i * batchSize
            const endIndex = Math.min(startIndex + batchSize, totalLeads)
            const batch = leadsToUpdate.slice(startIndex, endIndex)
            setBulkMoveNotification({ show: true, progress: { current: startIndex, total: totalLeads, batch: i + 1, totalBatches } })
            for (let j = 0; j < batch.length; j += parallelLimit) {
              const chunk = batch.slice(j, j + parallelLimit)
              const leadIndex = startIndex + j
              setBulkMoveNotification({ show: true, progress: { current: leadIndex, total: totalLeads, batch: i + 1, totalBatches } })
              const chunkPromises = chunk.map(async (lead) => {
                const updateData: any = { id: lead.id, status: newStatus }
                return updateLeadWithRetry(lead, updateData, 5)
              })
              const chunkResults = await Promise.all(chunkPromises)
              chunkResults.forEach(result => {
                if (result.success) successCount++
                else failedUpdates.push({ lead: result.lead, error: result.error || t('notifications.unknownError') })
              })
              if (j + parallelLimit < batch.length) await new Promise(resolve => setTimeout(resolve, 20))
            }
          }
          if (failedUpdates.length > 0) {
            pushToast(`Retrying ${failedUpdates.length} failed updates...`, "warning", 2000)
            for (let k = 0; k < failedUpdates.length; k += parallelLimit) {
              const retryChunk = failedUpdates.slice(k, k + parallelLimit)
              const retryPromises = retryChunk.map(({ lead }) => {
                const updateData: any = { id: lead.id, status: newStatus }
                return updateLeadWithRetry(lead, updateData, 5)
              })
              const retryResults = await Promise.all(retryPromises)
              retryResults.forEach(result => {
                if (result.success) {
                  successCount++
                  const index = failedUpdates.findIndex(f => f.lead.id === result.lead.id)
                  if (index !== -1) failedUpdates.splice(index, 1)
                }
              })
            }
          }
          if (failedUpdates.length > 0) pushToast(t('stageManagement.migration.partialSuccess', { success: successCount, errors: failedUpdates.length }), 'warning')
          else pushToast(t('stageManagement.leadsMoved', { count: successCount, stageName: targetStage.name }), 'success')
        } finally {
          setBulkMoveNotification({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 } })
        }
      } else if (migrationModal.action === 'uncategorize') {
        pushToast(t('stageManagement.migration.leadsMovedToUncategorized', { count: leadsToUpdate.length }), 'success')
      } else if (migrationModal.action === 'remove') {
        const totalLeads = leadsToUpdate.length
        const batchSize = 1000 
        const totalBatches = Math.ceil(totalLeads / batchSize)
        const parallelLimit = 30 
        setBulkMoveNotification({ show: true, progress: { current: 0, total: totalLeads, batch: 0, totalBatches } })
        
        try {
          let successCount = 0
          const failedUpdates: Array<{ lead: Lead, error: string }> = []
          for (let i = 0; i < totalBatches; i++) {
            const startIndex = i * batchSize
            const endIndex = Math.min(startIndex + batchSize, totalLeads)
            const batch = leadsToUpdate.slice(startIndex, endIndex)
            setBulkMoveNotification({ show: true, progress: { current: startIndex, total: totalLeads, batch: i + 1, totalBatches } })
            for (let j = 0; j < batch.length; j += parallelLimit) {
              const chunk = batch.slice(j, j + parallelLimit)
              const leadIndex = startIndex + j
              setBulkMoveNotification({ show: true, progress: { current: leadIndex, total: totalLeads, batch: i + 1, totalBatches } })
              const chunkPromises = chunk.map(async (lead) => {
                const updateData: any = { id: lead.id, show_on_pipeline: false }
                return updateLeadWithRetry(lead, updateData, 5)
              })
              const chunkResults = await Promise.all(chunkPromises)
              chunkResults.forEach(result => {
                if (result.success) successCount++
                else failedUpdates.push({ lead: result.lead, error: result.error || t('notifications.unknownError') })
              })
              if (j + parallelLimit < batch.length) await new Promise(resolve => setTimeout(resolve, 50))
            }
            if (i < totalBatches - 1) await new Promise(resolve => setTimeout(resolve, 100))
          }
          if (failedUpdates.length > 0) pushToast(t('stageManagement.migration.partialSuccess', { success: successCount, errors: failedUpdates.length }), 'warning')
          else pushToast(t('stageManagement.migration.leadsRemovedFromPipeline', { count: successCount }), 'success')
        } finally {
          setBulkMoveNotification({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 } })
        }
      }
      
      try {
        const response = await pipelineService.deleteStage(migrationModal.stage.id)
        if (response && response.success !== false) {
          const stagesResponse = await pipelineService.getStages()
          const stagesData = stagesResponse.data || stagesResponse
          if (stagesData && Array.isArray(stagesData)) {
            const stagesWithLeads = stagesData.map((stage: any) => ({ ...stage, leads: [] }))
            setPipelineStages(stagesWithLeads)
            setLeads(prev => {
              let updatedLeads = prev
              if (migrationModal.action === 'remove') {
                const removedLeadIds = new Set(migrationModal.stage?.leads.map(l => l.id) || [])
                updatedLeads = prev.filter(lead => !removedLeadIds.has(lead.id))
              } else {
                updatedLeads = prev.map(lead => {
                  const wasInDeletedStage = migrationModal.stage?.leads.some(l => l.id === lead.id) || false
                  if (wasInDeletedStage && migrationModal.action === 'move' && migrationModal.targetStageId) {
                    const targetStage = pipelineStages.find(s => s.id === migrationModal.targetStageId)
                    if (targetStage) {
                      let newStatus: string
                      if (targetStage.translation_key) {
                        const statusMap: { [key: string]: string } = { 'new': 'New', 'contact': 'In Contact', 'qualified': 'Qualified', 'lost': 'Lost' }
                        newStatus = statusMap[targetStage.slug] || targetStage.slug
                      } else { newStatus = targetStage.slug }
                      return { ...lead, status: newStatus }
                    }
                  }
                  return lead
                })
              }
              setTimeout(() => updatePipelineStages(updatedLeads), 100)
              return updatedLeads
            })
          }
          pushToast(t('stageManagement.stageDeleted', { name: migrationModal.stage.name }), 'success')
          setMigrationModal({ open: false, stage: null, targetStageId: null, action: null })
        } else {
          pushToast(response?.error || t('stageManagement.errorDeleting'), 'error')
        }
      } catch (deleteError: any) {
        if (migrationModal.action === 'move') pushToast(t('stageManagement.migration.leadsMovedStageDeleteFailed'), 'warning')
        else pushToast(t('stageManagement.errorDeleting'), 'error')
      }
    } catch (error: any) {
      pushToast(t('stageManagement.errorMigrating'), 'error')
    } finally {
      setIsSavingStage(false)
    }
  }

  const confirmDeleteStage = async () => {
    if (!isDeletingStage) return
    setIsSavingStage(true)
    try {
      const response = await pipelineService.deleteStage(isDeletingStage.id)
      if (response && response.success !== false) {
        const stagesResponse = await pipelineService.getStages()
        const stagesData = stagesResponse.data || stagesResponse
        if (stagesData && Array.isArray(stagesData)) {
          const stagesWithLeads = stagesData.map((stage: any) => {
            const currentStage = pipelineStages.find(s => s.id === stage.id)
            return { ...stage, leads: currentStage?.leads || [] }
          })
          setPipelineStages(stagesWithLeads)
        }
        pushToast(t('stageManagement.stageDeleted', { name: isDeletingStage.name }), 'success')
        setIsDeletingStage(null)
      } else if (response && response.error) {
        if (response.error.includes('leads')) pushToast(t('stageManagement.stageHasLeads'), 'error')
        else pushToast(response.error, 'error')
        setIsDeletingStage(null)
      } else {
        pushToast(t('stageManagement.errorDeleting'), 'error')
        setIsDeletingStage(null)
      }
    } catch (error: any) {
      if (error?.message && error.message.includes('leads')) pushToast(t('stageManagement.stageHasLeads'), 'error')
      else pushToast(t('stageManagement.errorDeleting'), 'error')
      setIsDeletingStage(null)
    } finally {
      setIsSavingStage(false)
    }
  }

  const [touchStartStage, setTouchStartStage] = React.useState<{ stage: PipelineStage; pos: { x: number; y: number } } | null>(null)
  const [isStageDragging, setIsStageDragging] = React.useState(false)
  
  const handleStageDragStart = (e: React.DragEvent, stage: PipelineStage) => {
    if (stage.id === '__uncategorized__') { e.preventDefault(); return }
    setDraggedStage(stage)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  const stageDragTouchStartRef = React.useRef<{ x: number; y: number; stage: PipelineStage } | null>(null)
  const stageDragElementsRef = React.useRef<Map<string, HTMLDivElement>>(new Map())
  const handleStageDropRef = React.useRef<((e: React.DragEvent, targetStage: PipelineStage) => Promise<void>) | null>(null)
  
  const handleStageTouchStart = React.useCallback((e: React.TouchEvent, stage: PipelineStage) => {
    if (stage.id === '__uncategorized__') return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('[role="menuitem"]')) return
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      setTouchStartStage({ stage, pos: { x: touch.clientX, y: touch.clientY } })
      stageDragTouchStartRef.current = { x: touch.clientX, y: touch.clientY, stage }
      setIsStageDragging(false)
    }
  }, [])
  
  const pipelineStagesRef = React.useRef(pipelineStages)
  React.useEffect(() => { pipelineStagesRef.current = pipelineStages }, [pipelineStages])

  const addStageTouchListener = React.useCallback((element: HTMLDivElement | null, stage: PipelineStage) => {
    if (!element) return () => {}
    let touchStartPos: { x: number; y: number } | null = null
    let isDragging = false
    let draggedStageRef: PipelineStage | null = null
    
    const touchStartHandler = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const target = e.target as HTMLElement
      if (target.closest('button') || target.closest('[role="menuitem"]')) return
      const touch = e.touches[0]
      touchStartPos = { x: touch.clientX, y: touch.clientY }
      stageDragTouchStartRef.current = { x: touch.clientX, y: touch.clientY, stage }
      isDragging = false
      draggedStageRef = null
    }
    
    const touchMoveHandler = (e: TouchEvent) => {
      if (!touchStartPos || !stageDragTouchStartRef.current || e.touches.length !== 1) return
      if (stageDragTouchStartRef.current.stage.id !== stage.id) return
      const touch = e.touches[0]
      const deltaX = Math.abs(touch.clientX - touchStartPos.x)
      const deltaY = Math.abs(touch.clientY - touchStartPos.y)
      if (!isDragging && (deltaX > 10 || deltaY > 10)) {
        isDragging = true
        draggedStageRef = stage
        setIsStageDragging(true)
        setDraggedStage(stage)
        element.style.touchAction = 'none'
        element.style.opacity = '0.5'
        element.style.cursor = 'grabbing'
        element.classList.add('dragging')
      }
      if (isDragging) {
        e.preventDefault()
        e.stopPropagation()
        const allStages = Array.from(document.querySelectorAll('[data-stage-management-id]'))
        allStages.forEach((el) => {
          const elStage = el as HTMLElement
          if (elStage.getAttribute('data-stage-management-id') === stage.id) return
          const rect = elStage.getBoundingClientRect()
          const centerY = rect.top + rect.height / 2
          if (touch.clientY < centerY) { elStage.classList.add('drag-over-top'); elStage.classList.remove('drag-over-bottom') } 
          else { elStage.classList.add('drag-over-bottom'); elStage.classList.remove('drag-over-top') }
        })
      }
    }
    
    const touchEndHandler = (e: TouchEvent) => {
      element.classList.remove('dragging')
      element.style.opacity = ''
      element.style.cursor = ''
      document.querySelectorAll('[data-stage-management-id]').forEach((el) => {
        (el as HTMLElement).classList.remove('drag-over-top', 'drag-over-bottom')
      })
      if (isDragging && draggedStageRef && stageDragTouchStartRef.current && handleStageDropRef.current) {
        e.preventDefault()
        e.stopPropagation()
        const touch = e.changedTouches[0]
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
        const targetStageElement = elementBelow?.closest('[data-stage-management-id]') as HTMLElement
        if (targetStageElement) {
          const targetStageId = targetStageElement.getAttribute('data-stage-management-id')
          if (targetStageId && targetStageId !== draggedStageRef.id && targetStageId !== '__uncategorized__') {
            const targetStage = pipelineStagesRef.current.find(s => s.id === targetStageId)
            if (targetStage && targetStage.id !== '__uncategorized__') {
              const fakeEvent = { preventDefault: () => {}, stopPropagation: () => {}, dataTransfer: { effectAllowed: 'move' as const, dropEffect: 'move' as const } } as React.DragEvent
              handleStageDropRef.current(fakeEvent, targetStage)
            }
          }
        }
        setDraggedStage(null)
        isDragging = false
        setIsStageDragging(false)
        draggedStageRef = null
      }
      stageDragElementsRef.current.forEach((el) => { el.style.touchAction = 'pan-y' })
      setTouchStartStage(null)
      stageDragTouchStartRef.current = null
      touchStartPos = null
      isDragging = false
    }
    
    element.addEventListener('touchstart', touchStartHandler, { passive: true })
    element.addEventListener('touchmove', touchMoveHandler, { passive: false })
    element.addEventListener('touchend', touchEndHandler, { passive: false })
    element.addEventListener('touchcancel', touchEndHandler, { passive: false })
    return () => {
      element.removeEventListener('touchstart', touchStartHandler)
      element.removeEventListener('touchmove', touchMoveHandler)
      element.removeEventListener('touchend', touchEndHandler)
      element.removeEventListener('touchcancel', touchEndHandler)
    }
  }, [])
  
  const handleStageTouchMoveForDrag = React.useCallback((e: React.TouchEvent, stage: PipelineStage) => {}, [])
  const handleStageTouchEndForDrag = React.useCallback((e: React.TouchEvent) => {}, [])
  const handleStageTouchEnd = React.useCallback(() => { setTouchStartStage(null); stageDragTouchStartRef.current = null; setIsStageDragging(false) }, [])
  const handleStageDragOver = (e: React.DragEvent, stageId: string) => { e.preventDefault(); setDraggedOverStageId(stageId) }
  const handleStageDragLeave = () => { setDraggedOverStageId(null) }

  const handleStageDrop = async (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault()
    setDraggedOverStageId(null)
    if (!draggedStage || draggedStage.id === targetStage.id || targetStage.id === '__uncategorized__') {
      setDraggedStage(null)
      return
    }
    const newStages = [...pipelineStages]
    const draggedIndex = newStages.findIndex(s => s.id === draggedStage.id)
    const targetIndex = newStages.findIndex(s => s.id === targetStage.id)
    newStages.splice(draggedIndex, 1)
    newStages.splice(targetIndex, 0, draggedStage)
    const reorderedStages = newStages.map((stage, index) => ({ ...stage, order: index }))
    setPipelineStages(reorderedStages)
    setDraggedStage(null)
    try {
      await  pipelineService.reorderStages(reorderedStages.map(s => s.id))
      pushToast(t('stageManagement.orderUpdated'), 'success')
    } catch (error) {
      pushToast(t('stageManagement.errorReordering'), 'error')
      const response = await pipelineService.getStages()
      const stagesData = response.data || response
      if (stagesData && Array.isArray(stagesData)) {
        const stagesWithLeads = stagesData.map((stage: any) => ({ ...stage, leads: pipelineStages.find(s => s.id === stage.id)?.leads || [] }))
        setPipelineStages(stagesWithLeads)
      }
    }
  }

  React.useEffect(() => { handleStageDropRef.current = handleStageDrop }, [handleStageDrop])

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image
    if (mimeType.startsWith('video/')) return FileVideo
    if (mimeType.startsWith('audio/')) return FileAudio
    if (mimeType.includes('pdf')) return FileText
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return Archive
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File) => {
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) return { valid: false, error: `${t('notifications.fileTooLarge')} ${formatFileSize(file.size)}` }
    return { valid: true }
  }

  const handleAttachmentFileSelect = (event: React.ChangeEvent<HTMLInputElement>, leadId: string) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    const validFiles: File[] = []
    const invalidFiles: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validation = validateFile(file)
      if (validation.valid) validFiles.push(file)
      else invalidFiles.push(`${file.name}: ${validation.error}`)
    }
    if (invalidFiles.length > 0) pushToast(`${t('notifications.invalidFiles')} ${invalidFiles.join(', ')}`, 'error')
    if (validFiles.length > 0) {
      setPendingAttachments(prev => ({ ...prev, [leadId]: { toAdd: [...(prev[leadId]?.toAdd || []), ...validFiles], toRemove: prev[leadId]?.toRemove || [] } }))
      setHasUnsavedChanges(true)
    }
    if (attachmentFileInputRef.current) attachmentFileInputRef.current.value = ''
  }

  const handleAttachmentDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsAttachmentDragActive(true) }
  const handleAttachmentDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsAttachmentDragActive(false) }

  const handleAttachmentDrop = (e: React.DragEvent, leadId: string) => {
    e.preventDefault(); e.stopPropagation(); setIsAttachmentDragActive(false)
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return
    const validFiles: File[] = []
    const invalidFiles: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validation = validateFile(file)
      if (validation.valid) validFiles.push(file)
      else invalidFiles.push(`${file.name}: ${validation.error}`)
    }
    if (invalidFiles.length > 0) pushToast(`${t('notifications.invalidFiles')} ${invalidFiles.join(', ')}`, 'error')
    if (validFiles.length > 0) {
      setPendingAttachments(prev => ({ ...prev, [leadId]: { toAdd: [...(prev[leadId]?.toAdd || []), ...validFiles], toRemove: prev[leadId]?.toRemove || [] } }))
      setHasUnsavedChanges(true)
    }
  }

  const uploadAttachmentSilently = async (leadId: string, file: File) => {
    try {
      const response = await apiService.uploadLeadAttachment(leadId, file)
      if (response.success && response.data) {
        let newAttachment = null
        if (response.data.attachment) newAttachment = response.data.attachment
        else if ((response.data as any).data && (response.data as any).data.attachment) newAttachment = (response.data as any).data.attachment
        else if (response.data) newAttachment = response.data as any
        
        if (newAttachment && newAttachment.id && newAttachment.mimeType && newAttachment.originalName) {
          setLeads(prev => prev.map(lead => {
            if (lead.id === leadId) {
              const attachments = lead.attachments || []
              return { ...lead, attachments: [...attachments, newAttachment] }
            }
            return lead
          }))
        }
      } else {
        throw new Error(response.error || t('notifications.errorUploadingFile'))
      }
    } catch (error) {
      console.error('Error uploading attachment silently:', error)
      throw error
    }
  }

  const removeAttachmentFromPending = (leadId: string, attachmentId: string) => {
    setPendingAttachments(prev => ({ ...prev, [leadId]: { toAdd: prev[leadId]?.toAdd || [], toRemove: [...(prev[leadId]?.toRemove || []), attachmentId] } }))
    setHasUnsavedChanges(true)
  }

  const deleteAttachment = async (leadId: string, attachmentId: string) => {
    try {
      const response = await apiService.deleteLeadAttachment(leadId, attachmentId)
      if (response.success) {
        setLeads(prev => prev.map(lead => {
          if (lead.id === leadId) {
            const attachments = (lead.attachments || []).filter(a => a.id !== attachmentId)
            return { ...lead, attachments }
          }
          return lead
        }))
      } else {
        pushToast(response.error || t('notifications.errorDeletingFile'), 'error')
      }
    } catch (error) {
      pushToast(t('notifications.errorDeletingFile'), 'error')
    }
  }

  const downloadAttachment = async (leadId: string, attachmentId: string, filename: string) => {
    try {
      const blobResponse = await apiService.getLeadAttachment(leadId, attachmentId)
      if (blobResponse) {
        const blob = blobResponse instanceof Blob ? blobResponse : new Blob([(blobResponse as any).data || blobResponse])
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        pushToast(t('notifications.errorDeletingFile'), 'error')
      }
    } catch (error) {
      pushToast(t('notifications.errorDeletingFile'), 'error')
    }
  }

  const viewAttachment = async (leadId: string, attachmentId: string) => {
    try {
      const blobResponse = await apiService.getLeadAttachment(leadId, attachmentId)
      if (blobResponse) {
        const blob = blobResponse instanceof Blob ? blobResponse : new Blob([(blobResponse as any).data || blobResponse])
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
      } else {
        pushToast(t('notifications.errorUploadingFile'), 'error')
      }
    } catch (error) {
      pushToast(t('notifications.errorUploadingFile'), 'error')
    }
  }

  const processPendingAttachments = async (leadId: string) => {
    const pending = pendingAttachments[leadId]
    if (!pending || (pending.toAdd.length === 0 && pending.toRemove.length === 0)) return

    try {
      setUploadingAttachments(prev => ({ ...prev, [leadId]: true }))
      for (const attachmentId of pending.toRemove) await deleteAttachment(leadId, attachmentId)
      for (const file of pending.toAdd) await uploadAttachmentSilently(leadId, file)
      const response = await apiService.getLeadsByStatus()
      if (response.success && response.data) {
        setLeads(response.data.leads)
        updatePipelineStages(response.data.leads)
        const leadIds = response.data.leads.map((l: Lead) => l.id)
        loadLinkedConversations(leadIds)
      }
      setPendingAttachments(prev => { const newPending = { ...prev }; delete newPending[leadId]; return newPending })
      setHasUnsavedChanges(false)
    } catch (error) {
      pushToast(t('notifications.errorUploadingFile'), 'error')
    } finally {
      setUploadingAttachments(prev => ({ ...prev, [leadId]: false }))
    }
  }

  const handleEdit = React.useCallback((lead: Lead) => {
    setEditingId(lead.id)
    setEditValue(lead.value?.toString() || "")
    setEditExpectedCloseDate(lead.estimated_close_date || "")
    setEditNotes(lead.description || "")
    setEditInterest(lead.interest || "")
    setOriginalFormValues({ value: lead.value?.toString() || "", expectedCloseDate: lead.estimated_close_date || "", notes: lead.description || "", interest: lead.interest || "" })
    setIsEditModalOpen(true)
  }, [])

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    if (typeof window === 'undefined') { pushToast('Aguarde o carregamento completo da página', 'warning'); return }
    try {
      const updateData: UpdateLeadRequest = {
        id: editingId,
        value: editValue ? parseFloat(editValue) : undefined,
        estimated_close_date: editExpectedCloseDate || undefined,
        description: editNotes || undefined,
        interest: editInterest || undefined
      }
      const response = await apiService.updateLead(updateData)
      if (response.success && response.data) {
        setLeads((prev) => {
          const updatedLeads = prev.map((lead) => lead.id === editingId ? response.data!.lead : lead )
          updatePipelineStages(updatedLeads)
          return updatedLeads
        })
        await processPendingAttachments(editingId)
        pushToast(t('notifications.leadUpdated'), "success")
      } else {
        pushToast(`${t('notifications.errorUpdating')}: ${response.error}`, "error")
      }
    } catch (error) {
      pushToast(t('notifications.errorUpdating'), "error")
    }
    setIsEditModalOpen(false)
    setEditingId(null)
    setEditValue("")
    setEditExpectedCloseDate("")
    setEditNotes("")
    if (editingId) {
      setPendingAttachments(prev => { const newPending = { ...prev }; delete newPending[editingId]; return newPending })
    }
    setHasUnsavedChanges(false)
  }

  function handleViewLead(lead: Lead) {
    const encodedName = encodeURIComponent(lead.name)
    window.location.href = `/${org}/leads?search=${encodedName}`
  }

  const handleOpenLinkLead = React.useCallback((lead: Lead) => {
    setLinkLeadModal({ open: true, lead })
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const response = await apiService.getOrganizationUsers(true)
        if (response.success && response.data?.employees) {
          setAvailableUsers(response.data.employees)
          setSelectedUserId(lead.assigned_user_id || (response.data.employees.length > 0 ? response.data.employees[0].id : ""))
        } else {
          pushToast(t('linkLeadModal.errorLoadingUsers'), 'error')
        }
      } catch (error) {
        pushToast(t('linkLeadModal.errorLoadingUsers'), 'error')
      } finally {
        setIsLoadingUsers(false)
      }
    }
    fetchUsers()
  }, [t])
  
  const handleLinkLead = async () => {
    if (!linkLeadModal.lead || !selectedUserId) { pushToast(t('linkLeadModal.selectUserWarning'), 'warning'); return }
    setIsLinkingLead(true)
    try {
      const response = await apiService.updateLead({ id: linkLeadModal.lead.id, assigned_user_id: selectedUserId })
      if (response.success && response.data) {
        setLeads(prev => prev.map(lead => lead.id === linkLeadModal.lead!.id ? { ...lead, assigned_user_id: selectedUserId } : lead ))
        setPipelineStages(prev => prev.map(stage => ({ ...stage, leads: stage.leads.map(lead => lead.id === linkLeadModal.lead!.id ? { ...lead, assigned_user_id: selectedUserId } : lead ) })))
        const userName = availableUsers.find(u => u.id === selectedUserId)?.name || t('linkLeadModal.unknownUser')
        pushToast(t('linkLeadModal.success', { leadName: linkLeadModal.lead.name, userName }), 'success')
        setLinkLeadModal({ open: false, lead: null })
        setSelectedUserId("")
      } else {
        pushToast(response.error || t('linkLeadModal.error'), 'error')
      }
    } catch (error) {
      pushToast(t('linkLeadModal.error'), 'error')
    } finally {
      setIsLinkingLead(false)
    }
  }

  const handleDragStart = React.useCallback((e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead)
    touchDraggedLeadRef.current = lead 
    e.dataTransfer.effectAllowed = "move"
  }, [])
  
  const handlePipelineDragOver = React.useCallback((e: React.DragEvent) => {
    if (!draggedLead || !pipelineScrollRef.current) return
    e.preventDefault()
    try { e.dataTransfer.dropEffect = "move" } catch (err) {}
    
    const container = pipelineScrollRef.current
    const containerRect = container.getBoundingClientRect()
    const mouseX = e.clientX
    const scrollThreshold = 80 
    const scrollSpeed = 12 
    
    const distanceFromLeft = mouseX - containerRect.left
    const distanceFromRight = containerRect.right - mouseX
    const isNearLeftEdge = distanceFromLeft < scrollThreshold && distanceFromLeft > 0
    const isNearRightEdge = distanceFromRight < scrollThreshold && distanceFromRight > 0
    const maxScroll = container.scrollWidth - container.clientWidth
    const canScrollLeft = container.scrollLeft > 0
    const canScrollRight = container.scrollLeft < maxScroll
    
    const shouldScrollLeft = isNearLeftEdge && canScrollLeft
    const shouldScrollRight = isNearRightEdge && canScrollRight
    
    if (scrollIntervalRef.current) { clearInterval(scrollIntervalRef.current); scrollIntervalRef.current = null }
    
    if (shouldScrollLeft) {
      scrollIntervalRef.current = setInterval(() => {
        if (pipelineScrollRef.current) {
          const currentScroll = pipelineScrollRef.current.scrollLeft
          if (currentScroll > 0) pipelineScrollRef.current.scrollLeft = Math.max(0, currentScroll - scrollSpeed)
          else if (scrollIntervalRef.current) { clearInterval(scrollIntervalRef.current); scrollIntervalRef.current = null }
        }
      }, 16)
      return
    }
    
    if (shouldScrollRight) {
      scrollIntervalRef.current = setInterval(() => {
        if (pipelineScrollRef.current) {
          const currentScroll = pipelineScrollRef.current.scrollLeft
          const maxScroll = pipelineScrollRef.current.scrollWidth - pipelineScrollRef.current.clientWidth
          if (currentScroll < maxScroll) pipelineScrollRef.current.scrollLeft = Math.min(maxScroll, currentScroll + scrollSpeed)
          else if (scrollIntervalRef.current) { clearInterval(scrollIntervalRef.current); scrollIntervalRef.current = null }
        }
      }, 16)
      return
    }
  }, [draggedLead])
  
  const handlePipelineDragEnd = React.useCallback(() => {
    if (scrollIntervalRef.current) { clearInterval(scrollIntervalRef.current); scrollIntervalRef.current = null }
  }, [])
  
  React.useEffect(() => {
    return () => { if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current) }
  }, [])

  const touchDraggedLeadRef = React.useRef<Lead | null>(null)
  const touchOverStageRef = React.useRef<string | null>(null)
  
  React.useEffect(() => { touchDraggedLeadRef.current = draggedLead }, [draggedLead])
  
  React.useEffect(() => {
    const handleLeadTouchDrop = async (e: Event) => {
      const customEvent = e as CustomEvent<{ leadId: string; stageId: string; touch: { x: number; y: number } }>
      const { leadId, stageId } = customEvent.detail
      const lead = leads.find(l => l.id === leadId)
      if (!lead) return
      const fakeEvent = { preventDefault: () => {}, stopPropagation: () => {}, dataTransfer: { effectAllowed: 'move' as const, dropEffect: 'move' as const } } as React.DragEvent
      setDraggedLead(lead)
      await new Promise(resolve => setTimeout(resolve, 0))
      await handleDrop(fakeEvent, stageId)
    }
    document.addEventListener('leadTouchDrop', handleLeadTouchDrop as EventListener)
    return () => document.removeEventListener('leadTouchDrop', handleLeadTouchDrop as EventListener)
  }, [leads])
  
  function handleDragOver(e: React.DragEvent, stageId: string) {
    e.preventDefault()
    try { e.dataTransfer.dropEffect = "move" } catch (err) {}
    setDraggedOverStage(stageId)
  }
  
  const handleStageTouchMoveForLeadDrop = React.useCallback((e: React.TouchEvent, stageId: string) => {
    if (touchDraggedLeadRef.current && e.touches.length === 1) {
      const touch = e.touches[0]
      const element = document.elementFromPoint(touch.clientX, touch.clientY)
      const isOverStage = element?.closest(`[data-stage-id="${stageId}"]`)
      if (isOverStage) { touchOverStageRef.current = stageId; setDraggedOverStage(stageId) } 
      else { touchOverStageRef.current = null }
    }
  }, [])
  
  const handleStageTouchEndForLeadDrop = React.useCallback(async (e: React.TouchEvent, stageId: string) => {
    if (touchDraggedLeadRef.current) {
      const touch = e.changedTouches[0]
      const element = document.elementFromPoint(touch.clientX, touch.clientY)
      const isOverStage = element?.closest(`[data-stage-id="${stageId}"]`)
      if (isOverStage) {
        const fakeEvent = { preventDefault: () => {}, stopPropagation: () => {}, dataTransfer: { effectAllowed: 'move' as const, dropEffect: 'move' as const } } as React.DragEvent
        await handleDrop(fakeEvent, stageId)
        touchDraggedLeadRef.current = null
        touchOverStageRef.current = null
      }
    }
  }, [])

  function handleDragLeave() {
    setDraggedOverStage(null)
    touchOverStageRef.current = null
  }

  async function handleDrop(e: React.DragEvent, targetStageId: string) {
    e.preventDefault()
    handlePipelineDragEnd()
    if (!draggedLead) return
    if (typeof window === 'undefined') { pushToast('Aguarde o carregamento completo da página', 'warning'); return }
    const targetStage = pipelineStages.find(stage => stage.id === targetStageId)
    if (!targetStage) { pushToast('Stage não encontrada', 'error'); setDraggedLead(null); setDraggedOverStage(null); handlePipelineDragEnd(); return }

    let newStatus: string
    if (targetStage.translation_key) {
      const statusMap: { [key: string]: string } = { 'new': 'New', 'contact': 'In Contact', 'qualified': 'Qualified', 'lost': 'Lost' }
      newStatus = statusMap[targetStage.slug] || targetStage.slug
    } else {
      newStatus = targetStage.slug
    }

    try {
      const updateData: UpdateLeadRequest = { id: draggedLead.id, status: newStatus }
      const response = await apiService.updateLead(updateData)
      if (response.success && response.data) {
        setLeads((prev) => {
          const updatedLeads = prev.map((lead) => lead.id === draggedLead.id ? response.data!.lead : lead )
          updatePipelineStages(updatedLeads)
          return updatedLeads
        })
      } else {
        pushToast(t('notifications.errorMovingLead', { error: response.error || t('notifications.unknownError') }), "error")
      }
    } catch (error) {
      pushToast(t('notifications.errorMovingLeadGeneric'), "error")
    }

    setDraggedLead(null)
    setDraggedOverStage(null)
    touchDraggedLeadRef.current = null
    touchOverStageRef.current = null
  }

  const extractPhoneNumber = (lead: Lead): string | null => {
    if (!lead.phone) return null
    if (lead.phone.startsWith('+')) return lead.phone
    return `+1${lead.phone.replace(/\D/g, '')}`
  }

  const handleTelegramApiSelection = async (apiType: 'bot' | 'account') => {
    if (!contactModal.lead) return
    const phoneNumber = extractPhoneNumber(contactModal.lead)
    setShowTelegramApiSelector(false)
    
    if (apiType === 'bot') {
      setLoadingBotConversations(true)
      try {
        const conversationsResponse = await (apiService as any).getTelegramConversations({ search: phoneNumber || undefined })
        if (conversationsResponse.success && conversationsResponse.data?.conversations) {
          const conversations = conversationsResponse.data.conversations
          const linkedConversations = conversations.filter((conv: any) => conv.lead_id === contactModal.lead?.id)
          if (linkedConversations.length > 0) {
            const firstLinkedConv = linkedConversations[0]
            setLinkedTelegramUsername(firstLinkedConv.telegram_username || null)
            setLinkedTelegramConversation(firstLinkedConv)
            setIsUsingBotApi(true)
            setContactModal({ open: false, lead: null })
            setSendMessageModal({ open: true, lead: contactModal.lead, method: 'telegram' })
          } else if (conversations.length > 0) {
            setBotConversations(conversations)
            setShowBotConversationsModal(true)
          } else {
            setTelegramWarningMessage(`Enquanto o lead ${contactModal.lead?.name} não entrar em contato pelo bot, não é possível iniciar uma conversa.`)
            setShowTelegramWarning(true)
          }
        }
      } catch (error) {
        pushToast(t('notifications.errorSearchingConversations'), 'error')
      } finally {
        setLoadingBotConversations(false)
        if (!showBotConversationsModal) setContactModal({ open: false, lead: null })
      }
    } else if (apiType === 'account') {
      setLinkedTelegramUsername(null)
      setLinkedTelegramConversation(null)
      setIsUsingBotApi(false)
      setContactModal({ open: false, lead: null })
      setSendMessageModal({ open: true, lead: contactModal.lead, method: 'telegram' })
    }
  }
  
  const handleContactMethodSelect = async (method: 'whatsapp' | 'telegram' | 'email') => {
    if (!contactModal.lead) return
    const phoneNumber = extractPhoneNumber(contactModal.lead)
    
    if ((method === 'whatsapp' || method === 'telegram') && !phoneNumber) {
      pushToast(t('notifications.noPhoneNumber'), 'error')
      setContactModal({ open: false, lead: null })
      return
    }

    if (method === 'telegram') {
      const hasActiveAccounts = telegramAccounts.some(acc => acc.is_active)
      const hasActiveBots = telegramBots.some(bot => bot.is_active)

      try {
        const conversationsResponse = await (apiService as any).getTelegramConversations({ search: phoneNumber || undefined })
        if (conversationsResponse.success && conversationsResponse.data?.conversations) {
          const conversations = conversationsResponse.data.conversations
          const linkedConversations = conversations.filter((conv: any) => conv.lead_id === contactModal.lead?.id)
          if (linkedConversations.length > 0) {
            const firstLinkedConv = linkedConversations[0]
            if (firstLinkedConv.bot_id) {
              setLinkedTelegramUsername(firstLinkedConv.telegram_username || null)
              setLinkedTelegramConversation(firstLinkedConv)
              setIsUsingBotApi(true)
              setContactModal({ open: false, lead: null })
              setSendMessageModal({ open: true, lead: contactModal.lead, method: 'telegram' })
              return
            } else if (firstLinkedConv.account_id) {
              setLinkedTelegramUsername(firstLinkedConv.telegram_username || null)
              setLinkedTelegramConversation(null)
              setIsUsingBotApi(false)
              setContactModal({ open: false, lead: null })
              setSendMessageModal({ open: true, lead: contactModal.lead, method: 'telegram' })
              return
            }
          }
          if (linkedConversations.length === 0 && hasActiveAccounts) {
            setShowNoLinkedConversationWarning(true)
            setLinkedTelegramUsername(null)
            setLinkedTelegramConversation(null)
            setIsUsingBotApi(false)
            setContactModal({ open: false, lead: null })
            setSendMessageModal({ open: true, lead: contactModal.lead, method: 'telegram' })
            return
          }
        } else {
          if (hasActiveAccounts) {
            setShowNoLinkedConversationWarning(true)
            setLinkedTelegramUsername(null)
            setLinkedTelegramConversation(null)
            setIsUsingBotApi(false)
            setContactModal({ open: false, lead: null })
            setSendMessageModal({ open: true, lead: contactModal.lead, method: 'telegram' })
            return
          }
        }
      } catch (error) {
        if (hasActiveAccounts) {
          setShowNoLinkedConversationWarning(true)
          setLinkedTelegramUsername(null)
          setLinkedTelegramConversation(null)
          setIsUsingBotApi(false)
          setContactModal({ open: false, lead: null })
          setSendMessageModal({ open: true, lead: contactModal.lead, method: 'telegram' })
          return
        }
      }

      if (hasActiveAccounts && hasActiveBots) {
        setShowNoLinkedConversationWarning(true)
        setLinkedTelegramUsername(null)
        setLinkedTelegramConversation(null)
        setIsUsingBotApi(false)
        setContactModal({ open: false, lead: null })
        setSendMessageModal({ open: true, lead: contactModal.lead, method: 'telegram' })
        return
      }

      if (!hasActiveAccounts) {
        if (hasActiveBots) {
          setLoadingBotConversations(true)
          try {
            const conversationsResponse = await (apiService as any).getTelegramConversations({ search: phoneNumber || undefined })
            if (conversationsResponse.success && conversationsResponse.data?.conversations) {
              const conversations = conversationsResponse.data.conversations
              const linkedConversations = conversations.filter((conv: any) => conv.lead_id === contactModal.lead?.id)
              if (linkedConversations.length > 0) {
                const firstLinkedConv = linkedConversations[0]
                setLinkedTelegramUsername(firstLinkedConv.telegram_username || null)
                setLinkedTelegramConversation(firstLinkedConv)
                setIsUsingBotApi(true)
                setContactModal({ open: false, lead: null })
                setSendMessageModal({ open: true, lead: contactModal.lead, method: 'telegram' })
              } else if (conversations.length > 0) {
                setBotConversations(conversations)
                setShowBotConversationsModal(true)
              } else {
                setTelegramWarningMessage(`A API de Bot do Telegram só pode responder conversas já existentes. Nenhuma conversa foi encontrada para ${contactModal.lead?.name} (${phoneNumber}).`)
                setShowTelegramWarning(true)
              }
            }
          } catch (error) {
            pushToast(t('notifications.errorSearchingConversations'), 'error')
          } finally {
            setLoadingBotConversations(false)
            setContactModal({ open: false, lead: null })
          }
        } else {
          setTelegramWarningMessage(t('notifications.telegramNotConfigured'))
          setShowTelegramWarning(true)
        }
        return
      }
    }
    setContactModal({ open: false, lead: null })
    setSendMessageModal({ open: true, lead: contactModal.lead, method })
  }

  const navigateToChat = (method: 'whatsapp' | 'telegram' | 'email', lead: Lead, conversationId?: string) => {
    const phoneNumber = extractPhoneNumber(lead)
    if (method === 'telegram' && phoneNumber) {
      const params = new URLSearchParams()
      params.append('phone', phoneNumber)
      if (conversationId) params.append('conversationId', conversationId)
      window.location.href = `/${org}/chats/telegram?${params.toString()}`
    } else if (method === 'whatsapp' && phoneNumber) {
      window.location.href = `/${org}/chats/whatsapp?phone=${encodeURIComponent(phoneNumber)}`
    } else if (method === 'email') {
      window.location.href = `/${org}/chats/email?email=${encodeURIComponent(lead.email)}`
    }
  }

  const handleSendMessageOnly = async () => {
    if (!sendMessageModal.lead || !sendMessageModal.method || !messageText.trim()) {
      pushToast(t('notifications.pleaseEnterMessage'), 'warning')
      return
    }
    setIsSendingMessage(true)
    try {
      if (sendMessageModal.method === 'telegram') {
        if (isUsingBotApi && linkedTelegramConversation) {
          const response = await (apiService as any).sendTelegramMessage({
            conversation_id: linkedTelegramConversation.id,
            message_text: messageText,
            message_type: 'text'
          })
          if (response.success) {
            pushToast(t('notifications.messageSentTelegram'), 'success')
            setSendMessageModal({ open: false, lead: null, method: null })
            setMessageText("")
            setShowNoLinkedConversationWarning(false)
            setLinkedTelegramUsername(null)
            setLinkedTelegramConversation(null)
            setIsUsingBotApi(false)
          } else {
            pushToast(response.error || t('notifications.failedToSendMessage'), 'error')
          }
        } else {
          if (!selectedAccountId && telegramAccounts.filter((acc) => acc.is_active).length > 0) {
            pushToast(t('notifications.noActiveTelegramAccount'), 'error')
            setIsSendingMessage(false); return
          }
          const phoneNumber = extractPhoneNumber(sendMessageModal.lead)
          if (!phoneNumber) { pushToast(t('notifications.invalidPhoneNumber'), 'error'); setIsSendingMessage(false); return }
          const identifier = linkedTelegramUsername ? `@${linkedTelegramUsername}` : phoneNumber
          const response = await (apiService as any).startTelegramAccountChat(
            selectedAccountId || telegramAccounts.find((acc) => acc.is_active)?.id || '', identifier, messageText
          )
          if (response.success) {
            pushToast(t('notifications.messageSentTelegram'), 'success')
            setSendMessageModal({ open: false, lead: null, method: null })
            setMessageText("")
            setShowNoLinkedConversationWarning(false)
            setLinkedTelegramUsername(null)
            setLinkedTelegramConversation(null)
            setIsUsingBotApi(false)
          } else {
            const errorMessage = response.error || t('notifications.failedToSendMessage')
            if (errorMessage.includes('Usuário não encontrado') || errorMessage.includes('não encontrado')) {
              pushToast(`Não foi possível encontrar o usuário no Telegram com o identificador ${identifier}. O número pode ser fictício ou não estar registrado no Telegram.`, 'error')
            } else { pushToast(errorMessage, 'error') }
          }
        }
      } else if (sendMessageModal.method === 'whatsapp') {
        pushToast(t('notifications.whatsappComingSoon'), 'warning')
      } else if (sendMessageModal.method === 'email') {
        pushToast(t('notifications.emailComingSoon'), 'warning')
      }
    } catch (error) {
      pushToast(t('notifications.errorSendingMessage'), 'error')
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleSendMessageAndOpenChat = async () => {
    if (!sendMessageModal.lead || !sendMessageModal.method || !messageText.trim()) {
      pushToast(t('notifications.pleaseEnterMessage'), 'warning')
      return
    }
    setIsSendingMessage(true)
    try {
      if (sendMessageModal.method === 'telegram') {
        if (isUsingBotApi && linkedTelegramConversation) {
          const response = await (apiService as any).sendTelegramMessage({
            conversation_id: linkedTelegramConversation.id,
            message_text: messageText,
            message_type: 'text'
          })
          if (response.success) {
            pushToast(t('notifications.messageSentOpeningChat'), 'success')
            navigateToChat(sendMessageModal.method, sendMessageModal.lead, linkedTelegramConversation.id)
            setSendMessageModal({ open: false, lead: null, method: null })
            setMessageText("")
            setShowNoLinkedConversationWarning(false)
            setLinkedTelegramUsername(null)
            setLinkedTelegramConversation(null)
            setIsUsingBotApi(false)
          } else {
            pushToast(response.error || t('notifications.failedToSendMessage'), 'error')
            setIsSendingMessage(false)
          }
          return
        } else {
          if (!selectedAccountId && telegramAccounts.filter((acc) => acc.is_active).length > 0) {
            pushToast(t('notifications.noActiveTelegramAccount'), 'error')
            setIsSendingMessage(false); return
          }
          const phoneNumber = extractPhoneNumber(sendMessageModal.lead)
          if (!phoneNumber) { pushToast(t('notifications.invalidPhoneNumber'), 'error'); setIsSendingMessage(false); return }
          const identifier = linkedTelegramUsername ? `@${linkedTelegramUsername}` : phoneNumber
          const response = await (apiService as any).startTelegramAccountChat(
            selectedAccountId || telegramAccounts.find((acc) => acc.is_active)?.id || '', identifier, messageText
          )
          if (response.success) {
            pushToast(t('notifications.messageSentOpeningChat'), 'success')
            const conversationId = response.data?.conversation?.id
            navigateToChat(sendMessageModal.method, sendMessageModal.lead, conversationId)
            setSendMessageModal({ open: false, lead: null, method: null })
            setMessageText("")
            setShowNoLinkedConversationWarning(false)
            setLinkedTelegramUsername(null)
            setLinkedTelegramConversation(null)
            setIsUsingBotApi(false)
          } else {
            const errorMessage = response.error || t('notifications.failedToSendMessage')
            if (errorMessage.includes('Usuário não encontrado') || errorMessage.includes('não encontrado')) {
              pushToast(`Não foi possível encontrar o usuário no Telegram com o identificador ${identifier}. O número pode ser fictício ou não estar registrado no Telegram.`, 'error')
            } else { pushToast(errorMessage, 'error') }
          }
        }
      } else if (sendMessageModal.method === 'whatsapp') {
        pushToast(t('notifications.whatsappComingSoon'), 'warning')
        navigateToChat(sendMessageModal.method, sendMessageModal.lead)
        setIsSendingMessage(false)
      } else if (sendMessageModal.method === 'email') {
        pushToast(t('notifications.emailComingSoon'), 'warning')
        navigateToChat(sendMessageModal.method, sendMessageModal.lead)
        setIsSendingMessage(false)
      }
    } catch (error) {
      pushToast(t('notifications.errorSendingMessage'), 'error')
      setIsSendingMessage(false)
    }
  }

  const handleOpenChatWithoutSending = async () => {
    if (!sendMessageModal.lead || !sendMessageModal.method) return
    if (sendMessageModal.method === 'telegram') {
      if (isUsingBotApi && linkedTelegramConversation) {
        navigateToChat(sendMessageModal.method, sendMessageModal.lead, linkedTelegramConversation.id)
        return
      }
      const phoneNumber = extractPhoneNumber(sendMessageModal.lead)
      if (!phoneNumber) { pushToast(t('notifications.invalidPhoneNumber'), 'error'); return }
      try {
        const conversationsResponse = await (apiService as any).getTelegramConversations({ search: phoneNumber })
        if (conversationsResponse.success && conversationsResponse.data?.conversations) {
          const conversations = conversationsResponse.data.conversations
          const linkedConversations = conversations.filter((conv: any) => conv.lead_id === sendMessageModal.lead?.id)
          if (linkedConversations.length > 0) {
            const firstLinkedConv = linkedConversations[0]
            navigateToChat(sendMessageModal.method, sendMessageModal.lead, firstLinkedConv.id)
            return
          }
        }
        navigateToChat(sendMessageModal.method, sendMessageModal.lead)
      } catch (error) {
        navigateToChat(sendMessageModal.method, sendMessageModal.lead)
      }
    } else {
      navigateToChat(sendMessageModal.method, sendMessageModal.lead)
    }
  }

  const totalValue = leads.reduce((sum, lead) => {
    const value = lead.value
    const numericValue = typeof value === 'string' ? parseFloat(value) : value
    if (numericValue != null && typeof numericValue === 'number' && !isNaN(numericValue) && isFinite(numericValue) && lead.status !== 'Lost') {
      return sum + numericValue
    }
    return sum
  }, 0)
  const totalLeads = leads.length
  
  const conversionRate = React.useMemo(() => {
    const entryStages = pipelineStages.filter(s => s.stage_type === 'entry')
    const entryLeadsCount = entryStages.reduce((sum, stage) => sum + stage.leads.length, 0)
    const wonStages = pipelineStages.filter(s => s.stage_type === 'won')
    const wonLeadsCount = wonStages.reduce((sum, stage) => sum + stage.leads.length, 0)
    if (entryLeadsCount > 0) return Math.round((wonLeadsCount / entryLeadsCount) * 100)
    if (totalLeads > 0 && wonLeadsCount > 0) return Math.round((wonLeadsCount / totalLeads) * 100)
    return 0
  }, [pipelineStages, totalLeads])

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset 
          className="overflow-x-hidden"
          onDragOver={(e) => {
            if (draggedLead) {
              e.preventDefault()
              try { e.dataTransfer.dropEffect = "move" } catch (err) { }
            }
          }}
        >
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-2 sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 sm:mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/${org}/dashboard`}>Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${org}/crm`} className="text-sm sm:text-base">CRM</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm sm:text-base">{t('pageTitle')} <span className="hidden sm:inline">(Kanban)</span></BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {toasts.length > 0 && (
          <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-[9999] flex flex-col gap-2 w-[calc(100vw-1rem)] sm:w-auto sm:max-w-sm">
            {toasts.map((toast) => {
              const styles = toast.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : toast.type === "error" ? "bg-red-50 border border-red-200 text-red-800" : "bg-yellow-50 border border-yellow-200 text-yellow-800"
              const closeColor = toast.type === "success" ? "text-green-600 hover:text-green-800" : toast.type === "error" ? "text-red-600 hover:text-red-800" : "text-yellow-600 hover:text-yellow-800"
              return (
                <div key={toast.id} className={`${styles} px-3 py-2 sm:px-4 sm:py-3 rounded-lg shadow-lg backdrop-blur-sm`}> 
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="mt-0.5">
                      {toast.type === "success" && <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />}
                      {toast.type === "warning" && <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />}
                      {toast.type === "error" && <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />}
                    </div>
                    <div className="flex-1 text-xs sm:text-sm leading-4 sm:leading-5">{toast.text}</div>
                    <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== toast.id))} className={`${closeColor} ml-1 sm:ml-2 flex-shrink-0`} aria-label={t('notifications.dismissNotification')}>
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-2 sm:gap-4 p-2 sm:p-4 pt-0 overflow-x-hidden" onDragOver={(e) => { if (draggedLead) { e.preventDefault(); try { e.dataTransfer.dropEffect = "move" } catch (err) {} } }}>
          <div className="flex flex-col gap-2 sm:gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 sm:flex-none min-w-0">
                <Search className="absolute left-2 sm:left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t('searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-7 sm:pl-10 w-full sm:w-64 text-sm sm:text-base" />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setIsFilterOpen(true)} variant="outline" size="sm" className="cursor-pointer text-xs sm:text-sm h-8 sm:h-9">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{t('filterButton')}</span>
                  {(searchTerm || Object.values(filters).some(f => f !== "") || valueRange.min || valueRange.max || dateRange.min || dateRange.max) && (
                    <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs">
                      {[searchTerm, ...Object.values(filters), valueRange.min, valueRange.max, dateRange.min, dateRange.max].filter(f => f && f !== "").length}
                    </span>
                  )}
                </Button>
                {(searchTerm || Object.values(filters).some(f => f !== "") || valueRange.min || valueRange.max || dateRange.min || dateRange.max) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="cursor-pointer text-muted-foreground hover:text-foreground h-8 w-8 sm:h-9 sm:w-auto p-0 sm:p-2">
                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-muted/50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('stats.totalLeads')}</p>
                  <p className="text-xl sm:text-2xl font-bold">{totalLeads}</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('stats.totalValue')}</p>
                  <p className="text-xl sm:text-2xl font-bold truncate">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('stats.conversionRate')}</p>
                  <p className="text-xl sm:text-2xl font-bold">{conversionRate}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-muted/50 rounded-xl p-2 sm:p-4 flex flex-col max-h-[600px] sm:max-h-[800px] overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-4 flex-shrink-0 gap-2">
              <h2 className="text-base sm:text-lg font-semibold">{t('salesPipeline')}</h2>
              {canManageStages && (
                <Button variant="outline" size="sm" onClick={() => setIsStageManagementOpen(true)} className="cursor-pointer text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3">
                  <Settings2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('stageManagement.manageStages')}</span>
                </Button>
              )}
            </div>
            
            {loadingStages && (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">{t('salesPipeline')}...</p>
                </div>
              </div>
            )}

            {!loadingStages && pipelineStages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <KanbanSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-base">Nenhuma etapa configurada</p>
                  <p className="text-sm text-muted-foreground mt-1">Clique em "Gerenciar Etapas" para criar o seu funil de vendas.</p>
                </div>
                {canManageStages && (
                  <Button variant="outline" size="sm" onClick={() => setIsStageManagementOpen(true)}>
                    <Settings2 className="h-4 w-4 mr-2" />
                    Gerenciar Etapas
                  </Button>
                )}
              </div>
            )}
            
            <div ref={pipelineScrollRef} className="pipeline-scroll-container flex gap-2 sm:gap-4 overflow-x-auto overflow-y-hidden pb-4 flex-1 min-h-0 w-full" onDragOver={handlePipelineDragOver} onDragEnd={handlePipelineDragEnd} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { handlePipelineDragEnd() } }}>
              {filteredStages.map((stage) => {
                const isUncategorized = stage.id === '__uncategorized__'
                
                return (
                <div key={stage.id} className={`rounded-lg border-2 p-2 sm:p-3 h-[500px] sm:h-[600px] flex flex-col transition-colors ${isUncategorized ? "border-amber-400 bg-amber-50/50 dark:bg-amber-900/10" : draggedOverStage === stage.id || touchOverStageRef.current === stage.id ? "border-primary bg-primary/5" : "border-border"}`} style={{ flex: pipelineStages.length <= 4 ? '1 1 0%' : '0 0 auto', minWidth: '240px', width: pipelineStages.length > 4 ? '280px' : 'auto' }} data-stage-id={stage.id} onDragOver={(e) => handleDragOver(e, stage.id)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, stage.id)} onTouchMove={(e) => handleStageTouchMoveForLeadDrop(e, stage.id)} onTouchEnd={(e) => handleStageTouchEndForLeadDrop(e, stage.id)} title={isUncategorized ? t('stageManagement.uncategorizedTooltip') : ''}>
                  <div className="flex-shrink-0 mb-2 sm:mb-3">
                    <div className="flex items-center justify-between gap-1 sm:gap-2">
                      <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                        {isUncategorized && <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 flex-shrink-0" />}
                        {renderStageBadge(stage, "inline-flex items-center rounded-md border px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium min-w-0")}
                        {isUncategorized && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-5 w-5 sm:h-6 sm:w-6 p-0 cursor-pointer hover:bg-amber-100 flex-shrink-0" title={t('stageManagement.moveAllLeads')}>
                              <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 sm:w-56">
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{t('stageManagement.moveAllLeadsTo')}</div>
                              {pipelineStages.filter(s => s.id !== '__uncategorized__').map(targetStage => (
                                <DropdownMenuItem key={targetStage.id} className="cursor-pointer" onClick={async () => {
                                  const leadsToMove = stage.leads
                                  if (leadsToMove.length === 0) return
                                  let newStatus: string
                                  if (targetStage.translation_key) {
                                    const statusMap: { [key: string]: string } = { 'new': 'New', 'contact': 'In Contact', 'qualified': 'Qualified', 'lost': 'Lost' }
                                    newStatus = statusMap[targetStage.slug] || targetStage.slug
                                  } else { newStatus = targetStage.slug }
                                  
                                  const totalLeads = leadsToMove.length
                                  const batchSize = 1000 
                                  const totalBatches = Math.ceil(totalLeads / batchSize)
                                  const parallelLimit = 30 
                                  
                                  setBulkMoveNotification({ show: true, progress: { current: 0, total: totalLeads, batch: 0, totalBatches } })
                                  try {
                                    let successCount = 0
                                    const failedUpdates: Array<{ lead: Lead, error: string }> = []
                                    for (let i = 0; i < totalBatches; i++) {
                                      const startIndex = i * batchSize
                                      const endIndex = Math.min(startIndex + batchSize, totalLeads)
                                      const batch = leadsToMove.slice(startIndex, endIndex)
                                      setBulkMoveNotification({ show: true, progress: { current: startIndex, total: totalLeads, batch: i + 1, totalBatches } })
                                      for (let j = 0; j < batch.length; j += parallelLimit) {
                                        const chunk = batch.slice(j, j + parallelLimit)
                                        const leadIndex = startIndex + j
                                        setBulkMoveNotification({ show: true, progress: { current: leadIndex, total: totalLeads, batch: i + 1, totalBatches } })
                                        const chunkPromises = chunk.map(async (lead) => {
                                          const updateData: any = { id: lead.id, status: newStatus }
                                          return updateLeadWithRetry(lead, updateData, 5)
                                        })
                                        const chunkResults = await Promise.all(chunkPromises)
                                        chunkResults.forEach(result => {
                                          if (result.success) successCount++
                                          else failedUpdates.push({ lead: result.lead, error: result.error || t('notifications.unknownError') })
                                        })
                                        if (j + parallelLimit < batch.length) await new Promise(resolve => setTimeout(resolve, 20))
                                      }
                                    }
                                    if (failedUpdates.length > 0) {
                                      pushToast(`Retrying ${failedUpdates.length} failed updates...`, "warning", 2000)
                                      for (let k = 0; k < failedUpdates.length; k += parallelLimit) {
                                        const retryChunk = failedUpdates.slice(k, k + parallelLimit)
                                        const retryPromises = retryChunk.map(({ lead }) => {
                                          const updateData: any = { id: lead.id, status: newStatus }
                                          return updateLeadWithRetry(lead, updateData, 5)
                                        })
                                        const retryResults = await Promise.all(retryPromises)
                                        retryResults.forEach(result => {
                                          if (result.success) { successCount++; const index = failedUpdates.findIndex(f => f.lead.id === result.lead.id); if (index !== -1) failedUpdates.splice(index, 1) }
                                        })
                                      }
                                    }
                                    setLeads(prev => {
                                      const updatedLeads = prev.map(lead => {
                                        const movedLead = leadsToMove.find(l => l.id === lead.id)
                                        if (movedLead) return { ...lead, status: newStatus }
                                        return lead
                                      })
                                      updatePipelineStages(updatedLeads)
                                      return updatedLeads
                                    })
                                    if (failedUpdates.length > 0) pushToast(t('stageManagement.migration.partialSuccess', { success: successCount, errors: failedUpdates.length }), 'warning')
                                    else { const translatedStageName = targetStage.translation_key ? t(`stage.${targetStage.translation_key.replace('pipeline.stage.', '')}`) : targetStage.name; pushToast(t('stageManagement.leadsMoved', { count: successCount, stageName: translatedStageName }), 'success') }
                                  } catch (error) { pushToast(t('stageManagement.errorMigrating'), 'error') } finally { setBulkMoveNotification({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 } }) }
                                }}>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1">{targetStage.translation_key ? t(`stage.${targetStage.translation_key.replace('pipeline.stage.', '')}`) : targetStage.name}</div>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground font-medium bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md whitespace-nowrap">{stage.leads.length}</div>
                    </div>
                    {isUncategorized && <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 mt-1 sm:mt-2 leading-tight">{t('stageManagement.uncategorizedTooltip')}</p>}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2 pr-1 sm:pr-2">
                    {stage.filteredLeads.map((lead) => (
                      <LeadCard
                        key={lead.id} lead={lead} onDragStart={handleDragStart} onContact={handleContactLead} onPreview={handlePreviewLead} onEdit={handleEdit} onLinkLead={canManageStages ? handleOpenLinkLead : undefined} userRole={userRole} locale={locale} hasConversation={leadsWithConversations.has(lead.id)}
                      />
                    ))}
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>


        <Sheet open={preview.open} onOpenChange={(open) => setPreview({ open, lead: open ? preview.lead : null })}>
          <SheetContent className="w-full sm:max-w-3xl border-l border-border p-0 overflow-y-auto overflow-x-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
            {preview.lead && (
              <>
                <SheetTitle className="sr-only">Lead Details: {preview.lead.name}</SheetTitle>
                <SheetDescription className="sr-only">Complete information about the lead including contact details, business information, and metadata.</SheetDescription>
                <div className="sticky top-0 z-10 bg-background border-b p-3 sm:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold break-words">{preview.lead.name}</h2>
                      </div>
                      <p className="text-muted-foreground text-xs sm:text-sm">{t('preview.headerDescription')}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0 cursor-pointer" onClick={() => setPreview({ open: false, lead: null })}>
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                  
                  <div className="mt-3 sm:mt-4 flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-muted px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium capitalize">{preview.lead.status}</span>
                    </div>
                    {preview.lead.value && (
                      <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-muted px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                        <span className="text-xs sm:text-sm font-medium truncate">{formatCurrency(preview.lead.value)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="bg-muted/50 rounded-xl p-3 sm:p-5 border">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      {t('preview.contactInfo.title')}
                    </h3>
                    <div className="grid gap-2 sm:gap-3">
                      {preview.lead.email && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-2 sm:p-3 border overflow-hidden gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('preview.contactInfo.email')}</p>
                              <p className="text-xs sm:text-sm font-medium truncate">{preview.lead.email}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 shrink-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(preview.lead?.email || ''); setCopiedKey('email'); setTimeout(() => setCopiedKey(null), 2000) }}>
                            {copiedKey === 'email' ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                          </Button>
                        </div>
                      )}
                      
                      {preview.lead.phone && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-2 sm:p-3 border overflow-hidden gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('preview.contactInfo.phone')}</p>
                              <p className="text-xs sm:text-sm font-medium truncate">{preview.lead.phone}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 shrink-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(preview.lead?.phone || ''); setCopiedKey('phone'); setTimeout(() => setCopiedKey(null), 2000) }}>
                            {copiedKey === 'phone' ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {(preview.lead.ssn || preview.lead.ein || preview.lead.source) && (
                    <div className="bg-muted/50 rounded-xl p-5 border">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 flex-shrink-0" />
                        {t('preview.businessInfo.title')}
                      </h3>
                      <div className="grid gap-3">
                        {preview.lead.ssn && (
                          <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">{t('preview.businessInfo.ssn')}</p>
                                <p className="text-sm font-medium font-mono break-all">{preview.lead.ssn}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(preview.lead?.ssn || ''); setCopiedKey('ssn'); setTimeout(() => setCopiedKey(null), 2000) }}>
                              {copiedKey === 'ssn' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        )}
                        
                        {preview.lead.ein && (
                          <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileDigit className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">{t('preview.businessInfo.ein')}</p>
                                <p className="text-sm font-medium font-mono break-all">{preview.lead.ein}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(preview.lead?.ein || ''); setCopiedKey('ein'); setTimeout(() => setCopiedKey(null), 2000) }}>
                              {copiedKey === 'ein' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        )}
                        
                        {preview.lead.source && (
                          <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">{t('preview.businessInfo.source')}</p>
                                <p className="text-sm font-medium break-words">{preview.lead.source}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(preview.lead?.source || ''); setCopiedKey('source'); setTimeout(() => setCopiedKey(null), 2000) }}>
                              {copiedKey === 'source' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {preview.lead.estimated_close_date && (
                    <div className="bg-muted/50 rounded-xl p-5 border">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 flex-shrink-0" />
                        {t('preview.dealTimeline.title')}
                      </h3>
                      <div className="grid gap-3">
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">{t('preview.dealTimeline.estimatedClose')}</p>
                              <p className="text-sm font-medium">{formatDate(preview.lead.estimated_close_date)}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(formatDate(preview.lead?.estimated_close_date || '')); setCopiedKey('close_date'); setTimeout(() => setCopiedKey(null), 2000) }}>
                            {copiedKey === 'close_date' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {(preview.lead.location || preview.lead.interest) && (
                    <div className="bg-muted/50 rounded-xl p-5 border">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5 flex-shrink-0" />
                        {t('preview.additionalInfo.title')}
                      </h3>
                      <div className="grid gap-3">
                        {preview.lead.location && (
                          <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">{t('preview.additionalInfo.location')}</p>
                                <p className="text-sm font-medium break-words">{preview.lead.location}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(preview.lead?.location || ''); setCopiedKey('location'); setTimeout(() => setCopiedKey(null), 2000) }}>
                              {copiedKey === 'location' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        )}
                        
                        {preview.lead.interest && (
                          <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">{t('preview.additionalInfo.interest')}</p>
                                <p className="text-sm font-medium break-words">{preview.lead.interest}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(preview.lead?.interest || ''); setCopiedKey('interest'); setTimeout(() => setCopiedKey(null), 2000) }}>
                              {copiedKey === 'interest' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {preview.lead.description && (
                    <div className="bg-muted/50 rounded-xl p-5 border">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Info className="h-5 w-5 flex-shrink-0" />
                          {t('preview.description.title')}
                        </h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(preview.lead?.description || ''); setCopiedKey('description'); setTimeout(() => setCopiedKey(null), 2000) }}>
                          {copiedKey === 'description' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="bg-background rounded-lg p-4 border overflow-hidden">
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{preview.lead.description}</p>
                      </div>
                    </div>
                  )}

                  {safeGetAttachments(preview.lead.attachments).length > 0 && (
                    <div className="bg-muted/50 rounded-xl p-5 border">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <File className="h-5 w-5 flex-shrink-0" />
                        {t('preview.attachments.title')}
                      </h3>
                      <div className="space-y-2">
                        {safeGetAttachments(preview.lead.attachments).map((attachment: any) => {
                          if (!attachment || (!attachment.id && !attachment.fileId)) return null
                          
                          // Lida tanto com mimeType quanto mimetype
                          const currentMimeType = attachment.mimeType || attachment.mimetype || 'application/octet-stream';
                          const FileIcon = getFileIcon(currentMimeType)
                          const fileName = attachment.originalName || attachment.filename || attachment.name || t('preview.attachments.unknownFile');
                          
                          return (
                            <div key={attachment.id || attachment.fileId} className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-accent/50 transition-colors overflow-hidden">
                              <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {fileName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(attachment.size || 0)} • {attachment.uploadedAt ? formatDate(attachment.uploadedAt) : t('preview.attachments.unknownDate')}
                                </p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button size="sm" variant="ghost" className="cursor-pointer h-8 w-8 p-0" onClick={() => viewAttachment(preview.lead!.id, attachment.id)} title={t('preview.attachments.viewFile')}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="cursor-pointer h-8 w-8 p-0" onClick={() => downloadAttachment(preview.lead!.id, attachment.id, fileName)} title={t('preview.attachments.downloadFile')}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {(userRole === 'admin' || userRole === 'master') && (
                    <div className="bg-muted/50 rounded-xl p-3 sm:p-5 border">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                        <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        {t('preview.assignment')}
                      </h3>
                      <div className="grid gap-2 sm:gap-3">
                        <div className="flex items-center justify-between bg-background rounded-lg p-2 sm:p-3 border overflow-hidden gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('preview.assignedTo')}</p>
                              <p className="text-xs sm:text-sm font-medium">
                                {preview.lead.assigned_user_id ? (assignedUserName || t('preview.loading')) : t('preview.notAssigned')}
                              </p>
                            </div>
                          </div>
                          {preview.lead.assigned_user_id && assignedUserName && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 shrink-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(assignedUserName); setCopiedKey('assigned_user'); setTimeout(() => setCopiedKey(null), 2000) }}>
                              {copiedKey === 'assigned_user' ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                            </Button>
                          )}
                        </div>
                        
                        {preview.lead.assigned_user_id && (
                          <div className="flex items-center justify-between bg-background rounded-lg p-2 sm:p-3 border overflow-hidden gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] sm:text-xs text-muted-foreground">{t('preview.assignedSince')}</p>
                                <p className="text-xs sm:text-sm font-medium">{new Date(preview.lead.updated_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 shrink-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(new Date(preview.lead?.updated_at || '').toLocaleString()); setCopiedKey('assigned_date'); setTimeout(() => setCopiedKey(null), 2000) }}>
                              {copiedKey === 'assigned_date' ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(userRole === 'admin' || userRole === 'master') && (
                    <div className="bg-muted/50 rounded-xl p-3 sm:p-5 border">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        {t('preview.metadata')}
                      </h3>
                      <div className="grid gap-2 sm:gap-3">
                        <div className="flex items-center justify-between bg-background rounded-lg p-2 sm:p-3 border overflow-hidden gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('preview.created')}</p>
                              <p className="text-xs sm:text-sm font-medium">{new Date(preview.lead.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 shrink-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(new Date(preview.lead?.created_at || '').toLocaleString()); setCopiedKey('created_at'); setTimeout(() => setCopiedKey(null), 2000) }}>
                            {copiedKey === 'created_at' ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                          </Button>
                        </div>
                        
                        {preview.lead.created_by && (
                          <div className="flex items-center justify-between bg-background rounded-lg p-2 sm:p-3 border overflow-hidden gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] sm:text-xs text-muted-foreground">{t('preview.createdBy')}</p>
                                <p className="text-xs sm:text-sm font-medium">{createdByUserName || t('preview.loading')}</p>
                              </div>
                            </div>
                            {createdByUserName && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 shrink-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(createdByUserName); setCopiedKey('created_by'); setTimeout(() => setCopiedKey(null), 2000) }}>
                                {copiedKey === 'created_by' ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                              </Button>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between bg-background rounded-lg p-2 sm:p-3 border overflow-hidden gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('preview.lastUpdated')}</p>
                              <p className="text-xs sm:text-sm font-medium">{new Date(preview.lead.updated_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 shrink-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(new Date(preview.lead?.updated_at || '').toLocaleString()); setCopiedKey('updated_at'); setTimeout(() => setCopiedKey(null), 2000) }}>
                            {copiedKey === 'updated_at' ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between bg-background rounded-lg p-2 sm:p-3 border overflow-hidden gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{t('preview.leadId')}</p>
                              <p className="text-xs sm:text-sm font-medium font-mono truncate">{preview.lead.id}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 shrink-0 cursor-pointer" onClick={() => { navigator.clipboard.writeText(preview.lead?.id || ''); setCopiedKey('id'); setTimeout(() => setCopiedKey(null), 2000) }}>
                            {copiedKey === 'id' ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={() => { setPreview({ open: false, lead: null }); if (preview.lead) handleViewLead(preview.lead) }} className="flex-1 cursor-pointer">
                      <Eye className="h-4 w-4 mr-2 flex-shrink-0" />
                      {t('preview.actions.viewCompleteList')}
                    </Button>
                    <Button variant="outline" onClick={() => setPreview({ open: false, lead: null })} className="cursor-pointer">
                      {t('preview.actions.close')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        <Sheet open={isEditModalOpen} onOpenChange={(open) => {
          if (!open) {
            if (unsavedChangesToast.show) confirmDiscardChanges()
            else handleModalClose()
          } else setIsEditModalOpen(open)
        }}>
          <SheetContent 
            className="w-full sm:max-w-md border-l border-border p-3 sm:p-6 flex flex-col max-h-screen"
            onDragOver={handleAttachmentDragOver}
            onDragLeave={handleAttachmentDragLeave}
            onDrop={(e) => editingId && handleAttachmentDrop(e, editingId)}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="flex-shrink-0">
              <SheetHeader>
                <SheetTitle className="text-base sm:text-lg">{t('editModal.title')}</SheetTitle>
                <SheetDescription className="text-xs sm:text-sm">
                  {t('editModal.description')}
                </SheetDescription>
              </SheetHeader>
              <Separator className="my-3 sm:my-4" />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 sm:pr-2">
            <form onSubmit={handleEditSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t('editModal.dealValue')} ({locale === 'pt-BR' ? 'R$' : '$'})
                  </label>
                  <Input type="number" placeholder={t('editModal.dealValuePlaceholder')} value={editValue} onChange={(e) => setEditValue(e.target.value)} step="0.01" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('editModal.expectedCloseDate')}</label>
                  <Input type="date" value={editExpectedCloseDate} onChange={(e) => setEditExpectedCloseDate(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t('editModal.notes')}
                    <span className="text-xs text-muted-foreground ml-2">({editNotes.length}/500)</span>
                  </label>
                  <textarea className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none min-h-[80px] max-h-[200px] overflow-y-auto" placeholder={t('editModal.notesPlaceholder')} value={editNotes} onChange={(e) => { if (e.target.value.length <= 500) setEditNotes(e.target.value) }} maxLength={500} rows={4} />
                  {editNotes.length >= 450 && <p className="text-xs text-amber-600 mt-1">{500 - editNotes.length} {t('editModal.charactersRemaining')}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('editModal.interest')}</label>
                  <Input type="text" placeholder={t('editModal.interestPlaceholder')} value={editInterest} onChange={(e) => setEditInterest(e.target.value)} maxLength={100} />
                </div>
              </div>

              {editingId && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-muted-foreground">{t('editModal.attachments')}</h3>
                      {(() => {
                        const lead = leads.find(l => l.id === editingId)
                        const attachments = safeGetAttachments(lead?.attachments);
                        const pending = pendingAttachments[editingId]
                        const pendingToAdd = pending?.toAdd || []
                        const pendingToRemove = pending?.toRemove || []
                        const visibleAttachments = attachments.filter((att: any) => !pendingToRemove.includes(att.id))
                        const hasAnyAttachments = visibleAttachments.length > 0 || pendingToAdd.length > 0
                        
                        if (hasAnyAttachments) {
                          return (
                            <Button type="button" variant="outline" size="sm" className="cursor-pointer" onClick={() => attachmentFileInputRef.current?.click()}>
                              <Upload className="h-4 w-4 mr-2" />
                              {t('editModal.addFiles')}
                            </Button>
                          )
                        }
                        return null
                      })()}
                    </div>
                    
                    <input ref={attachmentFileInputRef} type="file" multiple className="hidden" onChange={(e) => handleAttachmentFileSelect(e, editingId)} />
                    
                    {(() => {
                      const lead = leads.find(l => l.id === editingId)
                      const attachments = safeGetAttachments(lead?.attachments);
                      const pending = pendingAttachments[editingId]
                      const pendingToAdd = pending?.toAdd || []
                      const pendingToRemove = pending?.toRemove || []
                      const visibleAttachments = attachments.filter((att: any) => !pendingToRemove.includes(att.id))
                      const hasAnyAttachments = visibleAttachments.length > 0 || pendingToAdd.length > 0
                      
                      if (!hasAnyAttachments) {
                        return (
                          <div className={`relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${isAttachmentDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}`} onDragOver={handleAttachmentDragOver} onDragLeave={handleAttachmentDragLeave} onDrop={(e) => handleAttachmentDrop(e, editingId)} onClick={() => attachmentFileInputRef.current?.click()}>
                            <div className="flex flex-col items-center justify-center gap-2">
                              {uploadingAttachments[editingId] ? (
                                <>
                                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                  <p className="text-sm text-muted-foreground">{t('editModal.uploading')}</p>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-8 w-8 text-muted-foreground" />
                                  <div className="text-center">
                                    <p className="text-sm font-medium">{t('editModal.dragDropFiles')}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t('editModal.orClickBrowse')}</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}

                    {(() => {
                      const lead = leads.find(l => l.id === editingId)
                      const attachments = safeGetAttachments(lead?.attachments);
                      const pending = pendingAttachments[editingId]
                      const pendingToAdd = pending?.toAdd || []
                      const pendingToRemove = pending?.toRemove || []
                      const visibleAttachments = attachments.filter((att: any) => !pendingToRemove.includes(att.id))
                      
                      if (visibleAttachments.length === 0 && pendingToAdd.length === 0) return null
                      
                      return (
                        <div className="space-y-2">
                          {visibleAttachments.map((attachment: any) => {
                            if (!attachment || (!attachment.id && !attachment.fileId)) return null
                            
                            const currentMimeType = attachment.mimeType || attachment.mimetype || 'application/octet-stream';
                            const FileIcon = getFileIcon(currentMimeType)
                            const fileName = attachment.originalName || attachment.filename || attachment.name || t('editModal.unknownFile');
                            
                            return (
                              <div key={attachment.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{fileName}</p>
                                  <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size || 0)}</p>
                                </div>
                                <Button type="button" size="sm" variant="ghost" className="cursor-pointer text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeAttachmentFromPending(editingId, attachment.id) }}>
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          })}
                          
                          {pendingToAdd.map((file, index) => (
                            <div key={`pending-${index}`} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                              <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                              </div>
                              <Button type="button" size="sm" variant="ghost" className="cursor-pointer text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setPendingAttachments(prev => ({ ...prev, [editingId]: { toAdd: prev[editingId]?.toAdd.filter((_, i) => i !== index) || [], toRemove: prev[editingId]?.toRemove || [] } })) }}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </>
              )}

              <Separator />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 cursor-pointer">{t('editModal.save')}</Button>
                <Button type="button" variant="outline" onClick={() => { setUnsavedChangesToast({ show: false, message: '' }); setIsEditModalOpen(false); setEditingId(null); setEditValue(""); setEditExpectedCloseDate(""); setEditNotes(""); if (editingId) { setPendingAttachments(prev => { const newPending = { ...prev }; delete newPending[editingId]; return newPending }) }; setHasUnsavedChanges(false); setOriginalFormValues(null) }} className="cursor-pointer">
                  <X className="h-4 w-4 mr-1" />
                  {t('editModal.cancel')}
                </Button>
              </div>
            </form>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-0 flex flex-col overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="p-3 sm:p-6 border-b">
              <SheetHeader>
                <SheetTitle className="text-base sm:text-lg">{t('filterModal.title')}</SheetTitle>
                <SheetDescription className="text-xs sm:text-sm">{t('filterModal.description')}</SheetDescription>
              </SheetHeader>
            </div>
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.name')}</label>
                <Input placeholder={t('filterModal.namePlaceholder')} value={filters.name} onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.email')}</label>
                <Input placeholder={t('filterModal.emailPlaceholder')} value={filters.email} onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.phone')}</label>
                <Input placeholder={t('filterModal.phonePlaceholder')} value={filters.phone} onChange={(e) => setFilters(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.ssn')}</label>
                <Input placeholder={t('filterModal.ssnPlaceholder')} value={filters.ssn} onChange={(e) => setFilters(prev => ({ ...prev, ssn: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.ein')}</label>
                <Input placeholder={t('filterModal.einPlaceholder')} value={filters.ein} onChange={(e) => setFilters(prev => ({ ...prev, ein: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.source')}</label>
                <Input placeholder={t('filterModal.sourcePlaceholder')} value={filters.source} onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.location')}</label>
                <Input placeholder={t('filterModal.locationPlaceholder')} value={filters.location} onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.interest')}</label>
                <Input placeholder={t('filterModal.interestPlaceholder')} value={filters.interest} onChange={(e) => setFilters(prev => ({ ...prev, interest: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.status')}</label>
                <select className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]" value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}>
                  <option value="">{t('filterModal.allStatuses')}</option>
                  <option value="New">{t('filterModal.statusNew')}</option>
                  <option value="In Contact">{t('filterModal.statusInContact')}</option>
                  <option value="Qualified">{t('filterModal.statusQualified')}</option>
                  <option value="Lost">{t('filterModal.statusLost')}</option>
                </select>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.valueRange')}</label>
                <div className="flex gap-2">
                  <Input type="number" placeholder={t('filterModal.minValue')} value={valueRange.min} onChange={(e) => setValueRange(prev => ({ ...prev, min: e.target.value }))} className="flex-1" />
                  <Input type="number" placeholder={t('filterModal.maxValue')} value={valueRange.max} onChange={(e) => setValueRange(prev => ({ ...prev, max: e.target.value }))} className="flex-1" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.closeDateRange')}</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input type="date" placeholder={t('filterModal.fromDate')} value={dateRange.min} onChange={(e) => { const value = e.target.value; if (validateDate(value)) { setDateRange(prev => ({ ...prev, min: value })); } }} className={!validateDate(dateRange.min) ? "border-red-500" : ""} />
                    {!validateDate(dateRange.min) && dateRange.min && <p className="text-xs text-red-500 mt-1">{t('filterModal.yearValidation')}</p>}
                  </div>
                  <div className="flex-1">
                    <Input type="date" placeholder={t('filterModal.toDate')} value={dateRange.max} onChange={(e) => { const value = e.target.value; if (validateDate(value)) { setDateRange(prev => ({ ...prev, max: value })); } }} className={!validateDate(dateRange.max) ? "border-red-500" : ""} />
                    {!validateDate(dateRange.max) && dateRange.max && <p className="text-xs text-red-500 mt-1">{t('filterModal.yearValidation')}</p>}
                  </div>
                </div>
              </div>
            </div>
            </div>
            
            <div className="flex-shrink-0 border-t p-6 md:p-8">
              <div className="flex gap-2">
                <Button onClick={() => { applyModalFilters(); setIsFilterOpen(false) }} className="flex-1 cursor-pointer">{t('filterModal.applyFilter')}</Button>
                <Button onClick={() => { clearFilters(); setIsFilterOpen(false) }} variant="outline" className="flex-1 cursor-pointer">
                  <X className="h-4 w-4 mr-1" />
                  {t('filterModal.clearAll')}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {unsavedChangesToast.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="bg-yellow-50 dark:bg-yellow-900/90 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-lg px-4 py-3 max-w-sm mx-4 pointer-events-auto">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">{unsavedChangesToast.message}</span>
              </div>
            </div>
          </div>
        )}

        <Sheet open={showTelegramWarning} onOpenChange={(open) => { setShowTelegramWarning(open); if (!open) setTelegramWarningMessage("") }}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Telegram Configuration Required
              </SheetTitle>
              <SheetDescription>Telegram needs to be configured before you can contact leads</SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 leading-relaxed">{telegramWarningMessage}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Understanding Telegram APIs:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><strong>Bot API:</strong> Can only respond to messages initiated by users. Cannot start conversations.</li>
                      <li><strong>MTProto API (Account):</strong> Full featured. Can initiate conversations and contact leads directly.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Button onClick={() => { window.location.href = `/${org}/settings/telegram` }} className="flex-1 cursor-pointer">
                <Settings2 className="h-4 w-4 mr-2" /> Go to Settings
              </Button>
              <Button variant="outline" onClick={() => { setShowTelegramWarning(false); setTelegramWarningMessage("") }} className="cursor-pointer">
                Close
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={contactModal.open} onOpenChange={(open) => setContactModal({ open, lead: contactModal.lead })}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetHeader>
              <SheetTitle>{t('contactModal.title')}</SheetTitle>
              <SheetDescription>{t('contactModal.description')} {contactModal.lead?.name}</SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <div className="space-y-3">
              <Button onClick={() => handleContactMethodSelect('whatsapp')} variant="outline" className="w-full justify-start gap-3 h-auto py-4 cursor-pointer hover:bg-green-50 hover:border-green-200" disabled={!contactModal.lead?.phone}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100"><Phone className="h-5 w-5 text-green-600" /></div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{t('contactModal.whatsapp')}</div>
                  <div className="text-xs text-muted-foreground">{contactModal.lead?.phone || t('contactModal.noPhone')}</div>
                </div>
              </Button>
              <Button onClick={() => handleContactMethodSelect('telegram')} variant="outline" className="w-full justify-start gap-3 h-auto py-4 cursor-pointer hover:bg-blue-50 hover:border-blue-200" disabled={!contactModal.lead?.phone}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${telegramAccounts.some(acc => acc.is_active) ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                  {telegramAccounts.some(acc => acc.is_active) ? <Send className="h-5 w-5 text-blue-600" /> : <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold flex items-center gap-2">
                    {t('contactModal.telegram')}
                    {!telegramAccounts.some(acc => acc.is_active) && <span className="text-xs font-normal text-yellow-600">{t('contactModal.setupRequired')}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{contactModal.lead?.phone || t('contactModal.noPhone')}</div>
                </div>
              </Button>
              <Button onClick={() => handleContactMethodSelect('email')} variant="outline" className="w-full justify-start gap-3 h-auto py-4 cursor-pointer hover:bg-purple-50 hover:border-purple-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100"><Mail className="h-5 w-5 text-purple-600" /></div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{t('contactModal.email')}</div>
                  <div className="text-xs text-muted-foreground">{contactModal.lead?.email}</div>
                </div>
              </Button>
            </div>
            <Separator className="my-4" />
            <Button variant="outline" onClick={() => setContactModal({ open: false, lead: null })} className="w-full cursor-pointer">{t('contactModal.cancel')}</Button>
          </SheetContent>
        </Sheet>

        <Sheet open={sendMessageModal.open} onOpenChange={(open) => {
          if (!open) {
            setSendMessageModal({ open: false, lead: null, method: null })
            setMessageText("")
            setShowNoLinkedConversationWarning(false)
            setLinkedTelegramUsername(null)
            setLinkedTelegramConversation(null)
            setIsUsingBotApi(false)
          }
        }}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8 flex flex-col max-h-screen" onOpenAutoFocus={(e) => e.preventDefault()}>
            {sendMessageModal.lead ? (
              <>
            <div className="flex-shrink-0">
              <SheetHeader>
                <SheetTitle>{t('sendMessageModal.title')}</SheetTitle>
                <SheetDescription>
                  {t('sendMessageModal.description')} {sendMessageModal.lead.name} {t('sendMessageModal.via')} {sendMessageModal.method}
                </SheetDescription>
              </SheetHeader>
              <Separator className="my-4" />
              {showNoLinkedConversationWarning && sendMessageModal.method === 'telegram' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex gap-2">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Nenhuma conversa vinculada detectada</p>
                      <p className="text-xs">Não foram detectadas conversas vinculadas ao lead {sendMessageModal.lead?.name}. Portanto, será usada a conta do Telegram para enviar mensagem ao cliente.</p>
                      <p className="text-xs mt-2 font-medium">⚠️ Nota: Se o número de telefone for fictício ou não estiver registrado no Telegram, a mensagem não será enviada.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${sendMessageModal.method === 'whatsapp' ? 'bg-green-100' : sendMessageModal.method === 'telegram' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    {sendMessageModal.method === 'whatsapp' && <Phone className="h-5 w-5 text-green-600" />}
                    {sendMessageModal.method === 'telegram' && <Send className="h-5 w-5 text-blue-600" />}
                    {sendMessageModal.method === 'email' && <Mail className="h-5 w-5 text-purple-600" />}
                  </div>
                  <div>
                    <div className="font-semibold">{sendMessageModal.lead.name}</div>
                    <div className="text-sm text-muted-foreground">{sendMessageModal.method === 'email' ? sendMessageModal.lead.email : extractPhoneNumber(sendMessageModal.lead)}</div>
                    {sendMessageModal.method === 'telegram' && linkedTelegramUsername && <div className="text-xs text-muted-foreground mt-1">@{linkedTelegramUsername}</div>}
                  </div>
                </div>
              </div>

              {sendMessageModal.method === 'telegram' && !isUsingBotApi && telegramAccounts.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('sendMessageModal.accountLabel')}</label>
                  <select className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]" value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}>
                    {telegramAccounts.filter((acc) => acc.is_active).map((account) => ( <option key={account.id} value={account.id}>{account.phone_number}</option> ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('sendMessageModal.title')}</label>
                <textarea className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none min-h-[120px]" placeholder={t('sendMessageModal.messagePlaceholder')} value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={6} />
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button onClick={handleSendMessageOnly} variant="outline" className="flex-1 cursor-pointer" disabled={!messageText.trim() || isSendingMessage}>
                  {isSendingMessage ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  {t('sendMessageModal.sendOnly')}
                </Button>
                <Button onClick={handleSendMessageAndOpenChat} className="flex-1 cursor-pointer" disabled={!messageText.trim() || isSendingMessage}>
                  {isSendingMessage ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  {t('sendMessageModal.sendAndOpenChat')}
                </Button>
              </div>
              <Button variant="ghost" onClick={handleOpenChatWithoutSending} className="w-full cursor-pointer" disabled={isSendingMessage} title={t('sendMessageModal.openChatWithoutSendingTitle')}>
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('sendMessageModal.openChatWithoutSending')}
              </Button>
            </div>
            </>
            ) : (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">{t('sendMessageModal.noLeadSelected')}</p>
              </div>
            )}
          </SheetContent>
        </Sheet>

        <Sheet open={isStageManagementOpen} onOpenChange={setIsStageManagementOpen}>
          <SheetContent className="w-full sm:max-w-2xl border-l border-border p-6 overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetHeader>
              <SheetTitle>{t('stageManagement.title')}</SheetTitle>
              <SheetDescription>{t('stageManagement.description')}</SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <div className="space-y-4">
              <Button onClick={() => openStageForm()} className="w-full cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                {t('stageManagement.addStage')}
              </Button>
              <div className="space-y-2">
                {pipelineStages.filter(stage => stage.id !== '__uncategorized__').map((stage) => (
                  <div
                    key={stage.id}
                    ref={(el) => { if (el) { stageDragElementsRef.current.set(stage.id, el); addStageTouchListener(el, stage) } else { stageDragElementsRef.current.delete(stage.id) } }}
                    data-stage-management-id={stage.id}
                    draggable={!isStageDragging}
                    onDragStart={(e) => handleStageDragStart(e, stage)}
                    onDragOver={(e) => handleStageDragOver(e, stage.id)}
                    onDragLeave={handleStageDragLeave}
                    onDrop={(e) => handleStageDrop(e, stage)}
                    className={`border rounded-lg p-4 cursor-move transition-all select-none ${draggedOverStageId === stage.id ? 'border-primary bg-primary/5 scale-105' : 'border-border hover:border-primary/50'} ${isStageDragging && draggedStage?.id === stage.id ? 'opacity-50' : ''}`}
                    style={{ touchAction: 'pan-y', WebkitUserSelect: 'none', userSelect: 'none' }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex flex-col gap-1"><Hash className="h-5 w-5 text-muted-foreground" /></div>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          {renderStageBadge(stage)}
                          <div className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md flex-shrink-0">{stage.leads.length}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => openStageForm(stage)} onMouseDown={(e) => e.stopPropagation()} className="cursor-pointer"><Edit className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteStage(stage)} onMouseDown={(e) => e.stopPropagation()} className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <StageFormModal isOpen={isStageFormOpen} onClose={closeStageForm} editingStage={editingStage} onSave={handleSaveStage} isSaving={isSavingStage} t={t} />

        <Sheet open={!!isDeletingStage} onOpenChange={(open) => !open && setIsDeletingStage(null)}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600" />{t('stageManagement.confirmDelete')}</SheetTitle>
              <SheetDescription className="sr-only">Confirme a deleção desta coluna</SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            {isDeletingStage && (
              <div className="space-y-4">
                <p className="text-sm">{t('stageManagement.confirmDeleteMessage', { name: isDeletingStage.name })}</p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{t('stageManagement.confirmDeleteWarning')}</p>
                </div>
              </div>
            )}
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDeletingStage(null)} className="flex-1 cursor-pointer" disabled={isSavingStage}>{t('stageManagement.cancel')}</Button>
              <Button variant="destructive" onClick={confirmDeleteStage} className="flex-1 cursor-pointer" disabled={isSavingStage}>
                {isSavingStage ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('stageManagement.deleting')}</> : <><Trash2 className="h-4 w-4 mr-2" />{t('stageManagement.delete')}</>}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={migrationModal.open} onOpenChange={(open) => !open && setMigrationModal({ open: false, stage: null, targetStageId: null, action: null })}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-600" />{t('stageManagement.migration.title')}</SheetTitle>
              <SheetDescription>{t('stageManagement.migration.description')}</SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            {migrationModal.stage && (
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">{t('stageManagement.migration.warning', { count: migrationModal.stage.leads.length, stageName: migrationModal.stage.name })}</p>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium">{t('stageManagement.migration.selectAction')}</label>
                  <div onClick={() => setMigrationModal(prev => ({ ...prev, action: 'move' }))} className={`border rounded-lg p-4 cursor-pointer transition-all ${migrationModal.action === 'move' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${migrationModal.action === 'move' ? 'border-primary' : 'border-muted-foreground'}`}>
                        {migrationModal.action === 'move' && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{t('stageManagement.migration.moveLeads')}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('stageManagement.migration.moveLeadsDescription')}</p>
                      </div>
                    </div>
                  </div>
                  {migrationModal.action === 'move' && (
                    <div className="ml-7 space-y-2">
                      <label className="text-sm font-medium">{t('stageManagement.migration.targetStage')}</label>
                      <select className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-10 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]" value={migrationModal.targetStageId || ''} onChange={(e) => setMigrationModal(prev => ({ ...prev, targetStageId: e.target.value }))}>
                        <option value="">{t('stageManagement.migration.selectTargetStagePlaceholder')}</option>
                        {pipelineStages.filter(s => s.id !== migrationModal.stage?.id && s.id !== '__uncategorized__').map(stage => (
                          <option key={stage.id} value={stage.id}>{stage.translation_key ? t(`stage.${stage.translation_key.replace('pipeline.stage.', '')}`) : stage.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div onClick={() => setMigrationModal(prev => ({ ...prev, action: 'uncategorize', targetStageId: null }))} className={`border rounded-lg p-4 cursor-pointer transition-all ${migrationModal.action === 'uncategorize' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${migrationModal.action === 'uncategorize' ? 'border-primary' : 'border-muted-foreground'}`}>
                        {migrationModal.action === 'uncategorize' && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{t('stageManagement.migration.moveToUncategorized')}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('stageManagement.migration.moveToUncategorizedDescription')}</p>
                      </div>
                    </div>
                  </div>
                  <div onClick={() => setMigrationModal(prev => ({ ...prev, action: 'remove', targetStageId: null }))} className={`border rounded-lg p-4 cursor-pointer transition-all ${migrationModal.action === 'remove' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${migrationModal.action === 'remove' ? 'border-primary' : 'border-muted-foreground'}`}>
                        {migrationModal.action === 'remove' && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{t('stageManagement.migration.removeStageOnly')}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('stageManagement.migration.removeStageOnlyDescription')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMigrationModal({ open: false, stage: null, targetStageId: null, action: null })} className="flex-1 cursor-pointer" disabled={isSavingStage}>{t('stageManagement.cancel')}</Button>
              <Button onClick={confirmLeadMigration} className="flex-1 cursor-pointer" disabled={isSavingStage || !migrationModal.action}>
                {isSavingStage ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('stageManagement.processing')}</> : <><Check className="h-4 w-4 mr-2" />{t('stageManagement.confirm')}</>}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={linkLeadModal.open} onOpenChange={(open) => !open && setLinkLeadModal({ open: false, lead: null })}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetHeader>
              <SheetTitle>{t('linkLeadModal.title')}</SheetTitle>
              <SheetDescription>{t('linkLeadModal.description', { leadName: linkLeadModal.lead?.name || '' })}</SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('linkLeadModal.selectUser')}</label>
                {isLoadingUsers ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t('linkLeadModal.loadingUsers')}</div>
                ) : (
                  <select className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-10 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                    {availableUsers.map((user) => ( <option key={user.id} value={user.id}>{user.name} ({user.email})</option> ))}
                  </select>
                )}
              </div>
              {linkLeadModal.lead?.assigned_user_id && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{t('linkLeadModal.currentlyAssigned')}</p>
                  <p className="text-sm font-medium mt-1">{availableUsers.find(u => u.id === linkLeadModal.lead?.assigned_user_id)?.name || t('linkLeadModal.unknownUser')}</p>
                </div>
              )}
            </div>
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setLinkLeadModal({ open: false, lead: null })} className="flex-1 cursor-pointer" disabled={isLinkingLead}>{t('linkLeadModal.cancel')}</Button>
              <Button onClick={handleLinkLead} disabled={isLinkingLead || !selectedUserId} className="flex-1 cursor-pointer">
                {isLinkingLead ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('linkLeadModal.linking')}</> : <><UserPlus className="h-4 w-4 mr-2" />{t('linkLeadModal.linkButton')}</>}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={showTelegramApiSelector} onOpenChange={setShowTelegramApiSelector}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetHeader>
              <SheetTitle>Escolher API do Telegram</SheetTitle>
              <SheetDescription>Escolha por onde deseja falar com {contactModal.lead?.name}</SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <div className="space-y-3">
              <Button onClick={() => handleTelegramApiSelection('bot')} variant="outline" className="w-full justify-start gap-3 h-auto py-4 cursor-pointer hover:bg-blue-50 hover:border-blue-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100"><Bot className="h-5 w-5 text-blue-600" /></div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">API de Bot</div>
                  <div className="text-xs text-muted-foreground">Apenas conversas existentes</div>
                </div>
              </Button>
              <Button onClick={() => handleTelegramApiSelection('account')} variant="outline" className="w-full justify-start gap-3 h-auto py-4 cursor-pointer hover:bg-green-50 hover:border-green-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100"><MessageCircle className="h-5 w-5 text-green-600" /></div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">API de Conta</div>
                  <div className="text-xs text-muted-foreground">Pode iniciar novas conversas</div>
                </div>
              </Button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex gap-2">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Diferença entre as APIs:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Bot API:</strong> Só responde mensagens já existentes</li>
                    <li><strong>Conta API:</strong> Pode iniciar conversas e entrar em contato direto</li>
                  </ul>
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <Button variant="outline" onClick={() => setShowTelegramApiSelector(false)} className="w-full cursor-pointer">Cancelar</Button>
          </SheetContent>
        </Sheet>

        <Sheet open={showBotConversationsModal} onOpenChange={setShowBotConversationsModal}>
          <SheetContent className="w-full sm:max-w-lg border-l border-border p-0 overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="p-6 md:p-8">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-blue-600" />Conversas Existentes</SheetTitle>
                <SheetDescription>{contactModal.lead?.name} já possui conversas com seu bot. Escolha uma opção:</SheetDescription>
              </SheetHeader>
              <Separator className="my-4" />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex gap-2">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Bot API Limitado:</p>
                    <p className="text-xs">A API de Bot do Telegram só pode responder mensagens já existentes. Você não pode iniciar novas conversas.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {botConversations.map((conv: any) => (
                  <div key={conv.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{conv.first_name} {conv.last_name}</div>
                        <div className="text-xs text-gray-500">@{conv.telegram_username || t('linkLeadModal.noUsername')}</div>
                      </div>
                    </div>
                    {conv.last_message_preview && <div className="text-xs text-gray-600 mb-3 line-clamp-2">{conv.last_message_preview}</div>}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { navigateToChat('telegram', contactModal.lead!, conv.id); setShowBotConversationsModal(false) }} className="flex-1 cursor-pointer">
                        <Eye className="h-4 w-4 mr-2" />Abrir Chat
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <Button variant="outline" onClick={() => setShowBotConversationsModal(false)} className="w-full cursor-pointer">Fechar</Button>
            </div>
          </SheetContent>
        </Sheet>

        {bulkMoveNotification.show && (
          <div className="fixed top-20 right-4 z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 min-w-[320px] max-w-[400px]">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('notifications.bulkMoveProgress')}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('notifications.batchProgress', { current: bulkMoveNotification.progress.batch, total: bulkMoveNotification.progress.totalBatches })}</p>
                <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-300" style={{ width: `${(bulkMoveNotification.progress.current / bulkMoveNotification.progress.total) * 100}%` }} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{bulkMoveNotification.progress.current} / {bulkMoveNotification.progress.total}</p>
              </div>
            </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
    </AuthGuard>
  )
}