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
import { Search, Plus, Download, Upload, Trash2, Edit, X, ChevronDown, CheckCircle2, AlertTriangle, AlertCircle, Check, Filter, XCircle, ArrowUp, ArrowDown, Eye, Phone, Mail, Calendar, User, Building2, File, FileText, Image, FileImage, FileVideo, FileAudio, Archive, Loader2, Trash, MessageCircle, Send, Info, Settings2, DollarSign, Briefcase, CreditCard, FileDigit, MapPin, Tag, Clock, Hash, UserPlus, Copy, MoreVertical, Bot } from "lucide-react"
import * as XLSX from "xlsx"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiService, Lead, UpdateLeadRequest } from "@/lib/api"
import { useApi } from "@/hooks/useApi"

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

// Removed SAMPLE_LEADS - now using API

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
  // ========== ALL STATES ARE NOW INTERNAL - NO PARENT RE-RENDERS! ==========
  const [stageName, setStageName] = React.useState('')
  const [stageColor, setStageColor] = React.useState('bg-blue-100 border-blue-200 text-blue-800')
  const [stageType, setStageType] = React.useState<'entry' | 'progress' | 'won' | 'lost' | ''>('')
  const [useCustomColor, setUseCustomColor] = React.useState(false)
  const [customBgColor, setCustomBgColor] = React.useState('#3B82F6')
  const [customTextColor, setCustomTextColor] = React.useState('#FFFFFF')
  
  // CRITICAL: Use uncontrolled input + ref for color pickers (ZERO re-renders!)
  const bgColorPickerRef = React.useRef<HTMLInputElement>(null)
  const textColorPickerRef = React.useRef<HTMLInputElement>(null)
  const bgColorDebounceTimer = React.useRef<NodeJS.Timeout | null>(null)
  const textColorDebounceTimer = React.useRef<NodeJS.Timeout | null>(null)
  const renderCount = React.useRef(0)
  
  // Track last click time for color pickers (for toggle behavior)
  const bgPickerLastClickRef = React.useRef(0)
  const textPickerLastClickRef = React.useRef(0)
  
  // Track renders
  renderCount.current++
  
  // Initialize form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (editingStage) {
        setStageName(editingStage.name)
        setStageType(editingStage.stage_type || '')
        
        // Check if it's a JSON with bg and text colors
        try {
          const parsed = JSON.parse(editingStage.color)
          if (parsed.bg && parsed.text) {
            setUseCustomColor(true)
            setCustomBgColor(parsed.bg)
            setCustomTextColor(parsed.text)
            if (bgColorPickerRef.current) bgColorPickerRef.current.value = parsed.bg
            if (textColorPickerRef.current) textColorPickerRef.current.value = parsed.text
            setStageColor('bg-blue-100 border-blue-200 text-blue-800') // fallback
            return
          }
        } catch {
          // Not JSON, check if hex
          const isHex = /^#[0-9A-F]{6}$/i.test(editingStage.color)
          if (isHex) {
            setUseCustomColor(true)
            setCustomBgColor(editingStage.color)
            setCustomTextColor('#FFFFFF') // default white text
            if (bgColorPickerRef.current) bgColorPickerRef.current.value = editingStage.color
            if (textColorPickerRef.current) textColorPickerRef.current.value = '#FFFFFF'
            setStageColor('bg-blue-100 border-blue-200 text-blue-800') // fallback
          } else {
            // Tailwind classes
            setUseCustomColor(false)
            setStageColor(editingStage.color)
          }
        }
      } else {
        // Reset for new stage
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
  
  // Cleanup debounce timers on unmount
  React.useEffect(() => {
    return () => {
      if (bgColorDebounceTimer.current) {
        clearTimeout(bgColorDebounceTimer.current)
      }
      if (textColorDebounceTimer.current) {
        clearTimeout(textColorDebounceTimer.current)
      }
    }
  }, [])
  
  // Helper functions
  const isHexColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color)
  
  const handleColorSelectChange = (value: string) => {
    if (value === 'custom') {
      setUseCustomColor(true)
    } else {
      setUseCustomColor(false)
      setStageColor(value)
    }
  }
  
  // OPTIMIZED: Debounce - only update state when user STOPS dragging (300ms pause)
  const handleBgColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    if (bgColorDebounceTimer.current) {
      clearTimeout(bgColorDebounceTimer.current)
    }
    
    bgColorDebounceTimer.current = setTimeout(() => {
      setCustomBgColor(value)
    }, 300)
  }
  
  const handleTextColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    if (textColorDebounceTimer.current) {
      clearTimeout(textColorDebounceTimer.current)
    }
    
    textColorDebounceTimer.current = setTimeout(() => {
      setCustomTextColor(value)
    }, 300)
  }
  
  const handleBgColorTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
      setCustomBgColor(value)
      if (bgColorPickerRef.current && /^#[0-9A-F]{6}$/i.test(value)) {
        bgColorPickerRef.current.value = value
      }
    }
  }
  
  const handleTextColorTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
      setCustomTextColor(value)
      if (textColorPickerRef.current && /^#[0-9A-F]{6}$/i.test(value)) {
        textColorPickerRef.current.value = value
      }
    }
  }
  
  const handleSave = () => {
    const finalColor = useCustomColor 
      ? JSON.stringify({ bg: customBgColor, text: customTextColor })
      : stageColor
    onSave(stageName, finalColor, stageType)
  }
  
  // Preview style (same size as stage badge in columns)
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
      <SheetContent className="w-full sm:max-w-md border-l border-border p-6">
        <SheetHeader>
          <SheetTitle>
            {editingStage ? t('stageManagement.editStage') : t('stageManagement.addStage')}
          </SheetTitle>
        </SheetHeader>
        
        <Separator className="my-4" />
        
        <div className="space-y-4">
          {/* Stage Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('stageManagement.nameLabel')}</label>
            <Input
              placeholder={t('stageManagement.namePlaceholder')}
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
            />
          </div>
          
          {/* Stage Type */}
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
          
          {/* Color Picker */}
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
          
          {/* Preview - MOVED HERE for better visibility */}
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
          
          {/* Custom Color Pickers - MOVED BELOW PREVIEW */}
          {useCustomColor && (
            <div className="space-y-3">
              {/* Background Color */}
              <div>
                <label className="text-sm font-medium">{t('stageManagement.backgroundColor')}</label>
                <div className="flex gap-2 mt-1">
                  <input
                    ref={bgColorPickerRef}
                    type="color"
                    defaultValue={customBgColor}
                    onChange={handleBgColorPickerChange}
                    onClick={(e) => {
                      const now = Date.now()
                      const lastClick = bgPickerLastClickRef.current
                      
                      // If clicked within 500ms, it's a second click - close the picker
                      if (now - lastClick < 500) {
                        e.preventDefault()
                        e.currentTarget.blur()
                        bgPickerLastClickRef.current = 0
                      } else {
                        // First click - record time
                        bgPickerLastClickRef.current = now
                      }
                    }}
                    onBlur={() => {
                      // Reset on blur
                      setTimeout(() => {
                        bgPickerLastClickRef.current = 0
                      }, 600)
                    }}
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
              
              {/* Text Color */}
              <div>
                <label className="text-sm font-medium">{t('stageManagement.textColor')}</label>
                <div className="flex gap-2 mt-1">
                  <input
                    ref={textColorPickerRef}
                    type="color"
                    defaultValue={customTextColor}
                    onChange={handleTextColorPickerChange}
                    onClick={(e) => {
                      const now = Date.now()
                      const lastClick = textPickerLastClickRef.current
                      
                      // If clicked within 500ms, it's a second click - close the picker
                      if (now - lastClick < 500) {
                        e.preventDefault()
                        e.currentTarget.blur()
                        textPickerLastClickRef.current = 0
                      } else {
                        // First click - record time
                        textPickerLastClickRef.current = now
                      }
                    }}
                    onBlur={() => {
                      // Reset on blur
                      setTimeout(() => {
                        textPickerLastClickRef.current = 0
                      }, 600)
                    }}
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
          
          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 cursor-pointer"
              disabled={isSaving}
            >
              {t('stageManagement.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!stageName.trim() || isSaving}
              className="flex-1 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('stageManagement.saving')}
                </>
              ) : (
                editingStage ? t('stageManagement.saveChanges') : t('stageManagement.createStage')
              )}
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
  lead, 
  onDragStart, 
  onContact, 
  onPreview, 
  onEdit,
  onLinkLead,
  userRole,
  locale
}: { 
  lead: Lead, 
  onDragStart: (e: React.DragEvent, lead: Lead) => void,
  onContact: (lead: Lead) => void,
  onPreview: (lead: Lead) => void,
  onEdit: (lead: Lead) => void,
  onLinkLead?: (lead: Lead) => void,
  userRole: string,
  locale: string
}) => {
  const t = useTranslations('Pipeline')
  
  const formatCurrency = React.useCallback((value: number) => {
    return new Intl.NumberFormat(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: locale === 'pt-BR' ? 'BRL' : 'USD',
    }).format(value)
  }, [locale])

  const formatDate = React.useCallback((dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }, [locale])
  
  return (
    <div
      key={lead.id}
      className="bg-background border rounded-lg p-2.5 cursor-move hover:shadow-md transition-shadow"
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
    >
      {/* Header com nome e menu de ações */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate" title={lead.name}>
            {lead.name}
          </h4>
          <p className="text-xs text-muted-foreground truncate mt-0.5" title={lead.email}>
            {lead.email}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 cursor-pointer hover:bg-muted flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onPreview(lead)
              }}
              className="cursor-pointer"
            >
              <Eye className="h-4 w-4 mr-2" />
              {t('leadCard.viewDetails')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onEdit(lead)
              }}
              className="cursor-pointer"
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('leadCard.editLead')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onContact(lead)
              }}
              className="cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {t('leadCard.startConversation')}
            </DropdownMenuItem>
            {(userRole === 'admin' || userRole === 'master') && onLinkLead && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onLinkLead(lead)
                }}
                className="cursor-pointer"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {t('leadCard.linkToUser')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Valor da venda */}
      {lead.value && (
        <div className="mb-1.5">
          <div className="text-sm font-bold text-green-600">
            {formatCurrency(lead.value)}
          </div>
        </div>
      )}
      
      {/* Informações adicionais */}
      <div className="space-y-1">
        {/* Origem */}
        {lead.source && (
          <div className="text-xs text-muted-foreground flex items-center">
            <Building2 className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{lead.source}</span>
          </div>
        )}
        
        {/* Data de fechamento */}
        {lead.estimated_close_date && (
          <div className="text-xs text-muted-foreground flex items-center">
            <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
            <span>{formatDate(lead.estimated_close_date)}</span>
          </div>
        )}
      </div>
      
      {/* Notas (truncadas) */}
      {lead.description && (
        <div className="mt-1.5 p-1.5 bg-muted/30 rounded text-xs text-muted-foreground">
          <div className="line-clamp-2" title={lead.description}>
            📝 {lead.description}
          </div>
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props change
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
  const storageKey = React.useMemo(() => `pipeline_${org}`, [org])
  
  // Função para formatar moeda
  const formatCurrency = React.useCallback((value: number) => {
    return new Intl.NumberFormat(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: locale === 'pt-BR' ? 'BRL' : 'USD',
    }).format(value)
  }, [locale])

  // User role and ID check
  const [userRole, setUserRole] = React.useState<string>('')
  const [userId, setUserId] = React.useState<string>('')
  
  React.useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      
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
  
  // Helper function to add employee filter if needed
  const addEmployeeFilter = React.useCallback((params: any = {}) => {
    if (userRole === 'employee' && userId) {
      return { ...params, assigned_user_id: userId }
    }
    return params
  }, [userRole, userId])
  
  // Stage management modal
  const [isStageManagementOpen, setIsStageManagementOpen] = React.useState(false)
  const [editingStage, setEditingStage] = React.useState<PipelineStage | null>(null)
  const [isStageFormOpen, setIsStageFormOpen] = React.useState(false)
  const [isDeletingStage, setIsDeletingStage] = React.useState<PipelineStage | null>(null)
  const [isSavingStage, setIsSavingStage] = React.useState(false)
  const [draggedStage, setDraggedStage] = React.useState<PipelineStage | null>(null)
  const [draggedOverStageId, setDraggedOverStageId] = React.useState<string | null>(null)
  
  // Lead migration modal (when deleting stage with leads)
  const [migrationModal, setMigrationModal] = React.useState<{
    open: boolean
    stage: PipelineStage | null
    targetStageId: string | null
    action: 'move' | 'remove' | 'uncategorize' | null
  }>({ open: false, stage: null, targetStageId: null, action: null })

  const [leads, setLeads] = React.useState<Lead[]>([])
  const [pipelineStages, setPipelineStages] = React.useState<PipelineStage[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filters, setFilters] = React.useState({
    name: '',
    email: '',
    phone: '',
    ssn: '',
    ein: '',
    source: '',
    location: '',
    interest: '',
    status: ''
  })
  const [valueRange, setValueRange] = React.useState({
    min: '',
    max: ''
  })
  const [dateRange, setDateRange] = React.useState({
    min: '',
    max: ''
  })

  // Função para validar data
  const validateDate = (dateString: string): boolean => {
    if (!dateString) return true // Permitir campo vazio
    
    // Validar formato YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    
    // Validar ano (deve ter exatamente 4 dígitos)
    const year = parseInt(dateString.split('-')[0]);
    if (year < 1000 || year > 9999) {
      return false;
    }
    
    // Validar se a data é válida
    const dateObj = new Date(dateString);
    return !isNaN(dateObj.getTime());
  }
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draggedLead, setDraggedLead] = React.useState<Lead | null>(null)
  const [draggedOverStage, setDraggedOverStage] = React.useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [isFilterOpen, setIsFilterOpen] = React.useState(false)
  
  // Ref para o container de scroll do pipeline
  const pipelineScrollRef = React.useRef<HTMLDivElement>(null)
  const scrollIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

  // Edit form states
  const [editValue, setEditValue] = React.useState("")
  const [editExpectedCloseDate, setEditExpectedCloseDate] = React.useState("")
  const [editNotes, setEditNotes] = React.useState("")
  const [editInterest, setEditInterest] = React.useState("")


  // Toast notifications
  const [toasts, setToasts] = React.useState<{ id: string, text: string, type: "success" | "warning" | "error" }[]>([])

  // Preview modal
  const [preview, setPreview] = React.useState<{ open: boolean, lead: Lead | null }>({ open: false, lead: null })
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const [assignedUserName, setAssignedUserName] = React.useState<string>("")
  const [createdByUserName, setCreatedByUserName] = React.useState<string>("")
  
  // Fetch assigned user and created by user names when preview opens
  React.useEffect(() => {
    async function fetchUsers() {
      if (preview.open && preview.lead && (preview.lead.assigned_user_id || preview.lead.created_by)) {
        try {
          const response = await apiService.getOrganizationUsers(true)
          if (response.success && response.data) {
            const employees = response.data.employees
            
            if (preview.lead.assigned_user_id) {
              const assignedUser = employees.find((emp: any) => emp.id === preview.lead!.assigned_user_id)
              if (assignedUser) {
                setAssignedUserName(assignedUser.name)
              } else {
                setAssignedUserName(t('previewModal.unknownUser'))
              }
            }
            
            if (preview.lead.created_by) {
              const createdByUser = employees.find((emp: any) => emp.id === preview.lead!.created_by)
              if (createdByUser) {
                setCreatedByUserName(createdByUser.name)
              } else {
                setCreatedByUserName(t('previewModal.unknownUser'))
              }
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
  }, [preview.open, preview.lead?.assigned_user_id, preview.lead?.created_by])
  
  // Contact method modal
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
  
  // Link lead modal (only for admins and masters)
  const [linkLeadModal, setLinkLeadModal] = React.useState<{ open: boolean, lead: Lead | null }>({ open: false, lead: null })
  const [selectedUserId, setSelectedUserId] = React.useState<string>("")
  const [availableUsers, setAvailableUsers] = React.useState<any[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false)
  const [isLinkingLead, setIsLinkingLead] = React.useState(false)

  // Attachment states
  const [isAttachmentDragActive, setIsAttachmentDragActive] = React.useState(false)
  const [uploadingAttachments, setUploadingAttachments] = React.useState<{ [leadId: string]: boolean }>({})
  const [attachmentProgress, setAttachmentProgress] = React.useState<{ [leadId: string]: number }>({})
  const attachmentFileInputRef = React.useRef<HTMLInputElement | null>(null)
  
  // Local attachment management (pending changes)
  const [pendingAttachments, setPendingAttachments] = React.useState<{ [leadId: string]: { toAdd: File[], toRemove: string[] } }>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  
  // Track original form values for change detection
  const [originalFormValues, setOriginalFormValues] = React.useState<{
    value: string
    expectedCloseDate: string
    notes: string
    interest: string
  } | null>(null)
  
  // Toast notification for unsaved changes
  const [unsavedChangesToast, setUnsavedChangesToast] = React.useState<{
    show: boolean
    message: string
  }>({ show: false, message: '' })
  
  // Bulk move progress notification states
  const [bulkMoveNotification, setBulkMoveNotification] = React.useState<{
    show: boolean
    progress: {
      current: number
      total: number
      batch: number
      totalBatches: number
    }
  }>({
    show: false,
    progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }
  })
  
  // Function to check if form has changes
  const hasFormChanges = () => {
    if (!originalFormValues) return false
    
    return (
      editValue !== originalFormValues.value ||
      editExpectedCloseDate !== originalFormValues.expectedCloseDate ||
      editNotes !== originalFormValues.notes ||
      editInterest !== originalFormValues.interest
    )
  }
  
  // Function to check for unsaved changes and show confirmation
  const handleModalClose = () => {
    const hasAttachmentChanges = Object.keys(pendingAttachments).length > 0 && 
      Object.values(pendingAttachments).some(p => p.toAdd.length > 0 || p.toRemove.length > 0)
    const hasFieldChanges = hasFormChanges()
    
    if (hasAttachmentChanges || hasFieldChanges) {
      setUnsavedChangesToast({
        show: true,
        message: t('editModal.unsavedChanges')
      })
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setUnsavedChangesToast({ show: false, message: '' })
      }, 3000)
    } else {
      setIsEditModalOpen(false)
      setEditingId(null)
      setPreview({ open: false, lead: null })
    }
  }
  
  // Function to confirm discard changes (called when clicking outside again)
  const confirmDiscardChanges = () => {
    // Clear all pending changes
    setPendingAttachments({})
    setHasUnsavedChanges(false)
    setUnsavedChangesToast({ show: false, message: '' })
    setOriginalFormValues(null)
    setIsEditModalOpen(false)
    setEditingId(null)
    setPreview({ open: false, lead: null })
    // Reset form fields
    setEditValue("")
    setEditExpectedCloseDate("")
    setEditNotes("")
    setEditInterest("")
  }

  // Track if stages have been loaded to prevent multiple loads
  const stagesLoadedRef = React.useRef(false)

  // Load pipeline stages from API
  React.useEffect(() => {
    const loadStages = async () => {
      if (!isClient || stagesLoadedRef.current) return
      
      try {
        const response = await apiCall('/pipeline-stages')
        
        if (!response || response.success === false) {
          console.error('❌ [Pipeline] Failed to load stages:', response?.error)
          return
        }
        
        const stagesData = response.data || response
        
        if (stagesData && Array.isArray(stagesData)) {
          const stagesWithLeads = stagesData.map((stage: any) => ({
            ...stage,
            leads: []
          }))
          
          // Auto-detect and update stage types for default stages (only if not already set)
          const defaultStageTypes: { [key: string]: 'entry' | 'progress' | 'won' | 'lost' } = {
            'new': 'entry',
            'novos-leads': 'entry',
            'new-leads': 'entry',
            'contact': 'progress',
            'em-contato': 'progress',
            'in-contact': 'progress',
            'qualified': 'progress',
            'qualificados': 'progress',
            'won': 'won',
            'ganhos': 'won',
            'fechados': 'won',
            'closed': 'won',
            'lost': 'lost',
            'perdidos': 'lost'
          }
          
          // Check if there are stages without type that match default patterns
          const stagesToUpdate: any[] = []
          stagesWithLeads.forEach((stage: any) => {
            if (!stage.stage_type && defaultStageTypes[stage.slug]) {
              stagesToUpdate.push({
                id: stage.id,
                slug: stage.slug,
                suggestedType: defaultStageTypes[stage.slug]
              })
            }
          })
          
          // Auto-update stages with suggested types
          if (stagesToUpdate.length > 0 && canManageStages) {
            console.log('📊 [Pipeline] Auto-detecting types for default stages:', stagesToUpdate)
            
            for (const stageToUpdate of stagesToUpdate) {
              try {
                await apiCall(`/pipeline-stages/${stageToUpdate.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({
                    stage_type: stageToUpdate.suggestedType
                  })
                })
                console.log(`✅ [Pipeline] Auto-set type "${stageToUpdate.suggestedType}" for stage "${stageToUpdate.slug}"`)
              } catch (error) {
                console.error(`❌ [Pipeline] Failed to auto-set type for stage "${stageToUpdate.slug}":`, error)
              }
            }
            
            // Reload stages to get updated types
            const updatedResponse = await apiCall('/pipeline-stages')
            const updatedStagesData = updatedResponse.data || updatedResponse
            if (updatedStagesData && Array.isArray(updatedStagesData)) {
              const updatedStagesWithLeads = updatedStagesData.map((stage: any) => ({
                ...stage,
                leads: []
              }))
              setPipelineStages(updatedStagesWithLeads)
            }
        } else {
            setPipelineStages(stagesWithLeads)
          }
          
          stagesLoadedRef.current = true
        }
      } catch (error) {
        console.error('❌ [Pipeline] Error loading stages:', error)
      }
    }

    loadStages()
  }, [isClient, canManageStages, apiCall])

  // Track if stages have been loaded (to avoid reloading leads on every stage update)
  const [stagesLoaded, setStagesLoaded] = React.useState(false)
  
  React.useEffect(() => {
    if (pipelineStages.length > 0 && !stagesLoaded) {
      setStagesLoaded(true)
    }
  }, [pipelineStages.length, stagesLoaded])

  // Leads são carregados automaticamente pelo useEffect do searchTerm (linha ~1125)
  // quando searchTerm está vazio, evitando duplicação de chamadas

  // Load Telegram accounts and bots
  React.useEffect(() => {
    const loadTelegramConfig = async () => {
      try {
        // Load accounts
        const accountsResponse = await apiService.getTelegramAccounts()
        if (accountsResponse.success && accountsResponse.data) {
          setTelegramAccounts(accountsResponse.data.accounts || [])
          // Select first active account by default
          const activeAccount = accountsResponse.data.accounts?.find((acc: any) => acc.is_active)
          if (activeAccount) {
            setSelectedAccountId(activeAccount.id)
          }
        }

        // Load bots
        const botsResponse = await apiService.getTelegramBots()
        if (botsResponse.success && botsResponse.data) {
          setTelegramBots(botsResponse.data.bots || [])
        }
      } catch (error) {
        console.error('Error loading telegram configuration:', error)
      }
    }

    if (isClient) {
      loadTelegramConfig()
    }
  }, [isClient])

  // Search leads with backend filters
  const searchLeads = React.useCallback(async (searchParams: {
    search?: string;
    status?: string;
    source?: string;
    value_min?: number;
    value_max?: number;
    date_min?: string;
    date_max?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    assigned_user_id?: string;
  }) => {
    try {
      console.log('Pipeline: Calling searchLeads with:', searchParams)
      const response = await apiService.searchLeads(searchParams)
      console.log('Pipeline: Search response:', response)
      if (response.success && response.data) {
        console.log('Pipeline: Setting leads from search:', response.data.leads.length, 'leads')
        setLeads(response.data.leads)
        updatePipelineStages(response.data.leads)
        return response.data.leads
      } else {
        console.error('Failed to search leads:', response.error)
        pushToast('Erro ao buscar leads', 'error')
        return []
      }
    } catch (error) {
      console.error('Error searching leads:', error)
      pushToast('Erro ao buscar leads', 'error')
      return []
    }
  }, [])

  const clearFilters = () => {
    setSearchTerm('')
    setFilters({
      name: '',
      email: '',
      phone: '',
      ssn: '',
      ein: '',
      source: '',
      location: '',
      interest: '',
      status: ''
    })
    setValueRange({
      min: '',
      max: ''
    })
    setDateRange({
      min: '',
      max: ''
    })
    // Reload all leads when clearing filters
    const loadAllLeads = async () => {
      try {
        // Apply employee filter if needed
        const params = addEmployeeFilter({ show_on_pipeline: true })
        const response = await apiService.searchLeads(params)
        if (response.success && response.data) {
          setLeads(response.data.leads)
          updatePipelineStages(response.data.leads)
        }
      } catch (error) {
        console.error('Error loading all leads:', error)
      }
    }
    loadAllLeads()
  }

  // Debounced search function
  const debouncedSearch = React.useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return (searchParams: any) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        searchLeads(searchParams)
      }, 300) // 300ms debounce
    }
  }, [searchLeads])

  // Apply search term only (real-time)
  React.useEffect(() => {
    if (!isClient || !stagesLoaded || !userRole) return
    
    if (searchTerm) {
      // Use backend search with debounce for search term only
      const searchParams = addEmployeeFilter({
        search: searchTerm,
        show_on_pipeline: true
      })
      
      console.log('Pipeline: Searching with search term:', searchParams)
      debouncedSearch(searchParams)
    } else {
      // No search term, reload all leads from API
      const loadAllLeads = async () => {
        try {
          const params = addEmployeeFilter({ show_on_pipeline: true })
          const response = await apiService.searchLeads(params)
          if (response.success && response.data) {
            setLeads(response.data.leads)
            updatePipelineStages(response.data.leads)
          }
        } catch (error) {
          console.error('Error loading all leads:', error)
        }
      }
      loadAllLeads()
    }
  }, [searchTerm, debouncedSearch, isClient, stagesLoaded, userRole, addEmployeeFilter])

  // Apply modal filters when Apply Filter is clicked
  const applyModalFilters = React.useCallback(async () => {
    if (!isClient) return
    
    const hasFilters = filters.name || filters.email || filters.phone || filters.ssn || filters.ein || filters.source || filters.location || filters.interest || filters.status || valueRange.min || valueRange.max || dateRange.min || dateRange.max
    
    if (hasFilters) {
      try {
        // Usar a rota de busca unificada com todos os parâmetros
        let searchParams: any = {
          show_on_pipeline: true // Pipeline sempre mostra apenas leads no pipeline
        }
        
        // Adicionar filtros se existirem
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
        
        // Apply employee filter if needed
        searchParams = addEmployeeFilter(searchParams)

        const response = await apiService.searchLeads(searchParams)
        if (response.success && response.data) {
          console.log('Pipeline: Applying unified filters')
          console.log('Pipeline: Found leads:', response.data.leads.length)
          setLeads(response.data.leads)
          updatePipelineStages(response.data.leads)
        }
        
      } catch (error) {
        console.error('Error applying filters:', error)
        pushToast(t('notifications.errorApplyingFilters'), 'error')
      }
    } else {
      // No filters, reload all leads from API
      const loadAllLeads = async () => {
        try {
          const params = addEmployeeFilter({ show_on_pipeline: true })
          const response = await apiService.searchLeads(params)
          if (response.success && response.data) {
            setLeads(response.data.leads)
            updatePipelineStages(response.data.leads)
          }
        } catch (error) {
          console.error('Error loading all leads:', error)
        }
      }
      loadAllLeads()
    }
  }, [filters, valueRange, dateRange, isClient, addEmployeeFilter])

  function updatePipelineStages(leadsList: Lead[]) {
    setPipelineStages(prev => {
      // Remove any existing virtual "Uncategorized" stage from previous state
      const realStages = prev.filter(stage => stage.id !== '__uncategorized__')
      
      // First, assign leads to existing stages
      const newStages = realStages.map(stage => {
        // Filter leads by matching the stage slug with the lead status
      const stageLeads = leadsList.filter(lead => {
          // Normalizar status do lead (remover espaços, lowercase)
          const leadStatus = lead.status.toLowerCase().replace(/\s+/g, '')
          const stageSlug = stage.slug.toLowerCase()
          
          // Para stages do sistema, usar mapeamento de compatibilidade
          if (stage.translation_key) {
            const statusMap: { [key: string]: string } = {
              'new': 'new',
              'incontact': 'contact',
              'qualified': 'qualified',
              'lost': 'lost',
              'closedlost': 'lost',
              'proposalsent': 'qualified',
              'negotiation': 'qualified',
              'contacted': 'contact',
              'closedwon': 'qualified'
            }
            return statusMap[leadStatus] === stageSlug || leadStatus === stageSlug
          }
          
          // Para stages customizadas, match direto pelo slug
          // O slug é gerado a partir do nome: "Teste Coluna" -> "teste-coluna"
          // O status do lead deve ser exatamente o slug da stage
          return leadStatus === stageSlug || 
                 leadStatus.replace(/-/g, '') === stageSlug.replace(/-/g, '')
        })
        
      return {
        ...stage,
        leads: stageLeads
      }
    })
      
      // Find orphaned leads (leads that don't match any existing stage)
      const assignedLeadIds = new Set(
        newStages.flatMap(stage => stage.leads.map(lead => lead.id))
      )
      
      const orphanedLeads = leadsList.filter(lead => !assignedLeadIds.has(lead.id))
      
      // If there are orphaned leads, create a special "Uncategorized" stage
      if (orphanedLeads.length > 0) {
        const uncategorizedStage: PipelineStage = {
          id: '__uncategorized__',
          name: t('stageManagement.uncategorized'),
          slug: '__uncategorized__',
          color: JSON.stringify({ bg: '#FEF3C7', text: '#92400E' }), // Amber/yellow warning color
          order: -1, // Always first (leftmost)
          leads: orphanedLeads
        }
        
        // Add uncategorized stage at the beginning (leftmost position)
        return [uncategorizedStage, ...newStages]
      }
      
      return newStages
    })
  }

  function pushToast(message: string, type: "success" | "warning" | "error" = "success", timeoutMs = 4000) {
    const id = createId()
    setToasts((prev) => [...prev, { id, text: message, type }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, timeoutMs)
  }

  // Helper function to update a lead with retry logic (exponential backoff)
  async function updateLeadWithRetry(lead: Lead, updateData: any, maxRetries: number = 5): Promise<{ success: boolean, lead: Lead, error?: string }> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await apiService.updateLead(updateData)
        
        if (result.success) {
          return { success: true, lead }
        } else if (attempt < maxRetries - 1) {
          // Retry on failure with exponential backoff
          const backoffDelay = 50 * Math.pow(2, attempt) // 50ms, 100ms, 200ms, 400ms, 800ms
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
          continue
        } else {
          console.error(`Failed to update lead after ${maxRetries} attempts:`, lead.id, result.error)
          return { success: false, lead, error: result.error }
        }
      } catch (error) {
        if (attempt < maxRetries - 1) {
          // Retry on network errors with exponential backoff
          const backoffDelay = 50 * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
          continue
        } else {
          console.error(`Network error after ${maxRetries} attempts:`, lead.id, error)
          return { success: false, lead, error: String(error) }
        }
      }
    }
    
    return { success: false, lead, error: 'Max retries exceeded' }
  }

  // Helper function to check if color is hex code or Tailwind class
  const isHexColor = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color)
  
  // Helper function to get text color based on background brightness
  const getTextColorForBg = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128 ? '#1F2937' : '#FFFFFF' // dark gray or white
  }

  // Helper function to render stage badge with correct color
  const renderStageBadge = (stage: PipelineStage, className: string = "inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-semibold") => {
    // Always use stage.name - it will either be the custom name or the default name from database
    // This allows users to edit even system stages
    const stageName = stage.name
    
    // Check if it's a JSON with bg and text colors
    try {
      const parsed = JSON.parse(stage.color)
      if (parsed.bg && parsed.text) {
        return (
          <div 
            className={className}
            style={{
              backgroundColor: parsed.bg,
              borderColor: parsed.bg,
              color: parsed.text
            }}
          >
            {stageName}
          </div>
        )
      }
    } catch {
      // Not JSON, continue with legacy checks
    }
    
    // Legacy: single hex color
    if (isHexColor(stage.color)) {
      return (
        <div 
          className={className}
          style={{
            backgroundColor: stage.color,
            borderColor: stage.color,
            color: getTextColorForBg(stage.color)
          }}
        >
          {stageName}
        </div>
      )
    }
    
    // Tailwind classes
    return (
      <div className={`${className} ${stage.color}`}>
        {stageName}
      </div>
    )
  }

  // DEBUG: Log de renders do componente principal
  // Memoized callbacks to prevent LeadCard re-renders
  const handleContactLead = React.useCallback((lead: Lead) => {
    setContactModal({ open: true, lead })
  }, [])
  
  const handlePreviewLead = React.useCallback((lead: Lead) => {
    setPreview({ open: true, lead })
  }, [])
  
  // Memoize filtered leads per stage to prevent re-filtering on every render
  const filteredStages = React.useMemo(() => {
    return pipelineStages.map(stage => ({
      ...stage,
      filteredLeads: stage.leads.filter(lead => 
        !searchTerm || 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.source || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
  }, [pipelineStages, searchTerm])

  // Stage Management Functions
  const openStageForm = (stage?: PipelineStage) => {
    setEditingStage(stage || null)
    setIsStageFormOpen(true)
  }

  const closeStageForm = () => {
    setIsStageFormOpen(false)
    setEditingStage(null)
  }

  const handleSaveStage = async (name: string, color: string, stageType: string) => {
    console.log('[SAVE STAGE] START - Name:', name, 'Color:', color, 'Type:', stageType, 'Editing:', editingStage?.name)
    
    // Prevent multiple simultaneous calls
    if (isSavingStage) {
      console.log('[SAVE STAGE] Already saving, ignoring duplicate call')
      return
    }
    
    const finalName = name.trim()
    console.log('[SAVE STAGE] Final name:', finalName)
    
    if (!finalName) {
      console.log('[SAVE STAGE] Name required error')
      pushToast(t('stageManagement.nameRequired'), 'error')
      return
    }
    
    if (!color.trim()) {
      console.log('[SAVE STAGE] Color required error')
      pushToast(t('stageManagement.colorRequired'), 'error')
      return
    }

    // Check for duplicate name BEFORE calling API
    const newSlug = finalName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    console.log('[SAVE STAGE] New slug:', newSlug)
    console.log('[SAVE STAGE] Current stages:', pipelineStages.map(s => ({ id: s.id, name: s.name, slug: s.slug })))
    
    const duplicateStage = pipelineStages.find(stage => {
      if (editingStage && stage.id === editingStage.id) {
        return false // Ignore self
      }
      return stage.slug === newSlug || stage.name.toLowerCase() === finalName.toLowerCase()
    })
    
    console.log('[SAVE STAGE] Duplicate check result:', duplicateStage ? 'FOUND DUPLICATE' : 'No duplicate')
    
    if (duplicateStage) {
      console.log('[SAVE STAGE] Showing duplicate error')
      pushToast(t('stageManagement.duplicateStage'), 'error')
      return
    }

    console.log('[SAVE STAGE] Setting isSavingStage to true')
    setIsSavingStage(true)
    
    try {
      if (editingStage) {
        console.log('[SAVE STAGE] EDIT MODE - Stage ID:', editingStage.id)
        // newSlug was already calculated above for duplicate check
        const oldSlug = editingStage.slug
        console.log('[SAVE STAGE] Old slug:', oldSlug, 'New slug:', newSlug)
        
        // Check if the slug is changing
        const slugChanged = newSlug !== oldSlug
        console.log('[SAVE STAGE] Slug changed:', slugChanged)
        
        // Update existing stage
        console.log('[SAVE STAGE] Calling API PUT...')
        const response = await apiCall(`/pipeline-stages/${editingStage.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: finalName,
            color,
            stage_type: stageType || null
          })
        })
        
        console.log('[SAVE STAGE] API Response received:', response)
        
        // Check if response indicates success
        const isSuccess = response && response.success !== false && !response.error
        console.log('[SAVE STAGE] Is success:', isSuccess)
        
        if (isSuccess) {
          console.log('[SAVE STAGE] Success branch - Starting lead updates if needed')
          // If slug changed, update only the leads that are currently visible in this pipeline column
          // Note: newSlug was already calculated above for duplicate check
          if (slugChanged) {
            console.log('[SAVE STAGE] Slug changed - need to update leads')
            // Get leads that are currently in this specific column
            const leadsToUpdate = editingStage.leads
            console.log('[SAVE STAGE] Leads to update:', leadsToUpdate.length)
            
            if (leadsToUpdate.length > 0) {
              console.log('[SAVE STAGE] Starting batch update of leads...')
              // Determine new status based on the new slug
              let newStatus: string
              
              if (editingStage.translation_key) {
                // For system stages, use mapped status
                const statusMap: { [key: string]: string } = {
                  'new': 'New',
                  'contact': 'In Contact',
                  'qualified': 'Qualified',
                  'lost': 'Lost'
                }
                newStatus = statusMap[newSlug] || newSlug
              } else {
                // For custom stages, use slug directly
                newStatus = newSlug
              }
              
              // Update leads in batches
              const batchSize = 10
              const totalBatches = Math.ceil(leadsToUpdate.length / batchSize)
              let successCount = 0
              let errorCount = 0
              
              for (let i = 0; i < totalBatches; i++) {
                const start = i * batchSize
                const end = Math.min(start + batchSize, leadsToUpdate.length)
                const batch = leadsToUpdate.slice(start, end)
                
                // Show progress notification
                pushToast(
                  t('stageManagement.migration.processingBatch', { 
                    current: i + 1, 
                    total: totalBatches 
                  }), 
                  'warning',
                  2000
                )
                
                // Update batch in parallel
                const batchPromises = batch.map((lead: Lead) => 
                  apiService.updateLead({
                    id: lead.id,
                    status: newStatus
                  }).then(() => {
                    successCount++
                    return true
                  }).catch((error) => {
                    console.error(`Failed to update lead ${lead.id}:`, error)
                    errorCount++
                    return false
                  })
                )
                
                await Promise.all(batchPromises)
              }
              
              console.log('[SAVE STAGE] Batch update completed - Success:', successCount, 'Errors:', errorCount)
              
              if (errorCount > 0) {
                pushToast(
                  t('stageManagement.migration.partialSuccess', { 
                    success: successCount,
                    errors: errorCount 
                  }), 
                  'warning'
                )
              } else {
                pushToast(t('stageManagement.leadsUpdated', { 
                  count: successCount,
                  stageName: finalName
                }), 'success')
              }
            } else {
              console.log('[SAVE STAGE] No leads to update')
            }
          } else {
            console.log('[SAVE STAGE] Slug did not change, skipping lead updates')
          }
          
          console.log('[SAVE STAGE] Reloading stages from API...')
          // Reload stages from API to ensure sync
          const stagesResponse = await apiCall('/pipeline-stages')
          console.log('[SAVE STAGE] Stages response:', stagesResponse)
          
          const stagesData = stagesResponse.data || stagesResponse
          if (stagesData && Array.isArray(stagesData)) {
            console.log('[SAVE STAGE] Setting pipeline stages with', stagesData.length, 'stages')
            const stagesWithLeads = stagesData.map((stage: any) => ({
              ...stage,
              leads: []
            }))
            setPipelineStages(stagesWithLeads)
            
            // Re-distribute existing leads (already in state) instead of reloading all from API
            console.log('[SAVE STAGE] Re-distributing existing leads (' + leads.length + ') to updated stages...')
            updatePipelineStages(leads)
          }
          
          console.log('[SAVE STAGE] Showing success toast and closing form')
          pushToast(t('stageManagement.stageUpdated', { name: finalName }), 'success')
          closeStageForm()
        } else {
          console.log('[SAVE STAGE] Error branch - Response indicates failure')
          // Error occurred during update
          const errorMessage = response?.error || response?.message || ''
          console.log('[SAVE STAGE] Error message:', errorMessage)
          
          // Check if it's a duplicate stage error
          if (errorMessage.toLowerCase().includes('identificador') || 
              errorMessage.toLowerCase().includes('identifier') ||
              errorMessage.toLowerCase().includes('já existe') ||
              errorMessage.toLowerCase().includes('already exists') ||
              errorMessage.toLowerCase().includes('duplicate')) {
            console.log('[SAVE STAGE] Showing duplicate error')
            pushToast(t('stageManagement.duplicateStage'), 'error')
          } else if (errorMessage) {
            console.log('[SAVE STAGE] Showing error message:', errorMessage)
            pushToast(errorMessage, 'error')
          } else {
            console.log('[SAVE STAGE] Showing generic update error')
            pushToast(t('stageManagement.errorUpdating'), 'error')
          }
        }
      } else {
        // Create new stage (newSlug was already calculated above for duplicate check)
        const response = await apiCall('/pipeline-stages', {
          method: 'POST',
          body: JSON.stringify({
            name: finalName,
            slug: newSlug,
            color,
            stage_type: stageType || null,
            order: pipelineStages.length
          })
        })
        
        if (response && response.success !== false && !response.error) {
          // Reload stages from API
          const stagesResponse = await apiCall('/pipeline-stages')
          const stagesData = stagesResponse.data || stagesResponse
          if (stagesData && Array.isArray(stagesData)) {
            const stagesWithLeads = stagesData.map((stage: any) => ({
              ...stage,
              leads: []
            }))
            setPipelineStages(stagesWithLeads)
            // Re-distribute leads
            updatePipelineStages(leads)
          }
          pushToast(t('stageManagement.stageCreated', { name: finalName }), 'success')
          closeStageForm()
        } else {
          // Error occurred
          const errorMessage = response?.error || response?.message || ''
          
          // Check if it's a duplicate stage error
          if (errorMessage.toLowerCase().includes('identificador') || 
              errorMessage.toLowerCase().includes('identifier') ||
              errorMessage.toLowerCase().includes('já existe') ||
              errorMessage.toLowerCase().includes('already exists') ||
              errorMessage.toLowerCase().includes('duplicate')) {
            pushToast(t('stageManagement.duplicateStage'), 'error')
          } else if (errorMessage) {
            pushToast(errorMessage, 'error')
          } else {
            pushToast(t('stageManagement.errorCreating'), 'error')
          }
        }
      }
    } catch (error: any) {
      console.log('[SAVE STAGE] CATCH BLOCK - Exception occurred')
      console.error('[SAVE STAGE] Error saving stage:', error)
      
      // Extract error message from various possible error structures
      const errorMessage = error?.message || error?.error || error?.toString() || ''
      console.log('[SAVE STAGE] Extracted error message:', errorMessage)
      
      // Check if error message contains duplicate slug info
      if (errorMessage.toLowerCase().includes('identificador') || 
          errorMessage.toLowerCase().includes('identifier') ||
          errorMessage.toLowerCase().includes('já existe') ||
          errorMessage.toLowerCase().includes('already exists') ||
          errorMessage.toLowerCase().includes('duplicate')) {
        console.log('[SAVE STAGE] Showing duplicate error from catch')
        pushToast(t('stageManagement.duplicateStage'), 'error')
      } else if (errorMessage && errorMessage !== '[object Object]') {
        console.log('[SAVE STAGE] Showing error message from catch:', errorMessage)
        pushToast(errorMessage, 'error')
      } else {
        console.log('[SAVE STAGE] Showing generic error from catch')
        pushToast(editingStage ? t('stageManagement.errorUpdating') : t('stageManagement.errorCreating'), 'error')
      }
    } finally {
      console.log('[SAVE STAGE] FINALLY BLOCK - Resetting isSavingStage to false')
      setIsSavingStage(false)
      console.log('[SAVE STAGE] END')
    }
  }

  const handleDeleteStage = async (stage: PipelineStage) => {
    if (stage.leads.length > 0) {
      // Open migration modal instead of showing error
      setMigrationModal({
        open: true,
        stage,
        targetStageId: null,
        action: null
      })
      return
    }
    
    // No leads, proceed with normal deletion
    setIsDeletingStage(stage)
  }

  const confirmLeadMigration = async () => {
    if (!migrationModal.stage || !migrationModal.action) {
      pushToast(t('stageManagement.selectAction'), 'error')
      return
    }
    
    if (migrationModal.action === 'move' && !migrationModal.targetStageId) {
      pushToast(t('stageManagement.selectTargetStage'), 'error')
      return
    }
    
    setIsSavingStage(true)
    
    try {
      const leadsToUpdate = migrationModal.stage.leads
      
      if (migrationModal.action === 'move' && migrationModal.targetStageId) {
        // Move leads to target stage
        const targetStage = pipelineStages.find(s => s.id === migrationModal.targetStageId)
        if (!targetStage) {
          pushToast(t('stageManagement.targetStageNotFound'), 'error')
          setIsSavingStage(false)
          return
        }
        
        // Determine new status for leads
        let newStatus: string
        if (targetStage.translation_key) {
          const statusMap: { [key: string]: string } = {
            'new': 'New',
            'contact': 'In Contact',
            'qualified': 'Qualified',
            'lost': 'Lost'
          }
          newStatus = statusMap[targetStage.slug] || targetStage.slug
        } else {
          newStatus = targetStage.slug
        }
        
        // Batch processing configuration (same as leads page)
        const totalLeads = leadsToUpdate.length
        const batchSize = 1000 // Large batches (like leads page)
        const totalBatches = Math.ceil(totalLeads / batchSize)
        const parallelLimit = 30 // Process 30 leads in parallel within each batch
        
        // Show progress notification
        setBulkMoveNotification({
          show: true,
          progress: { current: 0, total: totalLeads, batch: 0, totalBatches }
        })
        
        try {
          let successCount = 0
          const failedUpdates: Array<{ lead: Lead, error: string }> = []
          
          // Process batches
          for (let i = 0; i < totalBatches; i++) {
            const startIndex = i * batchSize
            const endIndex = Math.min(startIndex + batchSize, totalLeads)
            const batch = leadsToUpdate.slice(startIndex, endIndex)
            
            // Update progress
            setBulkMoveNotification({
              show: true,
              progress: {
                current: startIndex,
                total: totalLeads,
                batch: i + 1,
                totalBatches
              }
            })
            
            // Process batch in controlled parallel chunks
            for (let j = 0; j < batch.length; j += parallelLimit) {
              const chunk = batch.slice(j, j + parallelLimit)
              const leadIndex = startIndex + j
              
              // Update progress for chunk
              setBulkMoveNotification({
                show: true,
                progress: {
                  current: leadIndex,
                  total: totalLeads,
                  batch: i + 1,
                  totalBatches
                }
              })
              
              // Prepare updates for this chunk with retry
              const chunkPromises = chunk.map(async (lead) => {
                const updateData: any = {
                  id: lead.id,
                  status: newStatus
                }
                return updateLeadWithRetry(lead, updateData, 5)
              })
              
              const chunkResults = await Promise.all(chunkPromises)
              
              // Collect results
              chunkResults.forEach(result => {
                if (result.success) {
                  successCount++
                } else {
                  failedUpdates.push({ lead: result.lead, error: result.error || 'Unknown error' })
                }
              })
              
              // Small delay to prevent server overload
              if (j + parallelLimit < batch.length) {
                await new Promise(resolve => setTimeout(resolve, 20))
              }
            }
          }
          
          // Retry failed updates if any
          if (failedUpdates.length > 0) {
            pushToast(`Retrying ${failedUpdates.length} failed updates...`, "warning", 2000)
            
            for (let k = 0; k < failedUpdates.length; k += parallelLimit) {
              const retryChunk = failedUpdates.slice(k, k + parallelLimit)
              const retryPromises = retryChunk.map(({ lead }) => {
                const updateData: any = {
                  id: lead.id,
                  status: newStatus
                }
                return updateLeadWithRetry(lead, updateData, 5)
              })
              
              const retryResults = await Promise.all(retryPromises)
              
              retryResults.forEach(result => {
                if (result.success) {
                  successCount++
                  // Remove from failedUpdates
                  const index = failedUpdates.findIndex(f => f.lead.id === result.lead.id)
                  if (index !== -1) failedUpdates.splice(index, 1)
                }
              })
            }
          }
          
          // Show final result
          if (failedUpdates.length > 0) {
            pushToast(
              t('stageManagement.migration.partialSuccess', { 
                success: successCount,
                errors: failedUpdates.length 
              }), 
              'warning'
            )
          } else {
            pushToast(t('stageManagement.leadsMoved', { 
              count: successCount,
              stageName: targetStage.name
            }), 'success')
          }
        } finally {
          setBulkMoveNotification({
            show: false,
            progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }
          })
        }
      } else if (migrationModal.action === 'uncategorize') {
        // Move leads to uncategorized by keeping their status unchanged
        // They will automatically appear in the __uncategorized__ virtual column
        pushToast(t('stageManagement.migration.leadsMovedToUncategorized', { 
          count: leadsToUpdate.length 
        }), 'success')
      } else if (migrationModal.action === 'remove') {
        // Remove leads from pipeline view (set show_on_pipeline = false)
        // Batch processing configuration (same as leads page)
        const totalLeads = leadsToUpdate.length
        const batchSize = 1000 // Large batches (like leads page)
        const totalBatches = Math.ceil(totalLeads / batchSize)
        const parallelLimit = 30 // Process 30 leads in parallel within each batch
        
        // Show progress notification
        setBulkMoveNotification({
          show: true,
          progress: { current: 0, total: totalLeads, batch: 0, totalBatches }
        })
        
        try {
          let successCount = 0
          const failedUpdates: Array<{ lead: Lead, error: string }> = []
          
          // Process batches
          for (let i = 0; i < totalBatches; i++) {
            const startIndex = i * batchSize
            const endIndex = Math.min(startIndex + batchSize, totalLeads)
            const batch = leadsToUpdate.slice(startIndex, endIndex)
            
            // Update progress
            setBulkMoveNotification({
              show: true,
              progress: {
                current: startIndex,
                total: totalLeads,
                batch: i + 1,
                totalBatches
              }
            })
            
            // Process batch in controlled parallel chunks
            for (let j = 0; j < batch.length; j += parallelLimit) {
              const chunk = batch.slice(j, j + parallelLimit)
              const leadIndex = startIndex + j
              
              // Update progress for chunk
              setBulkMoveNotification({
                show: true,
                progress: {
                  current: leadIndex,
                  total: totalLeads,
                  batch: i + 1,
                  totalBatches
                }
              })
              
              // Prepare updates for this chunk with retry
              const chunkPromises = chunk.map(async (lead) => {
                const updateData: any = {
                  id: lead.id,
                  show_on_pipeline: false // Remove from pipeline view
                }
                return updateLeadWithRetry(lead, updateData, 5)
              })
              
              const chunkResults = await Promise.all(chunkPromises)
              
              // Collect results
              chunkResults.forEach(result => {
                if (result.success) {
                  successCount++
                } else {
                  failedUpdates.push({ lead: result.lead, error: result.error || 'Unknown error' })
                }
              })
              
              // Small delay to prevent server overload
              if (j + parallelLimit < batch.length) {
                await new Promise(resolve => setTimeout(resolve, 50))
              }
            }
            
            // Delay between batches
            if (i < totalBatches - 1) {
              await new Promise(resolve => setTimeout(resolve, 100))
            }
          }
          
          console.log('[REMOVE FROM PIPELINE] Batch processing complete')
          console.log('[REMOVE FROM PIPELINE] Success:', successCount)
          console.log('[REMOVE FROM PIPELINE] Failed:', failedUpdates.length)
          
          // Show result message
          if (failedUpdates.length > 0) {
            pushToast(
              t('stageManagement.migration.partialSuccess', {
                success: successCount,
                errors: failedUpdates.length
              }),
              'warning'
            )
          } else {
            pushToast(t('stageManagement.migration.leadsRemovedFromPipeline', { 
              count: successCount
            }), 'success')
          }
        } finally {
          setBulkMoveNotification({
            show: false,
            progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }
          })
        }
      }
      
      // Now delete the stage
      try {
        console.log('[DELETE STAGE] Starting deletion for stage:', migrationModal.stage.id)
        console.log('[DELETE STAGE] Stage name:', migrationModal.stage.name)
        
        const response = await apiCall(`/pipeline-stages/${migrationModal.stage.id}`, {
          method: 'DELETE'
        })
        
        console.log('[DELETE STAGE] Delete response:', response)
        
        if (response && response.success !== false) {
          console.log('[DELETE STAGE] Stage deleted successfully, reloading stages...')
          
          // Reload stages from API to ensure sync
          const stagesResponse = await apiCall('/pipeline-stages')
          console.log('[DELETE STAGE] Stages response:', stagesResponse)
          
          const stagesData = stagesResponse.data || stagesResponse
          console.log('[DELETE STAGE] Stages data:', stagesData)
          
          if (stagesData && Array.isArray(stagesData)) {
            const stagesWithLeads = stagesData.map((stage: any) => ({
              ...stage,
              leads: []
            }))
            console.log('[DELETE STAGE] Setting new pipeline stages, count:', stagesWithLeads.length)
            setPipelineStages(stagesWithLeads)
            
            // Update leads state with the new statuses
            console.log('[DELETE STAGE] Updating leads with new statuses...')
            setLeads(prev => {
              let updatedLeads = prev
              
              // If action is 'remove', filter out the leads that were removed from pipeline
              if (migrationModal.action === 'remove') {
                const removedLeadIds = new Set(migrationModal.stage?.leads.map(l => l.id) || [])
                updatedLeads = prev.filter(lead => !removedLeadIds.has(lead.id))
                console.log('[DELETE STAGE] Removed leads from state, new count:', updatedLeads.length)
              } else {
                // For 'move' and 'uncategorize', update the leads
                updatedLeads = prev.map(lead => {
                  // If this lead was in the deleted stage, update it
                  const wasInDeletedStage = migrationModal.stage?.leads.some(l => l.id === lead.id) || false
                  if (wasInDeletedStage && migrationModal.action === 'move' && migrationModal.targetStageId) {
                    const targetStage = pipelineStages.find(s => s.id === migrationModal.targetStageId)
                    if (targetStage) {
                      let newStatus: string
                      if (targetStage.translation_key) {
                        const statusMap: { [key: string]: string } = {
                          'new': 'New',
                          'contact': 'In Contact',
                          'qualified': 'Qualified',
                          'lost': 'Lost'
                        }
                        newStatus = statusMap[targetStage.slug] || targetStage.slug
                      } else {
                        newStatus = targetStage.slug
                      }
                      return { ...lead, status: newStatus }
                    }
                  }
                  return lead
                })
              }
              
              console.log('[DELETE STAGE] Updated leads count:', updatedLeads.length)
              // Re-distribute leads with updated stages
              setTimeout(() => {
                console.log('[DELETE STAGE] Re-distributing leads to stages')
                updatePipelineStages(updatedLeads)
              }, 100)
              return updatedLeads
            })
          }
          
          pushToast(t('stageManagement.stageDeleted', { 
            name: migrationModal.stage.name 
          }), 'success')
          setMigrationModal({ open: false, stage: null, targetStageId: null, action: null })
        } else {
          console.error('[DELETE STAGE] Delete failed with response:', response)
          pushToast(response?.error || t('stageManagement.errorDeleting'), 'error')
        }
      } catch (deleteError: any) {
        console.error('[DELETE STAGE] Error deleting stage:', deleteError)
        console.error('[DELETE STAGE] Error stack:', deleteError.stack)
        console.error('[DELETE STAGE] Error message:', deleteError.message)
        
        // Even if delete fails, we updated the leads successfully
        if (migrationModal.action === 'move') {
          pushToast(t('stageManagement.migration.leadsMovedStageDeleteFailed'), 'warning')
        } else {
          pushToast(t('stageManagement.errorDeleting'), 'error')
        }
      }
    } catch (error: any) {
      console.error('Error in lead migration:', error)
      pushToast(t('stageManagement.errorMigrating'), 'error')
    } finally {
      setIsSavingStage(false)
    }
  }

  const confirmDeleteStage = async () => {
    if (!isDeletingStage) return
    
    setIsSavingStage(true)
    
    try {
      const response = await apiCall(`/pipeline-stages/${isDeletingStage.id}`, {
        method: 'DELETE'
      })
      
      if (response && response.success !== false) {
        // Reload stages from API to ensure sync
        const stagesResponse = await apiCall('/pipeline-stages')
        const stagesData = stagesResponse.data || stagesResponse
        if (stagesData && Array.isArray(stagesData)) {
          const stagesWithLeads = stagesData.map((stage: any) => {
            // Preserve leads from current state
            const currentStage = pipelineStages.find(s => s.id === stage.id)
            return {
              ...stage,
              leads: currentStage?.leads || []
            }
          })
          setPipelineStages(stagesWithLeads)
        }
        pushToast(t('stageManagement.stageDeleted', { name: isDeletingStage.name }), 'success')
        setIsDeletingStage(null)
      } else if (response && response.error) {
        // Check if it's a "has leads" error
        if (response.error.includes('leads')) {
          pushToast(t('stageManagement.stageHasLeads'), 'error')
        } else {
          pushToast(response.error, 'error')
        }
        setIsDeletingStage(null)
      } else {
        pushToast(t('stageManagement.errorDeleting'), 'error')
        setIsDeletingStage(null)
      }
    } catch (error: any) {
      console.error('Error deleting stage:', error)
      if (error?.message && error.message.includes('leads')) {
        pushToast(t('stageManagement.stageHasLeads'), 'error')
      } else {
        pushToast(t('stageManagement.errorDeleting'), 'error')
      }
      setIsDeletingStage(null)
    } finally {
      setIsSavingStage(false)
    }
  }

  const handleStageDragStart = (e: React.DragEvent, stage: PipelineStage) => {
    // Prevent dragging the virtual "Uncategorized" stage
    if (stage.id === '__uncategorized__') {
      e.preventDefault()
      return
    }
    setDraggedStage(stage)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleStageDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setDraggedOverStageId(stageId)
  }

  const handleStageDragLeave = () => {
    setDraggedOverStageId(null)
  }

  const handleStageDrop = async (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault()
    setDraggedOverStageId(null)
    
    // Prevent dropping on or from the virtual "Uncategorized" stage
    if (!draggedStage || draggedStage.id === targetStage.id || targetStage.id === '__uncategorized__') {
      setDraggedStage(null)
      return
    }
    
    // Reorder stages locally
    const newStages = [...pipelineStages]
    const draggedIndex = newStages.findIndex(s => s.id === draggedStage.id)
    const targetIndex = newStages.findIndex(s => s.id === targetStage.id)
    
    newStages.splice(draggedIndex, 1)
    newStages.splice(targetIndex, 0, draggedStage)
    
    // Update order property
    const reorderedStages = newStages.map((stage, index) => ({
      ...stage,
      order: index
    }))
    
    setPipelineStages(reorderedStages)
    setDraggedStage(null)
    
    // Save order to backend
    try {
      await apiCall('/pipeline-stages/reorder', {
        method: 'PUT',
        body: JSON.stringify({
          stageIds: reorderedStages.map(s => s.id)
        })
      })
      pushToast(t('stageManagement.orderUpdated'), 'success')
    } catch (error) {
      console.error('Error reordering stages:', error)
      pushToast(t('stageManagement.errorReordering'), 'error')
      // Revert local state on error
      const response = await apiCall('/pipeline-stages')
      const stagesData = response.data || response
      if (stagesData && Array.isArray(stagesData)) {
        const stagesWithLeads = stagesData.map((stage: any) => ({
          ...stage,
          leads: pipelineStages.find(s => s.id === stage.id)?.leads || []
        }))
        setPipelineStages(stagesWithLeads)
      }
    }
  }

  // Attachment utility functions
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
    if (file.size > maxSize) {
      return { valid: false, error: `${t('notifications.fileTooLarge')} ${formatFileSize(file.size)}` }
    }
    return { valid: true }
  }

  const handleAttachmentFileSelect = (event: React.ChangeEvent<HTMLInputElement>, leadId: string) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const validFiles: File[] = []
    const invalidFiles: string[] = []

    // Process all selected files
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validation = validateFile(file)
      
      if (validation.valid) {
        validFiles.push(file)
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`)
      }
    }

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      pushToast(`${t('notifications.invalidFiles')} ${invalidFiles.join(', ')}`, 'error')
    }

    // Add valid files to pending attachments
    if (validFiles.length > 0) {
      setPendingAttachments(prev => ({
        ...prev,
        [leadId]: {
          toAdd: [...(prev[leadId]?.toAdd || []), ...validFiles],
          toRemove: prev[leadId]?.toRemove || []
        }
      }))
      setHasUnsavedChanges(true)
    }
    
    // Reset input
    if (attachmentFileInputRef.current) {
      attachmentFileInputRef.current.value = ''
    }
  }

  const handleAttachmentDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsAttachmentDragActive(true)
  }

  const handleAttachmentDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsAttachmentDragActive(false)
  }

  const handleAttachmentDrop = (e: React.DragEvent, leadId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsAttachmentDragActive(false)

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const validFiles: File[] = []
    const invalidFiles: string[] = []

    // Process all dropped files
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validation = validateFile(file)
      
      if (validation.valid) {
        validFiles.push(file)
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`)
      }
    }

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      pushToast(`${t('notifications.invalidFiles')} ${invalidFiles.join(', ')}`, 'error')
    }

    // Add valid files to pending attachments
    if (validFiles.length > 0) {
      setPendingAttachments(prev => ({
        ...prev,
        [leadId]: {
          toAdd: [...(prev[leadId]?.toAdd || []), ...validFiles],
          toRemove: prev[leadId]?.toRemove || []
        }
      }))
      setHasUnsavedChanges(true)
    }
  }

  const uploadAttachmentSilently = async (leadId: string, file: File) => {
    try {
      const response = await apiService.uploadLeadAttachment(leadId, file)
      
      if (response.success && response.data) {
        // Check if the response has the expected structure
        let newAttachment = null
        
        if (response.data.attachment) {
          newAttachment = response.data.attachment
        } else if ((response.data as any).data && (response.data as any).data.attachment) {
          newAttachment = (response.data as any).data.attachment
        } else if (response.data) {
          newAttachment = response.data as any
        }
        
        if (newAttachment && newAttachment.id && newAttachment.mimeType && newAttachment.originalName) {
          // Update local state to add attachment
          setLeads(prev => prev.map(lead => {
            if (lead.id === leadId) {
              const attachments = lead.attachments || []
              return { ...lead, attachments: [...attachments, newAttachment] }
            }
            return lead
          }))
        }
      } else {
        throw new Error(response.error || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading attachment silently:', error)
      throw error
    }
  }

  const removeAttachmentFromPending = (leadId: string, attachmentId: string) => {
    // Add to pending removals instead of deleting immediately
    setPendingAttachments(prev => ({
      ...prev,
      [leadId]: {
        toAdd: prev[leadId]?.toAdd || [],
        toRemove: [...(prev[leadId]?.toRemove || []), attachmentId]
      }
    }))
    setHasUnsavedChanges(true)
  }

  const deleteAttachment = async (leadId: string, attachmentId: string) => {
    try {
      const response = await apiService.deleteLeadAttachment(leadId, attachmentId)
      
      if (response.success) {
        // Update local state to remove attachment
        setLeads(prev => prev.map(lead => {
          if (lead.id === leadId) {
            const attachments = (lead.attachments || []).filter(a => a.id !== attachmentId)
            return { ...lead, attachments }
          }
          return lead
        }))
      } else {
        pushToast(response.error || 'Failed to delete file', 'error')
      }
    } catch (error) {
      console.error('Error deleting attachment:', error)
      pushToast(t('notifications.errorDeletingFile'), 'error')
    }
  }

  const downloadAttachment = async (leadId: string, attachmentId: string, filename: string) => {
    try {
      const blob = await apiService.getLeadAttachment(leadId, attachmentId)
      
      if (blob) {
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
      console.error('Error downloading attachment:', error)
      pushToast(t('notifications.errorDeletingFile'), 'error')
    }
  }

  const viewAttachment = async (leadId: string, attachmentId: string) => {
    try {
      const blob = await apiService.getLeadAttachment(leadId, attachmentId)
      
      if (blob) {
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
      } else {
        pushToast(t('notifications.errorUploadingFile'), 'error')
      }
    } catch (error) {
      console.error('Error viewing attachment:', error)
      pushToast(t('notifications.errorUploadingFile'), 'error')
    }
  }

  const processPendingAttachments = async (leadId: string) => {
    const pending = pendingAttachments[leadId]
    if (!pending || (pending.toAdd.length === 0 && pending.toRemove.length === 0)) {
      return
    }

    try {
      setUploadingAttachments(prev => ({ ...prev, [leadId]: true }))
      
      // Process deletions first
      for (const attachmentId of pending.toRemove) {
        await deleteAttachment(leadId, attachmentId)
      }
      
      // Process uploads - but don't update local state immediately
      for (const file of pending.toAdd) {
        await uploadAttachmentSilently(leadId, file)
      }
      
      // Refresh the lead data to get updated attachments
      const response = await apiService.getLeadsByStatus()
      if (response.success && response.data) {
        setLeads(response.data.leads)
        updatePipelineStages(response.data.leads)
      }
      
      // Clear pending changes
      setPendingAttachments(prev => {
        const newPending = { ...prev }
        delete newPending[leadId]
        return newPending
      })
      setHasUnsavedChanges(false)
      
    } catch (error) {
      console.error('Error processing pending attachments:', error)
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
    
    // Save original values for change detection
    setOriginalFormValues({
      value: lead.value?.toString() || "",
      expectedCloseDate: lead.estimated_close_date || "",
      notes: lead.description || "",
      interest: lead.interest || ""
    })
    
    setIsEditModalOpen(true)
  }, [])

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return

    // Verificar se estamos no cliente
    if (typeof window === 'undefined') {
      pushToast('Aguarde o carregamento completo da página', 'warning')
      return
    }

    try {
      const updateData: UpdateLeadRequest = {
        id: editingId,
        value: editValue ? parseFloat(editValue) : undefined,
        estimated_close_date: editExpectedCloseDate || undefined,
        description: editNotes || undefined,
        interest: editInterest || undefined
      }

      console.log('Updating lead with data:', updateData)
      const response = await apiService.updateLead(updateData)
      console.log('Update response:', response)
      if (response.success && response.data) {
        setLeads((prev) => {
          const updatedLeads = prev.map((lead) =>
            lead.id === editingId ? response.data!.lead : lead
          )
          updatePipelineStages(updatedLeads)
          return updatedLeads
        })
        
        // Process pending attachments after successful lead update
        await processPendingAttachments(editingId)
        
        pushToast(t('notifications.leadUpdated'), "success")
      } else {
        pushToast(`${t('notifications.errorUpdating')}: ${response.error}`, "error")
      }
    } catch (error) {
      console.error('Error updating lead:', error)
      pushToast(t('notifications.errorUpdating'), "error")
    }

    setIsEditModalOpen(false)
    setEditingId(null)
    setEditValue("")
    setEditExpectedCloseDate("")
    setEditNotes("")
    
    // Clear pending attachments when closing modal
    if (editingId) {
      setPendingAttachments(prev => {
        const newPending = { ...prev }
        delete newPending[editingId]
        return newPending
      })
    }
    setHasUnsavedChanges(false)
  }

  function handleViewLead(lead: Lead) {
    // Redireciona para a página de leads com filtro pelo nome
    const encodedName = encodeURIComponent(lead.name)
    window.location.href = `/${org}/leads?search=${encodedName}`
  }

  // Link lead to user (admin/master only)
  const handleOpenLinkLead = React.useCallback((lead: Lead) => {
    setLinkLeadModal({ open: true, lead })
    
    // Fetch available users
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const response = await apiService.getOrganizationUsers(true)
        if (response.success && response.data?.employees) {
          setAvailableUsers(response.data.employees)
          // Se o lead já tiver um usuário vinculado, usar ele. Caso contrário, selecionar o primeiro da lista
          setSelectedUserId(lead.assigned_user_id || (response.data.employees.length > 0 ? response.data.employees[0].id : ""))
        } else {
          pushToast(t('linkLeadModal.errorLoadingUsers'), 'error')
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        pushToast(t('linkLeadModal.errorLoadingUsers'), 'error')
      } finally {
        setIsLoadingUsers(false)
      }
    }
    
    fetchUsers()
  }, [t])
  
  const handleLinkLead = async () => {
    if (!linkLeadModal.lead || !selectedUserId) {
      pushToast(t('linkLeadModal.selectUserWarning'), 'warning')
      return
    }
    
    setIsLinkingLead(true)
    
    try {
      const response = await apiService.updateLead({
        id: linkLeadModal.lead.id,
        assigned_user_id: selectedUserId
      })
      
      if (response.success && response.data) {
        // Update local state
        setLeads(prev => prev.map(lead => 
          lead.id === linkLeadModal.lead!.id 
            ? { ...lead, assigned_user_id: selectedUserId }
            : lead
        ))
        
        // Update pipeline stages
        setPipelineStages(prev => prev.map(stage => ({
          ...stage,
          leads: stage.leads.map(lead =>
            lead.id === linkLeadModal.lead!.id
              ? { ...lead, assigned_user_id: selectedUserId }
              : lead
          )
        })))
        
        const userName = availableUsers.find(u => u.id === selectedUserId)?.name || t('linkLeadModal.unknownUser')
        pushToast(t('linkLeadModal.success', { leadName: linkLeadModal.lead.name, userName }), 'success')
        setLinkLeadModal({ open: false, lead: null })
        setSelectedUserId("")
      } else {
        pushToast(response.error || t('linkLeadModal.error'), 'error')
      }
    } catch (error) {
      console.error('Error linking lead:', error)
      pushToast(t('linkLeadModal.error'), 'error')
    } finally {
      setIsLinkingLead(false)
    }
  }

  const handleDragStart = React.useCallback((e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = "move"
  }, [])
  
  // Auto-scroll durante drag quando próximo das bordas
  const handlePipelineDragOver = React.useCallback((e: React.DragEvent) => {
    if (!draggedLead || !pipelineScrollRef.current) {
      return
    }
    
    // SEMPRE prevenir default e definir dropEffect para evitar cursor bloqueado
    // Isso é CRÍTICO para evitar o cursor bloqueado
    e.preventDefault()
    // NÃO usar stopPropagation - deixar propagar para as colunas também processarem
    
    try {
      // SEMPRE definir dropEffect como "move" para permitir o drag
      e.dataTransfer.dropEffect = "move"
    } catch (err) {
      // Ignorar erros de dataTransfer
    }
    
    const container = pipelineScrollRef.current
    const containerRect = container.getBoundingClientRect()
    const mouseX = e.clientX
    const scrollThreshold = 80 // pixels da borda para ativar scroll
    const scrollSpeed = 12 // pixels por intervalo
    
    // Verificar se está próximo das bordas
    const distanceFromLeft = mouseX - containerRect.left
    const distanceFromRight = containerRect.right - mouseX
    const isNearLeftEdge = distanceFromLeft < scrollThreshold && distanceFromLeft > 0
    const isNearRightEdge = distanceFromRight < scrollThreshold && distanceFromRight > 0
    const maxScroll = container.scrollWidth - container.clientWidth
    const canScrollLeft = container.scrollLeft > 0
    const canScrollRight = container.scrollLeft < maxScroll
    
    // Só ativar auto-scroll se estiver realmente próximo da borda E puder scrollar
    const shouldScrollLeft = isNearLeftEdge && canScrollLeft
    const shouldScrollRight = isNearRightEdge && canScrollRight
    
    // Limpar intervalo anterior se existir
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }
    
    // Scroll para esquerda
    if (shouldScrollLeft) {
      scrollIntervalRef.current = setInterval(() => {
        if (pipelineScrollRef.current) {
          const currentScroll = pipelineScrollRef.current.scrollLeft
          if (currentScroll > 0) {
            pipelineScrollRef.current.scrollLeft = Math.max(0, currentScroll - scrollSpeed)
          } else {
            if (scrollIntervalRef.current) {
              clearInterval(scrollIntervalRef.current)
              scrollIntervalRef.current = null
            }
          }
        }
      }, 16) // ~60fps
      return
    }
    
    // Scroll para direita
    if (shouldScrollRight) {
      scrollIntervalRef.current = setInterval(() => {
        if (pipelineScrollRef.current) {
          const currentScroll = pipelineScrollRef.current.scrollLeft
          const maxScroll = pipelineScrollRef.current.scrollWidth - pipelineScrollRef.current.clientWidth
          if (currentScroll < maxScroll) {
            pipelineScrollRef.current.scrollLeft = Math.min(maxScroll, currentScroll + scrollSpeed)
          } else {
            if (scrollIntervalRef.current) {
              clearInterval(scrollIntervalRef.current)
              scrollIntervalRef.current = null
            }
          }
        }
      }, 16) // ~60fps
      return
    }
  }, [draggedLead])
  
  // Limpar scroll quando drag terminar
  const handlePipelineDragEnd = React.useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }
  }, [])
  
  // Cleanup ao desmontar
  React.useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
    }
  }, [])

  function handleDragOver(e: React.DragEvent, stageId: string) {
    e.preventDefault()
    
    // Sempre garantir que o dropEffect está correto para evitar cursor bloqueado
    try {
      e.dataTransfer.dropEffect = "move"
    } catch (err) {
      // Ignorar erros de dataTransfer
    }
    
    setDraggedOverStage(stageId)
  }

  function handleDragLeave() {
    setDraggedOverStage(null)
  }

  async function handleDrop(e: React.DragEvent, targetStageId: string) {
    e.preventDefault()
    
    // Limpar auto-scroll
    handlePipelineDragEnd()
    
    if (!draggedLead) return

    // Verificar se estamos no cliente
    if (typeof window === 'undefined') {
      pushToast('Aguarde o carregamento completo da página', 'warning')
      return
    }

    // Encontrar a stage de destino para pegar o slug correto
    const targetStage = pipelineStages.find(stage => stage.id === targetStageId)
    if (!targetStage) {
      pushToast('Stage não encontrada', 'error')
      setDraggedLead(null)
      setDraggedOverStage(null)
      handlePipelineDragEnd() // Limpar auto-scroll
      return
    }

    // Usar o slug da stage como status do lead
    // Para stages do sistema que têm translation_key, manter o formato original
    let newStatus: string
    if (targetStage.translation_key) {
      // Mapeamento para stages do sistema (manter compatibilidade)
      const statusMap: { [key: string]: string } = {
        'new': 'New',
        'contact': 'In Contact',
        'qualified': 'Qualified',
        'lost': 'Lost'
      }
      newStatus = statusMap[targetStage.slug] || targetStage.slug
    } else {
      // Para stages customizadas, usar o slug diretamente
      newStatus = targetStage.slug
    }

    try {
      const updateData: UpdateLeadRequest = {
        id: draggedLead.id,
        status: newStatus
      }

      const response = await apiService.updateLead(updateData)
      if (response.success && response.data) {
        setLeads((prev) => {
          const updatedLeads = prev.map((lead) =>
            lead.id === draggedLead.id ? response.data!.lead : lead
          )
          // Atualiza as colunas do pipeline imediatamente
          updatePipelineStages(updatedLeads)
          return updatedLeads
        })
      
      } else {
        pushToast(t('notifications.errorMovingLead', { error: response.error || 'Unknown error' }), "error")
      }
    } catch (error) {
      console.error('Error moving lead:', error)
      pushToast(t('notifications.errorMovingLeadGeneric'), "error")
    }

    setDraggedLead(null)
    setDraggedOverStage(null)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US')
  }

  // Extract and validate phone number with country code
  const extractPhoneNumber = (lead: Lead): string | null => {
    if (!lead.phone) {
      return null
    }
    
    // If phone already has country code, return as is
    if (lead.phone.startsWith('+')) {
      return lead.phone
    }
    
    // Default to US country code if not specified
    return `+1${lead.phone.replace(/\D/g, '')}`
  }

  // Handle Telegram API selection (when both Bot and Account are available)
  const handleTelegramApiSelection = async (apiType: 'bot' | 'account') => {
    if (!contactModal.lead) return
    
    const phoneNumber = extractPhoneNumber(contactModal.lead)
    setShowTelegramApiSelector(false)
    
    if (apiType === 'bot') {
      // Bot API - check for existing conversations
      setLoadingBotConversations(true)
      try {
        const conversationsResponse = await apiService.getTelegramConversations({ search: phoneNumber || undefined })
        
        if (conversationsResponse.success && conversationsResponse.data?.conversations) {
          const conversations = conversationsResponse.data.conversations
          
          // Check if any conversation is linked to this lead
          const linkedConversations = conversations.filter((conv: any) => conv.lead_id === contactModal.lead?.id)
          
          if (linkedConversations.length > 0) {
            // Found linked conversations - open send message modal with telegram username
            const firstLinkedConv = linkedConversations[0]
            setLinkedTelegramUsername(firstLinkedConv.telegram_username || null)
            setLinkedTelegramConversation(firstLinkedConv)
            setIsUsingBotApi(true)
            setContactModal({ open: false, lead: null })
            setSendMessageModal({ open: true, lead: contactModal.lead, method: 'telegram' })
          } else if (conversations.length > 0) {
            // Found conversations but not linked - show them in a modal
            setBotConversations(conversations)
            setShowBotConversationsModal(true)
          } else {
            // No conversations found - inform user
            setTelegramWarningMessage(`Enquanto o lead ${contactModal.lead?.name} não entrar em contato pelo bot, não é possível iniciar uma conversa.`)
            setShowTelegramWarning(true)
          }
        }
      } catch (error) {
        console.error('Error searching bot conversations:', error)
        pushToast(t('notifications.errorSearchingConversations'), 'error')
      } finally {
        setLoadingBotConversations(false)
        if (!showBotConversationsModal) {
          setContactModal({ open: false, lead: null })
        }
      }
    } else if (apiType === 'account') {
      // Account API - allow starting conversation
      setLinkedTelegramUsername(null)
      setLinkedTelegramConversation(null)
      setIsUsingBotApi(false)
      setContactModal({ open: false, lead: null })
      setSendMessageModal({ open: true, lead: contactModal.lead, method: 'telegram' })
    }
  }

  // Handle contact method selection
  const handleContactMethodSelect = async (method: 'whatsapp' | 'telegram' | 'email') => {
    if (!contactModal.lead) return

    const phoneNumber = extractPhoneNumber(contactModal.lead)
    
    if ((method === 'whatsapp' || method === 'telegram') && !phoneNumber) {
      pushToast(t('notifications.noPhoneNumber'), 'error')
      setContactModal({ open: false, lead: null })
      return
    }

    // Check Telegram configuration
    if (method === 'telegram') {
      const hasActiveAccounts = telegramAccounts.some(acc => acc.is_active)
      const hasActiveBots = telegramBots.some(bot => bot.is_active)

      // First, check for linked conversations
      try {
        // Search conversations by phone number to check if any are linked to this lead
        const conversationsResponse = await apiService.getTelegramConversations({ search: phoneNumber || undefined })
        
        if (conversationsResponse.success && conversationsResponse.data?.conversations) {
          const conversations = conversationsResponse.data.conversations
          // Check if any conversation is linked to this lead
          const linkedConversations = conversations.filter((conv: any) => conv.lead_id === contactModal.lead?.id)
          
          if (linkedConversations.length > 0) {
            // Found linked conversations - determine if Bot API or Account API
            const firstLinkedConv = linkedConversations[0]
            
            // Check if conversation is from Bot API (has bot_id) or Account API (has account_id)
            if (firstLinkedConv.bot_id) {
              // Bot API conversation - use Bot API directly
              setLinkedTelegramUsername(firstLinkedConv.telegram_username || null)
              setLinkedTelegramConversation(firstLinkedConv)
              setIsUsingBotApi(true)
              setContactModal({ open: false, lead: null })
              setSendMessageModal({ open: true, lead: contactModal.lead, method: 'telegram' })
              return
            } else if (firstLinkedConv.account_id) {
              // Account API conversation - use Account API directly
              setLinkedTelegramUsername(firstLinkedConv.telegram_username || null)
              setLinkedTelegramConversation(null)
              setIsUsingBotApi(false)
              setContactModal({ open: false, lead: null })
              setSendMessageModal({ open: true, lead: contactModal.lead, method: 'telegram' })
              return
            }
          }
          
          // No linked conversations found - use account API automatically if available
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
          // No conversations found at all - use account API automatically if available
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
        console.error('Error checking linked conversations:', error)
        // If error and has accounts, use account API
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

      // Both APIs configured but no linked conversations - use Account API (can start new conversations)
      if (hasActiveAccounts && hasActiveBots) {
        setShowNoLinkedConversationWarning(true)
        setLinkedTelegramUsername(null)
        setLinkedTelegramConversation(null)
        setIsUsingBotApi(false)
        setContactModal({ open: false, lead: null })
        setSendMessageModal({ open: true, lead: contactModal.lead, method: 'telegram' })
        return
      }

      // No MTProto accounts configured
      if (!hasActiveAccounts) {
        if (hasActiveBots) {
          // Only bot API configured - need to check for existing conversations
          setLoadingBotConversations(true)
          try {
            // Search conversations by phone number
            const conversationsResponse = await apiService.getTelegramConversations({ search: phoneNumber || undefined })
            
            if (conversationsResponse.success && conversationsResponse.data?.conversations) {
              const conversations = conversationsResponse.data.conversations
              
              // Check if any conversation is linked to this lead
              const linkedConversations = conversations.filter((conv: any) => conv.lead_id === contactModal.lead?.id)
              
              if (linkedConversations.length > 0) {
                // Found linked conversations - open send message modal with telegram username
                const firstLinkedConv = linkedConversations[0]
                setLinkedTelegramUsername(firstLinkedConv.telegram_username || null)
                setLinkedTelegramConversation(firstLinkedConv)
                setIsUsingBotApi(true)
                setContactModal({ open: false, lead: null })
                setSendMessageModal({ open: true, lead: contactModal.lead, method: 'telegram' })
              } else if (conversations.length > 0) {
                // Found conversations but not linked - show them in a modal
                setBotConversations(conversations)
                setShowBotConversationsModal(true)
              } else {
                // No conversations found - inform user
                setTelegramWarningMessage(`A API de Bot do Telegram só pode responder conversas já existentes. Nenhuma conversa foi encontrada para ${contactModal.lead?.name} (${phoneNumber}).`)
                setShowTelegramWarning(true)
              }
            }
          } catch (error) {
            console.error('Error searching bot conversations:', error)
            pushToast(t('notifications.errorSearchingConversations'), 'error')
          } finally {
            setLoadingBotConversations(false)
            setContactModal({ open: false, lead: null })
          }
        } else {
          // No Telegram configured at all
          setTelegramWarningMessage(t('notifications.telegramNotConfigured'))
          setShowTelegramWarning(true)
        }
        return
      }
    }

    // Close contact method modal and open send message modal
    setContactModal({ open: false, lead: null })
    setSendMessageModal({ open: true, lead: contactModal.lead, method })
  }

  // Navigate to chat page with specific contact
  const navigateToChat = (method: 'whatsapp' | 'telegram' | 'email', lead: Lead, conversationId?: string) => {
    const phoneNumber = extractPhoneNumber(lead)
    
    if (method === 'telegram' && phoneNumber) {
      // Navigate to telegram chat page with phone number and optional conversation ID
      const params = new URLSearchParams()
      params.append('phone', phoneNumber)
      if (conversationId) {
        params.append('conversationId', conversationId)
      }
      window.location.href = `/${org}/chats/telegram?${params.toString()}`
    } else if (method === 'whatsapp' && phoneNumber) {
      window.location.href = `/${org}/chats/whatsapp?phone=${encodeURIComponent(phoneNumber)}`
    } else if (method === 'email') {
      window.location.href = `/${org}/chats/email?email=${encodeURIComponent(lead.email)}`
    }
  }

  // Send message only (without opening chat)
  const handleSendMessageOnly = async () => {
    if (!sendMessageModal.lead || !sendMessageModal.method || !messageText.trim()) {
      pushToast(t('notifications.pleaseEnterMessage'), 'warning')
      return
    }

    setIsSendingMessage(true)

    try {
      if (sendMessageModal.method === 'telegram') {
        // Bot API - use linked conversation
        if (isUsingBotApi && linkedTelegramConversation) {
          const response = await apiService.sendTelegramMessage({
            conversation_id: linkedTelegramConversation.id,
            message_text: messageText,
            message_type: 'text'
          })

          if (response.success) {
            pushToast(t('notifications.messageSentTelegram'), 'success')
            
            // Reset state
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
          // Account API - use phone number or username
          if (!selectedAccountId && telegramAccounts.filter((acc) => acc.is_active).length > 0) {
            pushToast(t('notifications.noActiveTelegramAccount'), 'error')
            setIsSendingMessage(false)
            return
          }

          const phoneNumber = extractPhoneNumber(sendMessageModal.lead)
          if (!phoneNumber) {
            pushToast(t('notifications.invalidPhoneNumber'), 'error')
            setIsSendingMessage(false)
            return
          }

          // Use username from linked conversation if available, otherwise use phone number
          const identifier = linkedTelegramUsername ? `@${linkedTelegramUsername}` : phoneNumber

          // Start chat and send message via Telegram Account API
          const response = await apiService.startTelegramAccountChat(
            selectedAccountId || telegramAccounts.find((acc) => acc.is_active)?.id || '',
            identifier,
            messageText
          )

          if (response.success) {
            pushToast(t('notifications.messageSentTelegram'), 'success')
            
            // Reset state
            setSendMessageModal({ open: false, lead: null, method: null })
            setMessageText("")
            setShowNoLinkedConversationWarning(false)
            setLinkedTelegramUsername(null)
            setLinkedTelegramConversation(null)
            setIsUsingBotApi(false)
          } else {
            // Check if error is about user not found
            const errorMessage = response.error || t('notifications.failedToSendMessage')
            if (errorMessage.includes('Usuário não encontrado') || errorMessage.includes('não encontrado')) {
              pushToast(
                `Não foi possível encontrar o usuário no Telegram com o identificador ${identifier}. O número pode ser fictício ou não estar registrado no Telegram.`,
                'error'
              )
            } else {
              pushToast(errorMessage, 'error')
            }
          }
        }
      } else if (sendMessageModal.method === 'whatsapp') {
        // TODO: Implement WhatsApp sending
        pushToast(t('notifications.whatsappComingSoon'), 'warning')
      } else if (sendMessageModal.method === 'email') {
        // TODO: Implement Email sending
        pushToast(t('notifications.emailComingSoon'), 'warning')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      pushToast(t('notifications.errorSendingMessage'), 'error')
    } finally {
      setIsSendingMessage(false)
    }
  }

  // Send message and open chat
  const handleSendMessageAndOpenChat = async () => {
    if (!sendMessageModal.lead || !sendMessageModal.method || !messageText.trim()) {
      pushToast(t('notifications.pleaseEnterMessage'), 'warning')
      return
    }

    setIsSendingMessage(true)

    try {
      if (sendMessageModal.method === 'telegram') {
        // Bot API - use linked conversation
        if (isUsingBotApi && linkedTelegramConversation) {
          const response = await apiService.sendTelegramMessage({
            conversation_id: linkedTelegramConversation.id,
            message_text: messageText,
            message_type: 'text'
          })

          if (response.success) {
            pushToast(t('notifications.messageSentOpeningChat'), 'success')
            
            // Navigate to chat page with conversation ID
            navigateToChat(sendMessageModal.method, sendMessageModal.lead, linkedTelegramConversation.id)
            
            // Reset state
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
          // Account API - use phone number or username
          if (!selectedAccountId && telegramAccounts.filter((acc) => acc.is_active).length > 0) {
            pushToast(t('notifications.noActiveTelegramAccount'), 'error')
            setIsSendingMessage(false)
            return
          }

          const phoneNumber = extractPhoneNumber(sendMessageModal.lead)
          if (!phoneNumber) {
            pushToast(t('notifications.invalidPhoneNumber'), 'error')
            setIsSendingMessage(false)
            return
          }

          // Use username from linked conversation if available, otherwise use phone number
          const identifier = linkedTelegramUsername ? `@${linkedTelegramUsername}` : phoneNumber

          // Start chat and send message via Telegram Account API
          const response = await apiService.startTelegramAccountChat(
            selectedAccountId || telegramAccounts.find((acc) => acc.is_active)?.id || '',
            identifier,
            messageText
          )

          if (response.success) {
            pushToast(t('notifications.messageSentOpeningChat'), 'success')
            
            // Navigate to chat page with conversation ID
            const conversationId = response.data?.conversation?.id
            navigateToChat(sendMessageModal.method, sendMessageModal.lead, conversationId)
            
            // Reset state
            setSendMessageModal({ open: false, lead: null, method: null })
            setMessageText("")
            setShowNoLinkedConversationWarning(false)
            setLinkedTelegramUsername(null)
            setLinkedTelegramConversation(null)
            setIsUsingBotApi(false)
          } else {
            // Check if error is about user not found
            const errorMessage = response.error || t('notifications.failedToSendMessage')
            if (errorMessage.includes('Usuário não encontrado') || errorMessage.includes('não encontrado')) {
              pushToast(
                `Não foi possível encontrar o usuário no Telegram com o identificador ${identifier}. O número pode ser fictício ou não estar registrado no Telegram.`,
                'error'
              )
            } else {
              pushToast(errorMessage, 'error')
            }
          }
        }
      } else if (sendMessageModal.method === 'whatsapp') {
        // TODO: Implement WhatsApp sending
        pushToast(t('notifications.whatsappComingSoon'), 'warning')
        navigateToChat(sendMessageModal.method, sendMessageModal.lead)
        setIsSendingMessage(false)
      } else if (sendMessageModal.method === 'email') {
        // TODO: Implement Email sending
        pushToast(t('notifications.emailComingSoon'), 'warning')
        navigateToChat(sendMessageModal.method, sendMessageModal.lead)
        setIsSendingMessage(false)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      pushToast(t('notifications.errorSendingMessage'), 'error')
      setIsSendingMessage(false)
    }
  }

  // Open chat without sending message
  const handleOpenChatWithoutSending = async () => {
    if (!sendMessageModal.lead || !sendMessageModal.method) return

    if (sendMessageModal.method === 'telegram') {
      // Bot API - use linked conversation if available
      if (isUsingBotApi && linkedTelegramConversation) {
        navigateToChat(sendMessageModal.method, sendMessageModal.lead, linkedTelegramConversation.id)
        return
      }

      // Account API - try to find linked conversation
      const phoneNumber = extractPhoneNumber(sendMessageModal.lead)
      if (!phoneNumber) {
        pushToast(t('notifications.invalidPhoneNumber'), 'error')
        return
      }

      try {
        // Search for linked conversations
        const conversationsResponse = await apiService.getTelegramConversations({ search: phoneNumber })
        
        if (conversationsResponse.success && conversationsResponse.data?.conversations) {
          const conversations = conversationsResponse.data.conversations
          const linkedConversations = conversations.filter((conv: any) => conv.lead_id === sendMessageModal.lead?.id)
          
          if (linkedConversations.length > 0) {
            // Found linked conversation - use it
            const firstLinkedConv = linkedConversations[0]
            navigateToChat(sendMessageModal.method, sendMessageModal.lead, firstLinkedConv.id)
            return
          }
        }
        
        // No linked conversation found - navigate with phone number only
        // The chat page will try to find or create the conversation
        navigateToChat(sendMessageModal.method, sendMessageModal.lead)
      } catch (error) {
        console.error('Error finding conversation:', error)
        // Navigate anyway with phone number
        navigateToChat(sendMessageModal.method, sendMessageModal.lead)
      }
    } else {
      // For other methods (whatsapp, email), just navigate
      navigateToChat(sendMessageModal.method, sendMessageModal.lead)
    }
  }

  const totalValue = leads.reduce((sum, lead) => {
    const value = lead.value
    
    // Tentar converter para número se for string
    const numericValue = typeof value === 'string' ? parseFloat(value) : value
    
    // Só somar se o valor existir, for um número válido E o lead não estiver perdido
    if (numericValue != null && typeof numericValue === 'number' && !isNaN(numericValue) && isFinite(numericValue) && lead.status !== 'Lost') {
      return sum + numericValue
    }
    return sum
  }, 0)
  const totalLeads = leads.length
  
  // Calculate conversion rate based on stage types
  const conversionRate = React.useMemo(() => {
    // Find stages with type 'entry' (initial leads)
    const entryStages = pipelineStages.filter(s => s.stage_type === 'entry')
    const entryLeadsCount = entryStages.reduce((sum, stage) => sum + stage.leads.length, 0)
    
    // Find stages with type 'won' (converted leads)
    const wonStages = pipelineStages.filter(s => s.stage_type === 'won')
    const wonLeadsCount = wonStages.reduce((sum, stage) => sum + stage.leads.length, 0)
    
    // Calculate rate
    if (entryLeadsCount > 0) {
      return Math.round((wonLeadsCount / entryLeadsCount) * 100)
    }
    
    // Fallback to total leads if no entry stages defined
    if (totalLeads > 0 && wonLeadsCount > 0) {
      return Math.round((wonLeadsCount / totalLeads) * 100)
    }
    
    return 0
  }, [pipelineStages, totalLeads])

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset 
          className="overflow-x-hidden"
          onDragOver={(e) => {
            // Garantir dropEffect mesmo quando fora do container do pipeline
            if (draggedLead) {
              e.preventDefault()
              try {
                e.dataTransfer.dropEffect = "move"
              } catch (err) {
                // Ignorar erros
              }
            }
          }}
        >
        {/* HEADER */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/${org}/dashboard`}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${org}/crm`}>
                  CRM
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('pageTitle')} (Kanban)</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* NOTIFICATIONS STACK */}
        {toasts.length > 0 && (
          <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
            {toasts.map((t) => {
              const styles = t.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : t.type === "error"
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-yellow-50 border border-yellow-200 text-yellow-800"
              const closeColor = t.type === "success" ? "text-green-600 hover:text-green-800" : t.type === "error" ? "text-red-600 hover:text-red-800" : "text-yellow-600 hover:text-yellow-800"
              return (
                <div key={t.id} className={`${styles} px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm`}> 
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {t.type === "success" && <CheckCircle2 className="h-4 w-4" />}
                      {t.type === "warning" && <AlertTriangle className="h-4 w-4" />}
                      {t.type === "error" && <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 text-sm leading-5">{t.text}</div>
                    <button
                      onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                      className={`${closeColor} ml-2`}
                      aria-label="Dismiss notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* MAIN */}
        <div 
          className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-x-hidden"
          onDragOver={(e) => {
            // Garantir dropEffect mesmo quando fora do container do pipeline
            if (draggedLead) {
              e.preventDefault()
              try {
                e.dataTransfer.dropEffect = "move"
              } catch (err) {
                // Ignorar erros
              }
            }
          }}
        >
          {/* CONTROLS */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              {/* Filter button */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsFilterOpen(true)}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {t('filterButton')}
                  {(searchTerm || Object.values(filters).some(f => f !== "") || valueRange.min || valueRange.max || dateRange.min || dateRange.max) && (
                    <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                      {[searchTerm, ...Object.values(filters), valueRange.min, valueRange.max, dateRange.min, dateRange.max].filter(f => f && f !== "").length}
                    </span>
                  )}
                </Button>
                {(searchTerm || Object.values(filters).some(f => f !== "") || valueRange.min || valueRange.max || dateRange.min || dateRange.max) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.totalLeads')}</p>
                  <p className="text-2xl font-bold">{totalLeads}</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.totalValue')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.conversionRate')}</p>
                  <p className="text-2xl font-bold">
                    {conversionRate}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* KANBAN BOARD */}
          <div className="flex-1 bg-muted/50 rounded-xl p-4 flex flex-col max-h-[800px] overflow-hidden">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-lg font-semibold">{t('salesPipeline')}</h2>
              {canManageStages && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsStageManagementOpen(true)}
                  className="cursor-pointer"
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  {t('stageManagement.manageStages')}
                </Button>
              )}
            </div>
            
            {pipelineStages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">⏳ Loading pipeline stages...</p>
              </div>
            )}
            
            <div 
              ref={pipelineScrollRef}
              className="pipeline-scroll-container flex gap-4 overflow-x-auto overflow-y-hidden pb-4 flex-1 min-h-0 w-full"
              onDragOver={handlePipelineDragOver}
              onDragEnd={handlePipelineDragEnd}
              onDragLeave={(e) => {
                // Só limpar se realmente saiu do container (não de uma coluna)
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  handlePipelineDragEnd()
                }
              }}
            >
              {filteredStages.map((stage) => {
                const isUncategorized = stage.id === '__uncategorized__'
                
                return (
                <div
                  key={stage.id}
                  className={`rounded-lg border-2 p-3 h-[600px] flex flex-col transition-colors ${
                    isUncategorized
                      ? "border-amber-400 bg-amber-50/50 dark:bg-amber-900/10"
                      : draggedOverStage === stage.id 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  }`}
                  style={{
                    flex: pipelineStages.length <= 4 ? '1 1 0%' : '0 0 auto',
                    minWidth: '280px',
                    width: pipelineStages.length > 4 ? '320px' : 'auto'
                  }}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  title={isUncategorized ? t('stageManagement.uncategorizedTooltip') : ''}
                >
                  <div className="flex-shrink-0 mb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        {isUncategorized && (
                          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        )}
                        {renderStageBadge(stage, "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium")}
                        {isUncategorized && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                                className="h-6 w-6 p-0 cursor-pointer hover:bg-amber-100"
                                title={t('stageManagement.moveAllLeads')}
                              >
                                <Send className="h-3.5 w-3.5 text-amber-600" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                {t('stageManagement.moveAllLeadsTo')}
                          </div>
                              {pipelineStages
                                .filter(s => s.id !== '__uncategorized__')
                                .map(targetStage => (
                                  <DropdownMenuItem
                                    key={targetStage.id}
                                    className="cursor-pointer"
                                    onClick={async () => {
                                      const leadsToMove = stage.leads
                                      if (leadsToMove.length === 0) return
                                      
                                      // Determine new status
                                      let newStatus: string
                                      if (targetStage.translation_key) {
                                        const statusMap: { [key: string]: string } = {
                                          'new': 'New',
                                          'contact': 'In Contact',
                                          'qualified': 'Qualified',
                                          'lost': 'Lost'
                                        }
                                        newStatus = statusMap[targetStage.slug] || targetStage.slug
                                      } else {
                                        newStatus = targetStage.slug
                                      }
                                      
                                      // Batch processing configuration (same as leads page)
                                      const totalLeads = leadsToMove.length
                                      const batchSize = 1000 // Large batches (like leads page)
                                      const totalBatches = Math.ceil(totalLeads / batchSize)
                                      const parallelLimit = 30 // Process 30 leads in parallel within each batch
                                      
                                      // Show progress notification
                                      setBulkMoveNotification({
                                        show: true,
                                        progress: { current: 0, total: totalLeads, batch: 0, totalBatches }
                                      })
                                      
                                      try {
                                        let successCount = 0
                                        const failedUpdates: Array<{ lead: Lead, error: string }> = []
                                        
                                        // Process batches
                                        for (let i = 0; i < totalBatches; i++) {
                                          const startIndex = i * batchSize
                                          const endIndex = Math.min(startIndex + batchSize, totalLeads)
                                          const batch = leadsToMove.slice(startIndex, endIndex)
                                          
                                          // Update progress
                                          setBulkMoveNotification({
                                            show: true,
                                            progress: {
                                              current: startIndex,
                                              total: totalLeads,
                                              batch: i + 1,
                                              totalBatches
                                            }
                                          })
                                          
                                          // Process batch in controlled parallel chunks
                                          for (let j = 0; j < batch.length; j += parallelLimit) {
                                            const chunk = batch.slice(j, j + parallelLimit)
                                            const leadIndex = startIndex + j
                                            
                                            // Update progress for chunk
                                            setBulkMoveNotification({
                                              show: true,
                                              progress: {
                                                current: leadIndex,
                                                total: totalLeads,
                                                batch: i + 1,
                                                totalBatches
                                              }
                                            })
                                            
                                            // Prepare updates for this chunk with retry
                                            const chunkPromises = chunk.map(async (lead) => {
                                              const updateData: any = {
                                                id: lead.id,
                                                status: newStatus
                                              }
                                              return updateLeadWithRetry(lead, updateData, 5)
                                            })
                                            
                                            const chunkResults = await Promise.all(chunkPromises)
                                            
                                            // Collect results
                                            chunkResults.forEach(result => {
                                              if (result.success) {
                                                successCount++
                                              } else {
                                                failedUpdates.push({ lead: result.lead, error: result.error || 'Unknown error' })
                                              }
                                            })
                                            
                                            // Small delay to prevent server overload
                                            if (j + parallelLimit < batch.length) {
                                              await new Promise(resolve => setTimeout(resolve, 20))
                                            }
                                          }
                                        }
                                        
                                        // Retry failed updates if any
                                        if (failedUpdates.length > 0) {
                                          pushToast(`Retrying ${failedUpdates.length} failed updates...`, "warning", 2000)
                                          
                                          for (let k = 0; k < failedUpdates.length; k += parallelLimit) {
                                            const retryChunk = failedUpdates.slice(k, k + parallelLimit)
                                            const retryPromises = retryChunk.map(({ lead }) => {
                                              const updateData: any = {
                                                id: lead.id,
                                                status: newStatus
                                              }
                                              return updateLeadWithRetry(lead, updateData, 5)
                                            })
                                            
                                            const retryResults = await Promise.all(retryPromises)
                                            
                                            retryResults.forEach(result => {
                                              if (result.success) {
                                                successCount++
                                                // Remove from failedUpdates
                                                const index = failedUpdates.findIndex(f => f.lead.id === result.lead.id)
                                                if (index !== -1) failedUpdates.splice(index, 1)
                                              }
                                            })
                                          }
                                        }
                                        
                                        // Update local leads state and redistribute
                                        setLeads(prev => {
                                          const updatedLeads = prev.map(lead => {
                                            const movedLead = leadsToMove.find(l => l.id === lead.id)
                                            if (movedLead) {
                                              return { ...lead, status: newStatus }
                                            }
                                            return lead
                                          })
                                          
                                          // Re-distribute leads immediately with updated state
                                          updatePipelineStages(updatedLeads)
                                          
                                          return updatedLeads
                                        })
                                        
                                        // Show final result
                                        if (failedUpdates.length > 0) {
                                          pushToast(
                                            t('stageManagement.migration.partialSuccess', {
                                              success: successCount,
                                              errors: failedUpdates.length
                                            }),
                                            'warning'
                                          )
                                        } else {
                                          pushToast(
                                            t('stageManagement.leadsMoved', {
                                              count: successCount,
                                              stageName: targetStage.name
                                            }),
                                            'success'
                                          )
                                        }
                                      } catch (error) {
                                        console.error('Error moving leads:', error)
                                        pushToast(t('stageManagement.errorMigrating'), 'error')
                                      } finally {
                                        setBulkMoveNotification({
                                          show: false,
                                          progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }
                                        })
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1">
                                        {targetStage.name}
                          </div>
                                    </div>
                                  </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                            </div>
                      <div className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">
                        {stage.leads.length}
                          </div>
                    </div>
                    {isUncategorized && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 leading-tight">
                        {t('stageManagement.uncategorizedTooltip')}
                      </p>
                        )}
                      </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {stage.filteredLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onDragStart={handleDragStart}
                        onContact={handleContactLead}
                        onPreview={handlePreviewLead}
                        onEdit={handleEdit}
                        onLinkLead={canManageStages ? handleOpenLinkLead : undefined}
                        userRole={userRole}
                        locale={locale}
                      />
                    ))}
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>


        {/* PREVIEW MODAL - MODERN DESIGN */}
        <Sheet open={preview.open} onOpenChange={(open) => setPreview({ open, lead: open ? preview.lead : null })}>
          <SheetContent className="w-full sm:max-w-3xl border-l border-border p-0 overflow-y-auto overflow-x-hidden">
            {preview.lead && (
              <>
                <SheetTitle className="sr-only">Lead Details: {preview.lead.name}</SheetTitle>
                <SheetDescription className="sr-only">Complete information about the lead including contact details, business information, and metadata.</SheetDescription>
                {/* Header */}
                <div className="sticky top-0 z-10 bg-background border-b p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-6 w-6 flex-shrink-0" />
                        <h2 className="text-2xl font-bold break-words">{preview.lead.name}</h2>
                      </div>
                      <p className="text-muted-foreground text-sm">{t('preview.headerDescription')}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 flex-shrink-0 cursor-pointer"
                      onClick={() => setPreview({ open: false, lead: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium capitalize">{preview.lead.status}</span>
                    </div>
                    {preview.lead.value && (
                      <div className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
                        <span className="text-sm font-medium">
                          {formatCurrency(preview.lead.value)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Contact Information Card */}
                  <div className="bg-muted/50 rounded-xl p-5 border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Mail className="h-5 w-5 flex-shrink-0" />
                      {t('preview.contactInfo.title')}
                    </h3>
                    <div className="grid gap-3">
                      {preview.lead.email && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">{t('preview.contactInfo.email')}</p>
                              <p className="text-sm font-medium truncate">{preview.lead.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0 cursor-pointer"
                            onClick={() => {
                              navigator.clipboard.writeText(preview.lead?.email || '')
                              setCopiedKey('email')
                              setTimeout(() => setCopiedKey(null), 2000)
                            }}
                          >
                            {copiedKey === 'email' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                      
                      {preview.lead.phone && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">{t('preview.contactInfo.phone')}</p>
                              <p className="text-sm font-medium truncate">{preview.lead.phone}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0 cursor-pointer"
                            onClick={() => {
                              navigator.clipboard.writeText(preview.lead?.phone || '')
                              setCopiedKey('phone')
                              setTimeout(() => setCopiedKey(null), 2000)
                            }}
                          >
                            {copiedKey === 'phone' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Business Information Card */}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0 cursor-pointer"
                              onClick={() => {
                                navigator.clipboard.writeText(preview.lead?.ssn || '')
                                setCopiedKey('ssn')
                                setTimeout(() => setCopiedKey(null), 2000)
                              }}
                            >
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0 cursor-pointer"
                              onClick={() => {
                                navigator.clipboard.writeText(preview.lead?.ein || '')
                                setCopiedKey('ein')
                                setTimeout(() => setCopiedKey(null), 2000)
                              }}
                            >
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0 cursor-pointer"
                              onClick={() => {
                                navigator.clipboard.writeText(preview.lead?.source || '')
                                setCopiedKey('source')
                                setTimeout(() => setCopiedKey(null), 2000)
                              }}
                            >
                              {copiedKey === 'source' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Deal Information Card */}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0 cursor-pointer"
                            onClick={() => {
                              navigator.clipboard.writeText(formatDate(preview.lead?.estimated_close_date || ''))
                              setCopiedKey('close_date')
                              setTimeout(() => setCopiedKey(null), 2000)
                            }}
                          >
                            {copiedKey === 'close_date' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Location & Interest Card */}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0 cursor-pointer"
                              onClick={() => {
                                navigator.clipboard.writeText(preview.lead?.location || '')
                                setCopiedKey('location')
                                setTimeout(() => setCopiedKey(null), 2000)
                              }}
                            >
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0 cursor-pointer"
                              onClick={() => {
                                navigator.clipboard.writeText(preview.lead?.interest || '')
                                setCopiedKey('interest')
                                setTimeout(() => setCopiedKey(null), 2000)
                              }}
                            >
                              {copiedKey === 'interest' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description Card */}
                  {preview.lead.description && (
                    <div className="bg-muted/50 rounded-xl p-5 border">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Info className="h-5 w-5 flex-shrink-0" />
                          {t('preview.description.title')}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 flex-shrink-0 cursor-pointer"
                          onClick={() => {
                            navigator.clipboard.writeText(preview.lead?.description || '')
                            setCopiedKey('description')
                            setTimeout(() => setCopiedKey(null), 2000)
                          }}
                        >
                          {copiedKey === 'description' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="bg-background rounded-lg p-4 border overflow-hidden">
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{preview.lead.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {preview.lead.attachments && preview.lead.attachments.length > 0 && (
                    <div className="bg-muted/50 rounded-xl p-5 border">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <File className="h-5 w-5 flex-shrink-0" />
                        {t('preview.attachments.title')}
                      </h3>
                      <div className="space-y-2">
                        {preview.lead.attachments.map((attachment) => {
                          if (!attachment || !attachment.id || !attachment.mimeType) {
                            console.warn('Invalid attachment object:', attachment)
                            return null
                          }
                          const FileIcon = getFileIcon(attachment.mimeType)
                          return (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-accent/50 transition-colors overflow-hidden"
                            >
                              <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {attachment.originalName || t('preview.attachments.unknownFile')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(attachment.size || 0)} • {attachment.uploadedAt ? formatDate(attachment.uploadedAt) : t('preview.attachments.unknownDate')}
                                </p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="cursor-pointer h-8 w-8 p-0"
                                  onClick={() => viewAttachment(preview.lead!.id, attachment.id)}
                                  title={t('preview.attachments.viewFile')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="cursor-pointer h-8 w-8 p-0"
                                  onClick={() => downloadAttachment(preview.lead!.id, attachment.id, attachment.originalName || 'file')}
                                  title={t('preview.attachments.downloadFile')}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        setPreview({ open: false, lead: null })
                        if (preview.lead) {
                          handleViewLead(preview.lead)
                        }
                      }}
                      className="flex-1 cursor-pointer"
                    >
                      <Eye className="h-4 w-4 mr-2 flex-shrink-0" />
                      {t('preview.actions.viewCompleteList')}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setPreview({ open: false, lead: null })}
                      className="cursor-pointer"
                    >
                      {t('preview.actions.close')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* EDIT MODAL */}
        <Sheet open={isEditModalOpen} onOpenChange={(open) => {
          if (!open) {
            if (unsavedChangesToast.show) {
              // User clicked outside again after seeing the toast
              confirmDiscardChanges()
            } else {
              handleModalClose()
            }
          } else {
            setIsEditModalOpen(open)
          }
        }}>
          <SheetContent 
            className="w-full sm:max-w-md border-l border-border p-6 md:p-8 flex flex-col max-h-screen"
            onDragOver={handleAttachmentDragOver}
            onDragLeave={handleAttachmentDragLeave}
            onDrop={(e) => editingId && handleAttachmentDrop(e, editingId)}
          >
            <div className="flex-shrink-0">
              <SheetHeader>
                <SheetTitle>{t('editModal.title')}</SheetTitle>
                <SheetDescription>
                  {t('editModal.description')}
                </SheetDescription>
              </SheetHeader>
              <Separator className="my-4" />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t('editModal.dealValue')} ({locale === 'pt-BR' ? 'R$' : '$'})
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('editModal.expectedCloseDate')}</label>
                  <Input
                    type="date"
                    value={editExpectedCloseDate}
                    onChange={(e) => setEditExpectedCloseDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t('editModal.notes')}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({editNotes.length}/500)
                    </span>
                  </label>
                  <textarea
                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none min-h-[80px] max-h-[200px] overflow-y-auto"
                    placeholder={t('editModal.notesPlaceholder')}
                    value={editNotes}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setEditNotes(e.target.value)
                      }
                    }}
                    maxLength={500}
                    rows={4}
                  />
                  {editNotes.length >= 450 && (
                    <p className="text-xs text-amber-600 mt-1">
                      {500 - editNotes.length} {t('editModal.charactersRemaining')}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('editModal.interest')}</label>
                  <Input
                    type="text"
                    placeholder={t('editModal.interestPlaceholder')}
                    value={editInterest}
                    onChange={(e) => setEditInterest(e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Attachments Section */}
              {editingId && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-muted-foreground">{t('editModal.attachments')}</h3>
                      {(() => {
                        const lead = leads.find(l => l.id === editingId)
                        const attachments = lead?.attachments || []
                        const pending = pendingAttachments[editingId]
                        const pendingToAdd = pending?.toAdd || []
                        const pendingToRemove = pending?.toRemove || []
                        const visibleAttachments = attachments.filter(att => !pendingToRemove.includes(att.id))
                        const hasAnyAttachments = visibleAttachments.length > 0 || pendingToAdd.length > 0
                        
                        if (hasAnyAttachments) {
                          return (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => attachmentFileInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {t('editModal.addFiles')}
                            </Button>
                          )
                        }
                        return null
                      })()}
                    </div>
                    
                    <input
                      ref={attachmentFileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleAttachmentFileSelect(e, editingId)}
                    />
                    
                    {/* Upload Zone - Conditional display */}
                    {(() => {
                      const lead = leads.find(l => l.id === editingId)
                      const attachments = lead?.attachments || []
                      const pending = pendingAttachments[editingId]
                      const pendingToAdd = pending?.toAdd || []
                      const pendingToRemove = pending?.toRemove || []
                      const visibleAttachments = attachments.filter(att => !pendingToRemove.includes(att.id))
                      const hasAnyAttachments = visibleAttachments.length > 0 || pendingToAdd.length > 0
                      
                      if (!hasAnyAttachments) {
                        return (
                          <div
                            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
                              isAttachmentDragActive
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                            }`}
                            onDragOver={handleAttachmentDragOver}
                            onDragLeave={handleAttachmentDragLeave}
                            onDrop={(e) => handleAttachmentDrop(e, editingId)}
                            onClick={() => attachmentFileInputRef.current?.click()}
                          >
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
                                    <p className="text-sm font-medium">
                                      {t('editModal.dragDropFiles')}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {t('editModal.orClickBrowse')}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}

                    {/* Existing Attachments */}
                    {(() => {
                      const lead = leads.find(l => l.id === editingId)
                      const attachments = lead?.attachments || []
                      const pending = pendingAttachments[editingId]
                      const pendingToAdd = pending?.toAdd || []
                      const pendingToRemove = pending?.toRemove || []
                      
                      // Filter out attachments that are marked for removal
                      const visibleAttachments = attachments.filter(att => !pendingToRemove.includes(att.id))
                      
                      if (visibleAttachments.length === 0 && pendingToAdd.length === 0) {
                        return null
                      }
                      
                      return (
                        <div className="space-y-2">
                          {/* Existing attachments */}
                          {visibleAttachments.map((attachment) => {
                            // Add safety checks for attachment properties
                            if (!attachment || !attachment.id || !attachment.mimeType) {
                              console.warn('Invalid attachment object:', attachment)
                              return null
                            }
                            
                            const FileIcon = getFileIcon(attachment.mimeType)
                            return (
                              <div
                                key={attachment.id}
                                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                              >
                                <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {attachment.originalName || t('editModal.unknownFile')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(attachment.size || 0)}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="cursor-pointer text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeAttachmentFromPending(editingId, attachment.id)
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          })}
                          
                          {/* Pending files to add */}
                          {pendingToAdd.map((file, index) => (
                            <div
                              key={`pending-${index}`}
                              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="cursor-pointer text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPendingAttachments(prev => ({
                                    ...prev,
                                    [editingId]: {
                                      toAdd: prev[editingId]?.toAdd.filter((_, i) => i !== index) || [],
                                      toRemove: prev[editingId]?.toRemove || []
                                    }
                                  }))
                                }}
                              >
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
                <Button type="submit" className="flex-1 cursor-pointer">
                  {t('editModal.save')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    // Close toast if it's showing
                    setUnsavedChangesToast({ show: false, message: '' })
                    setIsEditModalOpen(false)
                    setEditingId(null)
                    setEditValue("")
                    setEditExpectedCloseDate("")
                    setEditNotes("")
                    // Clear pending attachments when closing modal
                    if (editingId) {
                      setPendingAttachments(prev => {
                        const newPending = { ...prev }
                        delete newPending[editingId]
                        return newPending
                      })
                    }
                    setHasUnsavedChanges(false)
                    setOriginalFormValues(null)
                  }} 
                  className="cursor-pointer"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t('editModal.cancel')}
                </Button>
              </div>
            </form>
            </div>
          </SheetContent>
        </Sheet>

        {/* FILTER MODAL */}
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-0 flex flex-col overflow-hidden">
            <div className="p-6 md:p-8 border-b">
              <SheetHeader>
                <SheetTitle>{t('filterModal.title')}</SheetTitle>
                <SheetDescription>{t('filterModal.description')}</SheetDescription>
              </SheetHeader>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="space-y-4">
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.name')}</label>
                <Input
                  placeholder={t('filterModal.namePlaceholder')}
                  value={filters.name}
                  onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.email')}</label>
                <Input
                  placeholder={t('filterModal.emailPlaceholder')}
                  value={filters.email}
                  onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.phone')}</label>
                <Input
                  placeholder={t('filterModal.phonePlaceholder')}
                  value={filters.phone}
                  onChange={(e) => setFilters(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.ssn')}</label>
                <Input
                  placeholder={t('filterModal.ssnPlaceholder')}
                  value={filters.ssn}
                  onChange={(e) => setFilters(prev => ({ ...prev, ssn: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.ein')}</label>
                <Input
                  placeholder={t('filterModal.einPlaceholder')}
                  value={filters.ein}
                  onChange={(e) => setFilters(prev => ({ ...prev, ein: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.source')}</label>
                <Input
                  placeholder={t('filterModal.sourcePlaceholder')}
                  value={filters.source}
                  onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.location')}</label>
                <Input
                  placeholder={t('filterModal.locationPlaceholder')}
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.interest')}</label>
                <Input
                  placeholder={t('filterModal.interestPlaceholder')}
                  value={filters.interest}
                  onChange={(e) => setFilters(prev => ({ ...prev, interest: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.status')}</label>
                <select
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
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
                  <Input
                    type="number"
                    placeholder={t('filterModal.minValue')}
                    value={valueRange.min}
                    onChange={(e) => setValueRange(prev => ({ ...prev, min: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder={t('filterModal.maxValue')}
                    value={valueRange.max}
                    onChange={(e) => setValueRange(prev => ({ ...prev, max: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">{t('filterModal.closeDateRange')}</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="date"
                      placeholder={t('filterModal.fromDate')}
                      value={dateRange.min}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (validateDate(value)) {
                          setDateRange(prev => ({ ...prev, min: value }));
                        }
                      }}
                      className={!validateDate(dateRange.min) ? "border-red-500" : ""}
                    />
                    {!validateDate(dateRange.min) && dateRange.min && (
                      <p className="text-xs text-red-500 mt-1">{t('filterModal.yearValidation')}</p>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="date"
                      placeholder={t('filterModal.toDate')}
                      value={dateRange.max}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (validateDate(value)) {
                          setDateRange(prev => ({ ...prev, max: value }));
                        }
                      }}
                      className={!validateDate(dateRange.max) ? "border-red-500" : ""}
                    />
                    {!validateDate(dateRange.max) && dateRange.max && (
                      <p className="text-xs text-red-500 mt-1">{t('filterModal.yearValidation')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </div>
            
            {/* Fixed Action Buttons */}
            <div className="flex-shrink-0 border-t p-6 md:p-8">
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    applyModalFilters()
                    setIsFilterOpen(false)
                  }}
                  className="flex-1 cursor-pointer"
                >
                  {t('filterModal.applyFilter')}
                </Button>
                <Button
                  onClick={() => {
                    clearFilters()
                    setIsFilterOpen(false)
                  }}
                  variant="outline"
                  className="flex-1 cursor-pointer"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t('filterModal.clearAll')}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* UNSAVED CHANGES TOAST NOTIFICATION */}
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

        {/* TELEGRAM WARNING MODAL */}
        <Sheet open={showTelegramWarning} onOpenChange={(open) => {
          setShowTelegramWarning(open)
          if (!open) {
            setTelegramWarningMessage("")
          }
        }}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Telegram Configuration Required
              </SheetTitle>
              <SheetDescription>
                Telegram needs to be configured before you can contact leads
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            
            <div className="space-y-4">
              {/* Warning message */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 leading-relaxed">
                  {telegramWarningMessage}
                </p>
              </div>

              {/* Information box */}
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
              <Button
                onClick={() => {
                  window.location.href = `/${org}/settings/telegram`
                }}
                className="flex-1 cursor-pointer"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Go to Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTelegramWarning(false)
                  setTelegramWarningMessage("")
                }}
                className="cursor-pointer"
              >
                Close
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* CONTACT METHOD SELECTION MODAL */}
        <Sheet open={contactModal.open} onOpenChange={(open) => setContactModal({ open, lead: contactModal.lead })}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">
            <SheetHeader>
              <SheetTitle>{t('contactModal.title')}</SheetTitle>
              <SheetDescription>
                {t('contactModal.description')} {contactModal.lead?.name}
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            
            <div className="space-y-3">
              {/* WhatsApp Option */}
              <Button
                onClick={() => handleContactMethodSelect('whatsapp')}
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4 cursor-pointer hover:bg-green-50 hover:border-green-200"
                disabled={!contactModal.lead?.phone}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{t('contactModal.whatsapp')}</div>
                  <div className="text-xs text-muted-foreground">
                    {contactModal.lead?.phone || t('contactModal.noPhone')}
                  </div>
                </div>
              </Button>

              {/* Telegram Option */}
              <Button
                onClick={() => handleContactMethodSelect('telegram')}
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4 cursor-pointer hover:bg-blue-50 hover:border-blue-200"
                disabled={!contactModal.lead?.phone}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  telegramAccounts.some(acc => acc.is_active) ? 'bg-blue-100' : 'bg-yellow-100'
                }`}>
                  {telegramAccounts.some(acc => acc.is_active) ? (
                    <Send className="h-5 w-5 text-blue-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold flex items-center gap-2">
                    {t('contactModal.telegram')}
                    {!telegramAccounts.some(acc => acc.is_active) && (
                      <span className="text-xs font-normal text-yellow-600">{t('contactModal.setupRequired')}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {contactModal.lead?.phone || t('contactModal.noPhone')}
                  </div>
                </div>
              </Button>

              {/* Email Option */}
              <Button
                onClick={() => handleContactMethodSelect('email')}
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4 cursor-pointer hover:bg-purple-50 hover:border-purple-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{t('contactModal.email')}</div>
                  <div className="text-xs text-muted-foreground">
                    {contactModal.lead?.email}
                  </div>
                </div>
              </Button>
            </div>

            <Separator className="my-4" />
            
            <Button
              variant="outline"
              onClick={() => setContactModal({ open: false, lead: null })}
              className="w-full cursor-pointer"
            >
              {t('contactModal.cancel')}
            </Button>
          </SheetContent>
        </Sheet>

        {/* SEND MESSAGE MODAL */}
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
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8 flex flex-col max-h-screen">
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
              
              {/* Warning when no linked conversations found */}
              {showNoLinkedConversationWarning && sendMessageModal.method === 'telegram' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex gap-2">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Nenhuma conversa vinculada detectada</p>
                      <p className="text-xs">
                        Não foram detectadas conversas vinculadas ao lead {sendMessageModal.lead?.name}. 
                        Portanto, será usada a conta do Telegram para enviar mensagem ao cliente.
                      </p>
                      <p className="text-xs mt-2 font-medium">
                        ⚠️ Nota: Se o número de telefone for fictício ou não estiver registrado no Telegram, a mensagem não será enviada.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {/* Contact Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    sendMessageModal.method === 'whatsapp' ? 'bg-green-100' :
                    sendMessageModal.method === 'telegram' ? 'bg-blue-100' :
                    'bg-purple-100'
                  }`}>
                    {sendMessageModal.method === 'whatsapp' && <Phone className="h-5 w-5 text-green-600" />}
                    {sendMessageModal.method === 'telegram' && <Send className="h-5 w-5 text-blue-600" />}
                    {sendMessageModal.method === 'email' && <Mail className="h-5 w-5 text-purple-600" />}
                  </div>
                  <div>
                    <div className="font-semibold">{sendMessageModal.lead.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {sendMessageModal.method === 'email' 
                        ? sendMessageModal.lead.email 
                        : extractPhoneNumber(sendMessageModal.lead)}
                    </div>
                    {sendMessageModal.method === 'telegram' && linkedTelegramUsername && (
                      <div className="text-xs text-muted-foreground mt-1">
                        @{linkedTelegramUsername}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Telegram Account Selection (only for Telegram Account API, not Bot API) */}
              {sendMessageModal.method === 'telegram' && !isUsingBotApi && telegramAccounts.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('sendMessageModal.accountLabel')}</label>
                  <select
                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                  >
                    {telegramAccounts
                      .filter((acc) => acc.is_active)
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.phone_number}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Message Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('sendMessageModal.title')}</label>
                <textarea
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none min-h-[120px]"
                  placeholder={t('sendMessageModal.messagePlaceholder')}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={6}
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={handleSendMessageOnly}
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  disabled={!messageText.trim() || isSendingMessage}
                >
                  {isSendingMessage ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {t('sendMessageModal.sendOnly')}
                </Button>
                <Button
                  onClick={handleSendMessageAndOpenChat}
                  className="flex-1 cursor-pointer"
                  disabled={!messageText.trim() || isSendingMessage}
                >
                  {isSendingMessage ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {t('sendMessageModal.sendAndOpenChat')}
                </Button>
              </div>
              
              <Button
                variant="ghost"
                onClick={handleOpenChatWithoutSending}
                className="w-full cursor-pointer"
                disabled={isSendingMessage}
                title={t('sendMessageModal.openChatWithoutSendingTitle')}
              >
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

        {/* STAGE MANAGEMENT MODAL */}
        <Sheet open={isStageManagementOpen} onOpenChange={setIsStageManagementOpen}>
          <SheetContent className="w-full sm:max-w-2xl border-l border-border p-6 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t('stageManagement.title')}</SheetTitle>
              <SheetDescription>{t('stageManagement.description')}</SheetDescription>
            </SheetHeader>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              {/* Add Stage Button */}
              <Button
                onClick={() => openStageForm()}
                className="w-full cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('stageManagement.addStage')}
              </Button>

              {/* Stages List */}
              <div className="space-y-2">
                {pipelineStages
                  .filter(stage => stage.id !== '__uncategorized__') // Exclude virtual "Uncategorized" stage
                  .map((stage) => (
                  <div
                    key={stage.id}
                    draggable
                    onDragStart={(e) => handleStageDragStart(e, stage)}
                    onDragOver={(e) => handleStageDragOver(e, stage.id)}
                    onDragLeave={handleStageDragLeave}
                    onDrop={(e) => handleStageDrop(e, stage)}
                    className={`border rounded-lg p-4 cursor-move transition-all ${
                      draggedOverStageId === stage.id
                        ? 'border-primary bg-primary/5 scale-105'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex flex-col gap-1">
                          <Hash className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          {renderStageBadge(stage)}
                          <div className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md flex-shrink-0">
                            {stage.leads.length}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStageForm(stage)}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStage(stage)}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* STAGE FORM MODAL (Create/Edit) - 100% Isolated with its own state */}
        <StageFormModal
          isOpen={isStageFormOpen}
          onClose={closeStageForm}
          editingStage={editingStage}
          onSave={handleSaveStage}
          isSaving={isSavingStage}
          t={t}
        />

        {/* DELETE STAGE CONFIRMATION MODAL */}
        <Sheet open={!!isDeletingStage} onOpenChange={(open) => !open && setIsDeletingStage(null)}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                {t('stageManagement.confirmDelete')}
              </SheetTitle>
            </SheetHeader>
            
            <Separator className="my-4" />
            
            {isDeletingStage && (
              <div className="space-y-4">
                <p className="text-sm">
                  {t('stageManagement.confirmDeleteMessage', { name: isDeletingStage.name })}
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {t('stageManagement.confirmDeleteWarning')}
                  </p>
                </div>
              </div>
            )}
            
            <Separator className="my-4" />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeletingStage(null)}
                className="flex-1 cursor-pointer"
                disabled={isSavingStage}
              >
                {t('stageManagement.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteStage}
                className="flex-1 cursor-pointer"
                disabled={isSavingStage}
              >
                {isSavingStage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('stageManagement.deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('stageManagement.delete')}
                  </>
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* LEAD MIGRATION MODAL (when deleting stage with leads) */}
        <Sheet open={migrationModal.open} onOpenChange={(open) => !open && setMigrationModal({ open: false, stage: null, targetStageId: null, action: null })}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                {t('stageManagement.migration.title')}
              </SheetTitle>
              <SheetDescription>
                {t('stageManagement.migration.description')}
              </SheetDescription>
            </SheetHeader>
            
            <Separator className="my-4" />
            
            {migrationModal.stage && (
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {t('stageManagement.migration.warning', { 
                      count: migrationModal.stage.leads.length,
                      stageName: migrationModal.stage.name 
                    })}
                  </p>
                </div>

                {/* Action Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">{t('stageManagement.migration.selectAction')}</label>
                  
                  {/* Move to another stage */}
                  <div
                    onClick={() => setMigrationModal(prev => ({ ...prev, action: 'move' }))}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      migrationModal.action === 'move'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        migrationModal.action === 'move' ? 'border-primary' : 'border-muted-foreground'
                      }`}>
                        {migrationModal.action === 'move' && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{t('stageManagement.migration.moveLeads')}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('stageManagement.migration.moveLeadsDescription')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Target stage selection */}
                  {migrationModal.action === 'move' && (
                    <div className="ml-7 space-y-2">
                      <label className="text-sm font-medium">{t('stageManagement.migration.targetStage')}</label>
                      <select
                        className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-10 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        value={migrationModal.targetStageId || ''}
                        onChange={(e) => setMigrationModal(prev => ({ ...prev, targetStageId: e.target.value }))}
                      >
                        <option value="">{t('stageManagement.migration.selectTargetStagePlaceholder')}</option>
                        {pipelineStages
                          .filter(s => s.id !== migrationModal.stage?.id && s.id !== '__uncategorized__')
                          .map(stage => (
                            <option key={stage.id} value={stage.id}>
                              {stage.translation_key 
                                ? t(stage.translation_key.replace('Pipeline.', ''))
                                : stage.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Move to Uncategorized */}
                  <div
                    onClick={() => setMigrationModal(prev => ({ ...prev, action: 'uncategorize', targetStageId: null }))}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      migrationModal.action === 'uncategorize'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        migrationModal.action === 'uncategorize' ? 'border-primary' : 'border-muted-foreground'
                      }`}>
                        {migrationModal.action === 'uncategorize' && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{t('stageManagement.migration.moveToUncategorized')}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('stageManagement.migration.moveToUncategorizedDescription')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Remove stage only */}
                  <div
                    onClick={() => setMigrationModal(prev => ({ ...prev, action: 'remove', targetStageId: null }))}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      migrationModal.action === 'remove'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        migrationModal.action === 'remove' ? 'border-primary' : 'border-muted-foreground'
                      }`}>
                        {migrationModal.action === 'remove' && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{t('stageManagement.migration.removeStageOnly')}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('stageManagement.migration.removeStageOnlyDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <Separator className="my-4" />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setMigrationModal({ open: false, stage: null, targetStageId: null, action: null })}
                className="flex-1 cursor-pointer"
                disabled={isSavingStage}
              >
                {t('stageManagement.cancel')}
              </Button>
              <Button
                onClick={confirmLeadMigration}
                className="flex-1 cursor-pointer"
                disabled={isSavingStage || !migrationModal.action}
              >
                {isSavingStage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('stageManagement.processing')}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t('stageManagement.confirm')}
                  </>
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* LINK LEAD TO USER MODAL (Admin/Master only) */}
        <Sheet open={linkLeadModal.open} onOpenChange={(open) => !open && setLinkLeadModal({ open: false, lead: null })}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6">
            <SheetHeader>
              <SheetTitle>{t('linkLeadModal.title')}</SheetTitle>
              <SheetDescription>
                {t('linkLeadModal.description', { leadName: linkLeadModal.lead?.name || '' })}
              </SheetDescription>
            </SheetHeader>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              {/* User Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('linkLeadModal.selectUser')}</label>
                {isLoadingUsers ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('linkLeadModal.loadingUsers')}
                  </div>
                ) : (
                  <select
                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-10 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {/* Current Assignment Info */}
              {linkLeadModal.lead?.assigned_user_id && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    {t('linkLeadModal.currentlyAssigned')}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    {availableUsers.find(u => u.id === linkLeadModal.lead?.assigned_user_id)?.name || t('linkLeadModal.unknownUser')}
                  </p>
                </div>
              )}
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLinkLeadModal({ open: false, lead: null })}
                className="flex-1 cursor-pointer"
                disabled={isLinkingLead}
              >
                {t('linkLeadModal.cancel')}
              </Button>
              <Button
                onClick={handleLinkLead}
                disabled={isLinkingLead || !selectedUserId}
                className="flex-1 cursor-pointer"
              >
                {isLinkingLead ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('linkLeadModal.linking')}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('linkLeadModal.linkButton')}
                  </>
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* TELEGRAM API SELECTOR MODAL */}
        <Sheet open={showTelegramApiSelector} onOpenChange={setShowTelegramApiSelector}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">
            <SheetHeader>
              <SheetTitle>Escolher API do Telegram</SheetTitle>
              <SheetDescription>
                Escolha por onde deseja falar com {contactModal.lead?.name}
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            
            <div className="space-y-3">
              {/* Bot API Option */}
              <Button
                onClick={() => handleTelegramApiSelection('bot')}
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4 cursor-pointer hover:bg-blue-50 hover:border-blue-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Bot className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">API de Bot</div>
                  <div className="text-xs text-muted-foreground">
                    Apenas conversas existentes
                  </div>
                </div>
              </Button>

              {/* Account API Option */}
              <Button
                onClick={() => handleTelegramApiSelection('account')}
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4 cursor-pointer hover:bg-green-50 hover:border-green-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">API de Conta</div>
                  <div className="text-xs text-muted-foreground">
                    Pode iniciar novas conversas
                  </div>
                </div>
              </Button>
            </div>

            {/* Info Box */}
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
            
            <Button
              variant="outline"
              onClick={() => setShowTelegramApiSelector(false)}
              className="w-full cursor-pointer"
            >
              Cancelar
            </Button>
          </SheetContent>
        </Sheet>

        {/* BOT CONVERSATIONS MODAL */}
        <Sheet open={showBotConversationsModal} onOpenChange={setShowBotConversationsModal}>
          <SheetContent className="w-full sm:max-w-lg border-l border-border p-0 overflow-y-auto">
            <div className="p-6 md:p-8">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  Conversas Existentes
                </SheetTitle>
                <SheetDescription>
                  {contactModal.lead?.name} já possui conversas com seu bot. Escolha uma opção:
                </SheetDescription>
              </SheetHeader>
              <Separator className="my-4" />
              
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex gap-2">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Bot API Limitado:</p>
                    <p className="text-xs">
                      A API de Bot do Telegram só pode responder mensagens já existentes. 
                      Você não pode iniciar novas conversas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Conversations List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {botConversations.map((conv: any) => (
                  <div key={conv.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">
                          {conv.first_name} {conv.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          @{conv.telegram_username || 'sem username'}
                        </div>
                      </div>
                    </div>
                    
                    {conv.last_message_preview && (
                      <div className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {conv.last_message_preview}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          // Navigate to chat
                          const phoneNumber = extractPhoneNumber(contactModal.lead!)
                          navigateToChat('telegram', contactModal.lead!, conv.id)
                          setShowBotConversationsModal(false)
                        }}
                        className="flex-1 cursor-pointer"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Abrir Chat
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />
              
              <Button
                variant="outline"
                onClick={() => setShowBotConversationsModal(false)}
                className="w-full cursor-pointer"
              >
                Fechar
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* BULK MOVE PROGRESS NOTIFICATION */}
        {bulkMoveNotification.show && (
          <div className="fixed top-20 right-4 z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 min-w-[320px] max-w-[400px]">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t('notifications.bulkMoveProgress')}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {t('notifications.batchProgress', {
                    current: bulkMoveNotification.progress.batch,
                    total: bulkMoveNotification.progress.totalBatches
                  })}
                </p>
                <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{
                      width: `${(bulkMoveNotification.progress.current / bulkMoveNotification.progress.total) * 100}%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {bulkMoveNotification.progress.current} / {bulkMoveNotification.progress.total}
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
    </AuthGuard>
  )
}

