"use client"

import { create } from 'zustand'
import { LandingPage, Section, LandingPageElement, ViewMode, ColorPalette, FontFamily } from "@/types/landing-page"
import { createDefaultPage, createPresetPage } from "@/lib/landing-page-presets"
import { getApiBaseUrl } from "@/lib/api"

interface HistoryState {
  pages: LandingPage[]
  currentIndex: number
}

interface LandingPageStore {
  currentPage: LandingPage | null
  currentOrg: string | null
  currentPageId: string | null // ID da página no backend
  viewMode: ViewMode
  history: HistoryState
  isLoading: boolean
  isSaving: boolean
  isPublishing: boolean
  lastError: string | null
  setViewMode: (mode: ViewMode) => void
  setPage: (page: LandingPage) => void
  setCurrentPageId: (id: string | null) => void
  addSection: (section: Section) => void
  updateSection: (sectionId: string, updates: Partial<Section>) => void
  deleteSection: (sectionId: string) => void
  addElement: (sectionId: string, element: LandingPageElement) => void
  updateElement: (element: LandingPageElement) => void
  deleteElement: (elementId: string) => void
  moveElement: (elementId: string, newSectionId: string, newIndex: number) => void
  updateTheme: (updates: Partial<LandingPage['theme']>) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  savePage: () => Promise<{ success: boolean; error?: string; pageId?: string }>
  savePageManual: (slot: 1 | 2 | 3) => Promise<{ success: boolean; error?: string; pageId?: string }>
  publishPage: () => Promise<{ success: boolean; error?: string }>
  loadPageFromBackend: (pageId: string) => Promise<{ success: boolean; error?: string }>
  loadPage: (pageId: string) => void
  resetPage: () => void
  loadPreset: (presetName: string, translations?: any, companyInfo?: { companyName?: string; companyLogo?: string }) => void
  initializeForOrg: (org: string) => void
  duplicatePage: () => Promise<{ success: boolean; error?: string; pageId?: string }>
}

const MAX_HISTORY = 50

function createHistoryState(page: LandingPage): HistoryState {
  return {
    pages: [JSON.parse(JSON.stringify(page))],
    currentIndex: 0,
  }
}

function addToHistory(history: HistoryState, page: LandingPage): HistoryState {
  const newPages = [...history.pages.slice(0, history.currentIndex + 1), JSON.parse(JSON.stringify(page))]
  
  // Limit history size
  let finalPages = newPages
  let finalIndex = newPages.length - 1
  
  if (newPages.length > MAX_HISTORY) {
    finalPages = newPages.slice(-MAX_HISTORY)
    finalIndex = MAX_HISTORY - 1
  }

  return {
    pages: finalPages,
    currentIndex: finalIndex,
  }
}

