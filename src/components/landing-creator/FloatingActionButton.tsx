"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { useLandingPageStore } from "@/stores/landing-page-store"
import { ViewMode } from "@/types/landing-page"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plus,
  Layout,
  Palette,
  Save,
  Undo,
  Redo,
  Settings,
  HelpCircle,
  X,
  Smartphone,
  Monitor,
  Layers,
  Sparkles,
  Link as LinkIcon,
  RotateCcw,
  Download,
  Send,
  Copy,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeCustomizer } from "./ThemeCustomizer"
import { PresetLoader } from "./PresetLoader"
import { PreviewLinkGenerator } from "./PreviewLinkGenerator"
import { SectionPresetSelector } from "./SectionPresetSelector"
import { HeaderFooterCustomizer } from "./HeaderFooterCustomizer"
import { HTMLExporter } from "./HTMLExporter"
import { GeneralSettings } from "./GeneralSettings"
import { HelpGuide } from "./HelpGuide"
import { LandingPageManager } from "./LandingPageManager"
import { useTranslations } from "next-intl"

interface FloatingActionButtonProps {
  viewMode: ViewMode
  onViewModeToggle: () => void
  onAddElement: () => void
  onAddSection: () => void
  onSave: () => void
  onPublish?: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  externalOpen?: boolean
  onExternalOpenChange?: (open: boolean) => void
}

