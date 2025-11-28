"use client"

import * as React from "react"
import { LandingPageElement, LandingPage, FormField } from "@/types/landing-page"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

function PhoneInput({ field, ...props }: { field: FormField; [key: string]: any }) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, home, end, arrow keys
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ]
    // Allow Ctrl/Cmd + A, C, V, X, Z
    if (e.ctrlKey || e.metaKey) {
      if (['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) {
        return
      }
    }
    // If it's an allowed key, let it through
    if (allowedKeys.includes(e.key)) {
      return
    }
    // Check if the key is a number or allowed character
    if (!/[0-9\s\-\(\)\+]/.test(e.key)) {
      e.preventDefault()
    }
  }
  
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    // Remove all non-numeric characters except spaces, dashes, parentheses, and plus
    const cleaned = input.value.replace(/[^0-9\s\-\(\)\+]/g, '')
    if (input.value !== cleaned) {
      const cursorPos = input.selectionStart || 0
      input.value = cleaned
      // Restore cursor position
      setTimeout(() => {
        const newPos = Math.min(cursorPos, cleaned.length)
        input.setSelectionRange(newPos, newPos)
      }, 0)
    }
  }
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    // Remove all non-numeric characters except spaces, dashes, parentheses, and plus
    const cleaned = pastedText.replace(/[^0-9\s\-\(\)\+]/g, '')
    const input = e.currentTarget
    const start = input.selectionStart || 0
    const end = input.selectionEnd || 0
    const value = input.value
    const newValue = value.substring(0, start) + cleaned + value.substring(end)
    input.value = newValue
    // Trigger input event to update form data
    const inputEvent = new Event('input', { bubbles: true })
    input.dispatchEvent(inputEvent)
    // Set cursor position
    setTimeout(() => {
      input.setSelectionRange(start + cleaned.length, start + cleaned.length)
    }, 0)
  }
  
  return (
    <input
      {...props}
      ref={inputRef}
      type="tel"
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      onPaste={handlePaste}
      pattern="[0-9\s\-\(\)\+]*"
      inputMode="tel"
    />
  )
}
import { GripVertical } from "lucide-react"

interface ElementRendererProps {
  element: LandingPageElement
  theme: LandingPage['theme']
  isSelected: boolean
  onSelect: () => void
  onUpdate: (element: LandingPageElement) => void
  onDelete?: () => void
}

