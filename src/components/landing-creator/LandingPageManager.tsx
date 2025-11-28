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
  FileText, 
  Trash2, 
  Edit, 
  Copy, 
  Eye, 
  CheckCircle, 
  XCircle,
  Loader2,
  Search,
  Plus,
  ArrowLeft
} from "lucide-react"
import { useLandingPageStore } from "@/stores/landing-page-store"
import { getApiBaseUrl } from "@/lib/api"
import { useTranslations } from "next-intl"

interface LandingPageData {
  id: string
  name: string
  is_published: boolean
  published_at?: string
  save_type: 'auto' | 'manual'
  save_slot?: number
  created_at: string
  updated_at: string
}

export function LandingPageManager({ open, onClose, onBack }: { open: boolean; onClose: () => void; onBack?: () => void }) {
  const t = useTranslations('LandingPageCreator.landingPageManager')
  const { 
    currentOrg, 
    loadPageFromBackend, 
    setCurrentPageId,
    duplicatePage,
    currentPageId,
    savePageManual,
    currentPage
  } = useLandingPageStore()
  const [pages, setPages] = React.useState<LandingPageData[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  }

  const loadPages = React.useCallback(async () => {
    if (!currentOrg) return

    setLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setError(t('authError'))
        setLoading(false)
        return
      }

      const API_BASE_URL = getApiBaseUrl()
      const response = await fetch(`${API_BASE_URL}/landing-pages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('loadPagesError'))
      }

      setPages(data.landing_pages || [])
    } catch (err: any) {
      console.error('Error loading pages:', err)
      setError(err.message || t('loadPagesError'))
    } finally {
      setLoading(false)
    }
  }, [currentOrg])

  React.useEffect(() => {
    if (open) {
      loadPages()
    }
  }, [open, loadPages])

  const handleLoadPage = async (pageId: string) => {
    const result = await loadPageFromBackend(pageId)
    if (result.success) {
      setCurrentPageId(pageId)
      onClose()
    } else {
      alert(result.error || t('loadError'))
    }
  }

  const handleDeletePage = async (pageId: string) => {
    if (!confirm(t('deleteConfirm'))) {
      return
    }

    setDeletingId(pageId)

    try {
      const token = getAuthToken()
      if (!token) {
        setError(t('authError'))
        return
      }

      const API_BASE_URL = getApiBaseUrl()
      const response = await fetch(`${API_BASE_URL}/landing-pages`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: pageId })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('deleteError'))
      }

      await loadPages()
    } catch (err: any) {
      console.error('Error deleting page:', err)
      alert(err.message || t('deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  const handleDuplicatePage = async (pageId: string) => {
    // First load the page
    const loadResult = await loadPageFromBackend(pageId)
    if (!loadResult.success) {
      alert(loadResult.error || t('loadDuplicateError'))
      return
    }

    // Then duplicate it
    const duplicateResult = await duplicatePage()
    if (duplicateResult.success) {
      await loadPages()
      onClose()
    } else {
      alert(duplicateResult.error || t('duplicateError'))
    }
  }

  const filteredPages = pages.filter(page =>
    page.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Separar páginas automáticas e manuais
  const autoPages = filteredPages.filter(p => p.save_type === 'auto').sort((a, b) => {
    // Ordenar por updated_at desc (mais recente primeiro)
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })
  const manualPages = filteredPages.filter(p => p.save_type === 'manual').sort((a, b) => {
    // Ordenar por slot (1, 2, 3)
    return (a.save_slot || 0) - (b.save_slot || 0)
  })

  const handleSaveManual = async (slot: 1 | 2 | 3) => {
    if (!currentPage) {
      alert(t('noPageToSave'))
      return
    }

    const result = await savePageManual(slot)
    if (result.success) {
      await loadPages()
      alert(t('saveSuccess', { slot }))
    } else {
      alert(result.error || t('saveError'))
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    // Use locale from i18n if available, otherwise default to pt-BR
    const locale = typeof window !== 'undefined' && navigator.language ? navigator.language : 'pt-BR'
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tBack = useTranslations('LandingPageCreator')
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-[90vw] max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6">
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

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Botões para salvar manualmente */}
          {currentPage && !loading && (
            <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 mb-2">{t('saveManualTitle')}</p>
              <div className="flex gap-2">
                {[1, 2, 3].map((slot) => {
                  const existingManual = manualPages.find(p => p.save_slot === slot)
                  return (
                    <Button
                      key={slot}
                      variant="outline"
                      onClick={() => handleSaveManual(slot as 1 | 2 | 3)}
                      className="border-2 border-[#3b82f6] text-[#3b82f6] hover:bg-blue-100"
                    >
                      {existingManual ? t('updateSlot', { slot }) : t('saveSlot', { slot })}
                    </Button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {t('saveManualDescription')}
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#3b82f6]" />
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                {searchTerm ? t('noPagesFound') : t('noPages')}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm 
                  ? t('noPagesFoundHint')
                  : t('noPagesHint')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Páginas Manuais */}
              {manualPages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                    {t('manualPages')}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {manualPages.map((page) => (
                      <div
                        key={page.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          currentPageId === page.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-green-200 bg-white hover:border-green-400 hover:bg-green-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-5 h-5 text-green-600" />
                              <h3 className="font-semibold text-gray-900">{page.name}</h3>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                {t('slot', { slot: page.save_slot })}
                              </span>
                              {page.is_published && (
                                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  <CheckCircle className="w-3 h-3" />
                                  {t('published')}
                                </span>
                              )}
                              {currentPageId === page.id && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {t('current')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span>{t('updated', { date: formatDate(page.updated_at) })}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleLoadPage(page.id)}
                              title={t('loadPage')}
                              className="hover:bg-green-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeletePage(page.id)}
                              disabled={deletingId === page.id}
                              title={t('deletePage')}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deletingId === page.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Histórico Automático */}
              {autoPages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                    {t('autoPages')}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {autoPages.map((page) => (
                      <div
                        key={page.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          currentPageId === page.id
                            ? 'border-[#3b82f6] bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-[#3b82f6] hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-5 h-5 text-[#3b82f6]" />
                              <h3 className="font-semibold text-gray-900">{page.name}</h3>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {t('automatic')}
                              </span>
                              {page.is_published && (
                                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  <CheckCircle className="w-3 h-3" />
                                  {t('published')}
                                </span>
                              )}
                              {currentPageId === page.id && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {t('current')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span>{t('updated', { date: formatDate(page.updated_at) })}</span>
                              {page.published_at && (
                                <span>{t('publishedAt', { date: formatDate(page.published_at) })}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleLoadPage(page.id)}
                              title={t('loadPage')}
                              className="hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDuplicatePage(page.id)}
                              title={t('duplicatePage')}
                              className="hover:bg-blue-50"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeletePage(page.id)}
                              disabled={deletingId === page.id}
                              title={t('deletePage')}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deletingId === page.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t('autoPagesDescription')}
                  </p>
                </div>
              )}
            </div>
          )}
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

