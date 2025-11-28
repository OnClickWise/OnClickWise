"use client"

import * as React from "react"
import { LandingPage, Section, LandingPageElement } from "@/types/landing-page"
import { PublishedElementRenderer } from "./PublishedElementRenderer"
import { cn } from "@/lib/utils"

interface PublishedLandingPageRendererProps {
  page: LandingPage
  orgSlug?: string
}

function getSectionBackground(section: Section, theme: LandingPage['theme']): string | undefined {
  // Check for theme references
  if (section.styles?.backgroundGradient === 'USE_THEME_PRIMARY_GRADIENT') {
    return theme.colorPalette.primaryGradient || `linear-gradient(135deg, ${theme.colorPalette.primary} 0%, ${theme.colorPalette.secondary || theme.colorPalette.primary} 100%)`
  }
  if (section.styles?.backgroundGradient === 'USE_THEME_SECONDARY_GRADIENT') {
    return theme.colorPalette.secondaryGradient || `linear-gradient(135deg, ${theme.colorPalette.secondary} 0%, ${theme.colorPalette.primary} 100%)`
  }
  if (section.styles?.backgroundGradient === 'USE_THEME_BACKGROUND_GRADIENT') {
    if (theme.colorPalette.backgroundGradient) {
      return theme.colorPalette.backgroundGradient
    }
    const bg = theme.colorPalette.background
    return `linear-gradient(180deg, ${bg} 0%, ${bg}dd 100%)`
  }
  
  if (section.styles?.backgroundColor === 'USE_THEME_PRIMARY') {
    return theme.colorPalette.primaryGradient || theme.colorPalette.primary
  }
  if (section.styles?.backgroundColor === 'USE_THEME_SECONDARY') {
    return theme.colorPalette.secondaryGradient || theme.colorPalette.secondary
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
    return undefined // Will use backgroundColor style
  }
  
  // Use theme background gradient if available
  if (theme.colorPalette.backgroundGradient) {
    return theme.colorPalette.backgroundGradient
  }
  
  return undefined
}

function getTextColor(section: Section, theme: LandingPage['theme']): string {
  if (section.styles?.color && !section.styles.color.startsWith('USE_THEME_')) {
    return section.styles.color
  }
  
  if (section.styles?.color === 'USE_THEME_PRIMARY') {
    return theme.colorPalette.primary
  }
  if (section.styles?.color === 'USE_THEME_SECONDARY') {
    return theme.colorPalette.secondary
  }
  if (section.styles?.color === 'USE_THEME_TEXT') {
    return theme.colorPalette.text
  }
  if (section.styles?.color === 'USE_THEME_BACKGROUND') {
    return theme.colorPalette.background
  }
  
  const bg = getSectionBackground(section, theme)
  
  // For primary/secondary colored sections, use white text for contrast
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
    if (bg.includes(theme.colorPalette.primary) && 
        !bg.includes('#fff') && !bg.includes('#ffffff') && 
        !bg.includes('255, 255, 255')) {
      return '#ffffff'
    }
  }
  
  // Default to theme text color
  return theme.colorPalette.text
}

export function PublishedLandingPageRenderer({ page, orgSlug }: PublishedLandingPageRendererProps) {
  // Update document title and meta tags
  React.useEffect(() => {
    if (page.meta?.title) {
      document.title = page.meta.title
    }
    
    // Update or create meta description
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    if (page.meta?.description) {
      metaDesc.setAttribute('content', page.meta.description)
    }

    // Update or create meta keywords
    if (page.meta?.keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta')
        metaKeywords.setAttribute('name', 'keywords')
        document.head.appendChild(metaKeywords)
      }
      metaKeywords.setAttribute('content', page.meta.keywords)
    }

    // Update or create OG tags
    if (page.meta?.ogImage) {
      let ogImage = document.querySelector('meta[property="og:image"]')
      if (!ogImage) {
        ogImage = document.createElement('meta')
        ogImage.setAttribute('property', 'og:image')
        document.head.appendChild(ogImage)
      }
      ogImage.setAttribute('content', page.meta.ogImage)

      if (page.meta.title) {
        let ogTitle = document.querySelector('meta[property="og:title"]')
        if (!ogTitle) {
          ogTitle = document.createElement('meta')
          ogTitle.setAttribute('property', 'og:title')
          document.head.appendChild(ogTitle)
        }
        ogTitle.setAttribute('content', page.meta.title)
      }

      if (page.meta.description) {
        let ogDesc = document.querySelector('meta[property="og:description"]')
        if (!ogDesc) {
          ogDesc = document.createElement('meta')
          ogDesc.setAttribute('property', 'og:description')
          document.head.appendChild(ogDesc)
        }
        ogDesc.setAttribute('content', page.meta.description)
      }
    }
  }, [page.meta])

  const fontFamily = page.theme.fontFamily === 'inter' ? 'Inter, sans-serif' :
                     page.theme.fontFamily === 'poppins' ? 'Poppins, sans-serif' :
                     page.theme.fontFamily === 'roboto' ? 'Roboto, sans-serif' :
                     'system-ui, sans-serif'

  return (
    <div 
      className="min-h-screen w-full" 
      style={{ 
        backgroundColor: page.theme.colorPalette.background,
        color: page.theme.colorPalette.text,
        fontFamily
      }}
    >
      {/* Apply global theme styles */}
      <style>{`
        :root {
          --primary-color: ${page.theme.colorPalette.primary};
          --secondary-color: ${page.theme.colorPalette.secondary};
          --background-color: ${page.theme.colorPalette.background};
          --text-color: ${page.theme.colorPalette.text};
        }
        * {
          font-family: ${fontFamily};
        }
      `}</style>

      {/* Render all sections */}
      {page.sections.map((section) => {
        const sectionBackground = getSectionBackground(section, page.theme)
        const sectionTextColor = getTextColor(section, page.theme)
        
        const sectionStyles: React.CSSProperties = {
          ...section.styles,
          padding: section.styles?.padding || page.theme.globalSpacing.padding,
          margin: section.styles?.margin || page.theme.globalSpacing.margin,
          backgroundColor: (typeof sectionBackground === 'string' && sectionBackground.includes('gradient')) 
            ? undefined 
            : (section.styles?.backgroundColor?.startsWith('USE_THEME_') 
                ? undefined 
                : (section.styles?.backgroundColor || (page.theme.colorPalette.backgroundGradient ? undefined : page.theme.colorPalette.background))),
          background: sectionBackground,
          color: sectionTextColor,
        }

        return (
          <section
            key={section.id}
            className={cn(
              "relative overflow-x-hidden",
              section.type === 'header' && "sticky top-0 z-50",
              section.type === 'footer' && "mt-auto mb-0"
            )}
            style={sectionStyles}
          >
            <div className="w-full">
              {section.elements.map((element) => (
                <PublishedElementRenderer
                  key={element.id}
                  element={element}
                  theme={page.theme}
                  orgSlug={orgSlug}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
