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
import { Search, Plus, Download, Trash2, Edit, X } from "lucide-react"
import * as XLSX from "xlsx"

type Lead = {
  id: string
  name: string
  email: string
  phone: string
  source: string
  status: "Novo" | "Em Contato" | "Qualificado" | "Perdido" | string
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
    status: "Novo",
  },
  {
    id: "ld_2",
    name: "João Souza",
    email: "joao.souza@example.com",
    phone: "+55 21 99876-5432",
    source: "Instagram",
    status: "Em Contato",
  },
  {
    id: "ld_3",
    name: "Ana Pereira",
    email: "ana.pereira@example.com",
    phone: "+55 31 90000-1111",
    source: "Indicação",
    status: "Qualificado",
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

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [source, setSource] = React.useState("")
  const [status, setStatus] = React.useState<Lead["status"]>("Novo")
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
    setStatus("Novo")
    setCustomStatus("")
    setIsModalOpen(false)
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
    if (lead.status !== "Novo" && lead.status !== "Em Contato" && lead.status !== "Qualificado" && lead.status !== "Perdido") {
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

  function handleSelectLead(id: string) {
    setSelectedLeads(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  function exportToXLSX() {
    const data = filteredLeads.map(lead => ({
      Nome: lead.name,
      Email: lead.email,
      Telefone: lead.phone,
      Origem: lead.source,
      Status: lead.status
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Leads")
    
    const fileName = `leads_${org}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  // Free text phone input: no auto-formatting

  const canConfirmDeletion = React.useMemo(() => {
    const value = confirmInput.trim().toLowerCase()
    return value === "confirmar" || value === "agree"
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
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
        </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsModalOpen(true)} className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Lead
              </Button>
              <Button variant="outline" onClick={exportToXLSX} className="cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                Exportar XLSX
              </Button>
              {selectedLeads.size > 0 && (
                <Button variant="destructive" onClick={handleDeleteSelected} className="cursor-pointer">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Selecionados ({selectedLeads.size})
                </Button>
              )}
                  </div>
                </div>

          {/* LEADS TABLE */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Lista de Leads</h2>
              <span className="text-sm text-muted-foreground">
                {filteredLeads.length} de {leads.length} itens
              </span>
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
                    <th className="py-2 pr-3">Nome</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Telefone</th>
                    <th className="py-2 pr-3">Origem</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-0 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
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
                            Editar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(lead.id)} className="cursor-pointer">
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remover
                          </Button>
              </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground">
                        {searchTerm ? "Nenhum lead encontrado para a busca." : "Nenhum lead ainda. Adicione o primeiro acima."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MODAL */}
        <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">
            <SheetHeader>
              <SheetTitle>
                {editingId ? "Editar Lead" : "Adicionar Lead"}
              </SheetTitle>
              <SheetDescription>
                {editingId ? "Atualize as informações do lead." : "Preencha os dados do novo lead."}
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
                  <label className="mb-1 block text-sm font-medium">Nome</label>
                  <Input
                    placeholder="Nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <Input
                type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Telefone</label>
                  <Input
                    placeholder="Telefone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
          <div>
                  <label className="mb-1 block text-sm font-medium">Origem</label>
                  <Input
                    placeholder="Ex.: Instagram, Landing Page"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
              />
            </div>
                <div className="md:col-span-2 space-y-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Status</label>
                    <select
                      className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      value={["Novo","Em Contato","Qualificado","Perdido"].includes(String(status)) ? String(status) : "custom"}
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
                      <option value="Novo">Novo</option>
                      <option value="Em Contato">Em Contato</option>
                      <option value="Qualificado">Qualificado</option>
                      <option value="Perdido">Perdido</option>
                      <option value="custom">Personalizado…</option>
                    </select>
                  </div>
                  {(!["Novo","Em Contato","Qualificado","Perdido"].includes(String(status))) && (
                    <div>
                      <label className="mb-1 block text-sm font-medium">Status personalizado</label>
                      <Input
                        placeholder="Ex.: Follow-up adiado"
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
                  {editingId ? "Salvar" : "Adicionar"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="cursor-pointer">
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

        {/* CONFIRMATION MODAL */}
        <Sheet open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">
            <SheetHeader>
              <SheetTitle>Confirmar exclusão</SheetTitle>
              <SheetDescription>
                Esta ação é irreversível. <br>
                </br>Digite "Confirmar" para prosseguir.
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <div className="space-y-6">
              <div className="text-sm bg-destructive/10 text-destructive border border-destructive/30 rounded-md p-3">
                {pendingDeletionIds.length === 1
                  ? "Você está prestes a remover 1 lead."
                  : `Você está prestes a remover ${pendingDeletionIds.length} leads.`}
              </div>
              <div className="space-y-2">
                <label className="mb-1 block text-sm font-medium">Confirmação</label>
                <Input
                  placeholder="Digite 'Confirmar' para continuar"
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
                  Remover definitivamente
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmOpen(false)}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
              </div>
    </div>
          </SheetContent>
        </Sheet>
      </SidebarInset>
    </SidebarProvider>
  )
}
