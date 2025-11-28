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
  DialogDescription,
} from "@/components/ui/dialog"
import { useLandingPageStore } from "@/stores/landing-page-store"
import { Search, Globe, FileText, ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"

export function GeneralSettings({ open, onClose, onBack }: { open: boolean; onClose: () => void; onBack?: () => void }) {
  const t = useTranslations('LandingPageCreator.generalSettings')
  const { currentPage, setPage } = useLandingPageStore()
  const [pageName, setPageName] = React.useState('')
  const [metaTitle, setMetaTitle] = React.useState('')
  const [metaDescription, setMetaDescription] = React.useState('')
  const [metaKeywords, setMetaKeywords] = React.useState('')
  const [ogImage, setOgImage] = React.useState('')

  React.useEffect(() => {
    if (currentPage) {
      setPageName(currentPage.name)
      setMetaTitle(currentPage.meta?.title || currentPage.name || '')
      setMetaDescription(currentPage.meta?.description || '')
      setMetaKeywords(currentPage.meta?.keywords || '')
      setOgImage(currentPage.meta?.ogImage || '')
    }
  }, [currentPage])

  const handleSave = () => {
    if (!currentPage) return
    
    const updatedPage = {
      ...currentPage,
      name: pageName,
      meta: {
        title: metaTitle || pageName,
        description: metaDescription,
        keywords: metaKeywords,
        ogImage: ogImage,
      },
      updatedAt: new Date().toISOString(),
    }
    setPage(updatedPage)
    onClose()
  }

  if (!currentPage) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-[90vw] max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6">
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
                title={t('back', 'Voltar')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 flex-1">
              <div className="w-2 h-6 sm:h-8 bg-[#3b82f6] rounded-full"></div>
              {t('title')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600 mt-2">
            {t('subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-[#3b82f6]" />
                <Label className="text-base font-semibold text-gray-900">{t('basicInfo')}</Label>
              </div>
              <div className="space-y-4 pl-7">
                <div>
                  <Label>{t('pageName')}</Label>
                  <Input
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    placeholder={t('pageNamePlaceholder')}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('pageNameDescription')}
                  </p>
                </div>
              </div>
            </div>

            {/* SEO Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-5 h-5 text-[#3b82f6]" />
                <Label className="text-base font-semibold text-gray-900">{t('seoSettings')}</Label>
              </div>
              <div className="space-y-4 pl-7">
                <div>
                  <Label>{t('metaTitle')}</Label>
                  <Input
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder={pageName || t('metaTitlePlaceholder')}
                    className="mt-2"
                    maxLength={60}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      {t('metaTitleDescription')}
                    </p>
                    <span className={`text-xs ${metaTitle.length > 60 ? 'text-red-600' : 'text-gray-400'}`}>
                      {metaTitle.length}/60
                    </span>
                  </div>
                </div>

                <div>
                  <Label>{t('metaDescription')}</Label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder={t('metaDescriptionPlaceholder')}
                    className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    rows={3}
                    maxLength={160}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      {t('metaDescriptionDescription')}
                    </p>
                    <span className={`text-xs ${metaDescription.length > 160 ? 'text-red-600' : 'text-gray-400'}`}>
                      {metaDescription.length}/160
                    </span>
                  </div>
                </div>

                <div>
                  <Label>{t('keywords')}</Label>
                  <Input
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    placeholder={t('keywordsPlaceholder')}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('keywordsDescription')}
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-[#3b82f6]" />
                <Label className="text-base font-semibold text-gray-900">{t('socialMedia')}</Label>
              </div>
              <div className="space-y-4 pl-7">
                <div>
                  <Label>{t('ogImage')}</Label>
                  <Input
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    placeholder={t('ogImagePlaceholder')}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('ogImageDescription')}
                  </p>
                </div>
              </div>
            </div>

            {/* Page Information */}
            <div className="pt-4 border-t">
              <Label className="text-sm font-semibold mb-2 block">{t('pageInfo')}</Label>
              <div className="space-y-2 text-sm text-gray-600">
                <div>{t('createdAt', { date: new Date(currentPage.createdAt).toLocaleDateString(typeof window !== 'undefined' && navigator.language ? navigator.language : 'pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) })}</div>
                <div>{t('lastUpdate', { date: new Date(currentPage.updatedAt).toLocaleDateString(typeof window !== 'undefined' && navigator.language ? navigator.language : 'pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) })}</div>
                <div className="font-mono text-xs">{t('pageId', { id: currentPage.id })}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t-2 border-[#3b82f6] flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold"
          >
            {t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


