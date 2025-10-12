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
import { Search, Plus, Download, Upload, Trash2, Edit, X, ChevronDown, CheckCircle2, AlertTriangle, AlertCircle, Check, Filter, XCircle, ArrowUp, ArrowDown, Eye, Phone, Mail, Calendar, User, Building2 } from "lucide-react"
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


  // Toast notifications
  const [toasts, setToasts] = React.useState<{ id: string, text: string, type: "success" | "warning" | "error" }[]>([])

  // Preview modal
  const [preview, setPreview] = React.useState<{ open: boolean, lead: Lead | null }>({ open: false, lead: null })

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
    
    const hasFilters = filters.name || filters.email || filters.phone || filters.ssn || filters.ein || filters.source || filters.status || valueRange.min || valueRange.max || dateRange.min || dateRange.max
    
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
        
        console.log('Pipeline: Applying specific field filters')
        console.log('Pipeline: Found leads:', filteredLeads.length)
        setLeads(filteredLeads)
        updatePipelineStages(filteredLeads)
        
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


  function handleEdit(lead: Lead) {
    setEditingId(lead.id)
    setEditValue(lead.value?.toString() || "")
    setEditExpectedCloseDate(lead.estimated_close_date || "")
    setEditNotes(lead.description || "")
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
        description: editNotes || undefined
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


        {/* PREVIEW MODAL */}
        <Sheet open={preview.open} onOpenChange={(open) => setPreview((p) => ({ ...p, open }))}>
          <SheetContent className="w-full sm:max-w-lg border-l border-border p-6 md:p-8">
        <SheetHeader>
          <SheetTitle>Lead Details</SheetTitle>
          <SheetDescription>Complete lead information</SheetDescription>
        </SheetHeader>
            <Separator className="my-4" />
            <div className="space-y-4">
              {preview.lead && (
                <>
                  {/* Basic Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Name</div>
                        <div className="text-sm font-medium">{preview.lead.name}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Status</div>
                        <div className="text-sm">
                          <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
                            {preview.lead.status}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Email</div>
                        <div className="text-sm">{preview.lead.email}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Phone</div>
                        <div className="text-sm">{preview.lead.phone || '-'}</div>
                      </div>
                      {preview.lead.ssn && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">SSN</div>
                          <div className="text-sm">{preview.lead.ssn}</div>
                        </div>
                      )}
                      {preview.lead.ein && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">EIN</div>
                          <div className="text-sm">{preview.lead.ein}</div>
                        </div>
                      )}
                      {!preview.lead.ssn && !preview.lead.ein && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">SSN/EIN</div>
                          <div className="text-sm text-muted-foreground">-</div>
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Source</div>
                        <div className="text-sm">{preview.lead.source || '-'}</div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Commercial Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">Commercial Information</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Value</div>
                        <div className="text-sm font-medium text-green-600">
                          {preview.lead.value ? formatCurrency(preview.lead.value) : '-'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Estimated Close Date</div>
                        <div className="text-sm">
                          {preview.lead.estimated_close_date ? formatDate(preview.lead.estimated_close_date) : '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {preview.lead.description && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground">Notes / Observations</h3>
                        <div className="bg-muted/30 rounded-md p-3 text-sm">
                          {preview.lead.description}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Activity History */}
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">Activity History</h3>
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(preview.lead.created_at).toLocaleDateString('en-US')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last updated: {new Date(preview.lead.updated_at).toLocaleDateString('en-US')}
                    </div>
                  </div>
                  
                  <Separator />
                  
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
                      <Eye className="h-4 w-4 mr-2" />
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
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* EDIT MODAL */}
        <Sheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">
            <SheetHeader>
              <SheetTitle>Edit Lead</SheetTitle>
              <SheetDescription>
                Edit the lead's negotiation fields.
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
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
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 cursor-pointer">
                  Save
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingId(null)
                    setEditValue("")
                    setEditExpectedCloseDate("")
                    setEditNotes("")
                  }} 
                  className="cursor-pointer"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

        {/* FILTER MODAL */}
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">
            <SheetHeader>
              <SheetTitle>Filter leads</SheetTitle>
              <SheetDescription>Filter leads by any field to find specific records.</SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
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
              
              <Separator />
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
                  className="cursor-pointer"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </SidebarInset>
    </SidebarProvider>
    </AuthGuard>
  )
}
