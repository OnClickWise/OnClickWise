"use client"

import * as React from "react"
import { LandingPage, LandingPageElement, ViewMode } from "@/types/landing-page"
import { ElementRenderer } from "./ElementRenderer"
import { SectionRenderer } from "./SectionRenderer"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface CanvasProps {
  page: LandingPage
  viewMode: ViewMode
  selectedElementId: string | null
  onElementSelect: (elementId: string | null) => void
  onElementUpdate: (element: LandingPageElement) => void
  onElementMove?: (sectionId: string, elementId: string, newIndex: number) => void
  onElementDelete?: (elementId: string) => void
  onSectionDelete?: (sectionId: string) => void
}

export function Canvas({
  page,
  viewMode,
  selectedElementId,
  onElementSelect,
  onElementUpdate,
  onElementMove,
  onElementDelete,
  onSectionDelete,
}: CanvasProps) {
  const t = useTranslations('LandingPageCreator.canvas')
  const containerClass = cn(
    "h-full w-full overflow-auto overflow-x-hidden bg-gray-50",
    viewMode === 'mobile' && "max-w-md mx-auto border-x border-gray-200"
  )

  const contentClass = cn(
    viewMode === 'mobile' && "bg-white"
  )

  return (
    <div className={containerClass}>
      {/* Editor Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-2 sm:px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs sm:text-sm text-muted-foreground">{t('editorMode')}</span>
        </div>
        <div className="text-xs text-muted-foreground hidden sm:block">
          {t('hint')}
        </div>
      </div>
      
      <div className={contentClass} style={{
        fontFamily: `var(--font-${page.theme.fontFamily})`,
        backgroundColor: page.theme.colorPalette.backgroundGradient ? undefined : page.theme.colorPalette.background,
        background: page.theme.colorPalette.backgroundGradient || page.theme.colorPalette.background,
        color: page.theme.colorPalette.text,
        minHeight: 'auto',
      }}>
        {page.sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            theme={page.theme}
            selectedElementId={selectedElementId}
            onElementSelect={onElementSelect}
            onElementUpdate={onElementUpdate}
            onElementMove={onElementMove ? (sectionId, elementId, newIndex) => {
              onElementMove(sectionId, elementId, newIndex)
            } : undefined}
            onElementDelete={onElementDelete}
            onSectionDelete={onSectionDelete}
          />
        ))}
      </div>
    </div>
  )
}

