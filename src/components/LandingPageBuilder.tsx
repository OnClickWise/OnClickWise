"use client"

import * as React from "react"
import { useState, useCallback, useEffect } from "react"
import { LandingPage, Section, LandingPageElement, ViewMode, ColorPalette, FontFamily } from "@/types/landing-page"
import { FloatingActionButton } from "./landing-creator/FloatingActionButton"
import { Canvas } from "./landing-creator/Canvas"
import { ElementPanel } from "./landing-creator/ElementPanel"
import { ElementSelector } from "./landing-creator/ElementSelector"
import { useLandingPageStore } from "@/stores/landing-page-store"
import { ElementType } from "@/types/landing-page"

const DEFAULT_COLOR_PALETTE: ColorPalette = {
  primary: "#3b82f6", // Blue
  secondary: "#eab308", // Yellow
  background: "#ffffff",
  text: "#000000",
}

export function LandingPageBuilder({ org }: { org: string }) {
  const {
    currentPage,
    viewMode,
    setViewMode,
    addSection,
    updateSection,
    deleteSection,
    addElement,
    updateElement,
    deleteElement,
    moveElement,
    undo,
    redo,
    canUndo,
    canRedo,
    savePage,
    publishPage,
    initializeForOrg,
  } = useLandingPageStore()

  // Initialize store for this organization
  React.useEffect(() => {
    if (org) {
      initializeForOrg(org)
    }
  }, [org, initializeForOrg])

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [showElementPanel, setShowElementPanel] = useState(false)
  const [showElementSelector, setShowElementSelector] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [fabMenuOpen, setFabMenuOpen] = useState(false)

  // Auto-save to localStorage on changes (debounced) - not to backend
  useEffect(() => {
    if (currentPage && org) {
      const timeoutId = setTimeout(() => {
        // Only save to localStorage for auto-save, not to backend
        try {
          const key = `landing-page-${org}-${currentPage.id}`
          localStorage.setItem(key, JSON.stringify(currentPage))
          localStorage.setItem(`landing-page-${org}-default`, JSON.stringify(currentPage))
        } catch (error) {
          console.error('Failed to auto-save to localStorage:', error)
        }
      }, 2000) // Debounce auto-save to 2 seconds

      return () => clearTimeout(timeoutId)
    }
  }, [currentPage, org])

  const handleElementSelect = useCallback((elementId: string | null) => {
    setSelectedElementId(elementId)
    setShowElementPanel(elementId !== null)
  }, [])

  const handleElementUpdate = useCallback((element: LandingPageElement) => {
    updateElement(element)
  }, [updateElement])

  const handleAddElement = useCallback((elementType: ElementType) => {
    const sectionId = selectedSectionId || currentPage?.sections[0]?.id
    if (!sectionId) return

    const id = Math.random().toString(36).slice(2, 10)
    let newElement: LandingPageElement
    
    switch (elementType) {
      case 'title':
        newElement = { id, type: 'title', content: 'New Title', level: 1 }
        break
      case 'subtitle':
        newElement = { id, type: 'subtitle', content: 'New Subtitle', level: 2 }
        break
      case 'paragraph':
        newElement = { id, type: 'paragraph', content: 'New paragraph text' }
        break
      case 'image':
        newElement = { id, type: 'image', src: '', alt: 'Image' }
        break
      case 'video':
        newElement = { id, type: 'video', src: '' }
        break
      case 'button':
        newElement = { id, type: 'button', text: 'Button', variant: 'primary' }
        break
      case 'countdown':
        newElement = {
          id,
          type: 'countdown',
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
        break
      case 'form':
        newElement = {
          id,
          type: 'form',
          fields: [
            { id: Math.random().toString(36).slice(2, 10), type: 'text', label: 'Name', required: true },
            { id: Math.random().toString(36).slice(2, 10), type: 'email', label: 'Email', required: true },
          ],
          submitText: 'Submit',
        }
        break
      case 'highlight':
        newElement = { id, type: 'highlight', content: 'Highlight text', variant: 'info' }
        break
      case 'icon-list':
        newElement = {
          id,
          type: 'icon-list',
          items: [
            { id: Math.random().toString(36).slice(2, 10), text: 'Item 1' },
            { id: Math.random().toString(36).slice(2, 10), text: 'Item 2' },
          ],
          columns: 2,
        }
        break
      case 'divider':
        newElement = { id, type: 'divider', variant: 'solid' }
        break
      case 'testimonial':
        newElement = {
          id,
          type: 'testimonial',
          testimonials: [
            {
              id: Math.random().toString(36).slice(2, 10),
              name: 'John Doe',
              content: 'Great product!',
              rating: 5,
            },
          ],
          layout: 'cards',
        }
        break
      case 'faq':
        newElement = {
          id,
          type: 'faq',
          items: [
            {
              id: Math.random().toString(36).slice(2, 10),
              question: 'Question?',
              answer: 'Answer here.',
            },
          ],
        }
        break
      case 'container':
        newElement = { id, type: 'container', children: [] }
        break
      case 'columns':
        newElement = { id, type: 'columns', children: [], columns: 2 }
        break
      default:
        newElement = { id, type: 'paragraph', content: 'New element' }
    }
    
    addElement(sectionId, newElement)
  }, [selectedSectionId, currentPage, addElement])

  const selectedElement = currentPage?.sections
    .flatMap(s => s.elements)
    .find(e => e.id === selectedElementId) || null

  if (!currentPage) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show empty state if no sections
  const isEmpty = currentPage.sections.length === 0 || 
    currentPage.sections.every(s => s.elements.length === 0)

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      {isEmpty ? (
        <div className="h-full w-full flex items-center justify-center bg-white">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-2">Página em branco</p>
            <p className="text-sm text-muted-foreground">Use o botão + no canto inferior direito para começar</p>
          </div>
        </div>
      ) : (
        <Canvas
          page={currentPage}
          viewMode={viewMode}
          selectedElementId={selectedElementId}
          onElementSelect={handleElementSelect}
          onElementUpdate={handleElementUpdate}
          onElementMove={(sectionId, elementId, newIndex) => {
            moveElement(elementId, sectionId, newIndex)
          }}
          onElementDelete={(elementId) => {
            deleteElement(elementId)
            setSelectedElementId(null)
            setShowElementPanel(false)
          }}
          onSectionDelete={(sectionId) => {
            deleteSection(sectionId)
          }}
        />
      )}
      
      {showElementPanel && selectedElement && (
        <ElementPanel
          element={selectedElement}
          onUpdate={handleElementUpdate}
          onClose={() => {
            setShowElementPanel(false)
            setSelectedElementId(null)
          }}
          onDelete={() => {
            if (selectedElementId) {
              deleteElement(selectedElementId)
              setShowElementPanel(false)
              setSelectedElementId(null)
            }
          }}
        />
      )}

      {showElementSelector && selectedSectionId && (
        <ElementSelector
          open={showElementSelector}
          onClose={() => {
            setShowElementSelector(false)
            setSelectedSectionId(null)
          }}
          onSelect={handleAddElement}
          sectionId={selectedSectionId}
          onBack={() => {
            // Close element selector and reopen FAB menu
            setShowElementSelector(false)
            setSelectedSectionId(null)
            setFabMenuOpen(true)
          }}
        />
      )}

      <FloatingActionButton
        viewMode={viewMode}
        onViewModeToggle={() => setViewMode(viewMode === 'desktop' ? 'mobile' : 'desktop')}
        onAddElement={() => {
          // Close FAB menu first
          setFabMenuOpen(false)
          // Then open element selector
          setShowElementSelector(true)
          // Default to first section
          if (currentPage?.sections[0]) {
            setSelectedSectionId(currentPage.sections[0].id)
          }
        }}
        externalOpen={fabMenuOpen}
        onExternalOpenChange={setFabMenuOpen}
        onAddSection={() => {
          addSection({
            id: `section-${Date.now()}`,
            type: 'content',
            elements: [],
          })
        }}
        onSave={savePage}
        onPublish={publishPage}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>
  )
}