export const useLandingPageStore = create<LandingPageStore>((set, get) => {
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  }

  return {
    currentPage: null,
    currentOrg: null,
    currentPageId: null,
    viewMode: 'desktop',
    history: { pages: [], currentIndex: 0 },
    isLoading: false,
    isSaving: false,
    isPublishing: false,
    lastError: null,

    setViewMode: (mode) => set({ viewMode: mode }),

    setCurrentPageId: (id) => set({ currentPageId: id }),

    setPage: (page) => {
      const { currentOrg } = get()
      const history = addToHistory(get().history, page)
      set({ 
        currentPage: page, 
        history,
        canUndo: history.currentIndex > 0,
        canRedo: false,
      })
      
      // Auto-save when page is set
      if (currentOrg) {
        try {
          localStorage.setItem(`landing-page-${currentOrg}-${page.id}`, JSON.stringify(page))
          localStorage.setItem(`landing-page-${currentOrg}-default`, JSON.stringify(page))
        } catch (error) {
          console.error('Failed to auto-save page:', error)
        }
      }
    },

    addSection: (section) => {
      const currentPage = get().currentPage
      if (!currentPage) return

      // Smart positioning: header goes first, footer goes last, others go before footer
      let newSections: Section[]
      if (section.type === 'header') {
        // Header always goes first
        newSections = [section, ...currentPage.sections]
      } else if (section.type === 'footer') {
        // Footer always goes last
        newSections = [...currentPage.sections, section]
      } else {
        // Other sections go before any existing footer
        const footerIndex = currentPage.sections.findIndex(s => s.type === 'footer')
        if (footerIndex >= 0) {
          newSections = [
            ...currentPage.sections.slice(0, footerIndex),
            section,
            ...currentPage.sections.slice(footerIndex)
          ]
        } else {
          newSections = [...currentPage.sections, section]
        }
      }

      const updatedPage = {
        ...currentPage,
        sections: newSections,
        updatedAt: new Date().toISOString(),
      }

      const history = addToHistory(get().history, updatedPage)
      set({
        currentPage: updatedPage,
        history,
        canUndo: history.currentIndex > 0,
        canRedo: false,
      })
    },

    updateSection: (sectionId, updates) => {
      const currentPage = get().currentPage
      if (!currentPage) return

      const updatedPage = {
        ...currentPage,
        sections: currentPage.sections.map(s =>
          s.id === sectionId ? { ...s, ...updates } : s
        ),
        updatedAt: new Date().toISOString(),
      }

      const history = addToHistory(get().history, updatedPage)
      set({
        currentPage: updatedPage,
        history,
        canUndo: history.currentIndex > 0,
        canRedo: false,
      })
    },

    deleteSection: (sectionId) => {
      const currentPage = get().currentPage
      if (!currentPage) return

      const updatedPage = {
        ...currentPage,
        sections: currentPage.sections.filter(s => s.id !== sectionId),
        updatedAt: new Date().toISOString(),
      }

      const history = addToHistory(get().history, updatedPage)
      set({
        currentPage: updatedPage,
        history,
        canUndo: history.currentIndex > 0,
        canRedo: false,
      })
    },

    addElement: (sectionId, element) => {
      const currentPage = get().currentPage
      if (!currentPage) return

      const updatedPage = {
        ...currentPage,
        sections: currentPage.sections.map(s =>
          s.id === sectionId
            ? { ...s, elements: [...s.elements, element] }
            : s
        ),
        updatedAt: new Date().toISOString(),
      }

      const history = addToHistory(get().history, updatedPage)
      set({
        currentPage: updatedPage,
        history,
        canUndo: history.currentIndex > 0,
        canRedo: false,
      })
    },

    updateElement: (element) => {
      const currentPage = get().currentPage
      if (!currentPage) return

      const updatedPage = {
        ...currentPage,
        sections: currentPage.sections.map(section => ({
          ...section,
          elements: section.elements.map(e =>
            e.id === element.id ? element : e
          ),
        })),
        updatedAt: new Date().toISOString(),
      }

      const history = addToHistory(get().history, updatedPage)
      set({
        currentPage: updatedPage,
        history,
        canUndo: history.currentIndex > 0,
        canRedo: false,
      })
    },

    deleteElement: (elementId) => {
      const currentPage = get().currentPage
      if (!currentPage) return

      const updatedPage = {
        ...currentPage,
        sections: currentPage.sections.map(section => ({
          ...section,
          elements: section.elements.filter(e => e.id !== elementId),
        })),
        updatedAt: new Date().toISOString(),
      }

      const history = addToHistory(get().history, updatedPage)
      set({
        currentPage: updatedPage,
        history,
        canUndo: history.currentIndex > 0,
        canRedo: false,
      })
    },

    moveElement: (elementId, newSectionId, newIndex) => {
      console.log('[Store] moveElement called:', { elementId, newSectionId, newIndex })
      const currentPage = get().currentPage
      if (!currentPage) {
        console.warn('[Store] No current page')
        return
      }

      // Find the section containing the element and the target section
      let elementToMove: LandingPageElement | null = null
      let sourceSectionId: string | null = null
      let sourceIndex: number = -1

      // Find element in current sections
      for (const section of currentPage.sections) {
        const index = section.elements.findIndex(e => e.id === elementId)
        if (index !== -1) {
          elementToMove = section.elements[index]
          sourceSectionId = section.id
          sourceIndex = index
          break
        }
      }

      console.log('[Store] Found element:', {
        elementToMove: !!elementToMove,
        sourceSectionId,
        sourceIndex
      })

      if (!elementToMove || !sourceSectionId) {
        console.warn('[Store] Element not found')
        return
      }

      // If moving within the same section, handle reordering
      if (sourceSectionId === newSectionId) {
        console.log('[Store] Moving within same section')
        const section = currentPage.sections.find(s => s.id === newSectionId)
        if (section) {
          const newElements = [...section.elements]
          
          // If moving to the same position, do nothing
          if (sourceIndex === newIndex) {
            console.log('[Store] Same position, no move needed')
            return
          }
          
          // Remove from old position
          newElements.splice(sourceIndex, 1)
          console.log('[Store] Removed from index:', sourceIndex, 'newElements length:', newElements.length)
          
          // Adjust target index if needed
          // If dragging forward (sourceIndex < newIndex), the target index decreases by 1
          // because we removed an element before it
          let adjustedIndex = newIndex
          if (sourceIndex < newIndex) {
            adjustedIndex = newIndex - 1
          }
          // If dragging backward (sourceIndex > newIndex), the target index stays the same
          
          console.log('[Store] Adjusted index:', adjustedIndex, 'from newIndex:', newIndex, 'sourceIndex:', sourceIndex)
          
          // Ensure adjustedIndex is within bounds
          adjustedIndex = Math.max(0, Math.min(adjustedIndex, newElements.length))
          
          // Insert at new position
          newElements.splice(adjustedIndex, 0, elementToMove)
          console.log('[Store] Inserted at index:', adjustedIndex, 'final length:', newElements.length)

          const updatedPage = {
            ...currentPage,
            sections: currentPage.sections.map(s =>
              s.id === newSectionId ? { ...s, elements: newElements } : s
            ),
            updatedAt: new Date().toISOString(),
          }

          const history = addToHistory(get().history, updatedPage)
          set({
            currentPage: updatedPage,
            history,
            canUndo: history.currentIndex > 0,
            canRedo: false,
          })
          console.log('[Store] Move completed successfully')
        }
      } else {
        console.log('[Store] Moving to different section')
        // Moving to different section
        const sectionsWithoutElement = currentPage.sections.map(section => ({
          ...section,
          elements: section.elements.filter(e => e.id !== elementId),
        }))

        const updatedPage = {
          ...currentPage,
          sections: sectionsWithoutElement.map(section => {
            if (section.id === newSectionId) {
              const newElements = [...section.elements]
              const insertIndex = Math.max(0, Math.min(newIndex, newElements.length))
              newElements.splice(insertIndex, 0, elementToMove!)
              console.log('[Store] Inserted in new section at index:', insertIndex)
              return { ...section, elements: newElements }
            }
            return section
          }),
          updatedAt: new Date().toISOString(),
        }

        const history = addToHistory(get().history, updatedPage)
        set({
          currentPage: updatedPage,
          history,
          canUndo: history.currentIndex > 0,
          canRedo: false,
        })
        console.log('[Store] Move to different section completed')
      }
    },

    updateTheme: (updates) => {
      const currentPage = get().currentPage
      if (!currentPage) return

      const updatedPage = {
        ...currentPage,
        theme: { ...currentPage.theme, ...updates },
        updatedAt: new Date().toISOString(),
      }

      const history = addToHistory(get().history, updatedPage)
      set({
        currentPage: updatedPage,
        history,
        canUndo: history.currentIndex > 0,
        canRedo: false,
      })
    },

    undo: () => {
      const { history } = get()
      if (history.currentIndex > 0) {
        const newIndex = history.currentIndex - 1
        set({
          currentPage: JSON.parse(JSON.stringify(history.pages[newIndex])),
          history: { ...history, currentIndex: newIndex },
          canUndo: newIndex > 0,
          canRedo: true,
        })
      }
    },

    redo: () => {
      const { history } = get()
      if (history.currentIndex < history.pages.length - 1) {
        const newIndex = history.currentIndex + 1
        set({
          currentPage: JSON.parse(JSON.stringify(history.pages[newIndex])),
          history: { ...history, currentIndex: newIndex },
          canUndo: true,
          canRedo: newIndex < history.pages.length - 1,
        })
      }
    },

    canUndo: false,
    canRedo: false,

    savePage: async () => {
      const { currentPage, currentOrg, currentPageId } = get()
      if (!currentPage || !currentOrg) {
        return { success: false, error: 'Nenhuma página ou organização definida' }
      }

      const token = getAuthToken()
      if (!token) {
        // Fallback to localStorage if no token
        try {
          const key = `landing-page-${currentOrg}-${currentPage.id}`
          localStorage.setItem(key, JSON.stringify(currentPage))
          localStorage.setItem(`landing-page-${currentOrg}-default`, JSON.stringify(currentPage))
          return { success: true }
        } catch (error) {
          return { success: false, error: 'Erro ao salvar no localStorage' }
        }
      }

      set({ isSaving: true, lastError: null })

      try {
        const API_BASE_URL = getApiBaseUrl()
        const pageName = currentPage.name || `Landing Page ${new Date().toLocaleDateString()}`

        let response
        if (currentPageId) {
          // Update existing page
          response = await fetch(`${API_BASE_URL}/landing-pages`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: currentPageId,
              name: pageName,
              content: currentPage
            })
          })
        } else {
          // Create new page
          response = await fetch(`${API_BASE_URL}/landing-pages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: pageName,
              content: currentPage,
              save_type: 'auto' // Sempre salvar como automático no histórico
            })
          })
        }

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Erro ao salvar página')
        }

        // Update currentPageId if it's a new page
        if (data.landing_page && !currentPageId) {
          set({ currentPageId: data.landing_page.id })
        }

        // Also save to localStorage as backup
        try {
          const key = `landing-page-${currentOrg}-${currentPage.id}`
          localStorage.setItem(key, JSON.stringify(currentPage))
          localStorage.setItem(`landing-page-${currentOrg}-default`, JSON.stringify(currentPage))
        } catch (localError) {
          console.warn('Failed to save to localStorage:', localError)
        }

        set({ isSaving: false })
        return { success: true, pageId: data.landing_page?.id || currentPageId }
      } catch (error: any) {
        console.error('Failed to save page:', error)
        set({ isSaving: false, lastError: error.message || 'Erro ao salvar página' })
        return { success: false, error: error.message || 'Erro ao salvar página' }
      }
    },

    savePageManual: async (slot: 1 | 2 | 3) => {
      const { currentPage, currentOrg } = get()
      if (!currentPage || !currentOrg) {
        return { success: false, error: 'Nenhuma página ou organização definida' }
      }

      const token = getAuthToken()
      if (!token) {
        return { success: false, error: 'Token de autenticação não encontrado' }
      }

      set({ isSaving: true, lastError: null })

      try {
        const API_BASE_URL = getApiBaseUrl()
        const pageName = currentPage.name || `Landing Page Manual ${slot}`

        // Sempre criar/atualizar como manual no slot especificado
        const response = await fetch(`${API_BASE_URL}/landing-pages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: pageName,
            content: currentPage,
            save_type: 'manual',
            save_slot: slot
          })
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Erro ao salvar página manual')
        }

        set({ isSaving: false })
        return { success: true, pageId: data.landing_page?.id }
      } catch (error: any) {
        console.error('Failed to save manual page:', error)
        set({ isSaving: false, lastError: error.message || 'Erro ao salvar página manual' })
        return { success: false, error: error.message || 'Erro ao salvar página manual' }
      }
    },

    publishPage: async () => {
      const { currentPage, currentOrg, currentPageId, savePage } = get()
      if (!currentPage || !currentOrg) {
        return { success: false, error: 'Nenhuma página ou organização definida' }
      }

      const token = getAuthToken()
      if (!token) {
        return { success: false, error: 'Token de autenticação não encontrado' }
      }

      // First save the page
      const saveResult = await savePage()
      if (!saveResult.success) {
        return saveResult
      }

      const pageId = saveResult.pageId || currentPageId
      if (!pageId) {
        return { success: false, error: 'ID da página não encontrado' }
      }

      set({ isPublishing: true, lastError: null })

      try {
        const API_BASE_URL = getApiBaseUrl()
        const response = await fetch(`${API_BASE_URL}/landing-pages/save-and-publish`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: pageId,
            name: currentPage.name || `Landing Page ${new Date().toLocaleDateString()}`,
            content: currentPage
          })
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Erro ao publicar página')
        }

        console.log('Page published successfully:', {
          pageId,
          published: data.landing_page?.is_published,
          publishedAt: data.landing_page?.published_at
        })

        set({ isPublishing: false, currentPageId: pageId })
        return { success: true }
      } catch (error: any) {
        console.error('Failed to publish page:', error)
        set({ isPublishing: false, lastError: error.message || 'Erro ao publicar página' })
        return { success: false, error: error.message || 'Erro ao publicar página' }
      }
    },

    loadPageFromBackend: async (pageId: string) => {
      const { currentOrg } = get()
      if (!currentOrg) {
        return { success: false, error: 'Nenhuma organização definida' }
      }

      const token = getAuthToken()
      if (!token) {
        return { success: false, error: 'Token de autenticação não encontrado' }
      }

      set({ isLoading: true, lastError: null })

      try {
        const API_BASE_URL = getApiBaseUrl()
        const response = await fetch(`${API_BASE_URL}/landing-pages/${pageId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        const data = await response.json()

        if (!response.ok || !data.success || !data.landing_page) {
          throw new Error(data.error || 'Erro ao carregar página')
        }

        const page = data.landing_page.content as LandingPage
        const history = createHistoryState(page)
        
        set({ 
          currentPage: page, 
          currentPageId: pageId,
          history,
          isLoading: false 
        })

        // Also save to localStorage as backup
        try {
          localStorage.setItem(`landing-page-${currentOrg}-${pageId}`, JSON.stringify(page))
          localStorage.setItem(`landing-page-${currentOrg}-default`, JSON.stringify(page))
        } catch (localError) {
          console.warn('Failed to save to localStorage:', localError)
        }

        return { success: true }
      } catch (error: any) {
        console.error('Failed to load page:', error)
        set({ isLoading: false, lastError: error.message || 'Erro ao carregar página' })
        return { success: false, error: error.message || 'Erro ao carregar página' }
      }
    },

    duplicatePage: async () => {
      const { currentPage, currentOrg, savePage } = get()
      if (!currentPage || !currentOrg) {
        return { success: false, error: 'Nenhuma página para duplicar' }
      }

      // Create a copy of the current page with new ID
      const duplicatedPage: LandingPage = {
        ...currentPage,
        id: Math.random().toString(36).slice(2, 10),
        name: `${currentPage.name} (Cópia)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Set the duplicated page as current
      const history = createHistoryState(duplicatedPage)
      set({ 
        currentPage: duplicatedPage, 
        currentPageId: null, // Reset ID so it creates a new page
        history 
      })

      // Save the duplicated page
      const saveResult = await savePage()
      return saveResult
    },

    loadPage: (pageId) => {
      const { currentOrg } = get()
      if (!currentOrg) return
      
      try {
        const key = `landing-page-${currentOrg}-${pageId}`
        const saved = localStorage.getItem(key)
        if (saved) {
          const page = JSON.parse(saved) as LandingPage
          const history = createHistoryState(page)
          set({ currentPage: page, history })
        }
      } catch (error) {
        console.error('Failed to load page:', error)
      }
    },

    resetPage: () => {
      const { currentOrg } = get()
      const defaultPage = createDefaultPage()
      const history = createHistoryState(defaultPage)
      set({ currentPage: defaultPage, history })
      
      // Save the reset page
      if (currentOrg) {
        try {
          localStorage.setItem(`landing-page-${currentOrg}-${defaultPage.id}`, JSON.stringify(defaultPage))
          localStorage.setItem(`landing-page-${currentOrg}-default`, JSON.stringify(defaultPage))
        } catch (error) {
          console.error('Failed to save reset page:', error)
        }
      }
    },

    loadPreset: (presetName, translations, companyInfo) => {
      const { currentOrg } = get()
      const presetPage = createPresetPage(presetName, translations, companyInfo)
      if (presetPage && currentOrg) {
        const history = createHistoryState(presetPage)
        set({ currentPage: presetPage, history })
        
        // Save the preset page
        try {
          localStorage.setItem(`landing-page-${currentOrg}-${presetPage.id}`, JSON.stringify(presetPage))
          localStorage.setItem(`landing-page-${currentOrg}-default`, JSON.stringify(presetPage))
        } catch (error) {
          console.error('Failed to save preset page:', error)
        }
      }
    },

    initializeForOrg: (org: string) => {
      const { currentOrg } = get()
      
      // If already initialized for this org, don't reload
      if (currentOrg === org && get().currentPage) {
        return
      }

      // Try to load saved page for this org
      try {
        const saved = localStorage.getItem(`landing-page-${org}-default`)
        if (saved) {
          const page = JSON.parse(saved) as LandingPage
          const history = createHistoryState(page)
          set({ currentPage: page, currentOrg: org, history })
          return
        }
      } catch (error) {
        console.error('Failed to load saved page for org:', error)
      }

      // If no saved page, create default
      const defaultPage = createDefaultPage()
      const history = createHistoryState(defaultPage)
      set({ currentPage: defaultPage, currentOrg: org, history })
      
      // Save the default page
      try {
        localStorage.setItem(`landing-page-${org}-${defaultPage.id}`, JSON.stringify(defaultPage))
        localStorage.setItem(`landing-page-${org}-default`, JSON.stringify(defaultPage))
      } catch (error) {
        console.error('Failed to save default page:', error)
      }
    },
  }
})

