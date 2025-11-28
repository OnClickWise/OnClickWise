"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Copy, Check, Trash2, RefreshCw, Clock, Infinity, X, ArrowLeft } from "lucide-react"
import { useLandingPageStore } from "@/stores/landing-page-store"
import { getApiBaseUrl } from "@/lib/api"
import { useTranslations } from "next-intl"

const API_BASE_URL = getApiBaseUrl()

interface PreviewLink {
  id: string
  token: string
  link_type: 'permanent' | 'temporary'
  expires_at?: string
  is_active: boolean
  name?: string
  access_count: number
  created_at: string
  preview_url?: string
}

export function PreviewLinkGenerator({ open, onClose, onBack }: { open: boolean; onClose: () => void; onBack?: () => void }) {
  const t = useTranslations('LandingPageCreator.previewLinkGenerator')
  const { currentPage } = useLandingPageStore()
  const [copied, setCopied] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [previewLinks, setPreviewLinks] = React.useState<PreviewLink[]>([])
  const [linkType, setLinkType] = React.useState<'permanent' | 'temporary'>('temporary')
  const [expiresInDays, setExpiresInDays] = React.useState(7)
  const [linkName, setLinkName] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  // Get auth token from localStorage
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  }

  // Load existing preview links
  const loadPreviewLinks = React.useCallback(async () => {
    if (!currentPage?.id) return

    // Validar se o ID é um UUID válido (página precisa estar salva no banco)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(currentPage.id)) {
      // Se não for UUID válido, não tenta carregar (página ainda não foi salva)
      setPreviewLinks([])
      return
    }

    try {
      const token = getAuthToken()
      if (!token) {
        setError(t('authError'))
        return
      }

      const response = await fetch(
        `${API_BASE_URL}/landing-pages/preview-links?landing_page_id=${currentPage.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || t('loadError'))
      }

      const data = await response.json()
      if (data.success && data.preview_links) {
        setPreviewLinks(data.preview_links)
      }
    } catch (err: any) {
      console.error('Error loading preview links:', err)
      setError(err.message || t('loadLinksError'))
    }
  }, [currentPage?.id, t])

  React.useEffect(() => {
    if (open && currentPage?.id) {
      loadPreviewLinks()
    }
  }, [open, currentPage?.id, loadPreviewLinks])

  const handleCreateLink = async () => {
    if (!currentPage?.id) {
      setError(t('noPageSelected'))
      return
    }

    // Validar se o ID é um UUID válido (página precisa estar salva no banco)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(currentPage.id)) {
      setError('A página precisa ser salva no banco de dados antes de criar links de preview. Por favor, salve a página primeiro.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setError(t('authError'))
        setLoading(false)
        return
      }

      const response = await fetch(`${API_BASE_URL}/landing-pages/preview-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          landing_page_id: currentPage.id,
          link_type: linkType,
          expires_in_days: linkType === 'temporary' ? expiresInDays : undefined,
          name: linkName || undefined
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('createError'))
      }

      setSuccess(t('linkCreated'))
      setLinkName('')
      await loadPreviewLinks()
    } catch (err: any) {
      console.error('Error creating preview link:', err)
      setError(err.message || t('createError'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm(t('deleteConfirm'))) {
      return
    }

    try {
      const token = getAuthToken()
      if (!token) {
        setError(t('authError'))
        return
      }

      const response = await fetch(`${API_BASE_URL}/landing-pages/preview-links`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: linkId })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('deleteError'))
      }

      setSuccess(t('linkDeleted'))
      await loadPreviewLinks()
    } catch (err: any) {
      console.error('Error deleting preview link:', err)
      setError(err.message || t('deleteError'))
    }
  }

  const handleToggleLink = async (linkId: string, currentStatus: boolean) => {
    try {
      const token = getAuthToken()
      if (!token) {
        setError(t('authError'))
        return
      }

      const response = await fetch(`${API_BASE_URL}/landing-pages/preview-links`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          id: linkId,
          is_active: !currentStatus
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('updateError'))
      }

      setSuccess(currentStatus ? t('linkDeactivated') : t('linkActivated'))
      await loadPreviewLinks()
    } catch (err: any) {
      console.error('Error toggling preview link:', err)
      setError(err.message || t('updateError'))
    }
  }

  const handleCopy = async (url: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(linkId)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setError(t('copyError'))
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const locale = typeof window !== 'undefined' && navigator.language ? navigator.language : 'pt-BR'
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (link: PreviewLink) => {
    if (link.link_type === 'permanent') return false
    if (!link.expires_at) return false
    return new Date(link.expires_at) < new Date()
  }

  const getPreviewUrl = (link: PreviewLink) => {
    if (link.preview_url) return link.preview_url
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/preview/${link.token}`
  }

  const tBack = useTranslations('LandingPageCreator')
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-[90vw] max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader className="border-b-2 border-[#3b82f6] pb-3 sm:pb-4 mb-3 sm:mb-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onClose()
                  onBack()
                }}
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                style={{ cursor: 'pointer' }}
                title={tBack('back', 'Voltar')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 flex-1">
              <div className="w-2 h-6 sm:h-8 bg-[#3b82f6] rounded-full"></div>
              {t('title')}
            </DialogTitle>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {t('subtitle')}
          </p>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-2">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Create new link form */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('createNewLink')}</h3>
            <div className="space-y-4">
              <div>
                <Label>{t('linkType')}</Label>
                <Select value={linkType} onValueChange={(value: 'permanent' | 'temporary') => setLinkType(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">
                      <div className="flex items-center gap-2">
                        <Infinity className="w-4 h-4" />
                        <span>{t('permanent')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="temporary">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{t('temporary')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {linkType === 'permanent' 
                    ? t('permanentDescription')
                    : t('temporaryDescription')}
                </p>
              </div>

              {linkType === 'temporary' && (
                <div>
                  <Label>{t('expiresIn')}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 7)))}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('expiresInDays', { days: expiresInDays, daysPlural: expiresInDays !== 1 ? 's' : '' })}
                  </p>
                </div>
              )}

              <div>
                <Label>{t('linkName')}</Label>
                <Input
                  type="text"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder={t('linkNamePlaceholder')}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('linkNameDescription')}
                </p>
              </div>

              <Button
                onClick={handleCreateLink}
                disabled={loading}
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t('creating')}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('createLink')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Existing links list */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('existingLinks')}</h3>
            {previewLinks.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500">{t('noLinks')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('noLinksHint')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {previewLinks.map((link) => {
                  const url = getPreviewUrl(link)
                  const expired = isExpired(link)
                  const isActive = link.is_active && !expired

                  return (
                    <div
                      key={link.id}
                      className={`p-4 rounded-lg border-2 ${
                        isActive
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {link.link_type === 'permanent' ? (
                              <Infinity className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-orange-600" />
                            )}
                            <span className="font-semibold text-gray-900">
                              {link.name || t('linkWithoutName')}
                            </span>
                            {!isActive && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                {expired ? t('expired') : t('inactive')}
                              </span>
                            )}
                            {link.link_type === 'permanent' && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {t('permanent')}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <Input
                              value={url}
                              readOnly
                              className="flex-1 text-sm font-mono"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleCopy(url, link.id)}
                            >
                              {copied === link.id ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span>{t('accesses', { count: link.access_count })}</span>
                            {link.expires_at && (
                              <span>
                                {t('expiresAt', { date: formatDate(link.expires_at) })}
                              </span>
                            )}
                            <span>{t('createdAt', { date: formatDate(link.created_at) })}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleLink(link.id, link.is_active)}
                            title={link.is_active ? t('deactivateLink') : t('activateLink')}
                          >
                            {link.is_active ? (
                              <X className="w-4 h-4" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteLink(link.id)}
                            title={t('deleteLink')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t-2 border-[#3b82f6] flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
          >
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
