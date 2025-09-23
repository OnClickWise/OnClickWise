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
import { Search, Plus, Download, Upload, Trash2, Edit, X, ChevronDown } from "lucide-react"
import * as XLSX from "xlsx"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Lead = {
  id: string
  name: string
  email: string
  phone: string
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
    source: "Landing Page",
    status: "New",
  },
  {
    id: "ld_2",
    name: "João Souza",
    email: "joao.souza@example.com",
    phone: "+55 21 99876-5432",
    source: "Instagram",
    status: "In Contact",
  },
  {
    id: "ld_3",
    name: "Ana Pereira",
    email: "ana.pereira@example.com",
    phone: "+55 31 90000-1111",
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

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [source, setSource] = React.useState("")
  const [status, setStatus] = React.useState<Lead["status"]>("New")
  const [customStatus, setCustomStatus] = React.useState("")

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

  React.useEffect(() => {
    const filtered = leads.filter(lead =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.status.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredLeads(filtered)
  }, [leads, searchTerm])

  function resetForm() {
    setEditingId(null)
    setName("")
    setEmail("")
    setPhone("")
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
    setSource("")
    setStatus("New")
    setCustomStatus("")
    setIsModalOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email) return
    if (editingId) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === editingId ? { ...l, name, email, phone, source, status } : l
        )
      )
    } else {
      const newLead: Lead = {
        id: createId(),
        name,
        email,
        phone,
        source,
        status,
      }
      setLeads((prev) => [newLead, ...prev])
    }
    resetForm()
  }

  function handleEdit(lead: Lead) {
    setEditingId(lead.id)
    setName(lead.name)
    setEmail(lead.email)
    setPhone(lead.phone)
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
    // English variants
    if (/^name|full\s*name|nome$/.test(normalized)) return "name"
    if (/^email|e\s*mail$/.test(normalized)) return "email"
    if (/^phone|phone\s*number|telefone|celular|telemovel|whatsapp$/.test(normalized)) return "phone"
    if (/^source|lead\s*source|origem|fonte|canal|canal\s*de\s*origem$/.test(normalized)) return "source"
    if (/^status|situacao|situação|estado|etapa$/.test(normalized)) return "status"
    return null
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
          draft.status = text as Lead["status"]
        } else if (key === "name") {
          draft.name = text
        } else if (key === "email") {
          draft.email = text
        } else if (key === "phone") {
          draft.phone = text
        } else if (key === "source") {
          draft.source = text
        }
      }
      if (!draft.name && !draft.email) continue
      imported.push({
        id: createId(),
        name: draft.name || "",
        email: draft.email || "",
        phone: draft.phone || "",
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
        if (imported.length > 0) setLeads((prev) => [...imported, ...prev])
        return
      }
      // CSV, XLSX, XLS, ODS via SheetJS
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" })
      const imported = mapRowsToLeads(rows)
      if (imported.length > 0) setLeads((prev) => [...imported, ...prev])
    } catch (err) {
      console.error(err)
      alert("Failed to import file. Please check the file format and content.")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function exportData(format: "xlsx" | "csv" | "ods" | "json") {
    const data = filteredLeads.map(lead => ({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
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
      return
    }
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Leads")
    const bookType = format
    XLSX.writeFile(wb, `${base}.${format}`, { bookType: bookType as XLSX.BookType })
  }

  // Free text phone input: no auto-formatting

  const canConfirmDeletion = React.useMemo(() => {
    const value = confirmInput.trim().toLowerCase()
    return value === "confirm"
  }, [confirmInput])

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
                  <DropdownMenuItem onClick={startAddNew} className="cursor-pointer">
                    Add manually
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsImportOpen(true)}
                    className="cursor-pointer"
                  >
                    Import
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* hidden input moved to Import modal */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => exportData("xlsx")} className="cursor-pointer">Export as XLSX</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportData("csv")} className="cursor-pointer">Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportData("ods")} className="cursor-pointer">Export as ODS</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportData("json")} className="cursor-pointer">Export as JSON</DropdownMenuItem>
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
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Phone</th>
                    <th className="py-2 pr-3">Source</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-0 text-right">Actions</th>
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
                      <td className="py-2 pr-3">{lead.name}</td>
                      <td className="py-2 pr-3">{lead.email}</td>
                      <td className="py-2 pr-3">{lead.phone}</td>
                      <td className="py-2 pr-3">{lead.source}</td>
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs">
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-2 pr-0">
                        <div className="flex justify-end gap-2">
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
                    onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <Input
                type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Phone</label>
                  <Input
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
          <div>
                  <label className="mb-1 block text-sm font-medium">Source</label>
                  <Input
                    placeholder="e.g., Instagram, Landing Page"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
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
                          setCustomStatus(e.target.value)
                          setStatus(e.target.value)
                        }}
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

        {/* IMPORT MODAL (Centered Overlay) */}
        {isImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsImportOpen(false)} />
            <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Import leads</h3>
                <p className="text-sm text-muted-foreground">Accepted formats: .xlsx, .xls, .csv, .ods, .json. <br></br>Columns: name, email, phone, source, status</p>
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
                This action is irreversible. <br>
                </br>Type "Confirm" to proceed.
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <div className="space-y-6">
              <div className="text-sm bg-destructive/10 text-destructive border border-destructive/30 rounded-md p-3">
                {pendingDeletionIds.length === 1
                  ? "You are about to remove 1 lead."
                  : `You are about to remove ${pendingDeletionIds.length} leads.`}
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">Confirmation</label>
                <Input
                  placeholder="Type 'Confirm' to continue"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                />
          </div>
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
