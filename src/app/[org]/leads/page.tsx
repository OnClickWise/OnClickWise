"use client"



import * as React from "react"

import { useSearchParams } from "next/navigation"

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

import { Search, Plus, Download, Upload, Trash2, Edit, X, ChevronDown, CheckCircle2, AlertTriangle, AlertCircle, Check, Filter, XCircle, ArrowUp, ArrowDown, Copy, File, FileText, Image, FileImage, FileVideo, FileAudio, Archive, Loader2, Eye, Trash } from "lucide-react"

import * as XLSX from "xlsx"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { apiService, Lead, CreateLeadRequest, UpdateLeadRequest, Attachment } from "@/lib/api"

import { useApi } from "@/hooks/useApi"



function createId() {

  return Math.random().toString(36).slice(2, 10)

}



// Removed SAMPLE_LEADS - now using API



export default function LeadsPage({

  params,

}: {

  params: Promise<{ org: string }>

}) {

  const { org } = React.use(params)

  const { isClient } = useApi()

  const storageKey = React.useMemo(() => `leads_${org}`, [org])

  const searchParams = useSearchParams()

  const [leads, setLeads] = React.useState<Lead[]>([])

  const [filteredLeads, setFilteredLeads] = React.useState<Lead[]>([])

  const [searchTerm, setSearchTerm] = React.useState("")

  const [selectedLeads, setSelectedLeads] = React.useState<Set<string>>(new Set())

  const [sortField, setSortField] = React.useState<keyof Lead | null>(null)

  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')

  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)

  const [confirmInput, setConfirmInput] = React.useState("")

  const [pendingDeletionIds, setPendingDeletionIds] = React.useState<string[]>([])

  const [editingId, setEditingId] = React.useState<string | null>(null)

  // Selection helpers

  const [lastClickedIndex, setLastClickedIndex] = React.useState<number | null>(null)

  const [isBulkEditOpen, setIsBulkEditOpen] = React.useState(false)

  const [bulkStatus, setBulkStatus] = React.useState<string>("") // empty = keep

  const [bulkSource, setBulkSource] = React.useState<string>("") // empty = keep
  
  // Bulk edit confirmation
  const [bulkEditConfirm, setBulkEditConfirm] = React.useState("")
  
  // Pipeline bulk actions
  const [isPipelineModalOpen, setIsPipelineModalOpen] = React.useState(false)
  const [pipelineAction, setPipelineAction] = React.useState<'add' | 'remove'>('add')

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const [isImportOpen, setIsImportOpen] = React.useState(false)

  const [isDragActive, setIsDragActive] = React.useState(false)

  const [isImporting, setIsImporting] = React.useState(false)
  const [isProcessingFile, setIsProcessingFile] = React.useState(false)

  const [importProgress, setImportProgress] = React.useState({ current: 0, total: 0, batch: 0, totalBatches: 0 })
  const [importCancelled, setImportCancelled] = React.useState(false)
  const [filePreview, setFilePreview] = React.useState<{
    leads: Lead[]
    fields: string[]
    totalLeads: number
  } | null>(null)
  const [showPreview, setShowPreview] = React.useState(false)
  // Toast notifications stack (top-right)

  const [toasts, setToasts] = React.useState<{ id: string, text: string, type: "success" | "warning" | "error" }[]>([])

  // Import progress notification
  const [importNotification, setImportNotification] = React.useState<{
    show: boolean
    progress: { current: number, total: number, batch: number, totalBatches: number }
    cancelled: boolean
  }>({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: false })
  
  // Bulk edit progress notification
  const [editNotification, setEditNotification] = React.useState<{
    show: boolean
    progress: { current: number, total: number, batch: number, totalBatches: number }
    cancelled: boolean
  }>({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: false })
  // Show top pagination when scrolling
  const [showTopPagination, setShowTopPagination] = React.useState(false)
  // Select all leads confirmation
  const [showSelectAllConfirm, setShowSelectAllConfirm] = React.useState(false)
  // Show select all leads button
  const [showSelectAllButton, setShowSelectAllButton] = React.useState(false)
  // Delete progress notification
  const [deleteNotification, setDeleteNotification] = React.useState<{
    show: boolean
    progress: { current: number, total: number, batch: number, totalBatches: number }
    cancelled: boolean
  }>({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: false })
  // Track if deletion is being cancelled
  const [isDeletionCancelled, setIsDeletionCancelled] = React.useState(false)
  // Ref for immediate access to cancellation state
  const isDeletionCancelledRef = React.useRef(false)
  
  // Track if bulk edit is being cancelled
  const [isEditCancelled, setIsEditCancelled] = React.useState(false)
  // Ref for immediate access to edit cancellation state
  const isEditCancelledRef = React.useRef(false)
  
  // Track deleted leads for potential rollback
  const [deletedLeads, setDeletedLeads] = React.useState<Lead[]>([])
  // Track imported leads for potential rollback
  const [importedLeads, setImportedLeads] = React.useState<Lead[]>([])
  const [currentImportLeads, setCurrentImportLeads] = React.useState<Lead[]>([])
  // Track original leads before bulk edit for potential rollback
  const [originalLeads, setOriginalLeads] = React.useState<Lead[]>([])
  const [currentEditLeads, setCurrentEditLeads] = React.useState<Lead[]>([])
  // Track if import is being cancelled
  const [isImportCancelled, setIsImportCancelled] = React.useState(false)
  // Ref for immediate access to import cancellation state
  const isImportCancelledRef = React.useRef(false)

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
    name: string
    email: string
    phone: string
    ssn: string
    ein: string
    source: string
    status: string
    value: string
    estimatedCloseDate: string
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
      name !== originalFormValues.name ||
      email !== originalFormValues.email ||
      phone !== originalFormValues.phone ||
      ssn !== originalFormValues.ssn ||
      ein !== originalFormValues.ein ||
      source !== originalFormValues.source ||
      status !== originalFormValues.status ||
      value !== originalFormValues.value ||
      estimatedCloseDate !== originalFormValues.estimatedCloseDate
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
      setIsModalOpen(false)
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
    setIsModalOpen(false)
    setEditingId(null)
    setPreview({ open: false, lead: null })
  }



  // Preview modal for viewing selected lead details

  const [preview, setPreview] = React.useState<{ open: boolean, lead: Lead | null }>({ open: false, lead: null })

  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)


  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(10)


  // Filter modal and state

  const [isFilterOpen, setIsFilterOpen] = React.useState(false)

  const [filters, setFilters] = React.useState({

    name: "",

    email: "",

    phone: "",

    ssn: "",

    ein: "",

    source: "",

    status: "",

    pipeline: ""

  })

  const [valueRange, setValueRange] = React.useState({

    min: "",

    max: ""

  })

  const [dateRange, setDateRange] = React.useState({

    min: "",

    max: ""

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



  const [name, setName] = React.useState("")

  const [email, setEmail] = React.useState("")

  const [phone, setPhone] = React.useState("")

  const [ssn, setSsn] = React.useState("")

  const [ein, setEin] = React.useState("")

  const [source, setSource] = React.useState("")

  const [status, setStatus] = React.useState<Lead["status"]>("New")

  const [customStatus, setCustomStatus] = React.useState("")

  const [value, setValue] = React.useState("")

  const [estimatedCloseDate, setEstimatedCloseDate] = React.useState("")

  const [description, setDescription] = React.useState("")



  // Field limits

  const FIELD_MAX = React.useMemo(() => ({

    name: 150,     // limite do banco de dados

    email: 150,    // limite do banco de dados

    phone: 20,     // formato internacional +55 11 99999-9999

    ssn: 20,       // SSN americano: 123-45-6789

    ein: 20,       // EIN americano

    source: 100,   // origem do lead

    status: 50,    // status customizado

    description: 500, // descrição/notas

    value: 15,     // valor monetário (ex: 999999999.99)

    date: 10,      // data no formato YYYY-MM-DD

  }), [])



  // Load all leads from API - simplified approach
  React.useEffect(() => {

    const loadAllLeads = async () => {
      console.log('Loading all leads...', { isClient })
      try {

        // Use only the basic call that works
        const response = await apiService.getLeads()

        console.log('API response:', response)

        
        if (response.success && response.data) {

          console.log('Setting all leads:', response.data.leads.length, 'leads')
          setLeads(response.data.leads)

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

    loadAllLeads()
  }, [])

  // Detect scroll to show top pagination
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // Show top pagination if scrolled down and there's more content below
      const shouldShow = scrollTop > 200 && (documentHeight - scrollTop - windowHeight) > 200
      setShowTopPagination(shouldShow)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])



  // Search leads with backend filters

  const searchLeads = React.useCallback(async (searchParams: {

    search?: string;

    status?: string;

    source?: string;

    pipeline?: string;

    value_min?: number;

    value_max?: number;

    date_min?: string;

    date_max?: string;

    sort?: string;

    order?: 'asc' | 'desc';

  }) => {

    try {

      console.log('Calling searchLeads with:', searchParams)

      const response = await apiService.searchLeads(searchParams)

      console.log('Search response:', response)

      if (response.success && response.data) {

        console.log('Setting leads from search:', response.data.leads.length, 'leads')

        setLeads(response.data.leads)

        setFilteredLeads(response.data.leads)

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



  // Initialize search term from URL parameters

  React.useEffect(() => {

    const searchFromUrl = searchParams.get('search')

    if (searchFromUrl) {

      setSearchTerm(decodeURIComponent(searchFromUrl))

    }

  }, [searchParams])

  

  // Removed localStorage logic - now using API



  // Helpers: notifications

  function pushToast(message: string, type: "success" | "warning" | "error" = "success", timeoutMs = 4000) {

    const id = createId()

    setToasts((prev) => [...prev, { id, text: message, type }])

    window.setTimeout(() => {

      setToasts((prev) => prev.filter((t) => t.id !== id))

    }, timeoutMs)

  }



  // Função de ordenação local
  const handleSort = (field: keyof Lead) => {

    if (sortField === field) {

      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')

    } else {

      setSortField(field)

      setSortDirection('asc')

    }

    
    // Aplicar ordenação local aos leads filtrados
    const sortedLeads = [...filteredLeads].sort((a, b) => {
      let aValue = a[field]
      let bValue = b[field]
      
      // Tratar valores nulos/undefined
      if (aValue === null || aValue === undefined) aValue = ''
      if (bValue === null || bValue === undefined) bValue = ''
      
      // Tratar valores numéricos (value)
      if (field === 'value') {
        const aNum = parseFloat(aValue as string) || 0
        const bNum = parseFloat(bValue as string) || 0
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
      }
      
      // Tratar datas (estimated_close_date)
      if (field === 'estimated_close_date') {
        const aDate = new Date(aValue as string)
        const bDate = new Date(bValue as string)
        if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0
        if (isNaN(aDate.getTime())) return 1
        if (isNaN(bDate.getTime())) return -1
        return sortDirection === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime()
      }
      
      // Tratar strings (source, status)
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })
    
    setFilteredLeads(sortedLeads)
  }

  const reloadLeads = async () => {
    try {
      const response = await apiService.getLeads()
      if (response.success && response.data) {
        const newLeads = response.data.leads || []
        setLeads(newLeads)
        setFilteredLeads(newLeads)
      }
    } catch (error) {
      console.error('Error reloading leads:', error)
    }
  }

  // Force refresh function that ensures complete sync
  const forceRefreshLeads = async () => {
    try {
      const response = await apiService.getLeads()
      if (response.success && response.data) {
        const newLeads = response.data.leads || []
        setLeads(newLeads)
        setFilteredLeads(newLeads)
      }
    } catch (error) {
      console.error('Error force refreshing leads:', error)
    }
  }

  // Immediate sync function for after CRUD operations
  const syncAfterOperation = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      await forceRefreshLeads()
    } catch (error) {
      console.error('Error syncing after operation:', error)
    }
  }



  const clearFilters = () => {

    setSearchTerm('')

    setFilters({

      name: '',

      email: '',

      phone: '',

      ssn: '',

      ein: '',

      source: '',

      status: '',

      pipeline: ''

    })

    setValueRange({

      min: '',

      max: ''

    })

    setDateRange({

      min: '',

      max: ''

    })

    setSortField(null)

    setSortDirection('asc')

    // Reload all leads when clearing filters
    reloadLeads()
  }



  const clearSort = () => {

    setSortField(null)

    setSortDirection('asc')

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

      

      console.log('Searching with search term:', searchParams)

      debouncedSearch(searchParams)

    } else {

      // No search term, reload all leads from API

      const loadAllLeads = async () => {

        try {

          const response = await apiService.getLeads()

          if (response.success && response.data) {

            setLeads(response.data.leads)

            setFilteredLeads(response.data.leads)

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

    

    const hasFilters = filters.name || filters.email || filters.phone || filters.ssn || filters.ein || filters.source || filters.status || filters.pipeline || sortField || valueRange.min || valueRange.max || dateRange.min || dateRange.max

    

    if (hasFilters) {

      try {

        let allLeads: Lead[] = []

        

        // Buscar por cada campo específico usando rotas separadas

        if (filters.name) {

          const response = await apiService.searchLeadsByName(filters.name)

          if (response.success && response.data) {

            allLeads = [...allLeads, ...response.data.leads]

          }

        }

        

        if (filters.email) {

          const response = await apiService.searchLeadsByEmail(filters.email)

          if (response.success && response.data) {

            allLeads = [...allLeads, ...response.data.leads]

          }

        }

        

        if (filters.phone) {

          const response = await apiService.searchLeadsByPhone(filters.phone)

          if (response.success && response.data) {

            allLeads = [...allLeads, ...response.data.leads]

          }

        }

        

        if (filters.ssn) {

          const response = await apiService.searchLeadsBySSN(filters.ssn)

          if (response.success && response.data) {

            allLeads = [...allLeads, ...response.data.leads]

          }

        }

        

        if (filters.ein) {

          const response = await apiService.searchLeadsByEIN(filters.ein)

          if (response.success && response.data) {

            allLeads = [...allLeads, ...response.data.leads]

          }

        }

        

        if (filters.source) {

          const response = await apiService.searchLeadsBySource(filters.source)

          if (response.success && response.data) {

            allLeads = [...allLeads, ...response.data.leads]

          }

        }

        

        if (filters.status) {

          const response = await apiService.searchLeadsByStatus(filters.status)

          if (response.success && response.data) {

            allLeads = [...allLeads, ...response.data.leads]

          }

        }

        // Se temos filtro de pipeline, usar busca unificada com todos os filtros
        if (filters.pipeline) {
          const searchParams: any = {
            show_on_pipeline: filters.pipeline === 'true'
          }
          
          // Adicionar outros filtros se existirem
          if (filters.name) searchParams.name = filters.name
          if (filters.email) searchParams.email = filters.email
          if (filters.phone) searchParams.phone = filters.phone
          if (filters.ssn) searchParams.ssn = filters.ssn
          if (filters.ein) searchParams.ein = filters.ein
          if (filters.source) searchParams.source = filters.source
          if (filters.status) searchParams.status = filters.status
          if (valueRange.min && !isNaN(parseFloat(valueRange.min))) searchParams.value_min = parseFloat(valueRange.min)
          if (valueRange.max && !isNaN(parseFloat(valueRange.max))) searchParams.value_max = parseFloat(valueRange.max)
          if (dateRange.min) searchParams.date_min = dateRange.min
          if (dateRange.max) searchParams.date_max = dateRange.max

          const response = await apiService.searchLeads(searchParams)
          if (response.success && response.data) {
            allLeads = response.data.leads
          }
        }

        

        if (valueRange.min && !isNaN(parseFloat(valueRange.min))) {

          const response = await apiService.searchLeadsByValueMin(parseFloat(valueRange.min))

          if (response.success && response.data) {

            allLeads = [...allLeads, ...response.data.leads]

          }

        }

        

        if (valueRange.max && !isNaN(parseFloat(valueRange.max))) {

          const response = await apiService.searchLeadsByValueMax(parseFloat(valueRange.max))

          if (response.success && response.data) {

            allLeads = [...allLeads, ...response.data.leads]

          }

        }

        

        if (dateRange.min) {

          const response = await apiService.searchLeadsByDateMin(dateRange.min)

          if (response.success && response.data) {

            allLeads = [...allLeads, ...response.data.leads]

          }

        }

        

        if (dateRange.max) {

          const response = await apiService.searchLeadsByDateMax(dateRange.max)

          if (response.success && response.data) {

            allLeads = [...allLeads, ...response.data.leads]

          }

        }

        

        // Remover duplicatas baseado no ID

        const uniqueLeads = allLeads.filter((lead, index, self) => 

          index === self.findIndex(l => l.id === lead.id)

        )

        

        // Aplicar filtros adicionais nos resultados (intersecção)

        let filteredLeads = uniqueLeads

        

        // Se temos filtros de valor, aplicar intersecção

        if (valueRange.min && valueRange.max && !isNaN(parseFloat(valueRange.min)) && !isNaN(parseFloat(valueRange.max))) {

          filteredLeads = filteredLeads.filter(lead => 

            lead.value && 

            lead.value >= parseFloat(valueRange.min) && 

            lead.value <= parseFloat(valueRange.max)

          )

        }

        

        // Se temos filtros de data, aplicar intersecção

        if (dateRange.min && dateRange.max) {

          filteredLeads = filteredLeads.filter(lead => 

            lead.estimated_close_date && 

            lead.estimated_close_date >= dateRange.min && 

            lead.estimated_close_date <= dateRange.max

          )

        }

        

        // Aplicar ordenação se especificada

        if (sortField) {

          filteredLeads.sort((a, b) => {

            const aValue = a[sortField as keyof Lead]

            const bValue = b[sortField as keyof Lead]

            

            if (aValue === null || aValue === undefined) return 1

            if (bValue === null || bValue === undefined) return -1

            

            if (typeof aValue === 'string' && typeof bValue === 'string') {

              return sortDirection === 'desc' 

                ? bValue.localeCompare(aValue)

                : aValue.localeCompare(bValue)

            }

            

            if (typeof aValue === 'number' && typeof bValue === 'number') {

              return sortDirection === 'desc' ? bValue - aValue : aValue - bValue

            }

            

            return 0

          })

        }

        

        console.log('Leads: Applying specific field filters')

        console.log('Leads: Found leads:', filteredLeads.length)

        setLeads(filteredLeads)

        setFilteredLeads(filteredLeads)

        

      } catch (error) {

        console.error('Error applying filters:', error)

        pushToast('Erro ao aplicar filtros', 'error')

      }

    } else {

      // No filters, reload all leads from API

      const loadAllLeads = async () => {

        try {

          const response = await apiService.getLeads()

          if (response.success && response.data) {

            setLeads(response.data.leads)

            setFilteredLeads(response.data.leads)

          }

        } catch (error) {

          console.error('Error loading all leads:', error)

        }

      }

      loadAllLeads()

    }

  }, [filters, valueRange, dateRange, sortField, sortDirection, isClient])



  // Update filteredLeads when leads change and no filters are active

  React.useEffect(() => {

    if (!isClient) return

    

    const hasFilters = searchTerm || filters.email || filters.phone || filters.ssn || filters.ein || filters.source || filters.status || filters.pipeline || sortField

    

    if (!hasFilters) {

      setFilteredLeads(leads)

    }

  }, [leads, searchTerm, filters.email, filters.phone, filters.ssn, filters.source, filters.status, filters.pipeline, sortField, isClient])


  // Pagination calculations
  const totalItems = filteredLeads.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentLeads = filteredLeads.slice(startIndex, endIndex)

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filteredLeads, itemsPerPage])


  function resetForm() {

    setEditingId(null)

    setName("")

    setEmail("")

    setPhone("")

    setSsn("")

    setEin("")

    setSource("")

    setStatus("New")

    setCustomStatus("")

    setValue("")

    setEstimatedCloseDate("")

    setDescription("")

    setIsModalOpen(false)
    
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

  }



  function startAddNew() {

    // Clear any editing state and open modal for creating a new lead

    setEditingId(null)

    setName("")

    setEmail("")

    setPhone("")

    setSsn("")

    setEin("")

    setSource("")

    setStatus("New")

    setCustomStatus("")

    setValue("")

    setEstimatedCloseDate("")

    setDescription("")

    setIsModalOpen(true)

  }



  function truncateTo(value: string, max: number): string {

    return value.length > max ? value.slice(0, max) : value

  }



  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault()

    if (!name || !email) return

    

    // Verificar se estamos no cliente

    if (!isClient) {

      pushToast('Aguarde o carregamento completo da página', 'warning')

      return

    }

    

    // Enforce limits before saving

    const safeName = truncateTo(name, FIELD_MAX.name)

    const safeEmail = truncateTo(email, FIELD_MAX.email)

    const safePhone = truncateTo(phone, FIELD_MAX.phone)

    const safeSsn = truncateTo(ssn, FIELD_MAX.ssn)

    const safeEin = truncateTo(ein, FIELD_MAX.ein)

    const safeSource = truncateTo(source, FIELD_MAX.source)

    const safeStatus = truncateTo(String(status), FIELD_MAX.status)

    const safeValue = value ? parseFloat(value) : undefined

    const safeEstimatedCloseDate = estimatedCloseDate ? estimatedCloseDate.slice(0, FIELD_MAX.date) : undefined

    const safeDescription = truncateTo(description, FIELD_MAX.description)

    

    try {

      if (editingId) {

        // Update existing lead

        const updateData: UpdateLeadRequest = {

          id: editingId,

          name: safeName,

          email: safeEmail,

          phone: safePhone || undefined,

          ssn: safeSsn || undefined,

          ein: safeEin || undefined,

          source: safeSource || undefined,

          status: safeStatus,

          value: safeValue,

          estimated_close_date: safeEstimatedCloseDate,

          description: safeDescription || undefined,

        }

        

        const response = await apiService.updateLead(updateData)

        if (response.success && response.data) {

          setLeads((prev) =>

            prev.map((l) =>

              l.id === editingId ? response.data!.lead : l

            )

          )

          // Process pending attachments after successful lead update
          await processPendingAttachments(editingId)

          pushToast(`Lead "${safeName}" atualizado com sucesso.`, "success")

        } else {

          pushToast(`Erro ao atualizar lead: ${response.error}`, "error")

        }

      } else {

        // Create new lead

        const createData: CreateLeadRequest = {

          name: safeName,

          email: safeEmail,

          phone: safePhone || undefined,

          ssn: safeSsn || undefined,

          ein: safeEin || undefined,

          source: safeSource || undefined,

          status: safeStatus,

          value: safeValue,

          estimated_close_date: safeEstimatedCloseDate,

          description: safeDescription || undefined,

        }

        

        const response = await apiService.createLead(createData)

        if (response.success && response.data) {

          setLeads((prev) => [response.data!.lead, ...prev])

          pushToast(`Lead "${safeName}" adicionado com sucesso.`, "success")

        } else {

          pushToast(`Erro ao criar lead: ${response.error}`, "error")

        }

      }

    } catch (error) {

      console.error('Error saving lead:', error)

      pushToast('Erro ao salvar lead', "error")

    }

    

    resetForm()

  }



  function handleEdit(lead: Lead) {

    setEditingId(lead.id)

    setName(lead.name)

    setEmail(lead.email)

    setPhone(lead.phone || "")

    setSsn(lead.ssn || "")

    setEin(lead.ein || "")

    setSource(lead.source || "")

    setStatus(lead.status)

    setValue(lead.value ? lead.value.toString() : "")

    setEstimatedCloseDate(lead.estimated_close_date || "")

    setDescription(lead.description || "")

    if (lead.status !== "New" && lead.status !== "In Contact" && lead.status !== "Qualified" && lead.status !== "Lost") {

      setCustomStatus(lead.status)

    } else {

      setCustomStatus("")

    }

    // Save original values for change detection
    setOriginalFormValues({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || "",
      ssn: lead.ssn || "",
      ein: lead.ein || "",
      source: lead.source || "",
      status: lead.status,
      value: lead.value ? lead.value.toString() : "",
      estimatedCloseDate: lead.estimated_close_date || ""
    })

    setIsModalOpen(true)

  }



  function handleDelete(id: string) {

    // Open confirmation modal for single deletion

    setPendingDeletionIds([id])

    setConfirmInput("")

    setIsConfirmOpen(true)

  }



  function handleDeleteSelected() {

    if (selectedLeads.size === 0) return

    // Open confirmation modal for bulk deletion

    setPendingDeletionIds(Array.from(selectedLeads))

    setConfirmInput("")

    setIsConfirmOpen(true)

  }



  function handleSelectAll() {

    if (selectedLeads.size === currentLeads.length) {
      setSelectedLeads(new Set())

      setShowSelectAllButton(false)
    } else {

      setSelectedLeads(new Set(currentLeads.map(l => l.id)))
      setShowSelectAllButton(true)
    }
  }


  const handleToggleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      // Se todos estão selecionados, desmarcar todos
      setSelectedLeads(new Set())
    } else {
      // Selecionar todos os leads que já estão carregados no frontend
      const allLeadIds = new Set(leads.map(lead => lead.id))
      setSelectedLeads(allLeadIds)
    }
  }

  const handleToggleSelectPage = () => {
    const currentPageLeadIds = new Set(currentLeads.map(lead => lead.id))
    const allCurrentPageSelected = currentPageLeadIds.size > 0 && 
      Array.from(currentPageLeadIds).every(id => selectedLeads.has(id))
    
    if (allCurrentPageSelected) {
      // Se todos da página estão selecionados, desmarcar apenas os da página
      const newSelected = new Set(selectedLeads)
      currentPageLeadIds.forEach(id => newSelected.delete(id))
      setSelectedLeads(newSelected)
    } else {
      // Selecionar todos os leads da página atual
      const newSelected = new Set([...selectedLeads, ...currentPageLeadIds])
      setSelectedLeads(newSelected)
    }
  }

  // Confirm select all leads (mantido para compatibilidade)
  const confirmSelectAllLeads = () => {
    const allLeadIds = new Set(leads.map(lead => lead.id))
    setSelectedLeads(allLeadIds)
    setShowSelectAllConfirm(false)
    setShowSelectAllButton(false)
  }


  function handleSelectLead(id: string, index: number, e: React.MouseEvent<HTMLInputElement>) {

    const isCurrentlySelected = selectedLeads.has(id)

    const shouldSelect = !isCurrentlySelected

    setSelectedLeads((prev) => {

      const next = new Set(prev)

      if (e.shiftKey && lastClickedIndex !== null && index !== -1) {

        const start = Math.min(lastClickedIndex, index)

        const end = Math.max(lastClickedIndex, index)

        for (let i = start; i <= end; i++) {

          const leadId = currentLeads[i]?.id
          if (!leadId) continue

          if (shouldSelect) {

            next.add(leadId)

          } else {

            next.delete(leadId)

          }

        }

      } else {

        if (isCurrentlySelected) {

          next.delete(id)

        } else {

          next.add(id)

        }

      }

      return next

    })

    if (index !== -1) setLastClickedIndex(index)

  }



  function openBulkEdit() {

    setBulkStatus("")

    setBulkSource("")
    
    setBulkEditConfirm("")

    setIsBulkEditOpen(true)

  }

  function openPipelineModal(action: 'add' | 'remove') {
    setPipelineAction(action)
    setIsPipelineModalOpen(true)
  }

  async function handlePipelineBulkAction() {
    if (selectedLeads.size === 0) return

    try {
      const leadIds = Array.from(selectedLeads)
      const showOnPipeline = pipelineAction === 'add'
      
      const response = await apiService.bulkUpdatePipeline(leadIds, showOnPipeline)
      
      if (response.success) {
        // Update local state
        setLeads(prev => prev.map(lead => 
          selectedLeads.has(lead.id) 
            ? { ...lead, show_on_pipeline: showOnPipeline }
            : lead
        ))
        
        pushToast(
          `${leadIds.length} leads ${showOnPipeline ? 'adicionados ao' : 'removidos do'} pipeline`,
          'success'
        )
        
        // Clear selection
        setSelectedLeads(new Set())
      } else {
        pushToast(`Erro: ${response.error}`, 'error')
      }
    } catch (error) {
      console.error('Pipeline bulk action error:', error)
      pushToast('Erro ao atualizar pipeline', 'error')
    }
    
    setIsPipelineModalOpen(false)
  }



  async function applyBulkEdit() {

    if (selectedLeads.size === 0) return

    const shouldUpdateStatus = bulkStatus.trim() !== ""

    const shouldUpdateSource = bulkSource.trim() !== ""

    if (!shouldUpdateStatus && !shouldUpdateSource) {

      setIsBulkEditOpen(false)

      return

    }

    // Check confirmation input
    if (bulkEditConfirm.trim().toLowerCase() !== "edit") {
      pushToast("Please type 'edit' to confirm bulk edit", "error")
      return
    }

    const idsToUpdate = Array.from(selectedLeads)
    const leadsToUpdate = leads.filter(l => idsToUpdate.includes(l.id))
    
    // Store original leads before editing for potential rollback
    setOriginalLeads([...leadsToUpdate])
    setCurrentEditLeads([])
    
    // Calculate batch size based on total leads (similar to import logic)
    const totalLeads = leadsToUpdate.length
    const batchSize = totalLeads > 10000 ? 1000 : 
                     totalLeads > 5000 ? 800 : 
                     totalLeads > 2000 ? 600 : 
                     totalLeads > 1000 ? 400 : 
                     totalLeads > 500 ? 200 : 
                     totalLeads > 100 ? 100 : 50
    const totalBatches = Math.ceil(totalLeads / batchSize)
    
    // Close the bulk edit modal immediately when starting
    setIsBulkEditOpen(false)
    
    // Show progress notification
    setEditNotification({
      show: true,
      progress: { current: 0, total: totalLeads, batch: 0, totalBatches },
      cancelled: false
    })
    setIsEditCancelled(false)
    isEditCancelledRef.current = false

    try {
      let successCount = 0
      let errorCount = 0
      const updatedLeads: Lead[] = []
      
      // Process leads in batches
      for (let i = 0; i < totalLeads; i += batchSize) {
        // Check if cancelled
        if (isEditCancelledRef.current) {
          // Rollback: restore original leads in backend
          try {
            const leadsToRestore = currentEditLeads
            let successfullyRestored = 0
            let errors = 0
            
            for (const editedLead of leadsToRestore) {
              try {
                // Find the original lead to get the original values
                const originalLead = originalLeads.find(orig => orig.id === editedLead.id)
                if (originalLead) {
                  const updateData: any = { 
                    id: editedLead.id,
                    status: originalLead.status,
                    source: originalLead.source
                  }
                  const result = await apiService.updateLead(updateData)
                  if (result.success) {
                    successfullyRestored++
                  } else {
                    errors++
                    console.log(`Lead ${editedLead.id} could not be restored:`, result.error)
                  }
                }
              } catch (error) {
                errors++
                console.log(`Error restoring lead ${editedLead.id}:`, error)
              }
            }
            
            if (successfullyRestored > 0) {
              pushToast(`Bulk edit cancelled - ${successfullyRestored} leads restored`, 'success')
            }
            if (errors > 0) {
              pushToast(`Bulk edit cancelled - ${errors} leads could not be restored`, 'warning')
            }
          } catch (error) {
            console.error('Error during rollback:', error)
            pushToast('Bulk edit cancelled - leads restored locally only', 'warning')
          }
          
          // Restore frontend state
          setLeads(prev => 
            prev.map(l => {
              if (!idsToUpdate.includes(l.id)) return l
              
              const originalLead = originalLeads.find(orig => orig.id === l.id)
              if (originalLead) {
                return originalLead
              }
              return l
            })
          )
          
          setFilteredLeads(prev => 
            prev.map(l => {
              if (!idsToUpdate.includes(l.id)) return l
              
              const originalLead = originalLeads.find(orig => orig.id === l.id)
              if (originalLead) {
                return originalLead
              }
              return l
            })
          )
          
          setEditNotification({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: true })
          setOriginalLeads([])
          setCurrentEditLeads([])
          
          // Force refresh leads to ensure sync with backend after rollback
          setTimeout(async () => {
            await forceRefreshLeads()
          }, 100)
          return
        }
        
        const batch = leadsToUpdate.slice(i, i + batchSize)
        const batchNumber = Math.floor(i / batchSize) + 1
        
        // Update progress notification
        setEditNotification({ 
          show: true, 
          progress: { 
            current: i + batch.length, 
            total: totalLeads, 
            batch: batchNumber, 
            totalBatches 
          }, 
          cancelled: false 
        })
        
        console.log(`Processing edit batch ${batchNumber}/${totalBatches} (${batch.length} leads)`)
        
        // Process batch in parallel
        const batchPromises = batch.map(async (lead) => {
          const updateData: any = { id: lead.id }
          
          if (shouldUpdateStatus) {
            updateData.status = bulkStatus as Lead["status"]
          }
          
          if (shouldUpdateSource) {
            updateData.source = bulkSource
          }

          try {
            const result = await apiService.updateLead(updateData)
            return { success: result.success, lead, result }
          } catch (error) {
            console.error(`Failed to update lead ${lead.id}:`, error)
            return { success: false, lead, error }
          }
        })
        
        const batchResults = await Promise.all(batchPromises)
        
        // Count successes and errors
        const batchSuccesses = batchResults.filter(r => r.success)
        const batchErrors = batchResults.filter(r => !r.success)
        
        successCount += batchSuccesses.length
        errorCount += batchErrors.length
        
        // Store successfully updated leads
        batchSuccesses.forEach(({ lead }) => {
          const updatedLead = {
            ...lead,
            status: shouldUpdateStatus ? (bulkStatus as Lead["status"]) : lead.status,
            source: shouldUpdateSource ? bulkSource : lead.source,
          }
          updatedLeads.push(updatedLead)
          
          // Track leads as they are edited for immediate rollback capability
          setCurrentEditLeads(prev => [...prev, updatedLead])
        })
        
        // Update local state for this batch
        setLeads(prev => 
          prev.map(l => {
            if (!idsToUpdate.includes(l.id)) return l
            
            const updatedLead = batchSuccesses.find(r => r.lead.id === l.id)
            if (updatedLead) {
              return {
                ...l,
                status: shouldUpdateStatus ? (bulkStatus as Lead["status"]) : l.status,
                source: shouldUpdateSource ? bulkSource : l.source,
              }
            }
            return l
          })
        )
        
        setFilteredLeads(prev => 
          prev.map(l => {
            if (!idsToUpdate.includes(l.id)) return l
            
            const updatedLead = batchSuccesses.find(r => r.lead.id === l.id)
            if (updatedLead) {
              return {
                ...l,
                status: shouldUpdateStatus ? (bulkStatus as Lead["status"]) : l.status,
                source: shouldUpdateSource ? bulkSource : l.source,
              }
            }
            return l
          })
        )
      }
      
      // Clear selections and show success
      setSelectedLeads(new Set())
      
      if (errorCount > 0) {
        pushToast(`Updated ${successCount} leads, ${errorCount} failed`, 'warning')
      } else {
        pushToast(`Successfully updated ${successCount} leads`, 'success')
      }
      
      // Sync after operation to ensure complete sync with backend
      await syncAfterOperation()

    } catch (error) {
      console.error('Error updating leads:', error)
      pushToast('Error updating leads', 'error')
    } finally {
      setEditNotification({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: false })
      
      
      setOriginalLeads([])
      setCurrentEditLeads([])
    }

  }



  function exportToXLSX() {

    const data = filteredLeads.map(lead => ({

      Name: lead.name,

      Email: lead.email,

      Phone: lead.phone,

      SSN: lead.ssn,

      Source: lead.source,

      Status: lead.status

    }))



    const ws = XLSX.utils.json_to_sheet(data)

    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(wb, ws, "Leads")

    

    const fileName = `leads_${org}_${new Date().toISOString().split('T')[0]}.xlsx`

    XLSX.writeFile(wb, fileName)

  }



  function normalizeHeader(raw: string): string {

    const s = raw

      .toLowerCase()

      .normalize("NFD")

      .replace(/\p{Diacritic}+/gu, "")

      .replace(/[^a-z0-9]+/g, " ")

      .trim()

    // unify common variants

    return s

  }



  function headerToCanonical(normalized: string): "name" | "email" | "phone" | "ssn" | "ein" | "source" | "status" | "value" | "estimated_close_date" | "description" | null {

    // Map of supported header synonyms (normalized via normalizeHeader)

    const headerAliases: Record<"name" | "email" | "phone" | "ssn" | "ein" | "source" | "status" | "value" | "estimated_close_date" | "description", string[]> = {

      name: [

        "name", "full name", "fullname", "nome", "nome completo"

      ],

      email: [

        "email", "e mail", "mail", "email address", "endereco de email", "correio", "correo", "email / phone", "email phone", "email/phone"
      ],

      phone: [

        "phone", "phone number", "cell", "cellphone", "mobile", "mobile phone", "telefone", "celular", "telemovel", "whatsapp"

      ],

      ssn: [

        "ssn", "social security number", "social security", "social security no", "social security n", "social security #", "social sec number", "social sec no",

        "cpf", "c p f", "cadastro de pessoa fisica", "cadastro de pessoa física", "numero do cpf", "n cpf", "número do cpf", "ssn ein", "ssn/ein", "ssn / ein", "ssn/ein"
      ],

      ein: [

        "ein", "employer identification number", "cnpj", "cadastro nacional da pessoa juridica", "numero do cnpj", "n cnpj", "número do cnpj", "ssn ein", "ssn/ein", "ssn / ein", "ssn/ein"
      ],

      source: [

        "source", "lead source", "leadsource", "origem", "fonte", "canal", "canal de origem", "origem do lead", "fonte do lead"

      ],

      status: [

        "status", "lead status", "leadstatus", "situacao", "estado", "etapa", "situacao do lead", "situacao do contato"

      ],

      value: [

        "value", "deal value", "valor", "valor da venda", "preco", "preço", "amount", "montante", "price", "sale value", "value", "deal value", "deal amount", "total value", "contract value"
      ],

      estimated_close_date: [

        "estimated close date", "close date", "data de fechamento", "data estimada", "data prevista", "expected close date", "estimated close date", "close date", "estimated close date", "close date", "close date", "expected close", "close", "date", "close date", "closing date", "deal close date", "expected close date", "target close date", "close date", "closing date", "deal close date", "expected close date", "target close date", "data", "data de fechamento", "data estimada", "data prevista", "data de venda", "data de conclusao", "data de conclusão", "data final", "data limite", "deadline", "due date", "end date", "final date", "completion date", "finish date"
      ],

      description: [

        "description", "notes", "observations", "descricao", "descrição", "notas", "observacoes", "observações", "comentarios", "comentários", "description", "notes"

      ],

    }



    for (const [key, aliases] of Object.entries(headerAliases) as ["name" | "email" | "phone" | "ssn" | "ein" | "source" | "status" | "value" | "estimated_close_date" | "description", string[]][]) {

      if (aliases.includes(normalized)) return key

    }

    return null

  }



  function makeLeadSignature(l: { name: string; email: string; phone?: string; ssn?: string; source?: string; status: string }): string {

    return `${l.name}||${l.email}||${l.phone || ""}||${l.ssn || ""}||${l.source || ""}||${l.status}`

  }



  function buildSignatureSet(items: Lead[]): Set<string> {

    const s = new Set<string>()

    for (const l of items) {

      s.add(makeLeadSignature({ name: l.name, email: l.email, phone: l.phone, ssn: l.ssn, source: l.source, status: l.status }))

    }

    return s

  }

  // Attachment functions
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileImage
    if (mimeType === 'application/pdf') return FileText
    if (mimeType.includes('word') || mimeType.includes('document')) return FileText
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return FileText
    if (mimeType.startsWith('video/')) return FileVideo
    if (mimeType.startsWith('audio/')) return FileAudio
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return Archive
    return File
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const validateFile = (file: File): { valid: boolean; error?: string } => {
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

  const uploadAttachment = async (leadId: string, file: File) => {
    try {
      setUploadingAttachments(prev => ({ ...prev, [leadId]: true }))
      setAttachmentProgress(prev => ({ ...prev, [leadId]: 0 }))

      const response = await apiService.uploadLeadAttachment(leadId, file)
      
      console.log('Upload response:', response)
      
      if (response.success && response.data) {
        
        // Check if the response has the expected structure
        let newAttachment = null
        
        if (response.data.attachment) {
          newAttachment = response.data.attachment
        } else if ((response.data as any).data && (response.data as any).data.attachment) {
          newAttachment = (response.data as any).data.attachment
        } else if (response.data) {
          // Maybe the response.data is the attachment itself
          newAttachment = response.data as any
        }
        
        console.log('New attachment object:', newAttachment)
        
        if (newAttachment && newAttachment.id && newAttachment.mimeType && newAttachment.originalName) {
          // Update local state with new attachment
          setLeads(prev => prev.map(lead => {
            if (lead.id === leadId) {
              const attachments = lead.attachments || []
              return { ...lead, attachments: [...attachments, newAttachment] }
            }
            return lead
          }))
          
          setFilteredLeads(prev => prev.map(lead => {
            if (lead.id === leadId) {
              const attachments = lead.attachments || []
              return { ...lead, attachments: [...attachments, newAttachment] }
            }
            return lead
          }))
        } else {
          console.warn('Invalid attachment received from server:', newAttachment)
        }
        
        // Refresh to ensure sync
        await syncAfterOperation()
      } else {
        pushToast(response.error || 'Failed to upload file', 'error')
      }
    } catch (error) {
      console.error('Error uploading attachment:', error)
      pushToast('Error uploading file', 'error')
    } finally {
      setUploadingAttachments(prev => ({ ...prev, [leadId]: false }))
      setAttachmentProgress(prev => ({ ...prev, [leadId]: 0 }))
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
          
          setFilteredLeads(prev => prev.map(lead => {
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
        
        setFilteredLeads(prev => prev.map(lead => {
          if (lead.id === leadId) {
            const attachments = (lead.attachments || []).filter(a => a.id !== attachmentId)
            return { ...lead, attachments }
          }
          return lead
        }))
        
        // Refresh to ensure sync
        await syncAfterOperation()
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
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        pushToast('File downloaded successfully', 'success')
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
      await syncAfterOperation()
      
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


  // Function to separate email and phone from concatenated string
  function separateEmailAndPhone(combinedString: string): { email: string; phone: string } {
    if (!combinedString) return { email: '', phone: '' }
    
    // Try to find email pattern (contains @)
    const emailMatch = combinedString.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    if (emailMatch) {
      const email = emailMatch[0]
      // Remove the email from the string to get the phone
      let phone = combinedString.replace(email, '').trim()
      
      // Clean up phone number (remove any non-digit characters except + at start)
      phone = phone.replace(/[^\d+]/g, '')
      
      // If phone starts with +, keep it, otherwise format as needed
      if (phone && !phone.startsWith('+')) {
        // Ensure it's a valid phone number format
        phone = phone.replace(/^0+/, '') // Remove leading zeros
      }
      
      return { email, phone }
    }
    
    // If no email found, treat entire string as phone
    return { email: '', phone: combinedString }
  }

  // Function to parse any date format (Brazilian, American, ISO, etc.)
  function parseAnyDateFormat(dateString: string | number): string | null {
    if (dateString == null || dateString === "") return null
    
    // 🔹 Trata valores numéricos (Excel serial date)
    if (typeof dateString === "number") {
      console.log(`Converting Excel serial date: ${dateString}`)
      const excelEpoch = new Date(1899, 11, 30) // Excel epoch is 1900-01-01, but JavaScript Date is 1899-12-30
      const date = new Date(excelEpoch.getTime() + dateString * 86400000)
      const result = date.toISOString().split("T")[0]
      console.log(`Excel serial ${dateString} -> ${result}`)
      return result
    }
    
    const cleanDate = dateString.toString().trim()
    
    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return cleanDate
    }
    
    // Try different date patterns
    const patterns = [
      // DD/MM/YYYY (Brazilian)
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, handler: (match: RegExpMatchArray) => {
        const [, day, month, year] = match
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }},
      
      // MM/DD/YYYY (American)
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, handler: (match: RegExpMatchArray) => {
        const [, month, day, year] = match
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }},
      
      // YYYY/MM/DD
      { regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, handler: (match: RegExpMatchArray) => {
        const [, year, month, day] = match
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }},
      
      // DD-MM-YYYY
      { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, handler: (match: RegExpMatchArray) => {
        const [, day, month, year] = match
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }},
      
      // YYYY-MM-DD (already handled above, but just in case)
      { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, handler: (match: RegExpMatchArray) => {
        const [, year, month, day] = match
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }},
      
      // DD.MM.YYYY
      { regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, handler: (match: RegExpMatchArray) => {
        const [, day, month, year] = match
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }},
      
      // DD de MMMM de YYYY (Brazilian long format)
      { regex: /^(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})$/, handler: (match: RegExpMatchArray) => {
        const [, day, monthName, year] = match
        const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                           'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
        const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase())
        if (monthIndex !== -1) {
          return new Date(parseInt(year), monthIndex, parseInt(day))
        }
        return null
      }},
    ]
    
    // Try each pattern
    for (const pattern of patterns) {
      const match = cleanDate.match(pattern.regex)
      if (match) {
        try {
          const date = pattern.handler(match)
          if (date && !isNaN(date.getTime())) {
            // Validate date is reasonable
            const year = date.getFullYear()
            const currentYear = new Date().getFullYear()
            if (year >= 1900 && year <= currentYear + 10) {
              return date.toISOString().split('T')[0]
            }
          }
        } catch (error) {
          console.log(`Error parsing date with pattern: ${error}`)
        }
      }
    }
    
    // Try JavaScript's native Date parsing as fallback
    try {
      const nativeDate = new Date(cleanDate)
      if (!isNaN(nativeDate.getTime())) {
        const year = nativeDate.getFullYear()
        const currentYear = new Date().getFullYear()
        if (year >= 1900 && year <= currentYear + 10) {
          return nativeDate.toISOString().split('T')[0]
        }
      }
    } catch (error) {
      console.log(`Native date parsing failed: ${error}`)
    }
    
    return null
  }

  // Function to separate SSN and EIN from concatenated string
  function separateSSNAndEIN(combinedString: string): { ssn: string; ein: string } {
    if (!combinedString) return { ssn: '', ein: '' }
    
    // Remove common prefixes and clean the string
    let cleanString = combinedString
      .replace(/^(ssn|ein):\s*/gi, '') // Remove SSN: or EIN: prefixes
      .replace(/^(ssn|ein)\s*/gi, '') // Remove SSN or EIN prefixes
      .replace(/ssn:\s*/gi, '') // Remove SSN: prefix
      .replace(/ein:\s*/gi, '') // Remove EIN: prefix
      .trim()
    
    // Try to find SSN pattern (XXX-XX-XXXX or XXXXXXXXX)
    const ssnMatch = cleanString.match(/(\d{3}-?\d{2}-?\d{4})/)
    let ssn = ''
    let ein = ''
    
    if (ssnMatch) {
      ssn = ssnMatch[1].replace(/-/g, '') // Remove dashes for storage
      // Remove SSN from string to get EIN
      cleanString = cleanString.replace(ssnMatch[1], '').trim()
    }
    
    // Look for EIN pattern (9+ digits)
    const einMatch = cleanString.match(/(\d{9,})/)
    if (einMatch) {
      ein = einMatch[1]
    }
    
    return { ssn, ein }
  }


  function mapRowsToLeads(rows: Record<string, unknown>[]): Lead[] {

    if (rows.length === 0) return []

    const sampleRow = rows[0]

    const headerKeys = Object.keys(sampleRow)

    
    console.log("=== FILE MAPPING DEBUG ===")
    console.log("Available columns:", headerKeys)
    console.log("Sample row data:", sampleRow)
    const mapping: Partial<Record<string, "name" | "email" | "phone" | "ssn" | "ein" | "source" | "status" | "value" | "estimated_close_date" | "description">> = {}

    

    console.log('Original headers:', headerKeys)

    

    // Test specific problematic headers

    console.log("Testing 'Close Date' detection...")
    const closeDateHeaders = headerKeys.filter(h => 
      h.toLowerCase().includes('close') || 
      h.toLowerCase().includes('date') ||
      h.toLowerCase().includes('fechamento')
    )
    console.log("Potential close date headers:", closeDateHeaders)
    const testHeaders = ['Value', 'Close Date', 'Notes', 'Description', 'Estimated Close Date']

    console.log('Testing specific headers:')

    for (const testHeader of testHeaders) {

      const normalized = normalizeHeader(testHeader)

      const canonical = headerToCanonical(normalized)

      console.log(`Test: "${testHeader}" -> Normalized: "${normalized}" -> Canonical: ${canonical}`)

    }

    

    for (const header of headerKeys) {

      const normalized = normalizeHeader(header)

      const canonical = headerToCanonical(normalized)

      console.log(`Header: "${header}" -> Normalized: "${normalized}" -> Canonical: ${canonical}`)

      if (canonical) {

        mapping[header] = canonical

        console.log(`✅ Mapped "${header}" to ${canonical}`)

      } else {

        console.log(`❌ Could not map "${header}" (normalized: "${normalized}")`)

      }

    }

    console.log('Final mapping:', mapping)

    const imported: Lead[] = []

    for (const row of rows) {

      const draft: Partial<Lead> = {}

      console.log('Processing row:', row)

      for (const [header, value] of Object.entries(row)) {

        const key = mapping[header]

        if (!key) continue

        const text = String(value ?? "").trim()

        console.log(`Processing field: ${header} -> ${key} = "${text}"`)

        

        if (key === "status") {

          draft.status = truncateTo(text, FIELD_MAX.status) as Lead["status"]

        } else if (key === "name") {

          draft.name = truncateTo(text, FIELD_MAX.name)

        } else if (key === "email") {

          // Check if this field contains both email and phone (concatenated)
          if (text.includes('@') && /\d/.test(text)) {
            console.log(`Detected concatenated email/phone: "${text}"`)
            const separated = separateEmailAndPhone(text)
            console.log(`Separated: email="${separated.email}", phone="${separated.phone}"`)
            draft.email = truncateTo(separated.email, FIELD_MAX.email)
            if (separated.phone && !draft.phone) {
              draft.phone = truncateTo(separated.phone, FIELD_MAX.phone)
            }
          } else {
          draft.email = truncateTo(text, FIELD_MAX.email)

          }
        } else if (key === "phone") {

          draft.phone = truncateTo(text, FIELD_MAX.phone)

        } else if (key === "source") {

          draft.source = truncateTo(text, FIELD_MAX.source)

        } else if (key === "ssn") {

          // Check if this field contains SSN (with or without EIN)
          if (text.includes('SSN')) {
            console.log(`Detected SSN field: "${text}"`)
            const separated = separateSSNAndEIN(text)
            console.log(`Separated: ssn="${separated.ssn}", ein="${separated.ein}"`)
            draft.ssn = truncateTo(separated.ssn, FIELD_MAX.ssn)
            if (separated.ein && !draft.ein) {
              draft.ein = truncateTo(separated.ein, FIELD_MAX.ein)
            }
          } else {
          draft.ssn = truncateTo(text, FIELD_MAX.ssn)

          console.log(`Set SSN: ${draft.ssn}`)

          }
        } else if (key === "ein") {

          draft.ein = truncateTo(text, FIELD_MAX.ein)

          console.log(`Set EIN: ${draft.ein}`)

        } else if (key === "value") {

          // Clean monetary values (remove $, commas, etc.)
          const cleanValue = text.replace(/[$,]/g, '').trim()
          const numValue = parseFloat(cleanValue)
          if (!isNaN(numValue)) {

            draft.value = numValue

            console.log(`Set Value: ${draft.value} (from "${text}")`)
          }

        } else if (key === "estimated_close_date") {

          // Try to parse the date and limit to 10 characters

          if (text && text.trim()) {
            try {
              const parsedDate = parseAnyDateFormat(text.trim())
              if (parsedDate) {
                draft.estimated_close_date = parsedDate.slice(0, FIELD_MAX.date)
                console.log(`Set Close Date: ${draft.estimated_close_date} (from "${text}")`)
              } else {
                console.log(`Could not parse date: ${text}`)
              }
            } catch (error) {
              console.log(`Error parsing date: ${text}`, error)
            }
          }

        } else if (key === "description") {

          draft.description = truncateTo(text, FIELD_MAX.description)

          console.log(`Set Description: ${draft.description}`)

        }

      }

      // Validate required fields
      if (!draft.name || !draft.email) {
        console.log(`Skipping lead - missing required fields: name="${draft.name}", email="${draft.email}"`)
        continue
      }
      
      // Ensure estimated_close_date is valid before creating lead
      let safeEstimatedCloseDate = draft.estimated_close_date
      if (safeEstimatedCloseDate) {
        try {
          // Validate the date format and ensure it's reasonable
          const testDate = new Date(safeEstimatedCloseDate)
          if (isNaN(testDate.getTime())) {
            console.log(`Invalid date format, removing: ${safeEstimatedCloseDate}`)
            safeEstimatedCloseDate = undefined
          } else {
            // Ensure it's in YYYY-MM-DD format
            const year = testDate.getFullYear()
            const month = String(testDate.getMonth() + 1).padStart(2, '0')
            const day = String(testDate.getDate()).padStart(2, '0')
            safeEstimatedCloseDate = `${year}-${month}-${day}`
          }
        } catch (error) {
          console.log(`Error validating date, removing: ${safeEstimatedCloseDate}`, error)
          safeEstimatedCloseDate = undefined
        }
      }

      const finalLead = {

        id: createId(),

        organization_id: "", // Will be set by the API

        name: draft.name,
        email: draft.email,
        phone: draft.phone || "",

        ssn: draft.ssn || "",

        ein: draft.ein || "",

        source: draft.source || "",

        status: (draft.status as Lead["status"]) || "New",

        value: draft.value,

        estimated_close_date: safeEstimatedCloseDate,
        description: draft.description,
        show_on_pipeline: false,

        created_at: new Date().toISOString(),

        updated_at: new Date().toISOString(),

      }

      console.log('Final lead created:', finalLead)

      imported.push(finalLead)

    }

    return imported

  }


  // Function to process leads in batches with minimal delay for speed
  async function processBatch(leads: Lead[], batchSize: number = 50, initialDelayMs: number = 100, isCancelled: () => boolean = () => importCancelled, onBatchSaved?: (leads: Lead[]) => void): Promise<{ saved: Lead[], errors: number, duplicates: number, cancelled: boolean }> {
    const totalBatches = Math.ceil(leads.length / batchSize)
    const savedLeads: Lead[] = []
    let errorCount = 0
    let duplicateCount = 0
    let currentDelay = initialDelayMs

    for (let i = 0; i < leads.length; i += batchSize) {
      // Check if import was cancelled
      const cancelled = isCancelled()
      if (cancelled || isImportCancelledRef.current) {
        // Rollback: remove imported leads from backend and frontend
        if (savedLeads.length > 0) {
          let successfullyDeleted = 0
          let errors = 0
          
          try {
            // Delete imported leads from backend with error handling
            for (const lead of savedLeads) {
              try {
                const response = await apiService.deleteLead(lead.id)
                if (response.success) {
                  successfullyDeleted++
                } else {
                  errors++
                  console.log(`Lead ${lead.id} not found or already deleted:`, response.error)
                }
              } catch (error) {
                errors++
                console.log(`Error deleting lead ${lead.id}:`, error)
              }
            }
            
            if (successfullyDeleted > 0) {
              pushToast(`Import cancelled - ${successfullyDeleted} leads removed from backend`, 'success')
            }
            if (errors > 0) {
              pushToast(`Import cancelled - ${errors} leads were already removed or not found`, 'warning')
            }
          } catch (error) {
            console.error('Error during rollback:', error)
            pushToast('Import cancelled - leads removed locally only', 'warning')
          }
          
          // Remove from frontend state regardless of backend success
          const importedIds = savedLeads.map(lead => lead.id)
          setLeads(prev => prev.filter(lead => !importedIds.includes(lead.id)))
          setFilteredLeads(prev => prev.filter(lead => !importedIds.includes(lead.id)))
          setImportedLeads(prev => prev.filter(lead => !importedIds.includes(lead.id)))
          setCurrentImportLeads([])
        }
        setImportNotification({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: true })
        setIsImportCancelled(false)
        isImportCancelledRef.current = false
        return { saved: savedLeads, errors: errorCount, duplicates: duplicateCount, cancelled: true }
      }

      const batch = leads.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      
      setImportProgress({
        current: i + batch.length,
        total: leads.length,
        batch: batchNumber,
        totalBatches
      })
      setImportNotification({ 
        show: true, 
        progress: { 
          current: i + batch.length, 
          total: leads.length, 
          batch: batchNumber, 
          totalBatches 
        }, 
        cancelled: false 
      })

      console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} leads) with ${currentDelay}ms delay`)
      
      // Check if import was cancelled before processing batch
      if (isCancelled()) {
        console.log('Import cancelled before processing batch')
        setImportNotification({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: true })
        return { saved: savedLeads, errors: errorCount, duplicates: duplicateCount, cancelled: true }
      }

      // Process batch in parallel
      const batchPromises = batch.map(async (lead) => {
        // Check cancellation before each lead
        if (isCancelled()) {
          return { success: false, lead: null, type: 'cancelled' }
        }
        
        try {
          const createData: CreateLeadRequest = {
            name: lead.name,
            email: lead.email,
            phone: lead.phone || undefined,
            ssn: lead.ssn || undefined,
            ein: lead.ein || undefined,
            source: lead.source || undefined,
            status: lead.status,
            value: lead.value,
            description: lead.description,
            estimated_close_date: lead.estimated_close_date,
          }
          
          const response = await apiService.createLead(createData)
          if (response.success && response.data) {
            return { success: true, lead: response.data.lead, type: 'saved' }
          } else {
            // Check if it's a duplicate error
            const errorMsg = response.error?.toLowerCase() || ''
            if (errorMsg.includes('duplicado') || errorMsg.includes('duplicate')) {
              // Don't log as error - it's expected behavior
              console.log(`Lead duplicate skipped: ${lead.name} (${lead.email})`)
              return { success: true, lead: null, type: 'duplicate' }
            } else {
              console.error('Failed to save lead:', response.error)
              return { success: false, lead: null, type: 'error' }
            }
          }
        } catch (error) {
          console.error('Error saving lead:', error)
          return { success: false, lead: null, type: 'error' }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      
      // Collect results and adapt delay
      let batchSuccesses = 0
      batchResults.forEach(result => {
        if (result.success) {
          if (result.type === 'saved' && result.lead) {
            savedLeads.push(result.lead)
            batchSuccesses++
          } else if (result.type === 'duplicate') {
            duplicateCount++
            batchSuccesses++ // Duplicates are considered successful
          }
        } else {
          errorCount++
        }
      })

      // Call callback with newly saved leads from this batch
      if (onBatchSaved && savedLeads.length > 0) {
        const newLeads = savedLeads.slice(-batchSuccesses) // Get only the leads from this batch
        onBatchSaved(newLeads)
      }

      // No adaptive delay - keep it fast

      // No delay between batches for maximum speed
      // Only check for cancellation if there are more batches
      if (i + batchSize < leads.length && isCancelled()) {
        console.log('Import cancelled between batches')
        setImportNotification({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: true })
        return { saved: savedLeads, errors: errorCount, duplicates: duplicateCount, cancelled: true }
      }
    }

    return { saved: savedLeads, errors: errorCount, duplicates: duplicateCount, cancelled: false }
  }

  async function processFileForPreview(file: File) {
    try {
      const lower = file.name.toLowerCase()
      let imported: Lead[] = []
      let fields: string[] = []
      
      if (lower.endsWith(".json")) {
        const text = await file.text()
        const data = JSON.parse(text) as Record<string, unknown>[]
        imported = mapRowsToLeads(Array.isArray(data) ? data : [])
        fields = data.length > 0 ? Object.keys(data[0]) : []
      } else {
        // CSV, XLSX, XLS, ODS via SheetJS
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { 
          defval: "",
          raw: false // 🔹 Força conversão automática de números de data em string
        })
        imported = mapRowsToLeads(rows)
        fields = rows.length > 0 ? Object.keys(rows[0]) : []
      }
      
      return { leads: imported, fields, totalLeads: imported.length }
    } catch (error) {
      console.error("Error processing file:", error)
      throw error
    }
  }

  async function handleFileSelect(file: File) {
    setIsProcessingFile(true)
    try {
      const preview = await processFileForPreview(file)
      setFilePreview(preview)
      setShowPreview(true)
    } catch (error) {
      pushToast("Error processing file. Please check the file format.", "error")
      console.error("File processing error:", error)
    } finally {
      setIsProcessingFile(false)
    }
  }

  async function confirmImport() {
    if (!filePreview) return
    
    setShowPreview(false)
    setIsImportOpen(false)
    
    // Create a temporary file object for the import
    const fileInput = fileInputRef.current
    if (fileInput && fileInput.files && fileInput.files[0]) {
      await handleImportFile(fileInput.files[0])
    }
  }


  async function handleImportFile(file: File) {

    setIsImporting(true)

    setImportProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 })
    setImportNotification({ show: true, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: false })
    setIsImportCancelled(false)
    isImportCancelledRef.current = false
    setCurrentImportLeads([]) // Reset current import leads
    
    try {

      const lower = file.name.toLowerCase()

      let imported: Lead[] = []

      

      if (lower.endsWith(".json")) {

        const text = await file.text()

        const data = JSON.parse(text) as Record<string, unknown>[]

        imported = mapRowsToLeads(Array.isArray(data) ? data : [])

      } else {

        // CSV, XLSX, XLS, ODS via SheetJS

        const arrayBuffer = await file.arrayBuffer()

        const workbook = XLSX.read(arrayBuffer, { type: "array" })

        const sheetName = workbook.SheetNames[0]

        const worksheet = workbook.Sheets[sheetName]

        const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { 
          defval: "",
          raw: false // 🔹 Força conversão automática de números de data em string
        })
        imported = mapRowsToLeads(rows)

      }

      

      if (imported.length > 0) {

        const existing = buildSignatureSet(leads)

        const uniqueToAdd: Lead[] = []

        let duplicatesCount = 0

        

        // Filtrar duplicados baseado em todos os campos principais

        for (const l of imported) {

          const isDuplicate = leads.some(existingLead => 

            existingLead.name.toLowerCase() === l.name.toLowerCase() &&

            existingLead.email.toLowerCase() === l.email.toLowerCase() &&

            (existingLead.phone || '') === (l.phone || '') &&

            (existingLead.ssn || '') === (l.ssn || '') &&

            (existingLead.source || '') === (l.source || '') &&

            existingLead.status === l.status

          )

          

          if (!isDuplicate) {

            uniqueToAdd.push(l)

          } else {

            duplicatesCount++

          }

        }

        

        if (uniqueToAdd.length > 0) {

          // Maximum speed optimization - no limits, maximum batches
          const batchSize = uniqueToAdd.length > 10000 ? 1000 : 
                           uniqueToAdd.length > 5000 ? 800 : 
                           uniqueToAdd.length > 2000 ? 600 : 
                           uniqueToAdd.length > 1000 ? 400 : 
                           uniqueToAdd.length > 500 ? 200 : 
                           uniqueToAdd.length > 100 ? 100 : 50
          const delayMs = 0 // No delay for maximum speed
          
          console.log(`Processing ${uniqueToAdd.length} leads in batches of ${batchSize} with ${delayMs}ms delay`)
          
          const { saved: savedLeads, errors: errorCount, duplicates: duplicateCount, cancelled } = await processBatch(uniqueToAdd, batchSize, delayMs, () => {
            console.log('Checking cancellation:', importCancelled)
            return importCancelled
          }, (newLeads) => {
            // Track leads as they are imported for immediate rollback capability
            setCurrentImportLeads(prev => [...prev, ...newLeads])
            
            // Update leads list in real-time as batches are processed
            setLeads(prev => [...newLeads, ...prev])
            setFilteredLeads(prev => [...newLeads, ...prev])
            
            // Track all imported leads for potential rollback
            setImportedLeads(prev => [...prev, ...newLeads])
          })
          

          // Leads are now updated in real-time during batch processing
          
          // Show comprehensive results
          if (cancelled) {
            pushToast(`Import cancelled. ${savedLeads.length} lead(s) saved, ${duplicateCount} duplicate(s) skipped.`, "warning")
          } else {
            let message = `${savedLeads.length} lead(s) imported successfully.`
            if (duplicateCount > 0) {
              message += ` ${duplicateCount} duplicate(s) were skipped.`
            }
          if (errorCount > 0) {

              message += ` ${errorCount} lead(s) failed to save.`
            }
            pushToast(message, errorCount > 0 ? "warning" : "success")
          }
          
          if (cancelled && savedLeads.length === 0 && duplicateCount === 0) {
            pushToast(`Import cancelled. No leads were processed.`, "warning")
          }

        } else {

          pushToast(`0 lead(s) imported. No new records detected.`, "warning")

        }

        

        if (duplicatesCount > 0) {

          pushToast(`${duplicatesCount} duplicate lead(s) were skipped during import.`, "warning")

        }

      }

    } catch (err) {

      console.error(err)

      pushToast("Failed to import file. Please check the file format and content.", "error")

    } finally {

      setIsImporting(false)

      setImportProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 })
      setImportCancelled(false)
      setImportNotification({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: false })
      if (fileInputRef.current) fileInputRef.current.value = ""
      
      
      // Sync after operation to ensure complete sync with backend
      await syncAfterOperation()

    }

  }


  function exportData(format: "xlsx" | "csv" | "ods" | "json") {

    const selectedIds = selectedLeads

    const baseList = selectedIds.size > 0

      ? leads.filter(l => selectedIds.has(l.id))

      : filteredLeads

    // Se não há leads, criar template vazio com colunas
    const data = baseList.length > 0 ? baseList.map(lead => ({

      Name: lead.name,

      Email: lead.email,

      Phone: lead.phone || '',

      SSN: lead.ssn || '',

      EIN: lead.ein || '',

      Source: lead.source || '',

      Status: lead.status,

      Value: lead.value || '',

      'Estimated Close Date': lead.estimated_close_date || '',

      Description: lead.description || '',

      'Created At': lead.created_at,

      'Updated At': lead.updated_at,

    })) : [{

      Name: '',

      Email: '',

      Phone: '',

      SSN: '',

      EIN: '',

      Source: '',

      Status: '',

      Value: '',

      'Estimated Close Date': '',

      Description: '',

      'Created At': '',

      'Updated At': '',

    }]

    const date = new Date().toISOString().split('T')[0]

    const base = baseList.length > 0 
      ? `leads_${org}_${date}`
      : `leads_template_${org}_${date}`

    if (format === "json") {

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" })

      const a = document.createElement("a")

      a.href = URL.createObjectURL(blob)

      a.download = `${base}.json`

      a.click()

      URL.revokeObjectURL(a.href)

      pushToast(`${data.length} lead(s) exported as JSON.`, "success")

      return

    }

    const ws = XLSX.utils.json_to_sheet(data)

    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(wb, ws, "Leads")

    const bookType = format

    XLSX.writeFile(wb, `${base}.${format}`, { bookType: bookType as XLSX.BookType })

    const message = baseList.length > 0 
      ? `${data.length} lead(s) exported as ${format.toUpperCase()}.`
      : `Template exported as ${format.toUpperCase()}. Use this file to import leads.`

    pushToast(message, "success")

  }



  // Free text phone input: no auto-formatting



  const canConfirmDeletion = React.useMemo(() => {

    // For single deletion, no typing required. For bulk deletion, require "delete"

    if (pendingDeletionIds.length === 1) return true

    const value = confirmInput.trim().toLowerCase()

    return value === "delete"

  }, [confirmInput, pendingDeletionIds.length])



  async function performDeletion() {

    if (!canConfirmDeletion) return

    // Close confirmation modal immediately when starting deletion
    setIsConfirmOpen(false)
    
    const totalLeads = pendingDeletionIds.length
    // Maximum speed optimization - no limits, maximum batches for deletion
    const batchSize = totalLeads > 10000 ? 1000 : 
                     totalLeads > 5000 ? 800 : 
                     totalLeads > 2000 ? 600 : 
                     totalLeads > 1000 ? 400 : 
                     totalLeads > 500 ? 200 : 
                     totalLeads > 100 ? 100 : 50
    const totalBatches = Math.ceil(totalLeads / batchSize)
    
    // Show progress notification
    setDeleteNotification({
      show: true,
      progress: { current: 0, total: totalLeads, batch: 0, totalBatches },
      cancelled: false
    })
    setIsDeletionCancelled(false)
    isDeletionCancelledRef.current = false
    
    try {
      let deletedCount = 0
      const leadsToDelete: Lead[] = []
      
      // Store leads before deletion for potential rollback
      const leadsBeforeDeletion = [...leads]
      
      for (let i = 0; i < totalBatches; i++) {
        // Check if cancelled
        if (isDeletionCancelledRef.current) {
          // Rollback: restore deleted leads in backend
          try {
            // Restore leads that were already deleted in this batch
            const leadsToRestore = leadsToDelete.slice(0, deletedCount)
            for (const lead of leadsToRestore) {
              await apiService.createLead(lead)
            }
            pushToast(`Deletion cancelled - ${leadsToRestore.length} leads restored`, 'success')
          } catch (error) {
            console.error('Error restoring leads:', error)
          }
          
          // Restore frontend state
          setLeads(leadsBeforeDeletion)
          setFilteredLeads(leadsBeforeDeletion)
          setDeletedLeads([])
          setDeleteNotification({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: false })
          setIsDeletionCancelled(false)
          isDeletionCancelledRef.current = false
          return

        }

        
        const startIndex = i * batchSize
        const endIndex = Math.min(startIndex + batchSize, totalLeads)
        const batchIds = pendingDeletionIds.slice(startIndex, endIndex)
        
        // Store leads being deleted in this batch
        const batchLeads = leadsBeforeDeletion.filter(lead => batchIds.includes(lead.id))
        leadsToDelete.push(...batchLeads)
        
        // Update progress
        setDeleteNotification(prev => ({
          ...prev,
          progress: { 
            current: deletedCount, 
            total: totalLeads, 
            batch: i + 1, 
            totalBatches 
          }
        }))
        
        try {
          // Check cancellation before processing batch
          if (isDeletionCancelledRef.current) {
            // Rollback: restore deleted leads in backend
            try {
              const leadsToRestore = leadsToDelete.slice(0, deletedCount)
              for (const lead of leadsToRestore) {
                await apiService.createLead(lead)
              }
              pushToast(`Deletion cancelled - ${leadsToRestore.length} leads restored`, 'success')
            } catch (error) {
              console.error('Error restoring leads:', error)
            }
            
            // Restore frontend state
            setLeads(leadsBeforeDeletion)
            setFilteredLeads(leadsBeforeDeletion)
            setDeletedLeads([])
            setDeleteNotification({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: false })
            setIsDeletionCancelled(false)
            isDeletionCancelledRef.current = false
            return
          }
          
          // Delete leads in parallel for maximum speed
          const deletePromises = batchIds.map(async (id) => {
            try {
              const response = await apiService.deleteLead(id)
              return { success: response.success, id }
    } catch (error) {

              console.error(`Failed to delete lead ${id}:`, error)
              return { success: false, id }
            }
          })
          
          const deleteResults = await Promise.all(deletePromises)
          const successfulDeletions = deleteResults.filter(result => result.success)
          deletedCount += successfulDeletions.length
          
          // Update local state for this batch
          setLeads(prev => prev.filter(lead => !batchIds.includes(lead.id)))
          setFilteredLeads(prev => prev.filter(lead => !batchIds.includes(lead.id)))
          
        } catch (error) {
          console.error('Error deleting batch:', error)
        }
        
        // No delay between batches for maximum speed
      }
      
      // Store deleted leads for potential rollback
      setDeletedLeads(leadsToDelete)
      
      // Clear selections and show success
      setSelectedLeads(new Set())
      pushToast(`Successfully deleted ${deletedCount} lead(s)`, 'success')
      
      
      // Sync after operation to ensure complete sync with backend
      await syncAfterOperation()
      
    } catch (error) {
      console.error('Error deleting leads:', error)
      pushToast('Error deleting leads', 'error')
    } finally {
      setDeleteNotification({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: false })
      setPendingDeletionIds([])
      setConfirmInput("")
    }
  }



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

                <BreadcrumbPage>Leads</BreadcrumbPage>

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


        {/* IMPORT PROGRESS NOTIFICATION */}
        {importNotification.show && (
          <div className="fixed top-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 w-80">
            <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <span className="font-medium">
                {isImportCancelled ? 'Cancelling Import...' : 'Importing Leads'}
              </span>
            </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setIsImportCancelled(true)
                  isImportCancelledRef.current = true
                  setImportCancelled(true)
                  setIsImporting(false)
                  
                  // Rollback: remove all imported leads from backend and frontend
                  if (currentImportLeads.length > 0) {
                    let successfullyDeleted = 0
                    let errors = 0
                    
                    try {
                      // Delete imported leads from backend with error handling
                      for (const lead of currentImportLeads) {
                        try {
                          const response = await apiService.deleteLead(lead.id)
                          if (response.success) {
                            successfullyDeleted++
                          } else {
                            errors++
                            console.log(`Lead ${lead.id} not found or already deleted:`, response.error)
                          }
                        } catch (error) {
                          errors++
                          console.log(`Error deleting lead ${lead.id}:`, error)
                        }
                      }
                      
                      if (successfullyDeleted > 0) {
                        pushToast(`Import cancelled - ${successfullyDeleted} leads removed from backend`, 'success')
                      }
                      if (errors > 0) {
                        pushToast(`Import cancelled - ${errors} leads were already removed or not found`, 'warning')
                      }
                    } catch (error) {
                      console.error('Error during rollback:', error)
                      pushToast('Import cancelled - leads removed locally only', 'warning')
                    }
                    
                    // Remove from frontend state regardless of backend success
                    const importedIds = currentImportLeads.map(lead => lead.id)
                    setLeads(prev => prev.filter(lead => !importedIds.includes(lead.id)))
                    setFilteredLeads(prev => prev.filter(lead => !importedIds.includes(lead.id)))
                    setImportedLeads(prev => prev.filter(lead => !importedIds.includes(lead.id)))
                    setCurrentImportLeads([])
                  }
                  
                  // Reset file input to allow reimporting the same file
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                  }
                  
                  // Reset file preview state
                  setFilePreview(null)
                  setShowPreview(false)
                  setIsProcessingFile(false)
                  
                  setImportNotification({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: true })
                }}
                className="cursor-pointer text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Batch {importNotification.progress.batch} of {importNotification.progress.totalBatches}</span>
                <span>{importNotification.progress.current} / {importNotification.progress.total}</span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(importNotification.progress.current / importNotification.progress.total) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* BULK EDIT PROGRESS NOTIFICATION */}
        {editNotification.show && (
          <div className="fixed top-4 right-4 z-[100] bg-background border rounded-lg shadow-lg p-4 w-80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="font-medium">
                  {isEditCancelled ? 'Cancelling Edit...' : 'Updating Leads'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setIsEditCancelled(true)
                  isEditCancelledRef.current = true
                  
                  // Rollback: restore original leads in backend
                  if (currentEditLeads.length > 0) {
                    let successfullyRestored = 0
                    let errors = 0
                    
                    try {
                      // Restore leads that were already edited in this batch
                      for (const editedLead of currentEditLeads) {
                        try {
                          // Find the original lead to get the original values
                          const originalLead = originalLeads.find(orig => orig.id === editedLead.id)
                          if (originalLead) {
                            const updateData: any = { 
                              id: editedLead.id,
                              status: originalLead.status,
                              source: originalLead.source
                            }
                            const result = await apiService.updateLead(updateData)
                            if (result.success) {
                              successfullyRestored++
                            } else {
                              errors++
                            }
                          }
                        } catch (error) {
                          errors++
                        }
                      }
                      
                      if (successfullyRestored > 0) {
                        pushToast(`Bulk edit cancelled - ${successfullyRestored} leads restored`, 'success')
                      }
                      if (errors > 0) {
                        pushToast(`Bulk edit cancelled - ${errors} leads could not be restored`, 'warning')
                      }
                    } catch (error) {
                      pushToast('Bulk edit cancelled - leads restored locally only', 'warning')
                    }
                    
                    // Restore frontend state regardless of backend success
                    const editedIds = currentEditLeads.map(lead => lead.id)
                    setLeads(prev => 
                      prev.map(l => {
                        if (!editedIds.includes(l.id)) return l
                        
                        const originalLead = originalLeads.find(orig => orig.id === l.id)
                        if (originalLead) {
                          return originalLead
                        }
                        return l
                      })
                    )
                    
                    setFilteredLeads(prev => 
                      prev.map(l => {
                        if (!editedIds.includes(l.id)) return l
                        
                        const originalLead = originalLeads.find(orig => orig.id === l.id)
                        if (originalLead) {
                          return originalLead
                        }
                        return l
                      })
                    )
                    
                    setOriginalLeads([])
                    setCurrentEditLeads([])
                  }
                  
                  setEditNotification({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: true })
                  
                  // Force refresh leads to ensure sync with backend after rollback
                  setTimeout(async () => {
                    await forceRefreshLeads()
                  }, 100)
                }}
                className="cursor-pointer text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Batch {editNotification.progress.batch} of {editNotification.progress.totalBatches}</span>
                <span>{editNotification.progress.current} / {editNotification.progress.total}</span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(editNotification.progress.current / editNotification.progress.total) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* DELETE PROGRESS NOTIFICATION */}
        {deleteNotification.show && (
          <div className="fixed top-4 right-4 z-[100] bg-background border rounded-lg shadow-lg p-4 w-80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                <span className="font-medium">
                  {isDeletionCancelled ? 'Cancelling Deletion...' : 'Deleting Leads'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setIsDeletionCancelled(true)
                  isDeletionCancelledRef.current = true
                  
                  // Rollback: restore deleted leads in backend
                  if (deletedLeads.length > 0) {
                    let successfullyRestored = 0
                    let errors = 0
                    
                    try {
                      // Restore leads that were already deleted in this batch
                      for (const lead of deletedLeads) {
                        try {
                          const createData: CreateLeadRequest = {
                            name: lead.name,
                            email: lead.email,
                            phone: lead.phone || undefined,
                            ssn: lead.ssn || undefined,
                            ein: lead.ein || undefined,
                            source: lead.source || undefined,
                            status: lead.status,
                            value: lead.value,
                            description: lead.description,
                            estimated_close_date: lead.estimated_close_date,
                          }
                          const result = await apiService.createLead(createData)
                          if (result.success) {
                            successfullyRestored++
                          } else {
                            errors++
                          }
                        } catch (error) {
                          errors++
                        }
                      }
                      
                      if (successfullyRestored > 0) {
                        pushToast(`Deletion cancelled - ${successfullyRestored} leads restored`, 'success')
                      }
                      if (errors > 0) {
                        pushToast(`Deletion cancelled - ${errors} leads could not be restored`, 'warning')
                      }
                    } catch (error) {
                      pushToast('Deletion cancelled - leads restored locally only', 'warning')
                    }
                    
                    // Restore frontend state regardless of backend success
                    setLeads(prev => [...deletedLeads, ...prev])
                    setFilteredLeads(prev => [...deletedLeads, ...prev])
                    setDeletedLeads([])
                  }
                  
                  setDeleteNotification({ show: false, progress: { current: 0, total: 0, batch: 0, totalBatches: 0 }, cancelled: true })
                  
                  // Force refresh leads to ensure sync with backend after rollback
                  setTimeout(async () => {
                    await forceRefreshLeads()
                  }, 100)
                }}
                className="cursor-pointer text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Batch {deleteNotification.progress.batch} of {deleteNotification.progress.totalBatches}</span>
                <span>{deleteNotification.progress.current} / {deleteNotification.progress.total}</span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(deleteNotification.progress.current / deleteNotification.progress.total) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        )}


        {/* MAIN */}

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">

          {/* CONTROLS */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search and Filters */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
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

            {/* Actions */}
            <div className="flex items-center gap-2">

              <DropdownMenu>

                <DropdownMenuTrigger asChild>

                  <Button className="cursor-pointer">

                    <Plus className="h-4 w-4 mr-2" />

                    Add Lead

                    <ChevronDown className="ml-2 h-4 w-4" />

                  </Button>

                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">

                  <DropdownMenuItem onClick={startAddNew} className="cursor-pointer flex items-center gap-2">

                    <Plus className="h-4 w-4" />

                    Add manually

                  </DropdownMenuItem>

                  <DropdownMenuItem

                    onClick={() => setIsImportOpen(true)}

                    className="cursor-pointer flex items-center gap-2"

                  >

                    <Download className="h-4 w-4" />

                    Import

                  </DropdownMenuItem>

                </DropdownMenuContent>

              </DropdownMenu>

              {/* hidden input moved to Import modal */}

              <DropdownMenu>

                <DropdownMenuTrigger asChild>

                  <Button variant="outline" className="cursor-pointer">

                    <Upload className="h-4 w-4 mr-2" />

                    {selectedLeads.size > 0 ? "Export selected" : "Export"}

                    <ChevronDown className="ml-2 h-4 w-4" />

                  </Button>

                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">

                  <DropdownMenuItem onClick={() => exportData("xlsx")} className="cursor-pointer flex items-center gap-2">

                    <Upload className="h-4 w-4" />

                    Export as XLSX

                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => exportData("csv")} className="cursor-pointer flex items-center gap-2">

                    <Upload className="h-4 w-4" />

                    Export as CSV

                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => exportData("ods")} className="cursor-pointer flex items-center gap-2">

                    <Upload className="h-4 w-4" />

                    Export as ODS

                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => exportData("json")} className="cursor-pointer flex items-center gap-2">

                    <Upload className="h-4 w-4" />

                    Export as JSON

                  </DropdownMenuItem>

                </DropdownMenuContent>

              </DropdownMenu>

              {selectedLeads.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="cursor-pointer">
                      <Edit className="h-4 w-4 mr-2" />
                      Actions ({selectedLeads.size})
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={openBulkEdit} className="cursor-pointer">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openPipelineModal('add')} className="cursor-pointer">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Add to Pipeline
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openPipelineModal('remove')} className="cursor-pointer">
                      <X className="h-4 w-4 mr-2" />
                      Remove from Pipeline
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDeleteSelected} 
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

            </div>

          </div>

          {/* LEADS TABLE */}

          <div className="bg-muted/50 rounded-xl p-4">

            <div className="flex items-center justify-between mb-3">

              <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Lead List</h2>

                {selectedLeads.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLeads(new Set())}
                    className="cursor-pointer text-red-600 hover:text-red-700"
                  >
                  <X className="h-4 w-4" />
                  Unselect All
                  </Button>
                )}
                {/* TOP PAGINATION - Show when scrolling */}
                {totalPages > 1 && showTopPagination && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="cursor-pointer"
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="cursor-pointer"
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="cursor-pointer"
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="cursor-pointer"
                    >
                      Last
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">

                {selectedLeads.size > 0 && (

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                      {selectedLeads.size} selected
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedLeads(new Set())}
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </Button>
                  </div>

                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">

                  {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} items
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="cursor-pointer">
                      {itemsPerPage} per page
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={() => setItemsPerPage(10)} className="cursor-pointer">
                      10 per page
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setItemsPerPage(20)} className="cursor-pointer">
                      20 per page
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setItemsPerPage(50)} className="cursor-pointer">
                      50 per page
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setItemsPerPage(100)} className="cursor-pointer">
                      100 per page
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>

                  <tr className="text-left border-b">

                    <th className="py-2 pr-3 w-12">
                      {leads.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="cursor-pointer p-1 h-6 w-6">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                              <DropdownMenuItem onClick={handleToggleSelectAll} className="cursor-pointer">
                                {selectedLeads.size === leads.length && leads.length > 0 ? `Unselect All (${leads.length})` : `Select All (${leads.length})`}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleToggleSelectPage} className="cursor-pointer">
                                {(() => {
                                  const currentPageLeadIds = new Set(currentLeads.map(lead => lead.id))
                                  const allCurrentPageSelected = currentPageLeadIds.size > 0 && 
                                    Array.from(currentPageLeadIds).every(id => selectedLeads.has(id))
                                  return allCurrentPageSelected ? `Unselect Page` : `Select Page`
                                })()}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </th>

                    <th 

                      className="py-2 pr-3 w-[200px] cursor-pointer hover:bg-muted/50 select-none"

                      onClick={() => handleSort('name')}

                    >

                      <div className="flex items-center gap-1">

                        Name

                        {sortField === 'name' && (

                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />

                        )}

                      </div>

                    </th>

                    <th className="py-2 pr-3 w-[240px]">Email / Phone</th>

                    <th className="py-2 pr-3 w-[160px]">SSN/EIN</th>

                    <th 

                      className="py-2 pr-3 w-[160px] cursor-pointer hover:bg-muted/50 select-none"

                      onClick={() => handleSort('source')}

                    >

                      <div className="flex items-center gap-1">

                        Source

                        {sortField === 'source' && (

                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />

                        )}

                      </div>

                    </th>

                    <th 

                      className="py-2 pr-3 w-[120px] cursor-pointer hover:bg-muted/50 select-none"

                      onClick={() => handleSort('status')}

                    >

                      <div className="flex items-center gap-1">

                        Status

                        {sortField === 'status' && (

                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />

                        )}

                      </div>

                    </th>

                    <th 

                      className="py-2 pr-3 w-[140px] cursor-pointer hover:bg-muted/50 select-none"

                      onClick={() => handleSort('value')}

                    >

                      <div className="flex items-center gap-1">

                        Value

                        {sortField === 'value' && (

                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />

                        )}

                      </div>

                    </th>

                    <th 

                      className="py-2 pr-3 w-[140px] cursor-pointer hover:bg-muted/50 select-none"

                      onClick={() => handleSort('estimated_close_date')}

                    >

                      <div className="flex items-center gap-1">

                        Close Date

                        {sortField === 'estimated_close_date' && (

                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />

                        )}

                      </div>

                    </th>

                    <th className="py-2 pr-0 text-right w-[100px]">Actions</th>

                  </tr>

                </thead>

                <tbody>

                  {currentLeads.map((lead, index) => (
                    <tr key={lead.id} className={`border-b last:border-b-0 hover:bg-muted/30 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/40'}`}>
                      <td className="py-2 pr-3">

                        <input

                          type="checkbox"

                          checked={selectedLeads.has(lead.id)}

                          onClick={(e) => handleSelectLead(lead.id, index, e)}

                          readOnly

                          className="rounded border-input"

                        />

                      </td>

                      <td className="py-2 pr-3">

                        <div className="flex items-center gap-2">
                          <div

                            className="max-w-[200px] truncate hover:underline decoration-dotted cursor-pointer font-medium"

                            title={lead.name}

                            onClick={() => setPreview({ open: true, lead })}

                          >

                            {lead.name}

                          </div>
                          {lead.show_on_pipeline && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Pipeline
                            </span>
                          )}
                        </div>

                      </td>

                      <td className="py-2 pr-3">

                        <div className="max-w-[220px] space-y-1">

                          <div className="truncate text-sm" title={lead.email}>

                            {lead.email}

                          </div>

                          {lead.phone && (

                            <div className="truncate text-xs text-muted-foreground" title={lead.phone}>

                              {lead.phone}

                            </div>

                          )}

                        </div>

                      </td>

                      <td className="py-2 pr-3">

                        <div className="max-w-[160px] space-y-1">

                          {lead.ssn && (

                            <div className="text-xs" title={`SSN: ${lead.ssn}`}>

                              SSN: {lead.ssn}

                            </div>

                          )}

                          {lead.ein && (

                            <div className="text-xs" title={`EIN: ${lead.ein}`}>

                              EIN: {lead.ein}

                            </div>

                          )}

                          {!lead.ssn && !lead.ein && (

                            <div className="text-xs text-muted-foreground">-</div>

                          )}

                        </div>

                      </td>

                      <td className="py-2 pr-3">

                        <div className="max-w-[160px] truncate text-xs" title={lead.source}>

                          {lead.source || '-'}

                        </div>

                      </td>

                      <td className="py-2 pr-3">

                        <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">

                          {lead.status}

                        </span>

                      </td>

                      <td className="py-2 pr-3">

                        <div className="text-sm font-medium text-green-600">

                          {lead.value ? `$${lead.value.toLocaleString()}` : '-'}

                        </div>

                      </td>

                      <td className="py-2 pr-3">

                        <div className="text-xs text-muted-foreground">

                          {lead.estimated_close_date ? new Date(lead.estimated_close_date).toLocaleDateString('pt-BR') : '-'}

                        </div>

                      </td>

                      <td className="py-2 pr-0">

                        <div className="flex justify-end gap-1.5">

                          <Button size="sm" variant="outline" onClick={() => handleEdit(lead)} className="cursor-pointer">

                            <Edit className="h-3 w-3 mr-1" />

                            Edit

                          </Button>

                          <Button size="sm" variant="destructive" onClick={() => handleDelete(lead.id)} className="cursor-pointer">

                            <Trash2 className="h-3 w-3" />

                          </Button>

              </div>

                      </td>

                    </tr>

                  ))}

                  {currentLeads.length === 0 && (
                    <tr>

                      <td colSpan={7} className="py-6 text-center text-muted-foreground">

                        {searchTerm ? "No leads found for this search." : "No leads yet. Add the first one above."}

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="cursor-pointer"
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="cursor-pointer"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2 px-4">
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="cursor-pointer"
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="cursor-pointer"
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* ADD/EDIT MODAL */}
        <Sheet open={isModalOpen} onOpenChange={(open) => {
          if (!open) {
            if (unsavedChangesToast.show) {
              // User clicked outside again after seeing the toast
              confirmDiscardChanges()
            } else {
              handleModalClose()
            }
          } else {
            setIsModalOpen(open)
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

              <SheetTitle>

                {editingId ? "Edit Lead" : "Add Lead"}

              </SheetTitle>

              <SheetDescription>

                {editingId ? "Update the lead information." : "Fill in the new lead details."}

              </SheetDescription>

            </SheetHeader>

            <Separator className="my-4" />
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>

                  <label className="mb-1 block text-sm font-medium">Name</label>

                  <Input

                    placeholder="Full name"

                    value={name}

                    onChange={(e) => setName(e.target.value.slice(0, FIELD_MAX.name))}

                    maxLength={FIELD_MAX.name}

              required

            />

          </div>

          <div>

                  <label className="mb-1 block text-sm font-medium">Email</label>

                  <Input

                type="email"

                    placeholder="email@example.com"

                    value={email}

                    onChange={(e) => setEmail(e.target.value.slice(0, FIELD_MAX.email))}

                maxLength={FIELD_MAX.email}

                required

              />

            </div>

                <div>

                  <label className="mb-1 block text-sm font-medium">Phone</label>

                  <Input

                    placeholder="Phone"

                    value={phone}

                    onChange={(e) => setPhone(e.target.value.slice(0, FIELD_MAX.phone))}

                    maxLength={FIELD_MAX.phone}

                  />

                </div>

                <div>

                  <label className="mb-1 block text-sm font-medium">SSN</label>

                  <Input

                    placeholder="SSN"

                    value={ssn}

                    onChange={(e) => setSsn(e.target.value.slice(0, FIELD_MAX.ssn))}

                    maxLength={FIELD_MAX.ssn}

                  />

                </div>

                <div>

                  <label className="mb-1 block text-sm font-medium">EIN</label>

                  <Input

                    placeholder="EIN"

                    value={ein}

                    onChange={(e) => setEin(e.target.value.slice(0, FIELD_MAX.ssn))}

                    maxLength={FIELD_MAX.ssn}

                  />

                </div>

          <div>

                  <label className="mb-1 block text-sm font-medium">Source</label>

                  <Input

                    placeholder="e.g., Instagram, Landing Page"

                    value={source}

                    onChange={(e) => setSource(e.target.value.slice(0, FIELD_MAX.source))}

                    maxLength={FIELD_MAX.source}

              />

            </div>

                <div className="md:col-span-2 space-y-2">

                  <div>

                    <label className="mb-1 block text-sm font-medium">Status</label>

                    <select

                      className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"

                      value={["New","In Contact","Qualified","Lost"].includes(String(status)) ? String(status) : "custom"}

                      onChange={(e) => {

                        const val = e.target.value

                        if (val === "custom") {

                          setStatus(customStatus || "")

                        } else {

                          setStatus(val as Lead["status"])

                          setCustomStatus("")

                        }

                      }}

                    >

                      <option value="New">New</option>

                      <option value="In Contact">In Contact</option>

                      <option value="Qualified">Qualified</option>

                      <option value="Lost">Lost</option>

                      <option value="custom">Custom…</option>

                    </select>

                  </div>

                  {(!["New","In Contact","Qualified","Lost"].includes(String(status))) && (

                    <div>

                      <label className="mb-1 block text-sm font-medium">Custom status</label>

                      <Input

                        placeholder="e.g., Follow-up postponed"

                        value={customStatus}

                        onChange={(e) => {

                          const v = e.target.value.slice(0, FIELD_MAX.status)

                          setCustomStatus(v)

                          setStatus(v)

                        }}

                        maxLength={FIELD_MAX.status}

                      />

                    </div>

                  )}

                </div>

              </div>

              

              {/* Commercial Information */}

              <div className="space-y-4">

                <h3 className="text-sm font-semibold text-muted-foreground">Commercial Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>

                    <label className="mb-1 block text-sm font-medium">Deal Value ($)</label>

                    <Input

                      type="number"

                      placeholder="0.00"

                      value={value}

                      onChange={(e) => {

                        const val = e.target.value.slice(0, FIELD_MAX.value)

                        setValue(val)

                      }}

                      step="0.01"

                      maxLength={FIELD_MAX.value}

                    />

                  </div>

                  <div>

                    <label className="mb-1 block text-sm font-medium">Estimated Close Date</label>

                    <Input

                      type="date"

                      value={estimatedCloseDate}

                      onChange={(e) => {

                        const value = e.target.value.slice(0, FIELD_MAX.date)

                        setEstimatedCloseDate(value)

                      }}

                      maxLength={FIELD_MAX.date}

                    />

                  </div>

                </div>

                <div>

                  <label className="mb-1 block text-sm font-medium">📝 Notes / Description</label>

                  <textarea

                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-20 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"

                    placeholder="Notes about the lead..."

                    value={description}

                    onChange={(e) => setDescription(e.target.value.slice(0, FIELD_MAX.description))}

                    maxLength={FIELD_MAX.description}

                  />

                  <div className="text-xs text-muted-foreground mt-1">

                    {description.length}/{FIELD_MAX.description} characters

                  </div>

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

                  {editingId ? "Save" : "Add"}

                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    // Close toast if it's showing
                    setUnsavedChangesToast({ show: false, message: '' })
                    resetForm()
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



    {/* PREVIEW MODAL - Lead details */}

    <Sheet open={preview.open} onOpenChange={(open) => setPreview((p) => ({ ...p, open }))}>

      <SheetContent className="w-full sm:max-w-lg border-l border-border p-6 md:p-8 flex flex-col max-h-screen">
        <div className="flex-shrink-0">
        <SheetHeader>

          <SheetTitle>Lead Details</SheetTitle>

          <SheetDescription>Complete lead information</SheetDescription>

        </SheetHeader>

        <Separator className="my-4" />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">

          {(() => {

            const l = preview.lead

            if (!l) return null

            return (

              <>

                {/* Basic Information */}

                <div className="space-y-3">

                  <h3 className="text-sm font-semibold text-muted-foreground">Basic Information</h3>

                  <div className="grid grid-cols-2 gap-3">

                    <div className="space-y-1">

                      <div className="flex items-center gap-2">

                        <div className="text-xs text-muted-foreground">Name</div>

                        <Button

                          size="sm"

                          variant="ghost"

                          className="h-5 w-5 p-0 cursor-pointer"

                          onClick={() => {

                            navigator.clipboard.writeText(l.name)

                            setCopiedKey('name')

                            window.setTimeout(() => setCopiedKey(null), 700)

                          }}

                        >

                          {copiedKey === 'name' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}

                        </Button>

                  </div>

                      <div className="text-sm font-medium">{l.name}</div>

                    </div>

                    <div className="space-y-1">

                      <div className="flex items-center gap-2">

                        <div className="text-xs text-muted-foreground">Status</div>

                  <Button

                    size="sm"

                          variant="ghost"

                          className="h-5 w-5 p-0 cursor-pointer"

                    onClick={() => {

                            navigator.clipboard.writeText(l.status)

                            setCopiedKey('status')

                            window.setTimeout(() => setCopiedKey(null), 700)

                          }}

                        >

                          {copiedKey === 'status' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}

                        </Button>

                      </div>

                      <div className="text-sm">

                        <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">

                          {l.status}

                    </span>

                      </div>

                    </div>

                    <div className="space-y-1">

                      <div className="flex items-center gap-2">

                        <div className="text-xs text-muted-foreground">Email</div>

                        <Button

                          size="sm"

                          variant="ghost"

                          className="h-5 w-5 p-0 cursor-pointer"

                          onClick={() => {

                            navigator.clipboard.writeText(l.email)

                            setCopiedKey('email')

                            window.setTimeout(() => setCopiedKey(null), 700)

                          }}

                        >

                          {copiedKey === 'email' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}

                  </Button>

                </div>

                      <div className="text-sm">{l.email}</div>

              </div>

                    <div className="space-y-1">

                      <div className="flex items-center gap-2">

                        <div className="text-xs text-muted-foreground">Phone</div>

                        <Button

                          size="sm"

                          variant="ghost"

                          className="h-5 w-5 p-0 cursor-pointer"

                          onClick={() => {

                            navigator.clipboard.writeText(l.phone || '')

                            setCopiedKey('phone')

                            window.setTimeout(() => setCopiedKey(null), 700)

                          }}

                        >

                          {copiedKey === 'phone' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}

                        </Button>

                      </div>

                      <div className="text-sm">{l.phone || '-'}</div>

                    </div>

                    {l.ssn && (

                      <div className="space-y-1">

                        <div className="flex items-center gap-2">

                          <div className="text-xs text-muted-foreground">SSN</div>

                          <Button

                            size="sm"

                            variant="ghost"

                            className="h-5 w-5 p-0 cursor-pointer"

                            onClick={() => {

                              navigator.clipboard.writeText(l.ssn || '')

                              setCopiedKey('ssn')

                              window.setTimeout(() => setCopiedKey(null), 700)

                            }}

                          >

                            {copiedKey === 'ssn' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}

                          </Button>

                        </div>

                        <div className="text-sm">{l.ssn}</div>

                      </div>

                    )}

                    {l.ein && (

                      <div className="space-y-1">

                        <div className="flex items-center gap-2">

                          <div className="text-xs text-muted-foreground">EIN</div>

                          <Button

                            size="sm"

                            variant="ghost"

                            className="h-5 w-5 p-0 cursor-pointer"

                            onClick={() => {

                              navigator.clipboard.writeText(l.ein || '')

                              setCopiedKey('ein')

                              window.setTimeout(() => setCopiedKey(null), 700)

                            }}

                          >

                            {copiedKey === 'ein' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}

                          </Button>

                        </div>

                        <div className="text-sm">{l.ein}</div>

                      </div>

                    )}

                    {!l.ssn && !l.ein && (

                      <div className="space-y-1">

                        <div className="text-xs text-muted-foreground">SSN/EIN</div>

                        <div className="text-sm text-muted-foreground">-</div>

                      </div>

                    )}

                    <div className="space-y-1">

                      <div className="flex items-center gap-2">

                        <div className="text-xs text-muted-foreground">Source</div>

                        <Button

                          size="sm"

                          variant="ghost"

                          className="h-5 w-5 p-0 cursor-pointer"

                          onClick={() => {

                            navigator.clipboard.writeText(l.source || '')

                            setCopiedKey('source')

                            window.setTimeout(() => setCopiedKey(null), 700)

                          }}

                        >

                          {copiedKey === 'source' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}

                        </Button>

                      </div>

                      <div className="text-sm">{l.source || '-'}</div>

                    </div>

                  </div>

                </div>



                <Separator />



                {/* Commercial Information */}

                <div className="space-y-3">

                  <h3 className="text-sm font-semibold text-muted-foreground">Commercial Information</h3>

                  <div className="grid grid-cols-2 gap-3">

                    <div className="space-y-1">

                      <div className="flex items-center gap-2">

                        <div className="text-xs text-muted-foreground">Value</div>

                        <Button

                          size="sm"

                          variant="ghost"

                          className="h-5 w-5 p-0 cursor-pointer"

                          onClick={() => {

                            navigator.clipboard.writeText(l.value ? `$${l.value.toLocaleString()}` : '')

                            setCopiedKey('value')

                            window.setTimeout(() => setCopiedKey(null), 700)

                          }}

                        >

                          {copiedKey === 'value' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}

                        </Button>

                      </div>

                      <div className="text-sm font-medium text-green-600">

                        {l.value ? `$${l.value.toLocaleString()}` : '-'}

                      </div>

                    </div>

                    <div className="space-y-1">

                      <div className="flex items-center gap-2">

                        <div className="text-xs text-muted-foreground">Estimated Close Date</div>

                        <Button

                          size="sm"

                          variant="ghost"

                          className="h-5 w-5 p-0 cursor-pointer"

                          onClick={() => {

                            navigator.clipboard.writeText(l.estimated_close_date ? new Date(l.estimated_close_date).toLocaleDateString('en-US') : '')

                            setCopiedKey('closeDate')

                            window.setTimeout(() => setCopiedKey(null), 700)

                          }}

                        >

                          {copiedKey === 'closeDate' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}

                        </Button>

                      </div>

                      <div className="text-sm">

                        {l.estimated_close_date ? new Date(l.estimated_close_date).toLocaleDateString('en-US') : '-'}

                      </div>

                    </div>

                  </div>

                </div>



                {/* Notes */}

                {l.description && (

                  <>

                    <Separator />

                    <div className="space-y-3">

                      <div className="flex items-center gap-2">

                        <h3 className="text-sm font-semibold text-muted-foreground">Notes / Observations</h3>

                        <Button

                          size="sm"

                          variant="ghost"

                          className="h-5 w-5 p-0 cursor-pointer"

                          onClick={() => {

                            navigator.clipboard.writeText(l.description || '')

                            setCopiedKey('description')

                            window.setTimeout(() => setCopiedKey(null), 700)

                          }}

                        >

                          {copiedKey === 'description' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}

                        </Button>

                      </div>

                      <div className="bg-muted/30 rounded-md p-3 text-sm">

                        {l.description}

                      </div>

                    </div>

                  </>

                )}



                {/* Attachments Section */}
                {l.attachments && l.attachments.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground">Attachments</h3>
                      <div className="space-y-2">
                        {l.attachments.map((attachment) => {
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
                                  {formatFileSize(attachment.size || 0)} • {attachment.uploadedAt ? new Date(attachment.uploadedAt).toLocaleDateString('en-US') : 'Unknown date'}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="cursor-pointer"
                                  onClick={() => viewAttachment(l.id, attachment.id)}
                                  title="View file"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="cursor-pointer"
                                  onClick={() => downloadAttachment(l.id, attachment.id, attachment.originalName || 'file')}
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
                  </>
                )}

                {/* Activity History */}

                <Separator />

                <div className="space-y-3">

                  <h3 className="text-sm font-semibold text-muted-foreground">Activity History</h3>

                  <div className="text-sm text-muted-foreground">

                    Created: {new Date(l.created_at).toLocaleDateString('en-US')}

                  </div>

                  <div className="text-sm text-muted-foreground">

                    Last updated: {new Date(l.updated_at).toLocaleDateString('en-US')}

                  </div>

                </div>

              </>

            )

          })()}
        </div>

        <div className="flex-shrink-0 pt-4 border-t">
          <div className="flex justify-end">

            <Button className="cursor-pointer" onClick={() => setPreview({ open: false, lead: null })}>Close</Button>

          </div>
        </div>

      </SheetContent>

    </Sheet>



    {/* FILTER MODAL */}

    <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>

      <SheetContent className="w-full sm:max-w-lg border-l border-border p-6 md:p-8 flex flex-col">

        <SheetHeader className="flex-shrink-0">

          <SheetTitle>Filter leads</SheetTitle>

          <SheetDescription>Filter leads by any field to find specific records.</SheetDescription>

        </SheetHeader>

        <Separator className="my-4 flex-shrink-0" />

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Documents</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Status and Pipeline */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Status & Pipeline</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">Source</label>
                <Input
                  placeholder="Filter by source..."
                  value={filters.source}
                  onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
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

              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">Pipeline</label>
                <select
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  value={filters.pipeline || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, pipeline: e.target.value }))}
                >
                  <option value="">All leads</option>
                  <option value="true">In Pipeline</option>
                  <option value="false">Not in Pipeline</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ranges */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Ranges</h3>
            
            <div className="space-y-4">
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
        <div className="flex-shrink-0 border-t pt-4 mt-4">
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



        {/* IMPORT MODAL (Centered Overlay) */}

        {isImportOpen && (

          <div className="fixed inset-0 z-50 flex items-center justify-center">

            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => !isImporting && setIsImportOpen(false)} />

            <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl">

              <div className="space-y-2">

                <h3 className="text-lg font-semibold leading-none tracking-tight">Import leads</h3>

                <p className="text-sm text-muted-foreground">Accepted formats: .xlsx, .xls, .csv, .ods, .json. <br></br>Columns: name, email, phone, ssn, ein, source, status, value, close date, notes</p>

              </div>

              <Separator className="my-4" />

              {isImporting ? (

                <div className="border-2 border-dashed rounded-lg p-8 text-center">

                  <div className="text-sm text-muted-foreground">Importing leads...</div>

                  <div className="mt-2 text-xs">Please wait while we save your leads to the database.</div>

                  
                  {importProgress.total > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Batch {importProgress.batch} of {importProgress.totalBatches}
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {importProgress.current} of {importProgress.total} leads processed
                      </div>
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImportCancelled(true)
                            setIsImporting(false)
                            setIsImportOpen(false)
                          }}
                          className="cursor-pointer"
                        >
                          Cancel Import
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

              ) : (

                <div

                  className={

                    "border-2 border-dashed rounded-lg p-8 text-center select-none " +
                    (isProcessingFile ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted/50") +

                    (isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30")

                  }

                  onDragOver={(e) => {

                    e.preventDefault()

                    if (!isProcessingFile) {

                      setIsDragActive(true)

                    }

                  }}

                  onDragLeave={() => setIsDragActive(false)}

                  onDrop={(e) => {

                    e.preventDefault()

                    setIsDragActive(false)

                    if (isProcessingFile) return

                    const file = e.dataTransfer.files?.[0]

                    if (!file) return

                    const ok = /\.(xlsx|xls|csv|ods|json)$/i.test(file.name)

                    if (!ok) {

                      alert("Unsupported file. Please choose .xlsx, .xls, .csv, .ods or .json")

                      return

                    }

                    handleFileSelect(file)
                  }}

                  role="button"

                  tabIndex={0}

                  onClick={() => !isProcessingFile && fileInputRef.current?.click()}

                >

                  {isProcessingFile ? (
                    <>
                      <div className="text-sm text-muted-foreground">Processing file...</div>
                      <div className="mt-2 text-xs">Please wait while we analyze your file</div>
                      <div className="mt-4 flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-muted-foreground">Drag and drop your file here</div>
                      <div className="mt-2 text-xs">or click to browse</div>
                      <div className="mt-4 text-xs text-muted-foreground">.xlsx, .xls, .csv, .ods, .json</div>
                    </>
                  )}

                </div>

              )}

              <input

                type="file"

                accept=".xlsx,.xls,.csv,.ods,.json,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.oasis.opendocument.spreadsheet"

                ref={fileInputRef}

                style={{ display: "none" }}

                onChange={(e) => {

                  if (isProcessingFile) return

                  const file = e.target.files?.[0]

                  if (!file) return

                  const ok = /\.(xlsx|xls|csv|ods|json)$/i.test(file.name)

                  if (!ok) {

                    alert("Unsupported file. Please choose .xlsx, .xls, .csv, .ods or .json")

                    return

                  }

                  handleFileSelect(file)
                }}

              />

              <Separator className="my-4" />

              <div className="text-xs text-muted-foreground">We detect headers automatically, including variants.</div>

              <div className="mt-4 flex justify-end gap-2">

                <Button 

                  variant="outline" 

                  onClick={() => setIsImportOpen(false)} 

                  className="cursor-pointer"

                  disabled={isImporting}

                >

                  {isImporting ? "Importing..." : "Close"}

                </Button>

              </div>

            </div>

          </div>

        )}



        {/* FILE PREVIEW MODAL */}
        {showPreview && filePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowPreview(false)} />
            <div className="relative z-10 w-full max-w-4xl max-h-[80vh] rounded-xl border border-border bg-background p-6 shadow-xl overflow-hidden">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold leading-none tracking-tight">File Preview</h3>
                <p className="text-sm text-muted-foreground">
                  Found {filePreview.totalLeads} leads with {filePreview.fields.length} columns
                </p>
              </div>
              <Separator className="my-4" />
              
              <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                <div>
                  <h4 className="text-sm font-medium mb-2">Detected Fields:</h4>
                  <div className="flex flex-wrap gap-2">
                    {filePreview.fields.map((field: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-muted rounded text-xs">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Sample Leads (first 5):</h4>
                  <div className="space-y-2">
                    {filePreview.leads.slice(0, 5).map((lead: Lead, index: number) => (
                      <div key={index} className="p-3 border rounded-lg text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div><strong>Name:</strong> {lead.name || 'N/A'}</div>
                          <div><strong>Email:</strong> {lead.email || 'N/A'}</div>
                          <div><strong>Phone:</strong> {lead.phone || 'N/A'}</div>
                          <div><strong>Source:</strong> {lead.source || 'N/A'}</div>
                          <div><strong>Status:</strong> {lead.status || 'N/A'}</div>
                          <div><strong>Value:</strong> {lead.value ? `$${lead.value}` : 'N/A'}</div>
                          <div><strong>Close Date:</strong> {lead.estimated_close_date || 'N/A'}</div>
                          <div><strong>SSN:</strong> {lead.ssn || 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreview(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmImport}
                  className="cursor-pointer"
                >
                  Import {filePreview.totalLeads} Leads
                </Button>
              </div>
            </div>
          </div>
        )}

    {/* BULK EDIT MODAL */}

    <Sheet open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>

      <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">

        <SheetHeader>

          <SheetTitle>Edit selected leads</SheetTitle>

          <SheetDescription>

            Update Status and/or Source for {selectedLeads.size} selected lead(s).

          </SheetDescription>

        </SheetHeader>

        <Separator className="my-4" />

        <div className="space-y-6">

          <div className="space-y-2">

            <label className="mb-1 block text-sm font-medium">Status</label>

            <select

              className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"

              value={bulkStatus}

              onChange={(e) => setBulkStatus(e.target.value)}

            >

              <option value="">Keep unchanged</option>

              <option value="New">New</option>

              <option value="In Contact">In Contact</option>

              <option value="Qualified">Qualified</option>

              <option value="Lost">Lost</option>

            </select>

          </div>

          <div className="space-y-2">

            <label className="mb-1 block text-sm font-medium">Source</label>

            <Input

              placeholder="Leave empty to keep unchanged"

              value={bulkSource}

              onChange={(e) => setBulkSource(e.target.value)}

            />

          </div>

          <Separator />

          <div className="space-y-2">
            <label className="mb-1 block text-sm font-medium">Confirmation</label>
            <Input
              placeholder="Type 'edit' to confirm bulk edit"
              value={bulkEditConfirm}
              onChange={(e) => setBulkEditConfirm(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              This action will update {selectedLeads.size} lead(s). Type 'edit' to confirm.
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">

            <Button 
              onClick={applyBulkEdit} 
              className="flex-1 cursor-pointer"
              disabled={bulkEditConfirm.trim().toLowerCase() !== "edit"}
            >
              Save changes
            </Button>

            <Button variant="outline" onClick={() => setIsBulkEditOpen(false)} className="cursor-pointer">Cancel</Button>

          </div>

        </div>

      </SheetContent>

    </Sheet>

    {/* PIPELINE MODAL */}
    <Sheet open={isPipelineModalOpen} onOpenChange={setIsPipelineModalOpen}>
      <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">
        <SheetHeader>
          <SheetTitle>
            {pipelineAction === 'add' ? 'Add to Pipeline' : 'Remove from Pipeline'}
          </SheetTitle>
          <SheetDescription>
            {pipelineAction === 'add' 
              ? `Add ${selectedLeads.size} selected lead(s) to the pipeline.`
              : `Remove ${selectedLeads.size} selected lead(s) from the pipeline.`
            }
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            {pipelineAction === 'add' 
              ? 'These leads will appear in the pipeline view and can be managed through the Kanban board.'
              : 'These leads will be removed from the pipeline view but will remain in the leads list.'
            }
          </div>
          <Separator />
          <div className="flex gap-2">
            <Button 
              onClick={handlePipelineBulkAction} 
              className="flex-1 cursor-pointer"
            >
              {pipelineAction === 'add' ? 'Add to Pipeline' : 'Remove from Pipeline'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsPipelineModalOpen(false)} 
              className="cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

        {/* CONFIRMATION MODAL */}

        <Sheet open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>

          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">

            <SheetHeader>

              <SheetTitle>Confirm deletion</SheetTitle>

              <SheetDescription>

                This action is irreversible. {pendingDeletionIds.length > 1 && (

                  <>

                    <br></br>Type "Delete" to proceed.

                  </>

                )}

              </SheetDescription>

            </SheetHeader>

            <Separator className="my-4" />

            <div className="space-y-6">

              <div className="text-sm bg-destructive/10 text-destructive border border-destructive/30 rounded-md p-3">

                {pendingDeletionIds.length === 1

                  ? "You are about to remove 1 lead."

                  : `You are about to remove ${pendingDeletionIds.length} leads.`}

              </div>

              {pendingDeletionIds.length > 1 && (

                <div className="space-y-2">

                  <label className="mb-1 block text-sm font-medium">Confirmation</label>

                  <Input

                    placeholder="Type 'Delete' to continue"

                    value={confirmInput}

                    onChange={(e) => setConfirmInput(e.target.value)}

                  />

                </div>

              )}

              <Separator />

              <div className="flex gap-2">

                <Button

                  variant="destructive"

                  onClick={performDeletion}

                  disabled={!canConfirmDeletion}

                  className="cursor-pointer flex-1"

                >

                  Delete permanently

                </Button>

                <Button

                  variant="outline"

                  onClick={() => setIsConfirmOpen(false)}

                  className="cursor-pointer"

                >

                  Cancel

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

      </SidebarInset>

    </SidebarProvider>

    </AuthGuard>
  )
}

