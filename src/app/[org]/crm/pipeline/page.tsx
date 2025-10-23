"use client"

import * as React from "react"
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
import { Search, Plus, Download, Upload, Trash2, Edit, X, ChevronDown, CheckCircle2, AlertTriangle, AlertCircle, Check, Filter, XCircle, ArrowUp, ArrowDown, Eye, Phone, Mail, Calendar, User, Building2, File, FileText, Image, FileImage, FileVideo, FileAudio, Archive, Loader2, Trash, MessageCircle, Send, Info, Settings2, DollarSign, Briefcase, CreditCard, FileDigit, MapPin, Tag, Clock, Hash, UserPlus, Copy } from "lucide-react"
import * as XLSX from "xlsx"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiService, Lead, UpdateLeadRequest } from "@/lib/api"
import { useApi } from "@/hooks/useApi"

type PipelineStage = {
  id: string
  name: string
  color: string
  leads: Lead[]
}

function createId() {
  return Math.random().toString(36).slice(2, 10)
}

// Removed SAMPLE_LEADS - now using API

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "new",
    name: "New Leads",
    color: "bg-blue-100 border-blue-200 text-blue-800",
    leads: []
  },
  {
    id: "contact",
    name: "In Contact",
    color: "bg-yellow-100 border-yellow-200 text-yellow-800",
    leads: []
  },
  {
    id: "qualified",
    name: "Qualified",
    color: "bg-green-100 border-green-200 text-green-800",
    leads: []
  },
  {
    id: "lost",
    name: "Lost",
    color: "bg-red-100 border-red-200 text-red-800",
    leads: []
  }
]
  
