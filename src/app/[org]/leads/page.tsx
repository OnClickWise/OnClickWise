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
import { Search, Plus, Download, Upload, Trash2, Edit, X, ChevronDown, CheckCircle2, AlertTriangle, AlertCircle, Check, Filter, XCircle, ArrowUp, ArrowDown } from "lucide-react"
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
  },
  {
    id: "ld_2",
    name: "João Souza",
    email: "joao.souza@example.com",
    phone: "+55 21 99876-5432",
    ssn: "",
    source: "Instagram",
    status: "In Contact",
  },
  {
    id: "ld_3",
    name: "Ana Pereira",
    email: "ana.pereira@example.com",
    phone: "+55 31 90000-1111",
    ssn: "",
    source: "Referral",
    status: "Qualified",
  },
]

export default function LeadsPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  const storageKey = React.useMemo(() => `leads_${org}`, [org])

  const [leads, setLeads] = React.useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = React.useState<Lead[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedLeads, setSelectedLeads] = React.useState<Set<string>>(new Set())
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
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isImportOpen, setIsImportOpen] = React.useState(false)
  const [isDragActive, setIsDragActive] = React.useState(false)
  // Toast notifications stack (top-right)
  const [toasts, setToasts] = React.useState<{ id: string, text: string, type: "success" | "warning" | "error" }[]>([])

  // Preview modal for viewing selected lead details
  const [preview, setPreview] = React.useState<{ open: boolean, lead: Lead | null }>({ open: false, lead: null })
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)

  // Filter modal and state
  const [isFilterOpen, setIsFilterOpen] = React.useState(false)
  const [filters, setFilters] = React.useState({
    name: "",
    email: "",
    phone: "",
    ssn: "",
    source: "",
    status: ""
  })

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [ssn, setSsn] = React.useState("")
  const [source, setSource] = React.useState("")
  const [status, setStatus] = React.useState<Lead["status"]>("New")
  const [customStatus, setCustomStatus] = React.useState("")

  // Field limits
  const FIELD_MAX = React.useMemo(() => ({
    name: 160,     // geralmente nomes completos ficam entre 40-60 chars
    email: 30,   // limite oficial do padrão RFC para emails
    phone: 20,    // suporta +DDI, DDD, traços e espaços (+55 11 99999-9999)
    ssn: 14,      // se for CPF/CNPJ -> 14 chars com pontos/traços
    source: 30,   // ex: origem do cadastro (site, campanha, etc.)
    status: 20,   // status curto: "pendente", "em análise", "aprovado"
  }), [])

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        setLeads(JSON.parse(raw))
      } else {
        setLeads(SAMPLE_LEADS)
        localStorage.setItem(storageKey, JSON.stringify(SAMPLE_LEADS))
      }
    } catch {
      setLeads(SAMPLE_LEADS)
    }
  }, [storageKey])

  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(leads))
    } catch {}
  }, [leads, storageKey])

  // Helpers: notifications
  function pushToast(message: string, type: "success" | "warning" | "error" = "success", timeoutMs = 4000) {
    const id = createId()
    setToasts((prev) => [...prev, { id, text: message, type }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, timeoutMs)
  }

  React.useEffect(() => {
    const filtered = leads.filter(lead => {
      // Search filter
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.ssn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.status.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Field filters
      const matchesName = !filters.name || lead.name.toLowerCase().includes(filters.name.toLowerCase())
      const matchesEmail = !filters.email || lead.email.toLowerCase().includes(filters.email.toLowerCase())
      const matchesPhone = !filters.phone || lead.phone.includes(filters.phone)
      const matchesSsn = !filters.ssn || lead.ssn.toLowerCase().includes(filters.ssn.toLowerCase())
      const matchesSource = !filters.source || lead.source.toLowerCase().includes(filters.source.toLowerCase())
      const matchesStatus = !filters.status || lead.status.toLowerCase() === filters.status.toLowerCase()
      
      return matchesSearch && matchesName && matchesEmail && matchesPhone && matchesSsn && matchesSource && matchesStatus
    })
    setFilteredLeads(filtered)
  }, [leads, searchTerm, filters])

  function resetForm() {
    setEditingId(null)
    setName("")
    setEmail("")
    setPhone("")
    setSsn("")
    setSource("")
    setStatus("New")
    setCustomStatus("")
    setIsModalOpen(false)
  }

  function startAddNew() {
    // Clear any editing state and open modal for creating a new lead
    setEditingId(null)
    setName("")
    setEmail("")
    setPhone("")
    setSsn("")
    setSource("")
    setStatus("New")
    setCustomStatus("")
    setIsModalOpen(true)
  }

  function truncateTo(value: string, max: number): string {
    return value.length > max ? value.slice(0, max) : value
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email) return
    // Enforce limits before saving
    const safeName = truncateTo(name, FIELD_MAX.name)
    const safeEmail = truncateTo(email, FIELD_MAX.email)
    const safePhone = truncateTo(phone, FIELD_MAX.phone)
    const safeSsn = truncateTo(ssn, FIELD_MAX.ssn)
    const safeSource = truncateTo(source, FIELD_MAX.source)
    const safeStatus = truncateTo(String(status), FIELD_MAX.status) as Lead["status"]
    if (editingId) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === editingId ? { ...l, name: safeName, email: safeEmail, phone: safePhone, ssn: safeSsn, source: safeSource, status: safeStatus } : l
        )
      )
    } else {
      const newLead: Lead = {
        id: createId(),
        name: safeName,
        email: safeEmail,
        phone: safePhone,
        ssn: safeSsn,
        source: safeSource,
        status: safeStatus,
      }
      const existing = buildSignatureSet(leads)
      const sig = makeLeadSignature({ name: newLead.name, email: newLead.email, phone: newLead.phone, ssn: newLead.ssn, source: newLead.source, status: newLead.status })
      if (existing.has(sig)) {
        pushToast(`Lead "${newLead.name}" already exists and was not added.`, "warning")
      } else {
        setLeads([newLead, ...leads])
        // Optional: toast for manual add success (kept subtle by default)
        pushToast(`Lead "${newLead.name}" added successfully.`, "success")
      }
    }
    resetForm()
  }

  function handleEdit(lead: Lead) {
    setEditingId(lead.id)
    setName(lead.name)
    setEmail(lead.email)
    setPhone(lead.phone)
    setSsn(lead.ssn)
    setSource(lead.source)
    setStatus(lead.status)
    if (lead.status !== "New" && lead.status !== "In Contact" && lead.status !== "Qualified" && lead.status !== "Lost") {
      setCustomStatus(lead.status)
    } else {
      setCustomStatus("")
    }
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
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)))
    }
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
          const leadId = filteredLeads[i]?.id
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
    setIsBulkEditOpen(true)
  }

  function applyBulkEdit() {
    if (selectedLeads.size === 0) return
    const shouldUpdateStatus = bulkStatus.trim() !== ""
    const shouldUpdateSource = bulkSource.trim() !== ""
    if (!shouldUpdateStatus && !shouldUpdateSource) {
      setIsBulkEditOpen(false)
      return
    }
    const idsToUpdate = new Set(selectedLeads)
    setLeads((prev) =>
      prev.map((l) => {
        if (!idsToUpdate.has(l.id)) return l
        return {
          ...l,
          status: shouldUpdateStatus ? (bulkStatus as Lead["status"]) : l.status,
          source: shouldUpdateSource ? bulkSource : l.source,
        }
      })
    )
    setIsBulkEditOpen(false)
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

  function headerToCanonical(normalized: string): keyof Omit<Lead, "id"> | null {
    // Map of supported header synonyms (normalized via normalizeHeader)
    const headerAliases: Record<keyof Omit<Lead, "id">, string[]> = {
      name: [
        "name",
        "full name",
        "fullname",
        "nome",
        "nome completo"
      ],
      email: [
        "email",
        "e mail",
        "mail",
        "email address",
        "endereco de email",
        "correio",
        "correo"
      ],
      phone: [
        "phone",
        "phone number",
        "cell",
        "cellphone",
        "mobile",
        "mobile phone",
        "telefone",
        "celular",
        "telemovel",
        "whatsapp"
      ],
      ssn: [
        "ssn",
        "social security number",
        "social security",
        "social security no",
        "social security n",
        "social security #",
        "social sec number",
        "social sec no",
        "cpf",
        "c p f",
        "cadastro de pessoa fisica",
        "cadastro de pessoa física",
        "numero do cpf",
        "n cpf",
        "número do cpf"
      ],
      source: [
        "source",
        "lead source",
        "leadsource",
        "origem",
        "fonte",
        "canal",
        "canal de origem",
        "origem do lead",
        "fonte do lead"
      ],
      status: [
        "status",
        "lead status",
        "leadstatus",
        "situacao",
        "estado",
        "etapa",
        "situacao do lead",
        "situacao do contato"
      ],
    }

    for (const [key, aliases] of Object.entries(headerAliases) as [keyof Omit<Lead, "id">, string[]][]) {
      if (aliases.includes(normalized)) return key
    }
    return null
  }

  function makeLeadSignature(l: Omit<Lead, "id">): string {
    return `${l.name}||${l.email}||${l.phone}||${l.ssn}||${l.source}||${l.status}`
  }

  function buildSignatureSet(items: Lead[]): Set<string> {
    const s = new Set<string>()
    for (const l of items) {
      s.add(makeLeadSignature({ name: l.name, email: l.email, phone: l.phone, ssn: l.ssn, source: l.source, status: l.status }))
    }
    return s
  }

  function mapRowsToLeads(rows: Record<string, unknown>[]): Lead[] {
    if (rows.length === 0) return []
    const sampleRow = rows[0]
    const headerKeys = Object.keys(sampleRow)
    const mapping: Partial<Record<string, keyof Omit<Lead, "id">>> = {}
    for (const header of headerKeys) {
      const canonical = headerToCanonical(normalizeHeader(header))
      if (canonical) mapping[header] = canonical
    }
    const imported: Lead[] = []
    for (const row of rows) {
      const draft: Partial<Lead> = {}
      for (const [header, value] of Object.entries(row)) {
        const key = mapping[header]
        if (!key) continue
        const text = String(value ?? "").trim()
        if (key === "status") {
          draft.status = truncateTo(text, FIELD_MAX.status) as Lead["status"]
        } else if (key === "name") {
          draft.name = truncateTo(text, FIELD_MAX.name)
        } else if (key === "email") {
          draft.email = truncateTo(text, FIELD_MAX.email)
        } else if (key === "phone") {
          draft.phone = truncateTo(text, FIELD_MAX.phone)
        } else if (key === "source") {
          draft.source = truncateTo(text, FIELD_MAX.source)
        } else if (key === "ssn") {
          draft.ssn = truncateTo(text, FIELD_MAX.ssn)
        }
      }
      if (!draft.name && !draft.email) continue
      imported.push({
        id: createId(),
        name: draft.name || "",
        email: draft.email || "",
        phone: draft.phone || "",
        ssn: draft.ssn || "",
        source: draft.source || "",
        status: (draft.status as Lead["status"]) || "New",
      })
    }
    return imported
  }

  async function handleImportFile(file: File) {
    try {
      const lower = file.name.toLowerCase()
      if (lower.endsWith(".json")) {
        const text = await file.text()
        const data = JSON.parse(text) as Record<string, unknown>[]
        const imported = mapRowsToLeads(Array.isArray(data) ? data : [])
        if (imported.length > 0) {
          const existing = buildSignatureSet(leads)
          const uniqueToAdd: Lead[] = []
          let duplicatesCount = 0
          for (const l of imported) {
            const sig = makeLeadSignature({ name: l.name, email: l.email, phone: l.phone, ssn: l.ssn, source: l.source, status: l.status })
            if (!existing.has(sig)) {
              existing.add(sig)
              uniqueToAdd.push(l)
            } else {
              duplicatesCount++
            }
          }
          if (uniqueToAdd.length > 0) {
            setLeads([...uniqueToAdd, ...leads])
            pushToast(`${uniqueToAdd.length} lead(s) imported successfully.`, "success")
          } else {
            pushToast(`0 lead(s) imported. No new records detected.`, "warning")
          }
          if (duplicatesCount > 0) {
            pushToast(`${duplicatesCount} duplicate lead(s) were skipped during import.`, "warning")
          }
        }
        return
      }
      // CSV, XLSX, XLS, ODS via SheetJS
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" })
      const imported = mapRowsToLeads(rows)
      if (imported.length > 0) {
        const existing = buildSignatureSet(leads)
        const uniqueToAdd: Lead[] = []
        let duplicatesCount = 0
        for (const l of imported) {
          const sig = makeLeadSignature({ name: l.name, email: l.email, phone: l.phone, ssn: l.ssn, source: l.source, status: l.status })
          if (!existing.has(sig)) {
            existing.add(sig)
            uniqueToAdd.push(l)
          } else {
            duplicatesCount++
          }
        }
        if (uniqueToAdd.length > 0) {
          setLeads([...uniqueToAdd, ...leads])
          pushToast(`${uniqueToAdd.length} lead(s) imported successfully.`, "success")
        } else {
          pushToast(`0 lead(s) imported. No new records detected.`, "warning")
        }
        if (duplicatesCount > 0) {
          pushToast(`${duplicatesCount} duplicate lead(s) were skipped during import.`, "warning")
        }
      }
    } catch (err) {
      console.error(err)
      alert("Failed to import file. Please check the file format and content.")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function exportData(format: "xlsx" | "csv" | "ods" | "json") {
    const selectedIds = selectedLeads
    const baseList = selectedIds.size > 0
      ? leads.filter(l => selectedIds.has(l.id))
      : filteredLeads
    const data = baseList.map(lead => ({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      ssn: lead.ssn,
      source: lead.source,
      status: lead.status,
    }))
    const date = new Date().toISOString().split('T')[0]
    const base = `leads_${org}_${date}`
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
    pushToast(`${data.length} lead(s) exported as ${format.toUpperCase()}.`, "success")
  }

  // Free text phone input: no auto-formatting

  const canConfirmDeletion = React.useMemo(() => {
    // For single deletion, no typing required. For bulk deletion, require "delete"
    if (pendingDeletionIds.length === 1) return true
    const value = confirmInput.trim().toLowerCase()
    return value === "delete"
  }, [confirmInput, pendingDeletionIds.length])

  function performDeletion() {
    if (!canConfirmDeletion) return
    const idsToDelete = new Set(pendingDeletionIds)
    setLeads((prev) => prev.filter((l) => !idsToDelete.has(l.id)))
    setSelectedLeads((prev) => {
      const next = new Set(prev)
      pendingDeletionIds.forEach((id) => next.delete(id))
      return next
    })
    if (editingId && idsToDelete.has(editingId)) {
      resetForm()
    }
    setIsConfirmOpen(false)
    setPendingDeletionIds([])
    setConfirmInput("")
  }

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(true)}
                className="cursor-pointer"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {Object.values(filters).some(f => f !== "") && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                    {Object.values(filters).filter(f => f !== "").length}
                  </span>
                )}
              </Button>
              {Object.values(filters).some(f => f !== "") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ name: "", email: "", phone: "", ssn: "", source: "", status: "" })}
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
        </div>
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
                <Button variant="outline" onClick={openBulkEdit} className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Selected
                </Button>
              )}
              {selectedLeads.size > 0 && (
                <Button variant="destructive" onClick={handleDeleteSelected} className="cursor-pointer">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              )}
                  </div>
                </div>

          {/* LEADS TABLE */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Lead List</h2>
              <div className="flex items-center gap-2">
                {selectedLeads.size > 0 && (
                  <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
                    {selectedLeads.size} selected
                  </span>
                )}
                <span className="text-sm text-muted-foreground">
                  {filteredLeads.length} of {leads.length} items
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-input"
                      />
                    </th>
                    <th className="py-2 pr-3 w-[200px]">Name</th>
                    <th className="py-2 pr-3 w-[240px]">Email</th>
                    <th className="py-2 pr-3 w-[140px]">Phone</th>
                    <th className="py-2 pr-3 w-[160px]">SSN</th>
                    <th className="py-2 pr-3 w-[160px]">Source</th>
                    <th className="py-2 pr-3 w-[120px]">Status</th>
                    <th className="py-2 pr-0 text-right w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead, index) => (
                    <tr key={lead.id} className="border-b last:border-b-0 hover:bg-muted/30">
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
                        <div
                          className="max-w-[200px] truncate hover:underline decoration-dotted cursor-pointer"
                          title={lead.name}
                          onClick={() => setPreview({ open: true, lead })}
                        >
                          {lead.name}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="max-w-[220px] truncate" title={lead.email}>{lead.email}</div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="max-w-[140px] truncate whitespace-nowrap" title={lead.phone}>{lead.phone}</div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="max-w-[160px] truncate whitespace-nowrap" title={lead.ssn}>{lead.ssn}</div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="max-w-[160px] truncate" title={lead.source}>{lead.source}</div>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs">
                          {lead.status}
                        </span>
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
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground">
                        {searchTerm ? "No leads found for this search." : "No leads yet. Add the first one above."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ADD/EDIT MODAL */}
        <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">
            <SheetHeader>
              <SheetTitle>
                {editingId ? "Edit Lead" : "Add Lead"}
              </SheetTitle>
              <SheetDescription>
                {editingId ? "Update the lead information." : "Fill in the new lead details."}
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
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
              <Separator />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 cursor-pointer">
                  {editingId ? "Save" : "Add"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="cursor-pointer">
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

    {/* PREVIEW MODAL - Lead details */}
    <Sheet open={preview.open} onOpenChange={(open) => setPreview((p) => ({ ...p, open }))}>
      <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">
        <SheetHeader>
          <SheetTitle>Lead details</SheetTitle>
          <SheetDescription>Full data for quick copy</SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <div className="space-y-3">
          {(() => {
            const l = preview.lead
            if (!l) return null
            const rows: { label: string, value: string }[] = [
              { label: "Name", value: l.name },
              { label: "Email", value: l.email },
              { label: "Phone", value: l.phone },
              { label: "SSN", value: l.ssn },
              { label: "Source", value: l.source },
              { label: "Status", value: String(l.status) },
            ]
            return rows.map((r) => (
              <div key={r.label} className="space-y-1">
                <div className="text-xs text-muted-foreground">{r.label}</div>
                <div className="flex items-start gap-2">
                  <div className="flex-1 rounded-md border border-input p-2 text-sm break-words bg-muted/30">
                    {r.value || <span className="text-muted-foreground">(empty)</span>}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer shrink-0"
                    onMouseLeave={() => setCopiedKey((k) => (k ? null : k))}
                    onClick={() => {
                      navigator.clipboard.writeText(r.value || "")
                      setCopiedKey(r.label)
                      window.setTimeout(() => setCopiedKey((k) => (k === r.label ? null : k)), 700)
                    }}
                  >
                    <span className="inline-flex items-center gap-1 w-[54px] justify-center">
                      {copiedKey === r.label ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <>Copy</>
                      )}
                    </span>
                  </Button>
                </div>
              </div>
            ))
          })()}
          <div className="flex justify-end pt-2">
            <Button className="cursor-pointer" onClick={() => setPreview({ open: false, lead: null })}>Close</Button>
          </div>
        </div>
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
          <div className="flex gap-2">
            <Button
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 cursor-pointer"
            >
              Apply Filter
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ name: "", email: "", phone: "", ssn: "", source: "", status: "" })
                setIsFilterOpen(false)
              }}
              className="cursor-pointer"
            >
              Clear All
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

        {/* IMPORT MODAL (Centered Overlay) */}
        {isImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsImportOpen(false)} />
            <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Import leads</h3>
                <p className="text-sm text-muted-foreground">Accepted formats: .xlsx, .xls, .csv, .ods, .json. <br></br>Columns: name, email, phone, ssn, source, status</p>
              </div>
              <Separator className="my-4" />
              <div
                className={
                  "border-2 border-dashed rounded-lg p-8 text-center select-none cursor-pointer " +
                  (isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30")
                }
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragActive(true)
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragActive(false)
                  const file = e.dataTransfer.files?.[0]
                  if (!file) return
                  const ok = /\.(xlsx|xls|csv|ods|json)$/i.test(file.name)
                  if (!ok) {
                    alert("Unsupported file. Please choose .xlsx, .xls, .csv, .ods or .json")
                    return
                  }
                  handleImportFile(file).then(() => setIsImportOpen(false))
                }}
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-sm text-muted-foreground">Drag and drop your file here</div>
                <div className="mt-2 text-xs">or click to browse</div>
                <div className="mt-4 text-xs text-muted-foreground">.xlsx, .xls, .csv, .ods, .json</div>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.ods,.json,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.oasis.opendocument.spreadsheet"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const ok = /\.(xlsx|xls|csv|ods|json)$/i.test(file.name)
                  if (!ok) {
                    alert("Unsupported file. Please choose .xlsx, .xls, .csv, .ods or .json")
                    return
                  }
                  handleImportFile(file).then(() => setIsImportOpen(false))
                }}
              />
              <Separator className="my-4" />
              <div className="text-xs text-muted-foreground">We detect headers automatically, including variants.</div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsImportOpen(false)} className="cursor-pointer">Close</Button>
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
          <div className="flex gap-2">
            <Button onClick={applyBulkEdit} className="flex-1 cursor-pointer">Save changes</Button>
            <Button variant="outline" onClick={() => setIsBulkEditOpen(false)} className="cursor-pointer">Cancel</Button>
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
      </SidebarInset>
    </SidebarProvider>
  )
}
