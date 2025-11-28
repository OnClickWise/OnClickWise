"use client"

import * as React from "react"
import { Section, LandingPageElement, LandingPage } from "@/types/landing-page"
import { ElementRenderer } from "./ElementRenderer"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface SectionRendererProps {
  section: Section
  theme: LandingPage['theme']
  selectedElementId: string | null
  onElementSelect: (elementId: string | null) => void
  onElementUpdate: (element: LandingPageElement) => void
  onElementMove?: (sectionId: string, elementId: string, newIndex: number) => void
  onElementDelete?: (elementId: string) => void
  onSectionDelete?: (sectionId: string) => void
}

export function SectionRenderer({
  section,
  theme,
  selectedElementId,
  onElementSelect,
  onElementUpdate,
  onElementMove,
  onElementDelete,
  onSectionDelete,
}: SectionRendererProps) {
  const t = useTranslations('LandingPageCreator')
  const [draggedOverIndex, setDraggedOverIndex] = React.useState<number | null>(null)
  const dragTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    
    // Clear any existing timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
      dragTimeoutRef.current = null
    }
    
    // Only update if different to avoid unnecessary re-renders
    if (draggedOverIndex !== index) {
      console.log('[SectionRenderer] Drag over index:', index, 'section:', section.id)
      setDraggedOverIndex(index)
    }
  }

  const handleDragLeave = (e: React.DragEvent | null) => {
    // Handle case where event might be null or undefined
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Clear the dragged over index after a small delay to prevent flickering
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }
    
    dragTimeoutRef.current = setTimeout(() => {
      setDraggedOverIndex(null)
      dragTimeoutRef.current = null
    }, 50)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    console.log('[SectionRenderer] Drop event at index:', dropIndex, 'section:', section.id)
    e.preventDefault()
    e.stopPropagation()
    
    // Clear any pending timeouts
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
      dragTimeoutRef.current = null
    }
    
    // Immediately clear the dragged over index
    setDraggedOverIndex(null)
    
    // Try to get element ID from dataTransfer
    let draggedElementId = e.dataTransfer.getData('text/plain')
    console.log('[SectionRenderer] DataTransfer text/plain:', draggedElementId)
    
    // Fallback: try to get from JSON
    if (!draggedElementId) {
      try {
        const jsonData = e.dataTransfer.getData('application/json')
        console.log('[SectionRenderer] DataTransfer application/json:', jsonData)
        if (jsonData) {
          const data = JSON.parse(jsonData)
          draggedElementId = data.elementId
          console.log('[SectionRenderer] Parsed elementId from JSON:', draggedElementId)
        }
      } catch (err) {
        console.error('[SectionRenderer] Failed to parse drag data:', err)
      }
    }
    
    // Try HTML format as last resort
    if (!draggedElementId) {
      draggedElementId = e.dataTransfer.getData('text/html')
      console.log('[SectionRenderer] DataTransfer text/html:', draggedElementId)
    }
    
    console.log('[SectionRenderer] Final draggedElementId:', draggedElementId)
    console.log('[SectionRenderer] onElementMove available:', !!onElementMove)
    
    if (draggedElementId && onElementMove) {
      // Find current index of dragged element in this section
      const currentIndex = section.elements.findIndex(el => el.id === draggedElementId)
      console.log('[SectionRenderer] Current index of element:', currentIndex, 'dropIndex:', dropIndex)
      
      // Pass dropIndex directly to store - let the store handle the index adjustment
      // The store will correctly adjust for same-section moves
      console.log('[SectionRenderer] Calling onElementMove with:', {
        sectionId: section.id,
        elementId: draggedElementId,
        newIndex: dropIndex
      })
      
      // Only move if the index actually changed (for same section) or if moving to different section
      if (currentIndex === -1 || currentIndex !== dropIndex) {
        onElementMove(section.id, draggedElementId, dropIndex)
      } else {
        console.log('[SectionRenderer] Move skipped - no change needed (same position)')
      }
    } else {
      console.warn('[SectionRenderer] Drop failed - missing elementId or onElementMove', {
        draggedElementId,
        hasOnElementMove: !!onElementMove
      })
    }
  }
  
  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current)
      }
    }
  }, [])
  // Apply theme colors to section styles dynamically
  const getSectionBackground = () => {
    // Check for special theme markers first
    if (section.styles?.backgroundGradient === 'USE_THEME_PRIMARY_GRADIENT') {
      return theme.colorPalette.primaryGradient || `linear-gradient(135deg, ${theme.colorPalette.primary} 0%, ${theme.colorPalette.secondary || theme.colorPalette.primary} 100%)`
    }
    if (section.styles?.backgroundGradient === 'USE_THEME_SECONDARY_GRADIENT') {
      return theme.colorPalette.secondaryGradient || `linear-gradient(135deg, ${theme.colorPalette.secondary} 0%, ${theme.colorPalette.primary} 100%)`
    }
    if (section.styles?.backgroundGradient === 'USE_THEME_BACKGROUND_GRADIENT') {
      // Create subtle gradient from background if not set
      if (theme.colorPalette.backgroundGradient) {
        return theme.colorPalette.backgroundGradient
      }
      // Create subtle gradient from background color
      const bg = theme.colorPalette.background
      return `linear-gradient(180deg, ${bg} 0%, ${bg}dd 100%)`
    }
    if (section.styles?.backgroundColor === 'USE_THEME_PRIMARY') {
      return theme.colorPalette.primaryGradient || theme.colorPalette.primary
    }
    if (section.styles?.backgroundColor === 'USE_THEME_SECONDARY') {
      return theme.colorPalette.secondaryGradient || theme.colorPalette.secondary
    }
    if (section.styles?.backgroundColor === 'USE_THEME_TEXT') {
      return theme.colorPalette.text
    }
    if (section.styles?.backgroundColor === 'USE_THEME_BACKGROUND') {
      return theme.colorPalette.backgroundGradient || theme.colorPalette.background
    }
    
    // Priority: section gradient > section color > theme gradient > theme color
    if (section.styles?.backgroundGradient && 
        !section.styles.backgroundGradient.startsWith('USE_THEME_')) {
      return section.styles.backgroundGradient
    }
    if (section.styles?.backgroundColor && 
        !section.styles.backgroundColor.startsWith('USE_THEME_')) {
      return section.styles.backgroundColor
    }
    // Use theme background gradient if available
    if (theme.colorPalette.backgroundGradient) {
      return theme.colorPalette.backgroundGradient
    }
    return theme.colorPalette.background
  }

  // Determine text color based on background for contrast
  const getTextColor = () => {
    // If section has explicit color and it's not a theme marker, use it
    if (section.styles?.color && !section.styles.color.startsWith('USE_THEME_')) {
      return section.styles.color
    }
    
    // Check for theme color markers
    if (section.styles?.color === 'USE_THEME_TEXT') {
      return theme.colorPalette.text
    }
    if (section.styles?.color === 'USE_THEME_BACKGROUND') {
      return theme.colorPalette.background
    }
    
    // For primary/secondary colored sections, use white text for contrast
    const bg = getSectionBackground()
    if (section.styles?.backgroundColor === 'USE_THEME_PRIMARY' || 
        section.styles?.backgroundGradient === 'USE_THEME_PRIMARY_GRADIENT' ||
        section.styles?.backgroundColor === 'USE_THEME_SECONDARY' ||
        section.styles?.backgroundGradient === 'USE_THEME_SECONDARY_GRADIENT') {
      return '#ffffff'
    }
    
    // For text-colored sections (dark), use light text
    if (section.styles?.backgroundColor === 'USE_THEME_TEXT') {
      return theme.colorPalette.background
    }
    
    // Smart contrast detection for gradients
    if (typeof bg === 'string' && bg.includes('gradient')) {
      // If gradient uses primary color, likely dark, use white text
      if (bg.includes(theme.colorPalette.primary) && 
          !bg.includes('#fff') && !bg.includes('#ffffff') && 
          !bg.includes('255, 255, 255')) {
        return '#ffffff'
      }
    }
    
    // Default to theme text color
    return theme.colorPalette.text
  }

  const sectionBackground = getSectionBackground()
  const sectionTextColor = getTextColor()
  
  const sectionStyles: React.CSSProperties = {
    ...section.styles,
    padding: section.styles?.padding || theme.globalSpacing.padding,
    margin: section.styles?.margin || theme.globalSpacing.margin,
    // Only set backgroundColor if it's not a gradient
    backgroundColor: (typeof sectionBackground === 'string' && sectionBackground.includes('gradient')) 
      ? undefined 
      : (section.styles?.backgroundColor?.startsWith('USE_THEME_') 
          ? undefined 
          : (section.styles?.backgroundColor || (theme.colorPalette.backgroundGradient ? undefined : theme.colorPalette.background))),
    background: sectionBackground,
    color: sectionTextColor,
  }

  return (
    <section
      className={cn(
        "relative border-r-4 border-transparent hover:border-primary/30 transition-colors overflow-x-hidden",
        section.type === 'header' && "sticky top-0 z-50",
        section.type === 'footer' && "mt-auto mb-0"
      )}
      style={sectionStyles}
      onClick={(e) => {
        // Clicking on section background deselects element
        if (e.target === e.currentTarget) {
          onElementSelect(null)
        }
      }}
    >
      {section.elements.length === 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDragOver(e, 0)
          }}
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDragOver(e, 0)
          }}
          onDragLeave={(e) => {
            if (e) {
              e.preventDefault()
              e.stopPropagation()
            }
            handleDragLeave(e)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDrop(e, 0)
          }}
          className={cn(
            "py-8 px-4 text-center border-2 border-dashed rounded-lg m-4 transition-all cursor-pointer relative group",
            draggedOverIndex === 0 
              ? "border-primary bg-primary/10" 
              : "border-gray-300"
          )}
          style={{
            pointerEvents: 'auto'
          }}
        >
          <p className="text-sm text-muted-foreground">Empty section</p>
          <p className="text-xs text-muted-foreground mt-1">Click the FAB button to add elements</p>
          {onSectionDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(t('deleteSectionConfirm'))) {
                  onSectionDelete(section.id)
                }
              }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-md hover:bg-red-100 text-red-600 hover:text-red-700 cursor-pointer"
              style={{ cursor: 'pointer' }}
              title="Remover seção vazia"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
      {section.elements.map((element, index) => (
        <React.Fragment key={element.id}>
          {/* Drop zone before element */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDragOver(e, index)
            }}
            onDragEnter={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDragOver(e, index)
            }}
            onDragLeave={(e) => {
              if (e) {
                e.preventDefault()
                e.stopPropagation()
              }
              handleDragLeave(e)
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDrop(e, index)
            }}
            className={cn(
              "relative transition-all min-h-[40px] -mx-4 px-4 cursor-pointer",
              draggedOverIndex === index && "min-h-[60px] border-t-2 border-primary border-dashed bg-primary/10"
            )}
            style={{
              pointerEvents: 'auto'
            }}
          />
          {/* Element */}
          <div className="relative" style={{ overflow: 'visible', width: '100%', maxWidth: '100%', marginRight: '0', paddingRight: '0' }}>
            <ElementRenderer
              element={element}
              theme={theme}
              isSelected={element.id === selectedElementId}
              onSelect={() => onElementSelect(element.id)}
              onUpdate={onElementUpdate}
              onDelete={onElementDelete ? () => onElementDelete(element.id) : undefined}
            />
          </div>
        </React.Fragment>
      ))}
      
      {/* Drop zone for adding to end of section */}
      {section.elements.length > 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDragOver(e, section.elements.length)
          }}
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDragOver(e, section.elements.length)
          }}
          onDragLeave={(e) => {
            if (e) {
              e.preventDefault()
              e.stopPropagation()
            }
            handleDragLeave(e)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDrop(e, section.elements.length)
          }}
          className={cn(
            "relative min-h-[40px] transition-all -mx-4 px-4 cursor-pointer",
            draggedOverIndex === section.elements.length && "min-h-[60px] border-t-2 border-primary border-dashed bg-primary/10"
          )}
          style={{
            pointerEvents: 'auto'
          }}
        />
      )}
    </section>
  )
}