export function ElementRenderer({
  element,
  theme,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: ElementRendererProps) {
  const t = useTranslations('LandingPageCreator')
  const [isDragging, setIsDragging] = React.useState(false)
  const [isDragHandleActive, setIsDragHandleActive] = React.useState(false)
  const dragRef = React.useRef<HTMLDivElement>(null)
  const mouseDownRef = React.useRef<{ x: number; y: number; time: number } | null>(null)

  const handleClick = (e: React.MouseEvent) => {
    // Don't select if we just finished dragging
    if (isDragHandleActive) {
      setIsDragHandleActive(false)
      return
    }
    e.stopPropagation()
    onSelect()
  }

  const baseStyles: React.CSSProperties = {
    position: 'relative',
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Track mouse down position and time for drag detection
    mouseDownRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    }
    setIsDragHandleActive(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseDownRef.current) {
      const deltaX = Math.abs(e.clientX - mouseDownRef.current.x)
      const deltaY = Math.abs(e.clientY - mouseDownRef.current.y)
      // If moved more than 5px, it's a drag
      if (deltaX > 5 || deltaY > 5) {
        setIsDragHandleActive(true)
      }
    }
  }

  const handleMouseUp = () => {
    mouseDownRef.current = null
    // Small delay to prevent click after drag
    setTimeout(() => {
      if (isDragHandleActive) {
        setIsDragHandleActive(false)
      }
    }, 100)
  }

  const handleDragStart = (e: React.DragEvent) => {
    console.log('[ElementRenderer] Drag start:', element.id, element.type)
    e.stopPropagation()
    setIsDragging(true)
    setIsDragHandleActive(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
    
    // Set data in multiple formats for compatibility
    e.dataTransfer.setData('text/plain', element.id)
    e.dataTransfer.setData('application/json', JSON.stringify({ elementId: element.id }))
    e.dataTransfer.setData('text/html', element.id) // Additional format
    
    console.log('[ElementRenderer] DataTransfer data set:', {
      text: e.dataTransfer.getData('text/plain'),
      json: e.dataTransfer.getData('application/json')
    })
    
    // Create a simple drag image
    const dragImage = document.createElement('div')
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    dragImage.style.opacity = '0.5'
    dragImage.style.padding = '8px'
    dragImage.style.background = 'rgba(59, 130, 246, 0.2)'
    dragImage.style.border = '2px dashed rgba(59, 130, 246, 0.5)'
    dragImage.style.borderRadius = '4px'
    dragImage.textContent = t('draggingElement')
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage)
      }
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('[ElementRenderer] Drag end:', element.id)
    e.stopPropagation()
    setIsDragging(false)
    // Reset after a short delay
    setTimeout(() => {
      setIsDragHandleActive(false)
    }, 200)
  }

  return (
    <div
      className={cn(
        "relative group transition-all",
        isDragging && "opacity-50"
      )}
      style={baseStyles}
      onClick={handleClick}
    >
      {/* Content wrapper with ring/border - excludes drag handle */}
      <div 
        className={cn(
          "relative",
          isSelected && "ring-2 ring-primary ring-offset-2 rounded",
          !isSelected && "hover:ring-1 hover:ring-primary/50 hover:ring-offset-1 rounded"
        )}
        style={{
          textAlign: element.styles?.textAlign || 'inherit',
          width: '100%',
          maxWidth: '100%',
          marginRight: '0',
          paddingRight: '0',
          boxSizing: 'border-box',
          ...(element.styles?.backgroundGradient 
            ? { background: element.styles.backgroundGradient }
            : element.styles?.backgroundColor 
            ? { backgroundColor: element.styles.backgroundColor }
            : {}
          ),
          padding: element.styles?.padding,
          borderRadius: element.styles?.borderRadius,
        }}
      >
        {renderElementContent(element, theme, onUpdate)}
      </div>
      
      {/* Drag Handle - On the right side, outside the ring, positioned absolutely */}
      <div 
        ref={dragRef}
        draggable={true}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="absolute top-0 bottom-0 flex items-center z-30 cursor-grab active:cursor-grabbing"
        onClick={(e) => {
          e.stopPropagation()
          // Prevent click if it was a drag
          if (isDragHandleActive) {
            e.preventDefault()
          }
        }}
        style={{ 
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          pointerEvents: 'auto', // Ensure it can receive events
          width: '2.5rem', // w-10 equivalent
          right: '-3rem' // Position further outside to avoid affecting layout
        }}
      >
        <div className={cn(
          "bg-primary text-white p-2 rounded shadow-lg transition-all select-none",
          isSelected || isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          "hover:bg-primary/90",
          isDragging && "opacity-100 scale-110",
          isDragHandleActive && "opacity-100"
        )}>
          <GripVertical className="w-4 h-4 pointer-events-none" />
        </div>
      </div>
      
      {/* Right side indicator bar */}
      {!isSelected && (
        <div className="absolute right-10 top-0 bottom-0 w-1 bg-transparent group-hover:bg-primary/30 transition-colors pointer-events-none"></div>
      )}
      
      {/* Tooltip on hover */}
      {!isSelected && !isDragging && (
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute top-1 right-14 bg-primary/90 text-white text-xs px-2 py-1 rounded shadow whitespace-nowrap z-30">
            Clique para editar • Arraste pela direita
          </div>
        </div>
      )}
    </div>
  )
}