export function FloatingActionButton({
  viewMode,
  onViewModeToggle,
  onAddElement,
  onAddSection,
  onSave,
  onPublish,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  externalOpen,
  onExternalOpenChange,
}: FloatingActionButtonProps) {
  const { resetPage, currentPage, isSaving, isPublishing, lastError, duplicatePage } = useLandingPageStore()
  const t = useTranslations('LandingPageCreator')
  const [showPageManager, setShowPageManager] = useState(false)
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen
  const setIsOpen = (open: boolean) => {
    if (externalOpen !== undefined && onExternalOpenChange) {
      onExternalOpenChange(open)
    } else {
      setInternalOpen(open)
    }
  }
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    // Set initial position, accounting for button size
    const buttonSize = 56 // w-14 = 56px
    const padding = 20
    setPosition({ 
      x: window.innerWidth - buttonSize - padding, 
      y: window.innerHeight - buttonSize - padding 
    })
    
    // Update position on window resize
    const handleResize = () => {
      const buttonSize = 56
      const padding = 20
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - buttonSize - padding),
        y: Math.min(prev.y, window.innerHeight - buttonSize - padding)
      }))
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const [isDragging, setIsDragging] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hasClickedOnce, setHasClickedOnce] = useState(false)
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false)
  const [showPresetLoader, setShowPresetLoader] = useState(false)
  const [showPreviewLink, setShowPreviewLink] = useState(false)
  const [showSectionPresets, setShowSectionPresets] = useState(false)
  const [showHeaderFooter, setShowHeaderFooter] = useState(false)
  const [showHTMLExport, setShowHTMLExport] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const mouseDownPosition = useRef<{ x: number; y: number } | null>(null)
  const touchStartPosition = useRef<{ x: number; y: number } | null>(null)
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Common drag start handler
  const startDrag = (clientX: number, clientY: number) => {
    mouseDownPosition.current = { x: clientX, y: clientY }
    touchStartPosition.current = { x: clientX, y: clientY }
    setIsDragging(true)
    setHasMoved(false)
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y,
    })
  }

  // Common drag move handler
  const handleDragMove = (clientX: number, clientY: number) => {
    const startPos = mouseDownPosition.current || touchStartPosition.current
    if (!startPos) return
    
    const deltaX = Math.abs(clientX - startPos.x)
    const deltaY = Math.abs(clientY - startPos.y)
    
    // Only consider it a drag if moved more than 10px
    if (deltaX > 10 || deltaY > 10) {
      setHasMoved(true)
      // Clear any pending click
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
        clickTimeoutRef.current = null
      }
    }
    
    // Only update position if we're actually dragging
    setPosition(prev => {
      const startPos = mouseDownPosition.current || touchStartPosition.current
      if (!startPos) return prev
      
      const deltaX = Math.abs(clientX - startPos.x)
      const deltaY = Math.abs(clientY - startPos.y)
      
      if (deltaX > 10 || deltaY > 10) {
        // Constrain position to viewport
        const buttonSize = 56 // w-14 = 56px
        const newX = Math.max(0, Math.min(window.innerWidth - buttonSize, clientX - dragStart.x))
        const newY = Math.max(0, Math.min(window.innerHeight - buttonSize, clientY - dragStart.y))
        
        return { x: newX, y: newY }
      }
      return prev
    })
  }

  // Common drag end handler
  const endDrag = () => {
    const wasDragging = isDragging
    const didMove = hasMoved
    setIsDragging(false)
    mouseDownPosition.current = null
    touchStartPosition.current = null
    
    // If we dragged, prevent click
    if (wasDragging && didMove) {
      // Don't trigger click
      setTimeout(() => setHasMoved(false), 200)
    } else {
      // Quick click without movement - allow click after a small delay
      setHasMoved(false)
    }
  }

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left mouse button
    e.preventDefault()
    startDrag(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: MouseEvent) => {
    handleDragMove(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    endDrag()
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    if (touch) {
      startDrag(touch.clientX, touch.clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    if (touch) {
      handleDragMove(touch.clientX, touch.clientY)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    endDrag()
  }

  useEffect(() => {
    if (isDragging) {
      const moveHandler = (e: MouseEvent) => handleMouseMove(e)
      const upHandler = () => handleMouseUp()
      
      window.addEventListener('mousemove', moveHandler)
      window.addEventListener('mouseup', upHandler)
      return () => {
        window.removeEventListener('mousemove', moveHandler)
        window.removeEventListener('mouseup', upHandler)
      }
    }
  }, [isDragging, dragStart, position, hasMoved])

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click if we just finished dragging
    if (hasMoved) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    e.preventDefault()
    e.stopPropagation()
    
    // Clear any pending timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
    }
    
    // Small delay to check if we actually dragged
    clickTimeoutRef.current = setTimeout(() => {
      if (!hasMoved && !isDragging) {
        setHasClickedOnce(true)
        setIsOpen(true)
      }
      clickTimeoutRef.current = null
    }, 100)
  }
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <div
        className="fixed z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {/* Tooltip - Only show if page is empty and never clicked */}
        {(() => {
          const isEmpty = currentPage && (
            currentPage.sections.length === 0 || 
            currentPage.sections.every(s => s.elements.length === 0)
          )
          return !isOpen && !hasClickedOnce && isEmpty
        })() && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-3 py-1.5 rounded shadow-lg pointer-events-none animate-pulse">
            {t('fab.tooltip')}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
        
        <button
          ref={buttonRef}
          className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-all",
            "bg-[#eab308] hover:bg-[#fbbf24] active:bg-[#f59e0b] text-white",
            "touch-none select-none", // Prevent text selection and default touch behaviors
            isDragging && "cursor-grabbing scale-110",
            !isDragging && "cursor-grab"
          )}
          style={{
            transform: isDragging ? 'scale(1.1)' : undefined,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
          aria-label={t('fab.ariaLabel')}
        >
          {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Plus className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-[90vw] max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6">
          <DialogHeader className="border-b-2 border-[#3b82f6] pb-3 sm:pb-4 mb-3 sm:mb-4 flex-shrink-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-6 sm:h-8 bg-[#3b82f6] rounded-full"></div>
              {t('menu.title')}
            </DialogTitle>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">{t('menu.subtitle')}</p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1 sm:pr-2">
            <div className="space-y-4 sm:space-y-6 pb-2">
              {/* CATEGORIA: Criar/Adicionar */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                  <div className="w-1 h-3 sm:h-4 bg-blue-500 rounded-full"></div>
                  {t('categories.create')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-3 h-auto py-6 border-2 border-[#3b82f6] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                    onClick={() => {
                      onAddElement()
                      // Don't close menu immediately - let ElementSelector handle it with back button
                    }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3b82f6] flex items-center justify-center">
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">{t('actions.addElement')}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">{t('actions.addElementDesc')}</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-3 h-auto py-6 border-2 border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                    onClick={() => {
                      setShowSectionPresets(true)
                      setIsOpen(false)
                    }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3b82f6] flex items-center justify-center">
                      <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">{t('actions.addSection')}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">{t('actions.addSectionDesc')}</span>
                  </Button>
                </div>
              </div>

              {/* CATEGORIA: Personalização */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                  <div className="w-1 h-3 sm:h-4 bg-yellow-500 rounded-full"></div>
                  {t('categories.customization')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 sm:gap-3 h-auto py-4 sm:py-6 border-2 border-gray-200 hover:border-[#eab308] hover:bg-yellow-50 transition-all shadow-sm hover:shadow-md"
                    onClick={() => {
                      setShowThemeCustomizer(true)
                      setIsOpen(false)
                    }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#eab308] flex items-center justify-center">
                      <Palette className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">{t('actions.changeTheme')}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">{t('actions.changeThemeDesc')}</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-3 h-auto py-6 border-2 border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                    onClick={() => {
                      setShowHeaderFooter(true)
                      setIsOpen(false)
                    }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3b82f6] flex items-center justify-center">
                      <Layout className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">{t('actions.headerFooter')}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">{t('actions.headerFooterDesc')}</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 sm:gap-3 h-auto py-4 sm:py-6 border-2 border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                    onClick={() => {
                      setShowPresetLoader(true)
                      setIsOpen(false)
                    }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3b82f6] flex items-center justify-center">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">{t('actions.loadTemplate')}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">{t('actions.loadTemplateDesc')}</span>
                  </Button>
                </div>
              </div>

              {/* CATEGORIA: Visualização */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                  <div className="w-1 h-3 sm:h-4 bg-purple-500 rounded-full"></div>
                  {t('categories.visualization')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 sm:gap-3 h-auto py-4 sm:py-6 border-2 border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                    onClick={() => {
                      onViewModeToggle()
                      setIsOpen(false)
                    }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3b82f6] flex items-center justify-center">
                      {viewMode === 'desktop' ? (
                        <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      ) : (
                        <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      )}
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">
                      {viewMode === 'desktop' ? t('actions.viewMobile') : t('actions.viewDesktop')}
                    </span>
                    <span className="text-xs text-gray-500 hidden sm:block">{t('actions.toggleViewDesc')}</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 sm:gap-3 h-auto py-4 sm:py-6 border-2 border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                    onClick={() => {
                      setShowPreviewLink(true)
                      setIsOpen(false)
                    }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3b82f6] flex items-center justify-center">
                      <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">{t('actions.previewLink')}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">{t('actions.previewLinkDesc')}</span>
                  </Button>
                </div>
              </div>

              {/* CATEGORIA: Gerenciamento */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                  <div className="w-1 h-3 sm:h-4 bg-green-500 rounded-full"></div>
                  {t('categories.management')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 sm:gap-3 h-auto py-4 sm:py-6 border-2 border-[#3b82f6] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              onClick={async () => {
                await onSave()
                setIsOpen(false)
              }}
              disabled={isSaving}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3b82f6] flex items-center justify-center">
                {isSaving ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                )}
              </div>
              <span className="font-semibold text-sm sm:text-base text-gray-900">
                {isSaving ? t('actions.saving') : t('actions.save')}
              </span>
              <span className="text-xs text-gray-500 hidden sm:block">{t('actions.saveDesc')}</span>
            </Button>

                  {onPublish && (
                    <Button
                      variant="outline"
                      className="flex flex-col items-center gap-2 sm:gap-3 h-auto py-4 sm:py-6 border-2 border-[#10b981] hover:bg-green-50 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                      onClick={async () => {
                        await onPublish()
                        setIsOpen(false)
                      }}
                      disabled={isPublishing || isSaving}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#10b981] flex items-center justify-center">
                        {isPublishing ? (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        )}
                      </div>
                      <span className="font-semibold text-sm sm:text-base text-gray-900">
                        {isPublishing ? t('actions.publishing') : t('actions.publish')}
                      </span>
                      <span className="text-xs text-gray-500 hidden sm:block">{t('actions.publishDesc')}</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 sm:gap-3 h-auto py-4 sm:py-6 border-2 border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                    onClick={() => {
                      setShowPageManager(true)
                      setIsOpen(false)
                    }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3b82f6] flex items-center justify-center">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">{t('actions.managePages')}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">{t('actions.managePagesDesc')}</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 sm:gap-3 h-auto py-4 sm:py-6 border-2 border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                    onClick={() => {
                      setShowDuplicateConfirm(true)
                      setIsOpen(false)
                    }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3b82f6] flex items-center justify-center">
                      <Copy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">{t('actions.duplicatePage')}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">{t('actions.duplicatePageDesc')}</span>
                  </Button>
                </div>
              </div>

              {/* CATEGORIA: Edição */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                  <div className="w-1 h-3 sm:h-4 bg-gray-500 rounded-full"></div>
                  {t('categories.editing')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 sm:gap-3 h-auto py-4 sm:py-6 border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      onUndo()
                      setIsOpen(false)
                    }}
                    disabled={!canUndo}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${canUndo ? 'bg-gray-600' : 'bg-gray-300'}`}>
                      <Undo className={`w-5 h-5 sm:w-6 sm:h-6 ${canUndo ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">{t('actions.undo')}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">{t('actions.undoDesc')}</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 sm:gap-3 h-auto py-4 sm:py-6 border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      onRedo()
                      setIsOpen(false)
                    }}
                    disabled={!canRedo}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${canRedo ? 'bg-gray-600' : 'bg-gray-300'}`}>
                      <Redo className={`w-5 h-5 sm:w-6 sm:h-6 ${canRedo ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">{t('actions.redo')}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">{t('actions.redoDesc')}</span>
                  </Button>
                </div>
              </div>

              {/* CATEGORIA: Exportar e Configurações */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                  <div className="w-1 h-3 sm:h-4 bg-indigo-500 rounded-full"></div>
                  {t('categories.export')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 sm:gap-3 h-auto py-4 sm:py-6 border-2 border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                    onClick={() => {
                      setShowHTMLExport(true)
                      setIsOpen(false)
                    }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3b82f6] flex items-center justify-center">
                      <Download className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">{t('actions.exportHTML')}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">{t('actions.exportHTMLDesc')}</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 sm:gap-3 h-auto py-4 sm:py-6 border-2 border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                    onClick={() => {
                      setShowSettings(true)
                      setIsOpen(false)
                    }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3b82f6] flex items-center justify-center">
                      <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">{t('actions.settings')}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">{t('actions.settingsDesc')}</span>
                  </Button>
                </div>
              </div>

              {/* CATEGORIA: Ajuda */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                  <div className="w-1 h-3 sm:h-4 bg-yellow-500 rounded-full"></div>
                  {t('categories.help')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 sm:gap-3 h-auto py-4 sm:py-6 border-2 border-gray-200 hover:border-[#eab308] hover:bg-yellow-50 transition-all shadow-sm hover:shadow-md"
                    onClick={() => {
                      setShowHelp(true)
                      setIsOpen(false)
                    }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#eab308] flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">{t('actions.help')}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">{t('actions.helpDesc')}</span>
                  </Button>
                </div>
              </div>

              {/* CATEGORIA: Ações Destrutivas */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                  <div className="w-1 h-3 sm:h-4 bg-red-500 rounded-full"></div>
                  {t('categories.destructive')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 sm:gap-3 h-auto py-4 sm:py-6 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all shadow-sm hover:shadow-md"
                    onClick={() => {
                      if (confirm(t('resetConfirm.message'))) {
                        resetPage()
                        setIsOpen(false)
                      }
                    }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500 flex items-center justify-center">
                      <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-gray-900">{t('actions.resetPage')}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">{t('actions.resetPageDesc')}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ThemeCustomizer 
        open={showThemeCustomizer} 
        onClose={() => setShowThemeCustomizer(false)}
        onBack={() => {
          setShowThemeCustomizer(false)
          setIsOpen(true)
        }}
      />
      <PresetLoader 
        open={showPresetLoader} 
        onClose={() => setShowPresetLoader(false)}
        onBack={() => {
          setShowPresetLoader(false)
          setIsOpen(true)
        }}
      />
      <PreviewLinkGenerator 
        open={showPreviewLink} 
        onClose={() => setShowPreviewLink(false)}
        onBack={() => {
          setShowPreviewLink(false)
          setIsOpen(true)
        }}
      />
      <SectionPresetSelector 
        open={showSectionPresets} 
        onClose={() => setShowSectionPresets(false)}
        onBack={() => {
          setShowSectionPresets(false)
          setIsOpen(true)
        }}
      />
      <HeaderFooterCustomizer 
        open={showHeaderFooter} 
        onClose={() => setShowHeaderFooter(false)}
        onBack={() => {
          setShowHeaderFooter(false)
          setIsOpen(true)
        }}
      />
      <HTMLExporter 
        open={showHTMLExport} 
        onClose={() => setShowHTMLExport(false)}
        onBack={() => {
          setShowHTMLExport(false)
          setIsOpen(true)
        }}
      />
      <GeneralSettings 
        open={showSettings} 
        onClose={() => setShowSettings(false)}
        onBack={() => {
          setShowSettings(false)
          setIsOpen(true)
        }}
      />
      <HelpGuide 
        open={showHelp} 
        onClose={() => setShowHelp(false)}
        onBack={() => {
          setShowHelp(false)
          setIsOpen(true)
        }}
      />
      <LandingPageManager 
        open={showPageManager} 
        onClose={() => setShowPageManager(false)}
        onBack={() => {
          setShowPageManager(false)
          setIsOpen(true)
        }}
      />
      
      {/* Duplicate confirmation dialog */}
      <Dialog open={showDuplicateConfirm} onOpenChange={setShowDuplicateConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('duplicateConfirm.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {t('duplicateConfirm.message')}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDuplicateConfirm(false)}>
                {t('duplicateConfirm.cancel')}
              </Button>
              <Button
                onClick={async () => {
                  const result = await duplicatePage()
                  if (result.success) {
                    setShowDuplicateConfirm(false)
                  } else {
                    alert(result.error || t('error.duplicateError'))
                  }
                }}
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
              >
                {t('duplicateConfirm.confirm')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error notification */}
      {lastError && (
        <div className="fixed top-4 right-4 bg-red-50 border-2 border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="font-semibold text-red-800">{t('error.title')}</p>
              <p className="text-sm text-red-600 mt-1">{lastError}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => useLandingPageStore.setState({ lastError: null })}
              className="h-6 w-6 text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