export default function PipelinePage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  const { isClient } = useApi()
  const storageKey = React.useMemo(() => `pipeline_${org}`, [org])

  const [leads, setLeads] = React.useState<Lead[]>([])
  const [pipelineStages, setPipelineStages] = React.useState<PipelineStage[]>(PIPELINE_STAGES)
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
                setAssignedUserName("Unknown User")
              }
            }
            
            if (preview.lead.created_by) {
              const createdByUser = employees.find((emp: any) => emp.id === preview.lead!.created_by)
              if (createdByUser) {
                setCreatedByUserName(createdByUser.name)
              } else {
                setCreatedByUserName("Unknown User")
              }
            }
          }
        } catch (error) {
          console.error('Error fetching users:', error)
          if (preview.lead?.assigned_user_id) setAssignedUserName("Unknown User")
          if (preview.lead?.created_by) setCreatedByUserName("Unknown User")
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
        message: 'You have unsaved changes. Click outside again to discard them.'
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

  // Load leads from API
  React.useEffect(() => {
    const loadLeads = async () => {
      try {
        const response = await apiService.getLeadsByStatus()
        if (response.success && response.data) {
          setLeads(response.data.leads)
          updatePipelineStages(response.data.leads)
        } else {
          console.error('Failed to load leads:', response.error)
          pushToast('Erro ao carregar leads', 'error')
        }
      } catch (error) {
        console.error('Error loading leads:', error)
        pushToast('Erro ao carregar leads', 'error')
      }
    }

    // Always run, not just on client side
    loadLeads()
  }, [])

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
        const response = await apiService.getLeadsByStatus()
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
    if (!isClient) return
    
    if (searchTerm) {
      // Use backend search with debounce for search term only
      const searchParams = {
        search: searchTerm,
      }
      
      console.log('Pipeline: Searching with search term:', searchParams)
      debouncedSearch(searchParams)
    } else {
      // No search term, reload all leads from API
      const loadAllLeads = async () => {
        try {
          const response = await apiService.getLeadsByStatus()
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
  }, [searchTerm, debouncedSearch, isClient])

  // Apply modal filters when Apply Filter is clicked
  const applyModalFilters = React.useCallback(async () => {
    if (!isClient) return
    
    const hasFilters = filters.name || filters.email || filters.phone || filters.ssn || filters.ein || filters.source || filters.location || filters.interest || filters.status || valueRange.min || valueRange.max || dateRange.min || dateRange.max
    
    if (hasFilters) {
      try {
        // Usar a rota de busca unificada com todos os parâmetros
        const searchParams: any = {
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

        const response = await apiService.searchLeads(searchParams)
        if (response.success && response.data) {
          console.log('Pipeline: Applying unified filters')
          console.log('Pipeline: Found leads:', response.data.leads.length)
          setLeads(response.data.leads)
          updatePipelineStages(response.data.leads)
        }
        
      } catch (error) {
        console.error('Error applying filters:', error)
        pushToast('Erro ao aplicar filtros', 'error')
      }
    } else {
      // No filters, reload all leads from API
      const loadAllLeads = async () => {
        try {
          const response = await apiService.getLeadsByStatus()
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
  }, [filters, valueRange, dateRange, isClient])

  function updatePipelineStages(leadsList: Lead[]) {
    const stages = PIPELINE_STAGES.map(stage => {
      const stageLeads = leadsList.filter(lead => {
        switch (lead.status) {
          case "New":
            return stage.id === "new"
          case "In Contact":
            return stage.id === "contact"
          case "Qualified":
            return stage.id === "qualified"
          case "Lost":
            return stage.id === "lost"
          default:
            return stage.id === "new"
        }
      })
      return {
        ...stage,
        leads: stageLeads
      }
    })
    setPipelineStages(stages)
  }

  function pushToast(message: string, type: "success" | "warning" | "error" = "success", timeoutMs = 4000) {
    const id = createId()
    setToasts((prev) => [...prev, { id, text: message, type }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, timeoutMs)
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
      return { valid: false, error: `File size exceeds 50MB limit. Current size: ${formatFileSize(file.size)}` }
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
      pushToast(`Some files were invalid: ${invalidFiles.join(', ')}`, 'error')
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
      pushToast(`Some files were invalid: ${invalidFiles.join(', ')}`, 'error')
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
      pushToast('Error deleting file', 'error')
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
        pushToast('Failed to download file', 'error')
      }
    } catch (error) {
      console.error('Error downloading attachment:', error)
      pushToast('Error downloading file', 'error')
    }
  }

  const viewAttachment = async (leadId: string, attachmentId: string) => {
    try {
      const blob = await apiService.getLeadAttachment(leadId, attachmentId)
      
      if (blob) {
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
      } else {
        pushToast('Failed to view file', 'error')
      }
    } catch (error) {
      console.error('Error viewing attachment:', error)
      pushToast('Error viewing file', 'error')
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
      pushToast('Error saving attachment changes', 'error')
    } finally {
      setUploadingAttachments(prev => ({ ...prev, [leadId]: false }))
    }
  }


  function handleEdit(lead: Lead) {
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
  }

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
        
        pushToast("Lead atualizado com sucesso.", "success")
      } else {
        pushToast(`Erro ao atualizar lead: ${response.error}`, "error")
      }
    } catch (error) {
      console.error('Error updating lead:', error)
      pushToast('Erro ao atualizar lead', "error")
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

  function handleDragStart(e: React.DragEvent, lead: Lead) {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = "move"
  }

  function handleDragOver(e: React.DragEvent, stageId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDraggedOverStage(stageId)
  }

  function handleDragLeave() {
    setDraggedOverStage(null)
  }

  async function handleDrop(e: React.DragEvent, targetStageId: string) {
    e.preventDefault()
    
    if (!draggedLead) return

    // Verificar se estamos no cliente
    if (typeof window === 'undefined') {
      pushToast('Aguarde o carregamento completo da página', 'warning')
      return
    }

    const newStatus = targetStageId === "new" ? "New" :
                     targetStageId === "contact" ? "In Contact" :
                     targetStageId === "qualified" ? "Qualified" :
                     targetStageId === "lost" ? "Lost" : "New"

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
        pushToast(`Lead "${draggedLead.name}" movido para "${newStatus}".`, "success")
      } else {
        pushToast(`Erro ao mover lead: ${response.error}`, "error")
      }
    } catch (error) {
      console.error('Error moving lead:', error)
      pushToast('Erro ao mover lead', "error")
    }

    setDraggedLead(null)
    setDraggedOverStage(null)
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US')
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

  // Handle contact method selection
  const handleContactMethodSelect = (method: 'whatsapp' | 'telegram' | 'email') => {
    if (!contactModal.lead) return

    const phoneNumber = extractPhoneNumber(contactModal.lead)
    
    if ((method === 'whatsapp' || method === 'telegram') && !phoneNumber) {
      pushToast('This lead does not have a phone number registered', 'error')
      setContactModal({ open: false, lead: null })
      return
    }

    // Check Telegram configuration
    if (method === 'telegram') {
      const hasActiveAccounts = telegramAccounts.some(acc => acc.is_active)
      const hasActiveBots = telegramBots.some(bot => bot.is_active)

      // No MTProto accounts configured
      if (!hasActiveAccounts) {
        if (hasActiveBots) {
          // Only bot API configured
          setTelegramWarningMessage(
            "Telegram Bot API is configured, but it can only receive messages and respond passively. " +
            "To initiate contact with leads, please configure a Telegram Account (MTProto API) in Settings > Telegram."
          )
        } else {
          // No Telegram configured at all
          setTelegramWarningMessage(
            "Telegram is not configured. Please set up a Telegram Account (MTProto API) in Settings > Telegram " +
            "to be able to contact leads via Telegram."
          )
        }
        setShowTelegramWarning(true)
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
      pushToast('Please enter a message', 'warning')
      return
    }

    setIsSendingMessage(true)

    try {
      if (sendMessageModal.method === 'telegram') {
        if (!selectedAccountId) {
          pushToast('No active Telegram account found', 'error')
          setIsSendingMessage(false)
          return
        }

        const phoneNumber = extractPhoneNumber(sendMessageModal.lead)
        if (!phoneNumber) {
          pushToast('Invalid phone number', 'error')
          setIsSendingMessage(false)
          return
        }

        // Start chat and send message via Telegram API
        const response = await apiService.startTelegramAccountChat(
          selectedAccountId,
          phoneNumber,
          messageText
        )

        if (response.success) {
          pushToast('Message sent successfully via Telegram!', 'success')
          
          // Reset state
          setSendMessageModal({ open: false, lead: null, method: null })
          setMessageText("")
        } else {
          pushToast(response.error || 'Failed to send message', 'error')
        }
      } else if (sendMessageModal.method === 'whatsapp') {
        // TODO: Implement WhatsApp sending
        pushToast('WhatsApp integration coming soon', 'warning')
      } else if (sendMessageModal.method === 'email') {
        // TODO: Implement Email sending
        pushToast('Email integration coming soon', 'warning')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      pushToast('Error sending message', 'error')
    } finally {
      setIsSendingMessage(false)
    }
  }

  // Send message and open chat
  const handleSendMessageAndOpenChat = async () => {
    if (!sendMessageModal.lead || !sendMessageModal.method || !messageText.trim()) {
      pushToast('Please enter a message', 'warning')
      return
    }

    setIsSendingMessage(true)

    try {
      if (sendMessageModal.method === 'telegram') {
        if (!selectedAccountId) {
          pushToast('No active Telegram account found', 'error')
          setIsSendingMessage(false)
          return
        }

        const phoneNumber = extractPhoneNumber(sendMessageModal.lead)
        if (!phoneNumber) {
          pushToast('Invalid phone number', 'error')
          setIsSendingMessage(false)
          return
        }

        // Start chat and send message via Telegram API
        const response = await apiService.startTelegramAccountChat(
          selectedAccountId,
          phoneNumber,
          messageText
        )

        if (response.success) {
          pushToast('Message sent! Opening chat...', 'success')
          
          // Navigate to chat page with conversation ID
          const conversationId = response.data?.conversation?.id
          navigateToChat(sendMessageModal.method, sendMessageModal.lead, conversationId)
          
          // Reset state
          setSendMessageModal({ open: false, lead: null, method: null })
          setMessageText("")
        } else {
          pushToast(response.error || 'Failed to send message', 'error')
          setIsSendingMessage(false)
        }
      } else if (sendMessageModal.method === 'whatsapp') {
        // TODO: Implement WhatsApp sending
        pushToast('WhatsApp integration coming soon', 'warning')
        navigateToChat(sendMessageModal.method, sendMessageModal.lead)
        setIsSendingMessage(false)
      } else if (sendMessageModal.method === 'email') {
        // TODO: Implement Email sending
        pushToast('Email integration coming soon', 'warning')
        navigateToChat(sendMessageModal.method, sendMessageModal.lead)
        setIsSendingMessage(false)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      pushToast('Error sending message', 'error')
      setIsSendingMessage(false)
    }
  }

  const totalValue = leads.reduce((sum, lead) => {
    const value = lead.value
    console.log('Lead:', lead.name, 'Status:', lead.status, 'Value:', value, 'Type:', typeof value)
    
    // Tentar converter para número se for string
    const numericValue = typeof value === 'string' ? parseFloat(value) : value
    
    // Só somar se o valor existir, for um número válido E o lead não estiver perdido
    if (numericValue != null && typeof numericValue === 'number' && !isNaN(numericValue) && isFinite(numericValue) && lead.status !== 'Lost') {
      console.log('Adding value:', numericValue, 'to sum:', sum)
      return sum + numericValue
    }
    return sum
  }, 0)
  console.log('Total Value calculated:', totalValue)
  const totalLeads = leads.length

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
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
                <BreadcrumbPage>Pipeline (Kanban)</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* NOTIFICATIONS STACK */}
        {toasts.length > 0 && (
          <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* CONTROLS */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
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
                  Filters
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
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                  <p className="text-2xl font-bold">{totalLeads}</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">
                    {totalLeads > 0 ? Math.round((pipelineStages.find(s => s.id === "qualified")?.leads.length || 0) / totalLeads * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* KANBAN BOARD */}
          <div className="flex-1 bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Sales Pipeline</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {pipelineStages.map((stage) => (
                <div
                  key={stage.id}
                  className={`rounded-lg border-2 p-4 h-[500px] flex flex-col transition-colors ${
                    draggedOverStage === stage.id 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  }`}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className="flex-shrink-0">
                    <div className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium mb-4 ${stage.color}`}>
                      {stage.name}
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      {stage.leads.length} lead{stage.leads.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {stage.leads
                      .filter(lead => 
                        !searchTerm || 
                        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (lead.source || '').toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-background border rounded-lg p-3 cursor-move hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                      >
                        {/* Header com nome e ações */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate" title={lead.name}>
                              {lead.name}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate mt-1" title={lead.email}>
                              {lead.email}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setContactModal({ open: true, lead })}
                              className="h-6 w-6 p-0 cursor-pointer hover:bg-purple-50"
                              title="Iniciar conversa"
                            >
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPreview({ open: true, lead })}
                              className="h-6 w-6 p-0 cursor-pointer hover:bg-blue-50"
                              title="Ver detalhes"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(lead)}
                              className="h-6 w-6 p-0 cursor-pointer hover:bg-green-50"
                              title="Editar"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Valor da venda */}
                        {lead.value && (
                          <div className="mb-2">
                            <div className="text-sm font-bold text-green-600">
                              {formatCurrency(lead.value)}
                            </div>
                          </div>
                        )}
                        
                        {/* Origem */}
                        {lead.source && (
                          <div className="text-xs text-muted-foreground mb-2">
                            <Building2 className="h-3 w-3 inline mr-1" />
                            {lead.source}
                          </div>
                        )}
                        
                        {/* Data de fechamento */}
                        {lead.estimated_close_date && (
                          <div className="text-xs text-muted-foreground mb-2">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {formatDate(lead.estimated_close_date)}
                          </div>
                        )}
                        
                        {/* Notas (truncadas) */}
                        {lead.description && (
                          <div className="mt-2 p-2 bg-muted/30 rounded text-xs text-muted-foreground overflow-hidden">
                            <div className="truncate" title={lead.description}>
                              📝 {lead.description}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
                      <p className="text-muted-foreground text-sm">Complete lead information and details</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 flex-shrink-0"
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
                        <DollarSign className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(preview.lead.value)}
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
                      Contact Information
                    </h3>
                    <div className="grid gap-3">
                      {preview.lead.email && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm font-medium truncate">{preview.lead.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
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
                              <p className="text-xs text-muted-foreground">Phone</p>
                              <p className="text-sm font-medium truncate">{preview.lead.phone}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
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
                        Business Information
                      </h3>
                      <div className="grid gap-3">
                        {preview.lead.ssn && (
                          <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">SSN</p>
                                <p className="text-sm font-medium font-mono break-all">{preview.lead.ssn}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0"
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
                                <p className="text-xs text-muted-foreground">EIN</p>
                                <p className="text-sm font-medium font-mono break-all">{preview.lead.ein}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0"
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
                                <p className="text-xs text-muted-foreground">Source</p>
                                <p className="text-sm font-medium break-words">{preview.lead.source}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0"
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
                        Deal Timeline
                      </h3>
                      <div className="grid gap-3">
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">Estimated Close Date</p>
                              <p className="text-sm font-medium">{new Date(preview.lead.estimated_close_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(new Date(preview.lead?.estimated_close_date || '').toLocaleDateString())
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

                  {/* Assignment Card */}
                  <div className="bg-muted/50 rounded-xl p-5 border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <UserPlus className="h-5 w-5 flex-shrink-0" />
                      Assignment
                    </h3>
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Assigned to</p>
                            <p className="text-sm font-medium break-words">
                              {preview.lead.assigned_user_id ? (assignedUserName || "Loading...") : "Not assigned"}
                            </p>
                          </div>
                        </div>
                        {preview.lead.assigned_user_id && assignedUserName && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(assignedUserName)
                              setCopiedKey('assigned_user')
                              setTimeout(() => setCopiedKey(null), 2000)
                            }}
                          >
                            {copiedKey === 'assigned_user' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                      
                      {preview.lead.assigned_user_id && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">Assigned since</p>
                              <p className="text-sm font-medium break-words">{new Date(preview.lead.updated_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(new Date(preview.lead?.updated_at || '').toLocaleString())
                              setCopiedKey('assigned_date')
                              setTimeout(() => setCopiedKey(null), 2000)
                            }}
                          >
                            {copiedKey === 'assigned_date' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location & Interest Card */}
                  {(preview.lead.location || preview.lead.interest) && (
                    <div className="bg-muted/50 rounded-xl p-5 border">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5 flex-shrink-0" />
                        Additional Information
                      </h3>
                      <div className="grid gap-3">
                        {preview.lead.location && (
                          <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">Location</p>
                                <p className="text-sm font-medium break-words">{preview.lead.location}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0"
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
                                <p className="text-xs text-muted-foreground">Interest</p>
                                <p className="text-sm font-medium break-words">{preview.lead.interest}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0"
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
                          Description
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 flex-shrink-0"
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
                        Attachments
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
                                  {attachment.originalName || 'Unknown file'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(attachment.size || 0)} • {attachment.uploadedAt ? new Date(attachment.uploadedAt).toLocaleDateString('en-US') : 'Unknown date'}
                                </p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="cursor-pointer h-8 w-8 p-0"
                                  onClick={() => viewAttachment(preview.lead!.id, attachment.id)}
                                  title="View file"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="cursor-pointer h-8 w-8 p-0"
                                  onClick={() => downloadAttachment(preview.lead!.id, attachment.id, attachment.originalName || 'file')}
                                  title="Download file"
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

                  {/* Metadata Card */}
                  <div className="bg-muted/50 rounded-xl p-5 border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 flex-shrink-0" />
                      Metadata
                    </h3>
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Created</p>
                            <p className="text-sm font-medium">{new Date(preview.lead.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(new Date(preview.lead?.created_at || '').toLocaleString())
                            setCopiedKey('created_at')
                            setTimeout(() => setCopiedKey(null), 2000)
                          }}
                        >
                          {copiedKey === 'created_at' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      {preview.lead.created_by && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">Created by</p>
                              <p className="text-sm font-medium break-words">{createdByUserName || "Loading..."}</p>
                            </div>
                          </div>
                          {createdByUserName && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0"
                              onClick={() => {
                                navigator.clipboard.writeText(createdByUserName)
                                setCopiedKey('created_by')
                                setTimeout(() => setCopiedKey(null), 2000)
                              }}
                            >
                              {copiedKey === 'created_by' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Last Updated</p>
                            <p className="text-sm font-medium">{new Date(preview.lead.updated_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(new Date(preview.lead?.updated_at || '').toLocaleString())
                            setCopiedKey('updated_at')
                            setTimeout(() => setCopiedKey(null), 2000)
                          }}
                        >
                          {copiedKey === 'updated_at' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between bg-background rounded-lg p-3 border overflow-hidden">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Lead ID</p>
                            <p className="text-sm font-medium font-mono text-xs break-all">{preview.lead.id}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(preview.lead?.id || '')
                            setCopiedKey('lead_id')
                            setTimeout(() => setCopiedKey(null), 2000)
                          }}
                        >
                          {copiedKey === 'lead_id' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

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
                      View in Complete List
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setPreview({ open: false, lead: null })}
                      className="cursor-pointer"
                    >
                      Close
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
                <SheetTitle>Edit Lead</SheetTitle>
                <SheetDescription>
                  Edit the lead's negotiation fields.
                </SheetDescription>
              </SheetHeader>
              <Separator className="my-4" />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Deal Value ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Expected Close Date</label>
                  <Input
                    type="date"
                    value={editExpectedCloseDate}
                    onChange={(e) => setEditExpectedCloseDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Notes
                    <span className="text-xs text-muted-foreground ml-2">
                      ({editNotes.length}/500)
                    </span>
                  </label>
                  <textarea
                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none min-h-[80px] max-h-[200px] overflow-y-auto"
                    placeholder="Notes about the negotiation..."
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
                      {500 - editNotes.length} characters remaining
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Interest</label>
                  <Input
                    type="text"
                    placeholder="Product or service interest..."
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
                      <h3 className="text-sm font-semibold text-muted-foreground">Attachments</h3>
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
                              Add Files
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
                                  <p className="text-sm text-muted-foreground">Uploading...</p>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-8 w-8 text-muted-foreground" />
                                  <div className="text-center">
                                    <p className="text-sm font-medium">
                                      Drag and drop files here
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      or click to browse (max 50MB)
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
                                    {attachment.originalName || 'Unknown file'}
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
                              className="flex items-center gap-3 p-3 rounded-lg border bg-primary/5 border-primary/20"
                            >
                              <File className="h-5 w-5 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-primary">
                                  {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)} (pending, save to upload)
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
                  Save
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
                  Cancel
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
                <SheetTitle>Filter leads</SheetTitle>
                <SheetDescription>Filter leads by any field to find specific records.</SheetDescription>
              </SheetHeader>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="space-y-4">
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">Name</label>
                <Input
                  placeholder="Filter by name..."
                  value={filters.name}
                  onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">Email</label>
                <Input
                  placeholder="Filter by email..."
                  value={filters.email}
                  onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <Input
                  placeholder="Filter by phone..."
                  value={filters.phone}
                  onChange={(e) => setFilters(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">SSN</label>
                <Input
                  placeholder="Filter by SSN..."
                  value={filters.ssn}
                  onChange={(e) => setFilters(prev => ({ ...prev, ssn: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">EIN</label>
                <Input
                  placeholder="Filter by EIN..."
                  value={filters.ein}
                  onChange={(e) => setFilters(prev => ({ ...prev, ein: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">Source</label>
                <Input
                  placeholder="Filter by source..."
                  value={filters.source}
                  onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">Location</label>
                <Input
                  placeholder="Filter by location..."
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">Interest</label>
                <Input
                  placeholder="Filter by interest..."
                  value={filters.interest}
                  onChange={(e) => setFilters(prev => ({ ...prev, interest: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">All statuses</option>
                  <option value="New">New</option>
                  <option value="In Contact">In Contact</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">Value Range</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min value"
                    value={valueRange.min}
                    onChange={(e) => setValueRange(prev => ({ ...prev, min: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Max value"
                    value={valueRange.max}
                    onChange={(e) => setValueRange(prev => ({ ...prev, max: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">Close Date Range</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="date"
                      placeholder="From date"
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
                      <p className="text-xs text-red-500 mt-1">Ano deve ter exatamente 4 dígitos (1000-9999)</p>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="date"
                      placeholder="To date"
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
                      <p className="text-xs text-red-500 mt-1">Ano deve ter exatamente 4 dígitos (1000-9999)</p>
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
                  Apply Filter
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
                  Clear All
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
              <SheetTitle>Select Contact Method</SheetTitle>
              <SheetDescription>
                Choose how you want to communicate with {contactModal.lead?.name}
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
                  <div className="font-semibold">WhatsApp</div>
                  <div className="text-xs text-muted-foreground">
                    {contactModal.lead?.phone || 'No phone number available'}
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
                    Telegram
                    {!telegramAccounts.some(acc => acc.is_active) && (
                      <span className="text-xs font-normal text-yellow-600">(Setup Required)</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {contactModal.lead?.phone || 'No phone number available'}
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
                  <div className="font-semibold">Email</div>
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
              Cancel
            </Button>
          </SheetContent>
        </Sheet>

        {/* SEND MESSAGE MODAL */}
        <Sheet open={sendMessageModal.open} onOpenChange={(open) => {
          if (!open) {
            setSendMessageModal({ open: false, lead: null, method: null })
            setMessageText("")
          }
        }}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8 flex flex-col max-h-screen">
            {sendMessageModal.lead ? (
              <>
            <div className="flex-shrink-0">
              <SheetHeader>
                <SheetTitle>Send Message</SheetTitle>
                <SheetDescription>
                  Send a message to {sendMessageModal.lead.name} via {sendMessageModal.method}
                </SheetDescription>
              </SheetHeader>
              <Separator className="my-4" />
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
                  </div>
                </div>
              </div>

              {/* Telegram Account Selection (only for Telegram) */}
              {sendMessageModal.method === 'telegram' && telegramAccounts.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telegram Account</label>
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
                <label className="text-sm font-medium">Message</label>
                <textarea
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none min-h-[120px]"
                  placeholder="Type your message here..."
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
                  Send Only
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
                  Send & Open Chat
                </Button>
              </div>
              
              <Button
                variant="ghost"
                onClick={() => {
                  if (sendMessageModal.lead && sendMessageModal.method) {
                    navigateToChat(sendMessageModal.method, sendMessageModal.lead)
                  }
                }}
                className="w-full cursor-pointer"
                disabled={isSendingMessage}
                title="Open chat without sending message"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Open Chat Without Sending
              </Button>
            </div>
            </>
            ) : (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">No lead selected</p>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </SidebarInset>
    </SidebarProvider>
    </AuthGuard>
  )
}
