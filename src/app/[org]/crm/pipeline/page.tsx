"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
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

type Lead = {
  id: string
  name: string
  email: string
  phone: string
  ssn: string
  source: string
  status: "New" | "In Contact" | "Qualified" | "Lost" | string
  value?: number
  expectedCloseDate?: string
  notes?: string
}

type PipelineStage = {
  id: string
  name: string
  color: string
  leads: Lead[]
}

function createId() {
  return Math.random().toString(36).slice(2, 10)
}

const SAMPLE_LEADS: Lead[] = [
  {
    id: "ld_1",
    name: "Maria Silva",
    email: "maria.silva@example.com",
    phone: "+55 11 91234-5678",
    ssn: "",
    source: "Landing Page",
    status: "New",
    value: 5000,
    expectedCloseDate: "2024-02-15",
    notes: "Interessada em curso de marketing digital"
  },
  {
    id: "ld_2",
    name: "João Souza",
    email: "joao.souza@example.com",
    phone: "+55 21 99876-5432",
    ssn: "",
    source: "Instagram",
    status: "In Contact",
    value: 3000,
    expectedCloseDate: "2024-02-20",
    notes: "Já teve primeira reunião, aguardando proposta"
  },
  {
    id: "ld_3",
    name: "Ana Pereira",
    email: "ana.pereira@example.com",
    phone: "+55 31 90000-1111",
    ssn: "",
    source: "Referral",
    status: "Qualified",
    value: 8000,
    expectedCloseDate: "2024-02-10",
    notes: "Cliente qualificado, alta probabilidade de fechamento"
  },
  {
    id: "ld_4",
    name: "Carlos Mendes",
    email: "carlos.mendes@example.com",
    phone: "+55 11 98765-4321",
    ssn: "",
    source: "LinkedIn",
    status: "New",
    value: 2500,
    expectedCloseDate: "2024-03-01",
    notes: "Lead frio, precisa de nurturing"
  },
  {
    id: "ld_5",
    name: "Fernanda Costa",
    email: "fernanda.costa@example.com",
    phone: "+55 21 91234-5678",
    ssn: "",
    source: "Website",
    status: "In Contact",
    value: 6000,
    expectedCloseDate: "2024-02-25",
    notes: "Demonstração agendada para próxima semana"
  }
]

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
  const storageKey = React.useMemo(() => `pipeline_${org}`, [org])

  const [leads, setLeads] = React.useState<Lead[]>([])
  const [pipelineStages, setPipelineStages] = React.useState<PipelineStage[]>(PIPELINE_STAGES)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draggedLead, setDraggedLead] = React.useState<Lead | null>(null)
  const [draggedOverStage, setDraggedOverStage] = React.useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)

  // Edit form states
  const [editValue, setEditValue] = React.useState("")
  const [editExpectedCloseDate, setEditExpectedCloseDate] = React.useState("")
  const [editNotes, setEditNotes] = React.useState("")


  // Toast notifications
  const [toasts, setToasts] = React.useState<{ id: string, text: string, type: "success" | "warning" | "error" }[]>([])

  // Preview modal
  const [preview, setPreview] = React.useState<{ open: boolean, lead: Lead | null }>({ open: false, lead: null })

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const savedLeads = JSON.parse(raw)
        setLeads(savedLeads)
        updatePipelineStages(savedLeads)
      } else {
        setLeads(SAMPLE_LEADS)
        updatePipelineStages(SAMPLE_LEADS)
        localStorage.setItem(storageKey, JSON.stringify(SAMPLE_LEADS))
      }
    } catch {
      setLeads(SAMPLE_LEADS)
      updatePipelineStages(SAMPLE_LEADS)
    }
  }, [storageKey])

  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(leads))
    } catch {}
  }, [leads, storageKey])

  function updatePipelineStages(leadsList: Lead[]) {
    const stages = PIPELINE_STAGES.map(stage => ({
      ...stage,
      leads: leadsList.filter(lead => {
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
    }))
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
    setEditExpectedCloseDate(lead.expectedCloseDate || "")
    setEditNotes(lead.notes || "")
    setIsEditModalOpen(true)
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === editingId
          ? {
              ...lead,
              value: editValue ? parseFloat(editValue) : undefined,
              expectedCloseDate: editExpectedCloseDate || undefined,
              notes: editNotes || undefined
            }
          : lead
      )
    )

    pushToast("Lead updated successfully.", "success")
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

  function handleDrop(e: React.DragEvent, targetStageId: string) {
    e.preventDefault()
    
    if (!draggedLead) return

    const newStatus = targetStageId === "new" ? "New" :
                     targetStageId === "contact" ? "In Contact" :
                     targetStageId === "qualified" ? "Qualified" :
                     targetStageId === "lost" ? "Lost" : "New"

    setLeads((prev) => {
      const updatedLeads = prev.map((lead) =>
        lead.id === draggedLead.id ? { ...lead, status: newStatus } : lead
      )
      // Atualiza as colunas do pipeline imediatamente
      updatePipelineStages(updatedLeads)
      return updatedLeads
    })

    pushToast(`Lead "${draggedLead.name}" moved to "${newStatus}".`, "success")
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

  const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0)
  const totalLeads = leads.length

  return (
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
                        lead.source.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-background border rounded-lg p-3 cursor-move hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm truncate" title={lead.name}>
                              {lead.name}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate" title={lead.email}>
                              {lead.email}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewLead(lead)}
                              className="h-6 w-6 p-0 cursor-pointer"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(lead)}
                              className="h-6 w-6 p-0 cursor-pointer"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {lead.value && (
                          <div className="text-xs font-medium text-green-600 mb-1">
                            {formatCurrency(lead.value)}
                          </div>
                        )}
                        
                        {lead.expectedCloseDate && (
                          <div className="text-xs text-muted-foreground mb-1">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {formatDate(lead.expectedCloseDate)}
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3 inline mr-1" />
                          {lead.source}
                        </div>
                        
                        {lead.notes && (
                          <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                            {lead.notes}
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
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">
            <SheetHeader>
              <SheetTitle>Lead Details</SheetTitle>
              <SheetDescription>Complete lead information</SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <div className="space-y-4">
              {preview.lead && (
                <>
                  <div className="space-y-2">
                    <h3 className="font-medium">{preview.lead.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {preview.lead.email}
                    </div>
                    {preview.lead.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {preview.lead.phone}
                      </div>
                    )}
                    {preview.lead.ssn && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        {preview.lead.ssn}
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Status:</span>
                      <span className="ml-2 text-sm">{preview.lead.status}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Source:</span>
                      <span className="ml-2 text-sm">{preview.lead.source}</span>
                    </div>
                    {preview.lead.ssn && (
                      <div>
                        <span className="text-sm font-medium">SSN/EIN:</span>
                        <span className="ml-2 text-sm">{preview.lead.ssn}</span>
                      </div>
                    )}
                    {preview.lead.value && (
                      <div>
                        <span className="text-sm font-medium">Value:</span>
                        <span className="ml-2 text-sm font-medium text-green-600">
                          {formatCurrency(preview.lead.value)}
                        </span>
                      </div>
                    )}
                    {preview.lead.expectedCloseDate && (
                      <div>
                        <span className="text-sm font-medium">Expected Close Date:</span>
                        <span className="ml-2 text-sm">{formatDate(preview.lead.expectedCloseDate)}</span>
                      </div>
                    )}
                    {preview.lead.notes && (
                      <div>
                        <span className="text-sm font-medium">Notes:</span>
                        <p className="mt-1 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {preview.lead.notes}
                        </p>
                      </div>
                    )}
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
                      View Complete Details
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
                  <label className="mb-1 block text-sm font-medium">Notes</label>
                  <textarea
                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-20 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    placeholder="Notes about the negotiation..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
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
      </SidebarInset>
    </SidebarProvider>
  )
}
