'use client';

import * as React from 'react'
import { use, useRef, useState, useEffect } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import AuthGuard from '@/components/AuthGuard'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useApi } from '@/hooks/useApi'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, Upload, X, ImageIcon, Palette, CheckCircle2 } from 'lucide-react'
import { getApiBaseUrl, resolveMediaUrl } from '@/lib/api-url'

interface OrgBranding {
  name: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
}

export default function BrandingPage({
  params,
}: {
  params: Promise<{ org: string; locale: string }>
}) {
  const { org, locale } = use(params)
  const { apiCall } = useApi()
  const { token } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [branding, setBranding] = useState<OrgBranding>({
    name: '',
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
  })
  const [originalBranding, setOriginalBranding] = useState<OrgBranding>({ ...branding })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoVersion, setLogoVersion] = useState<number>(Date.now())
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    loadBranding()
  }, [])

  const loadBranding = async () => {
    setLoading(true)
    try {
      const res = await apiCall('/organization/user-organization', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.success && res.organization) {
        const data = {
          name: res.organization.name || '',
          logo_url: res.organization.logo_url || '',
          primary_color: res.organization.primary_color || '#3B82F6',
          secondary_color: res.organization.secondary_color || '#8B5CF6',
        }
        setBranding(data)
        setOriginalBranding(data)
        setLogoVersion(Date.now())
      }
    } catch {
      setError('Não foi possível carregar os dados de branding.')
    } finally {
      setLoading(false)
    }
  }

  const optimizeLogoFile = async (file: File): Promise<File> => {
    const isRasterImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    if (!isRasterImage) return file

    const imageBitmap = await createImageBitmap(file)
    const maxDimension = 1024
    const scale = Math.min(1, maxDimension / Math.max(imageBitmap.width, imageBitmap.height))
    const targetWidth = Math.max(1, Math.round(imageBitmap.width * scale))
    const targetHeight = Math.max(1, Math.round(imageBitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight)
    imageBitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.82)
    })

    if (!blob) return file

    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    })
  }

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setUploadError('')
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowed.includes(selectedFile.type)) {
      setUploadError('Formato inválido. Use JPG, PNG, GIF, WebP ou SVG.')
      return
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadError('Arquivo muito grande. Máximo 5 MB.')
      return
    }

    let fileToUpload = selectedFile
    try {
      fileToUpload = await optimizeLogoFile(selectedFile)
    } catch (error) {
      console.warn('Falha ao otimizar logo, usando arquivo original', error)
    }

    const maxUploadSize = 900 * 1024
    if (fileToUpload.size > maxUploadSize) {
      setUploadError('Arquivo muito grande para o servidor. Use uma imagem menor que 900KB.')
      return
    }

    setLogoPreview(URL.createObjectURL(fileToUpload))
    setLogoFile(fileToUpload)
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    setLogoFile(null)
    setBranding((prev) => ({ ...prev, logo_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      // Upload logo first if a new file was selected
      if (logoFile) {
        const formData = new FormData()
        formData.append('logo', logoFile)
        const uploadRes = await fetch(
          `${getApiBaseUrl()}/organization/logo`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        )
        const uploadData = await uploadRes.json()
        if (uploadData.success) {
          setBranding((prev) => ({ ...prev, logo_url: uploadData.logo_url }))
          setLogoPreview(null)
          setLogoFile(null)
          setLogoVersion(Date.now())
          window.dispatchEvent(new CustomEvent('organizationUpdated'))
          setSaved(true)
          setSaving(false)
          return
        } else {
          setError(uploadData.error || 'Falha ao enviar o logo.')
          setSaving(false)
          return
        }
      }

      // Only save changed color fields
      const changed: Partial<OrgBranding> = {}
      if (branding.primary_color !== originalBranding.primary_color)
        changed.primary_color = branding.primary_color
      if (branding.secondary_color !== originalBranding.secondary_color)
        changed.secondary_color = branding.secondary_color

      if (Object.keys(changed).length === 0) {
        setSaving(false)
        return
      }

      const res = await apiCall('/organization/update', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changed),
      })

      if (res.success) {
        setOriginalBranding({ ...branding })
        window.dispatchEvent(new CustomEvent('organizationUpdated'))
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(res.error || 'Erro ao salvar configurações.')
      }
    } catch {
      setError('Erro inesperado ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const resolvedLogo = resolveMediaUrl(branding.logo_url)
  const currentLogo =
    logoPreview || !resolvedLogo
      ? logoPreview || resolvedLogo
      : `${resolvedLogo}${resolvedLogo.includes('?') ? '&' : '?'}t=${logoVersion}`
  const primary = branding.primary_color || '#3B82F6'
  const secondary = branding.secondary_color || '#8B5CF6'
  const hasChanges =
    logoFile ||
    branding.primary_color !== originalBranding.primary_color ||
    branding.secondary_color !== originalBranding.secondary_color

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
          {/* HEADER */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${locale}/${org}/dashboard`}>Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${locale}/${org}/settings`}>Configurações</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Identidade Visual</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* MAIN */}
          <div className="flex flex-col gap-6 p-6 max-w-3xl">
            <div>
              <h1 className="text-2xl font-bold">Identidade Visual</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Personalize o logo e as cores da sua organização.
              </p>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive text-sm">
                {error}
              </div>
            )}

            {!loading && (
              <div className="flex flex-col gap-6">
                {/* Logo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ImageIcon className="w-4 h-4" />
                      Logotipo
                    </CardTitle>
                    <CardDescription>
                      Formatos aceitos: JPG, PNG, GIF, WebP, SVG (otimizado automaticamente, recomendado menor que 900KB)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Preview */}
                    <div
                      className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 shrink-0 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {currentLogo ? (
                        <img
                          src={currentLogo}
                          alt="Logo"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-[10px]">Clique para enviar</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                        onChange={handleLogoSelect}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          {currentLogo ? 'Trocar logo' : 'Enviar logo'}
                        </Button>
                        {currentLogo && (
                          <Button variant="ghost" size="sm" onClick={handleRemoveLogo}>
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Remover
                          </Button>
                        )}
                      </div>
                      {logoFile && (
                        <p className="text-xs text-muted-foreground">
                          {logoFile.name} — {(logoFile.size / 1024).toFixed(0)} KB
                        </p>
                      )}
                      {uploadError && (
                        <p className="text-xs text-destructive">{uploadError}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Palette className="w-4 h-4" />
                      Paleta de Cores
                    </CardTitle>
                    <CardDescription>
                      Defina as cores primária e secundária da sua marca.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Primary color */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cor Primária</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={primary}
                            onChange={(e) =>
                              setBranding((prev) => ({ ...prev, primary_color: e.target.value }))
                            }
                            className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
                          />
                          <Input
                            value={primary}
                            onChange={(e) =>
                              setBranding((prev) => ({ ...prev, primary_color: e.target.value }))
                            }
                            placeholder="#3B82F6"
                            className="font-mono uppercase text-sm"
                            maxLength={7}
                          />
                        </div>
                      </div>

                      {/* Secondary color */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cor Secundária</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={secondary}
                            onChange={(e) =>
                              setBranding((prev) => ({ ...prev, secondary_color: e.target.value }))
                            }
                            className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
                          />
                          <Input
                            value={secondary}
                            onChange={(e) =>
                              setBranding((prev) => ({ ...prev, secondary_color: e.target.value }))
                            }
                            placeholder="#8B5CF6"
                            className="font-mono uppercase text-sm"
                            maxLength={7}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Color preview */}
                    <div className="rounded-xl border overflow-hidden">
                      <div
                        className="p-4 text-white text-sm font-semibold flex items-center justify-between"
                        style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                      >
                        <span>{branding.name || 'Sua Organização'}</span>
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-white/40" />
                          <div className="w-3 h-3 rounded-full bg-white/70" />
                          <div className="w-3 h-3 rounded-full bg-white" />
                        </div>
                      </div>
                      <div className="p-4 bg-background flex gap-3">
                        <button
                          style={{ background: primary }}
                          className="px-4 py-2 rounded-lg text-white text-xs font-semibold"
                        >
                          Ação Primária
                        </button>
                        <button
                          style={{ background: secondary }}
                          className="px-4 py-2 rounded-lg text-white text-xs font-semibold"
                        >
                          Ação Secundária
                        </button>
                        <button
                          style={{ border: `1.5px solid ${primary}`, color: primary }}
                          className="px-4 py-2 rounded-lg text-xs font-semibold bg-transparent"
                        >
                          Contorno
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save */}
                <div className="flex items-center justify-between">
                  <div>
                    {saved && (
                      <span className="flex items-center gap-1.5 text-sm text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        Salvo com sucesso!
                      </span>
                    )}
                  </div>
                  <Button onClick={handleSave} disabled={saving || !hasChanges}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
