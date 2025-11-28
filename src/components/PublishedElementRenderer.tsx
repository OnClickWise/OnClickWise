"use client"

import * as React from "react"
import { LandingPageElement, LandingPage, FormElement } from "@/types/landing-page"

interface PublishedElementRendererProps {
  element: LandingPageElement
  theme: LandingPage['theme']
  orgSlug?: string
}

export function PublishedElementRenderer({
  element,
  theme,
  orgSlug,
}: PublishedElementRendererProps) {
  const baseStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  }

  return (
    <div style={baseStyles}>
      <div 
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
        {renderElementContent(element, theme, orgSlug)}
      </div>
    </div>
  )
}

function PhoneInput({ field, ...props }: { field: any; [key: string]: any }) {
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

function PublishedForm({ element, theme, orgSlug }: { element: FormElement; theme: LandingPage['theme']; orgSlug?: string }) {
  const formRef = React.useRef<HTMLFormElement>(null)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = formRef.current
    if (!form) {
      console.error('Form element not found')
      return
    }
    
    const formData = new FormData(form)
    const data: Record<string, string> = {}
    
    // Extract all form field values
    element.fields.forEach((field) => {
      const value = formData.get(field.id) as string
      if (value !== null && value !== undefined && value.trim() !== '') {
        data[field.id] = value.trim()
        // Also map common field names for lead creation
        const labelLower = field.label.toLowerCase()
        if (labelLower.includes('nome') || labelLower.includes('name') || field.id.toLowerCase().includes('nome') || field.id.toLowerCase().includes('name')) {
          data.name = value.trim()
        }
        if (labelLower.includes('email') || field.type === 'email' || field.id.toLowerCase().includes('email')) {
          data.email = value.trim()
        }
        if (labelLower.includes('telefone') || labelLower.includes('phone') || field.type === 'tel' || field.id.toLowerCase().includes('telefone') || field.id.toLowerCase().includes('phone')) {
          data.phone = value.trim()
        }
      }
    })
    
    // Ensure we have at least name or email
    if (!data.name && !data.email) {
      alert('Por favor, preencha pelo menos o nome ou email.')
      return
    }
    
    // If form has action, submit to that URL
    if (element.action) {
      try {
        const response = await fetch(element.action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        
        if (response.ok) {
          alert('Formulário enviado com sucesso!')
          form.reset()
        } else {
          alert('Erro ao enviar formulário. Tente novamente.')
        }
      } catch (error) {
        console.error('Form submission error:', error)
        alert('Erro ao enviar formulário. Tente novamente.')
      }
    } else {
      // Default: create a lead via public API
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
        
        // If orgSlug is provided, include it in the request
        const requestBody: any = {
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          source: 'Landing Page',
          status: 'new',
        }
        
        // Include organization_slug if available (backend will resolve to organization_id)
        if (orgSlug) {
          requestBody.organization_slug = orgSlug
          console.log('📝 Form submission - Including organization_slug:', orgSlug)
        } else {
          console.warn('⚠️ Form submission - No orgSlug provided!')
        }
        
        console.log('📤 Form submission - Request body:', requestBody)
        
        const response = await fetch(`${API_BASE_URL}/leads/public`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })
        
        const responseData = await response.json().catch(() => ({}))
        
        if (response.ok && responseData.success !== false) {
          alert('Formulário enviado com sucesso!')
          form.reset()
        } else {
          const errorMessage = responseData.error || 'Erro ao enviar formulário. Tente novamente.'
          console.error('Form submission failed:', responseData)
          alert(errorMessage)
        }
      } catch (error) {
        console.error('Form submission error:', error)
        alert('Erro ao enviar formulário. Tente novamente.')
      }
    }
  }
  
  // Get max width from element styles, default to 500px for modern compact design
  const formMaxWidth = element.styles?.maxWidth || '500px'
  
  return (
    <div style={{ 
      maxWidth: formMaxWidth, 
      margin: '0 auto',
      width: '100%'
    }}>
      <form 
        id={`form-${element.id}`}
        ref={formRef}
        className="space-y-4"
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {element.fields.map((field) => (
          <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label 
              htmlFor={field.id} 
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
                id={field.id}
                name={field.id}
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
                id={field.id}
                name={field.id}
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
                <option value="">Selecione...</option>
                {field.options?.map((opt, index) => (
                  <option key={`${field.id}-option-${index}`} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'tel' ? (
              <PhoneInput
                id={field.id}
                name={field.id}
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
                id={field.id}
                type={field.type}
                name={field.id}
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
}

function renderElementContent(
  element: LandingPageElement,
  theme: LandingPage['theme'],
  orgSlug?: string
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
        paragraphColor = theme.colorPalette.text
      } else if (paragraphColor === 'USE_THEME_PRIMARY') {
        paragraphColor = theme.colorPalette.primary
      } else if (paragraphColor === 'USE_THEME_SECONDARY') {
        paragraphColor = theme.colorPalette.secondary
      } else if (paragraphColor === 'USE_THEME_BACKGROUND') {
        paragraphColor = theme.colorPalette.background
      }
      return (
        <p
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
        return null
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
        return null
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
      const buttonTextAlign = element.styles?.textAlign || 'center'
      const shouldCenter = buttonTextAlign === 'center'
      
      const { display: elementDisplay, margin: elementMargin, textAlign: elementTextAlign, width: elementWidth, ...otherButtonStyles } = element.styles || {}
      const buttonDisplay = elementDisplay || (shouldCenter ? 'inline-block' : 'inline-block')
      
      let buttonMargin = '0'
      if (elementMargin) {
        const marginParts = elementMargin.split(' ').map(p => p.trim())
        if (shouldCenter) {
          if (marginParts.length === 4) {
            buttonMargin = `${marginParts[0]} auto ${marginParts[2]} auto`
          } else if (marginParts.length === 2) {
            buttonMargin = `${marginParts[0]} auto`
          } else if (marginParts.length === 1) {
            buttonMargin = `${marginParts[0]} auto`
          } else {
            buttonMargin = elementMargin
          }
        } else {
          buttonMargin = elementMargin
        }
      } else {
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
            className="px-6 py-3 rounded-md font-medium transition-all"
            style={{
              backgroundColor: element.variant === 'primary' ? theme.colorPalette.primary : 
                               element.variant === 'secondary' ? theme.colorPalette.secondary : 
                               element.variant === 'outline' ? 'transparent' : undefined,
              color: element.variant === 'primary' || element.variant === 'secondary' ? '#ffffff' : theme.colorPalette.primary,
              border: element.variant === 'outline' ? `2px solid ${theme.colorPalette.primary}` : undefined,
              textAlign: 'center',
              display: buttonDisplay,
              margin: buttonMargin,
              width: elementWidth || 'auto',
              boxSizing: 'border-box',
              cursor: 'pointer',
              ...otherButtonStyles,
            }}
            onMouseEnter={(e) => {
              if (element.variant === 'outline') {
                e.currentTarget.style.backgroundColor = theme.colorPalette.primary
                e.currentTarget.style.color = '#ffffff'
              } else {
                e.currentTarget.style.opacity = '0.9'
              }
            }}
            onMouseLeave={(e) => {
              if (element.variant === 'outline') {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = theme.colorPalette.primary
              } else {
                e.currentTarget.style.opacity = '1'
              }
            }}
            onClick={(e) => {
              e.preventDefault()
              if (element.href) {
                // If href starts with #, do smooth scroll
                if (element.href.startsWith('#')) {
                  const targetId = element.href.substring(1)
                  const targetElement = document.getElementById(targetId)
                  if (targetElement) {
                    targetElement.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start' 
                    })
                  } else {
                    // If target not found, try to find first form as fallback
                    const firstForm = document.querySelector('form[id^="form-"]') as HTMLElement
                    if (firstForm) {
                      firstForm.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                      })
                    }
                  }
                } else {
                  // External link
                  window.location.href = element.href
                }
              } else if (element.onClick) {
                // Execute onClick if it's a valid JavaScript function
                try {
                  // eslint-disable-next-line no-eval
                  eval(element.onClick)
                } catch (err) {
                  console.error('Error executing onClick:', err)
                  // Fallback to form scroll on error
                  const firstForm = document.querySelector('form[id^="form-"]') as HTMLElement
                  if (firstForm) {
                    firstForm.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start' 
                    })
                  }
                }
              } else {
                // Fallback: if button has no href or onClick, scroll to first form on page
                const firstForm = document.querySelector('form[id^="form-"]') as HTMLElement
                if (firstForm) {
                  firstForm.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                  })
                }
              }
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
      const highlightStyle: React.CSSProperties = {}
      if (element.styles?.backgroundGradient) {
        highlightStyle.background = element.styles.backgroundGradient
      } else if (element.styles?.backgroundColor) {
        highlightStyle.backgroundColor = element.styles.backgroundColor
      }
      
      const hasCustomBackground = element.styles?.backgroundGradient || element.styles?.backgroundColor
      
      return (
        <div
          className="p-4 rounded-lg"
          style={{
            ...highlightStyle,
            ...(!hasCustomBackground && element.variant === 'info' && { backgroundColor: '#dbeafe', color: '#1e40af' }),
            ...(!hasCustomBackground && element.variant === 'success' && { backgroundColor: '#d1fae5', color: '#065f46' }),
            ...(!hasCustomBackground && element.variant === 'warning' && { backgroundColor: '#fef3c7', color: '#92400e' }),
            ...(!hasCustomBackground && element.variant === 'error' && { backgroundColor: '#fee2e2', color: '#991b1b' }),
          }}
        >
          {element.content}
        </div>
      )

    case 'form':
      return <PublishedForm element={element} theme={theme} orgSlug={orgSlug} />

    case 'icon-list':
      return (
        <div
          className={`grid gap-6 ${
            element.columns === 1 ? 'grid-cols-1' :
            element.columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
            element.columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
            'grid-cols-1'
          }`}
        >
          {element.items.map((item) => (
            <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg">
              <div className="flex-shrink-0 text-2xl mt-1">
                {item.icon || '•'}
              </div>
              <span className="text-gray-700 leading-relaxed" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )

    case 'testimonial':
      const isCardsLayout = element.layout === 'cards'
      return (
        <div className={`w-full grid gap-6 ${
          isCardsLayout && element.testimonials.length === 1 ? 'grid-cols-1' :
          isCardsLayout && element.testimonials.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
          isCardsLayout && element.testimonials.length >= 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1'
        }`}>
          {element.testimonials.map((testimonial) => (
            <div 
              key={testimonial.id} 
              className="p-6 rounded-xl border bg-white border-gray-200"
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
          className={`grid gap-4 ${
            element.columns === 1 ? 'grid-cols-1' :
            element.columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
            element.columns === 3 ? 'grid-cols-1 md:grid-cols-3' :
            'grid-cols-1'
          }`}
          style={containerStyle}
        >
          {element.children?.map((child) => (
            <PublishedElementRenderer
              key={child.id}
              element={child}
              theme={theme}
              orgSlug={orgSlug}
            />
          ))}
        </div>
      )

    default:
      return null
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