function renderElementContent(
  element: LandingPageElement,
  theme: LandingPage['theme'],
  onUpdate: (element: LandingPageElement) => void
) {
  switch (element.type) {
    case 'title':
    case 'subtitle':
      const TitleTag = `h${element.level || 1}` as keyof JSX.IntrinsicElements
      // Resolve theme color markers
      let titleColor = element.styles?.color || 'inherit'
      if (titleColor === 'USE_THEME_TEXT') {
        titleColor = theme.colorPalette.text
      } else if (titleColor === 'USE_THEME_PRIMARY') {
        titleColor = theme.colorPalette.primary
      } else if (titleColor === 'USE_THEME_SECONDARY') {
        titleColor = theme.colorPalette.secondary
      } else if (titleColor === 'USE_THEME_BACKGROUND') {
        titleColor = theme.colorPalette.background
      }
      return (
        <TitleTag
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            onUpdate({ ...element, content: e.currentTarget.textContent || '' })
          }}
          style={{
            color: titleColor,
            fontSize: element.styles?.fontSize,
            fontWeight: element.styles?.fontWeight,
            textAlign: element.styles?.textAlign || 'inherit',
            width: '100%',
            margin: element.styles?.margin || '0',
          }}
        >
          {element.content}
        </TitleTag>
      )

    case 'paragraph':
      // Resolve theme color markers
      let paragraphColor = element.styles?.color || 'inherit'
      if (paragraphColor === 'USE_THEME_TEXT') {
        // Use text color with reduced opacity for muted effect
        paragraphColor = theme.colorPalette.text
      } else if (paragraphColor === 'USE_THEME_PRIMARY') {
        paragraphColor = theme.colorPalette.primary
      } else if (paragraphColor === 'USE_THEME_SECONDARY') {
        paragraphColor = theme.colorPalette.secondary
      } else if (paragraphColor === 'USE_THEME_BACKGROUND') {
        paragraphColor = theme.colorPalette.background
      } else if (paragraphColor && paragraphColor !== 'inherit' && !paragraphColor.startsWith('USE_THEME_') && !paragraphColor.startsWith('#')) {
        // If it's a valid color but not a theme marker, use as is
      }
      return (
        <p
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            onUpdate({ ...element, content: e.currentTarget.textContent || '' })
          }}
          style={{
            color: paragraphColor,
            fontSize: element.styles?.fontSize,
            textAlign: element.styles?.textAlign || 'inherit',
            width: '100%',
            margin: element.styles?.margin || '0',
          }}
        >
          {element.content}
        </p>
      )

    case 'image':
      // Don't render image if src is empty or undefined
      if (!element.src || element.src.trim() === '') {
        return (
          <div
            style={{
              width: element.styles?.width || element.width || '100%',
              height: element.styles?.height || element.height || '200px',
              minHeight: element.styles?.minHeight || '200px',
              border: '2px dashed #ccc',
              borderRadius: element.styles?.borderRadius || '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f9fafb',
              color: '#6b7280',
            }}
          >
            <span>No image URL provided</span>
          </div>
        )
      }
      return (
        <img
          src={element.src}
          alt={element.alt || ''}
          style={{
            width: element.styles?.width || element.width || '100%',
            height: element.styles?.height || element.height || 'auto',
            maxWidth: element.styles?.maxWidth,
            maxHeight: element.styles?.maxHeight,
            minWidth: element.styles?.minWidth,
            minHeight: element.styles?.minHeight,
            borderRadius: element.styles?.borderRadius,
            objectFit: 'contain',
          }}
        />
      )

    case 'video':
      // Don't render video if src is empty or undefined
      if (!element.src || element.src.trim() === '') {
        return (
          <div
            style={{
              width: element.styles?.width || '100%',
              height: element.styles?.height || '300px',
              minHeight: element.styles?.minHeight || '300px',
              border: '2px dashed #ccc',
              borderRadius: element.styles?.borderRadius || '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f9fafb',
              color: '#6b7280',
            }}
          >
            <span>No video URL provided</span>
          </div>
        )
      }
      return (
        <video
          src={element.src}
          autoPlay={element.autoplay}
          controls={element.controls !== false}
          style={{
            width: element.styles?.width || '100%',
            height: element.styles?.height || 'auto',
            maxWidth: element.styles?.maxWidth,
            maxHeight: element.styles?.maxHeight,
            minWidth: element.styles?.minWidth,
            minHeight: element.styles?.minHeight,
            borderRadius: element.styles?.borderRadius,
          }}
        />
      )

    case 'button':
      // Determine display and margin based on textAlign
      const buttonTextAlign = element.styles?.textAlign || 'center'
      const shouldCenter = buttonTextAlign === 'center'
      
      // Extract styles that should not override our layout
      const { display: elementDisplay, margin: elementMargin, textAlign: elementTextAlign, width: elementWidth, ...otherButtonStyles } = element.styles || {}
      
      // Respect the element's display if explicitly set, otherwise use appropriate default
      // If element has inline-block, keep it but ensure parent centers it
      const buttonDisplay = elementDisplay || (shouldCenter ? 'inline-block' : 'inline-block')
      
      // Parse margin to extract vertical margin and handle horizontal margins correctly
      let buttonMargin = '0'
      if (elementMargin) {
        // If margin is set, parse it
        const marginParts = elementMargin.split(' ').map(p => p.trim())
        if (shouldCenter) {
          // For centered buttons, preserve only vertical margins, set horizontal to auto
          if (marginParts.length === 4) {
            // margin: top right bottom left
            buttonMargin = `${marginParts[0]} auto ${marginParts[2]} auto`
          } else if (marginParts.length === 2) {
            // margin: vertical horizontal
            buttonMargin = `${marginParts[0]} auto`
          } else if (marginParts.length === 1) {
            // margin: all
            // Extract vertical value and use auto for horizontal
            buttonMargin = `${marginParts[0]} auto`
          } else {
            buttonMargin = elementMargin
          }
        } else {
          // For non-centered buttons, use margin as-is
          buttonMargin = elementMargin
        }
      } else {
        // Default margin for centered buttons
        buttonMargin = shouldCenter ? '0 auto' : '0'
      }
      
      return (
        <div style={{ 
          textAlign: shouldCenter ? 'center' : buttonTextAlign,
          width: '100%',
          display: 'block',
          margin: '0',
          padding: '0',
          boxSizing: 'border-box',
        }}>
          <button
            className={cn(
              "px-6 py-3 rounded-md font-medium transition-colors cursor-pointer",
              element.variant === 'primary' && "bg-primary text-white hover:opacity-90",
              element.variant === 'secondary' && "bg-secondary text-white hover:opacity-90",
              element.variant === 'outline' && "border-2 border-primary text-primary hover:bg-primary hover:text-white"
            )}
            style={{
              backgroundColor: element.variant === 'primary' ? theme.colorPalette.primary : undefined,
              color: element.variant === 'primary' ? '#ffffff' : theme.colorPalette.primary,
              textAlign: 'center', // Text inside button is always centered
              display: buttonDisplay,
              margin: buttonMargin,
              width: elementWidth || 'auto',
              boxSizing: 'border-box',
              cursor: 'pointer',
              ...otherButtonStyles,
            }}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              onUpdate({ ...element, text: e.currentTarget.textContent || '' })
            }}
          >
            {element.text}
          </button>
        </div>
      )

    case 'divider':
      return (
        <hr
          style={{
            borderStyle: element.variant || 'solid',
            borderColor: theme.colorPalette.text,
            opacity: 0.2,
          }}
        />
      )

    case 'highlight':
      // Apply custom background if specified, otherwise use variant colors
      const highlightStyle: React.CSSProperties = {}
      if (element.styles?.backgroundGradient) {
        highlightStyle.background = element.styles.backgroundGradient
      } else if (element.styles?.backgroundColor) {
        highlightStyle.backgroundColor = element.styles.backgroundColor
      }
      
      const hasCustomBackground = element.styles?.backgroundGradient || element.styles?.backgroundColor
      
      return (
        <div
          className={cn(
            "p-4 rounded-lg",
            !hasCustomBackground && element.variant === 'info' && "bg-blue-100 text-blue-800",
            !hasCustomBackground && element.variant === 'success' && "bg-green-100 text-green-800",
            !hasCustomBackground && element.variant === 'warning' && "bg-yellow-100 text-yellow-800",
            !hasCustomBackground && element.variant === 'error' && "bg-red-100 text-red-800"
          )}
          style={highlightStyle}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            onUpdate({ ...element, content: e.currentTarget.textContent || '' })
          }}
        >
          {element.content}
        </div>
      )

    case 'form':
      // Get max width from element styles, default to 500px for modern compact design
      const formMaxWidth = element.styles?.maxWidth || '500px'
      
      return (
        <div style={{ 
          maxWidth: formMaxWidth, 
          margin: '0 auto',
          width: '100%'
        }}>
          <form 
            className="space-y-4"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            {element.fields.map((field) => (
              <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label 
                  className="text-sm font-medium"
                  style={{ 
                    color: 'rgba(0, 0, 0, 0.8)',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  {field.label}
                  {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    className="w-full"
                    placeholder={field.placeholder}
                    required={field.required}
                    contentEditable
                    suppressContentEditableWarning
                    style={{
                      padding: '0.75rem 1rem',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '0.5rem',
                      fontSize: '0.9375rem',
                      fontFamily: 'inherit',
                      backgroundColor: '#ffffff',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: '100px'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.colorPalette.primary
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colorPalette.primary}20`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                ) : field.type === 'select' ? (
                  <select
                    className="w-full"
                    required={field.required}
                    style={{
                      padding: '0.75rem 1rem',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '0.5rem',
                      fontSize: '0.9375rem',
                      fontFamily: 'inherit',
                      backgroundColor: '#ffffff',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.colorPalette.primary
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colorPalette.primary}20`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {field.options?.map((opt, index) => (
                      <option key={`${field.id}-option-${index}`} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'tel' ? (
                  <PhoneInput
                    field={field}
                    className="w-full"
                    placeholder={field.placeholder}
                    required={field.required}
                    style={{
                      padding: '0.75rem 1rem',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '0.5rem',
                      fontSize: '0.9375rem',
                      fontFamily: 'inherit',
                      backgroundColor: '#ffffff',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.colorPalette.primary
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colorPalette.primary}20`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                ) : (
                  <input
                    type={field.type}
                    className="w-full"
                    placeholder={field.placeholder}
                    required={field.required}
                    contentEditable
                    suppressContentEditableWarning
                    style={{
                      padding: '0.75rem 1rem',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '0.5rem',
                      fontSize: '0.9375rem',
                      fontFamily: 'inherit',
                      backgroundColor: '#ffffff',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.colorPalette.primary
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colorPalette.primary}20`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              className="w-full"
              style={{ 
                backgroundColor: theme.colorPalette.primary, 
                color: '#ffffff',
                padding: '0.875rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.9375rem',
                fontWeight: '600',
                fontFamily: 'inherit',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginTop: '0.5rem',
                boxShadow: `0 2px 8px ${theme.colorPalette.primary}30`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.95'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = `0 4px 12px ${theme.colorPalette.primary}40`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = `0 2px 8px ${theme.colorPalette.primary}30`
              }}
            >
              {element.submitText || 'Submit'}
            </button>
          </form>
        </div>
      )

    case 'icon-list':
      return (
        <div
          className={cn(
            "grid gap-6",
            element.columns === 1 && "grid-cols-1",
            element.columns === 2 && "grid-cols-1 md:grid-cols-2",
            element.columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {element.items.map((item) => (
            <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 text-2xl mt-1">
                {item.icon || '•'}
              </div>
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const updatedItems = element.items.map(i =>
                    i.id === item.id ? { ...i, text: e.currentTarget.textContent || '' } : i
                  )
                  onUpdate({ ...element, items: updatedItems })
                }}
                className="text-gray-700 leading-relaxed"
                style={{ fontSize: '1rem', lineHeight: '1.6' }}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )

    case 'testimonial':
      const isCardsLayout = element.layout === 'cards'
      return (
        <div className={cn(
          "w-full",
          isCardsLayout && "grid gap-6",
          isCardsLayout && element.testimonials.length === 1 && "grid-cols-1",
          isCardsLayout && element.testimonials.length === 2 && "grid-cols-1 md:grid-cols-2",
          isCardsLayout && element.testimonials.length >= 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          !isCardsLayout && "space-y-6"
        )}>
          {element.testimonials.map((testimonial) => (
            <div 
              key={testimonial.id} 
              className={cn(
                "p-6 rounded-xl border transition-all hover:shadow-lg",
                isCardsLayout && "bg-white border-gray-200",
                !isCardsLayout && "bg-gray-50 border-gray-100"
              )}
            >
              {testimonial.rating && (
                <div className="mb-3 text-yellow-400 text-lg">
                  {'★'.repeat(testimonial.rating)}{'☆'.repeat(5 - testimonial.rating)}
                </div>
              )}
              <p className="text-gray-700 mb-4 leading-relaxed" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
                {testimonial.content}
              </p>
              <div className="flex items-center gap-3">
                {testimonial.avatar && (
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                )}
                <div>
                  <div className="font-semibold text-gray-900" style={{ fontSize: '0.95rem' }}>{testimonial.name}</div>
                  {testimonial.role && (
                    <div className="text-sm text-gray-500" style={{ fontSize: '0.875rem' }}>{testimonial.role}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )

    case 'faq':
      return (
        <div className="space-y-2">
          {element.items.map((item) => (
            <details key={item.id} className="border rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">{item.question}</summary>
              <p className="mt-2 text-gray-600">{item.answer}</p>
            </details>
          ))}
        </div>
      )

    case 'countdown':
      return <CountdownTimer targetDate={element.targetDate} />

    case 'container':
    case 'columns':
      const containerStyle: React.CSSProperties = {}
      if (element.styles?.backgroundGradient) {
        containerStyle.background = element.styles.backgroundGradient
      } else if (element.styles?.backgroundColor) {
        containerStyle.backgroundColor = element.styles.backgroundColor
      }
      
      return (
        <div
          className={cn(
            "grid gap-4",
            element.columns === 1 && "grid-cols-1",
            element.columns === 2 && "grid-cols-1 md:grid-cols-2",
            element.columns === 3 && "grid-cols-1 md:grid-cols-3"
          )}
          style={containerStyle}
        >
          {element.children?.map((child) => (
            <ElementRenderer
              key={child.id}
              element={child}
              theme={theme}
              isSelected={false}
              onSelect={() => {}}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )

    default:
      return <div>Unknown element type</div>
  }
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const difference = target - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  return (
    <div className="flex gap-4 justify-center">
      <div className="text-center">
        <div className="text-3xl font-bold">{timeLeft.days}</div>
        <div className="text-sm">Days</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold">{timeLeft.hours}</div>
        <div className="text-sm">Hours</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold">{timeLeft.minutes}</div>
        <div className="text-sm">Minutes</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold">{timeLeft.seconds}</div>
        <div className="text-sm">Seconds</div>
      </div>
    </div>
  )
}

