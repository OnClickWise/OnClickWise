"use client"

import * as React from "react"
import { LandingPage } from "@/types/landing-page"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Download, Copy, Check, ArrowLeft } from "lucide-react"
import { useLandingPageStore } from "@/stores/landing-page-store"
import { useTranslations } from "next-intl"

function generateHTML(page: LandingPage): string {
  const fontFamilyMap: Record<string, string> = {
    'inter': 'Inter, sans-serif',
    'poppins': 'Poppins, sans-serif',
    'roboto': 'Roboto, sans-serif',
    'geist-sans': 'Geist Sans, sans-serif',
  }

  const fontFamily = fontFamilyMap[page.theme.fontFamily] || 'Inter, sans-serif'

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: ${fontFamily};
      background-color: ${page.theme.colorPalette.background};
      color: ${page.theme.colorPalette.text};
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: ${page.theme.globalSpacing.padding};
    }
    h1 { font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; }
    h2 { font-size: 2rem; font-weight: bold; margin-bottom: 0.875rem; }
    h3 { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.75rem; }
    h4 { font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem; }
    p { margin-bottom: 1rem; }
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      text-decoration: none;
      font-weight: 500;
      transition: opacity 0.2s;
    }
    .btn-primary {
      background-color: ${page.theme.colorPalette.primary};
      color: #ffffff;
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-secondary {
      background-color: ${page.theme.colorPalette.secondary};
      color: #ffffff;
    }
    .btn-outline {
      border: 2px solid ${page.theme.colorPalette.primary};
      color: ${page.theme.colorPalette.primary};
      background: transparent;
    }
    .btn-outline:hover {
      background-color: ${page.theme.colorPalette.primary};
      color: #ffffff;
    }
    img { max-width: 100%; height: auto; }
    form { margin-top: 1rem; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    input, textarea, select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 0.375rem;
      font-family: inherit;
    }
    .highlight {
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 1rem 0;
    }
    .highlight-info { background-color: #dbeafe; color: #1e40af; }
    .highlight-success { background-color: #d1fae5; color: #065f46; }
    .highlight-warning { background-color: #fef3c7; color: #92400e; }
    .highlight-error { background-color: #fee2e2; color: #991b1b; }
    .icon-list {
      display: grid;
      gap: 1rem;
      margin: 1rem 0;
    }
    .icon-list-1 { grid-template-columns: 1fr; }
    .icon-list-2 { grid-template-columns: repeat(2, 1fr); }
    .icon-list-3 { grid-template-columns: repeat(3, 1fr); }
    @media (max-width: 768px) {
      .icon-list-2, .icon-list-3 { grid-template-columns: 1fr; }
    }
    .testimonial-card {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin: 1rem 0;
    }
    .faq-item {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
      margin: 0.5rem 0;
    }
    .faq-question {
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    section {
      padding: ${page.theme.globalSpacing.padding};
    }
  </style>
</head>
<body>
`

  // Header
  if (page.header) {
    html += `  <header style="padding: 1rem 2rem; background-color: #ffffff;">
    <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
`
    if (page.header.logo) {
      html += `      <img src="${page.header.logo}" alt="Logo" style="height: 40px;">\n`
    }
    if (page.header.menu && page.header.menu.length > 0) {
      html += `      <nav style="display: flex; gap: 2rem;">\n`
      page.header.menu.forEach(link => {
        html += `        <a href="${link.href}" style="text-decoration: none; color: inherit;">${link.label}</a>\n`
      })
      html += `      </nav>\n`
    }
    if (page.header.actionButton) {
      html += `      <a href="${page.header.actionButton.href || '#'}" class="btn btn-primary">${page.header.actionButton.text}</a>\n`
    }
    html += `    </div>
  </header>
`
  }

  // Sections
  page.sections.forEach(section => {
    const sectionStyle = section.styles || {}
    const bgStyle = sectionStyle.backgroundColor 
      ? `background-color: ${sectionStyle.backgroundColor};`
      : sectionStyle.backgroundImage
      ? `background-image: url('${sectionStyle.backgroundImage}'); background-size: cover;`
      : sectionStyle.backgroundGradient
      ? `background: ${sectionStyle.backgroundGradient};`
      : ''
    
    html += `  <section style="${bgStyle} padding: ${sectionStyle.padding || page.theme.globalSpacing.padding};">
    <div class="container">
`

    section.elements.forEach(element => {
      html += renderElementHTML(element, page.theme.colorPalette)
    })

    html += `    </div>
  </section>
`
  })

  // Footer
  if (page.footer) {
    html += `  <footer style="padding: 2rem; background-color: #1f2937; color: #ffffff;">
    <div class="container">
`
    if (page.footer.logo) {
      html += `      <img src="${page.footer.logo}" alt="Logo" style="height: 40px; margin-bottom: 1rem;">\n`
    }
    if (page.footer.links && page.footer.links.length > 0) {
      html += `      <div style="margin-bottom: 1rem;">\n`
      page.footer.links.forEach(link => {
        html += `        <a href="${link.href}" style="color: #ffffff; text-decoration: none; margin-right: 1rem;">${link.label}</a>\n`
      })
      html += `      </div>\n`
    }
    if (page.footer.socialMedia && page.footer.socialMedia.length > 0) {
      html += `      <div style="margin-bottom: 1rem;">\n`
      page.footer.socialMedia.forEach(social => {
        html += `        <a href="${social.url}" style="color: #ffffff; text-decoration: none; margin-right: 1rem;">${social.platform}</a>\n`
      })
      html += `      </div>\n`
    }
    if (page.footer.legalInfo) {
      html += `      <p style="font-size: 0.875rem; opacity: 0.8;">${page.footer.legalInfo}</p>\n`
    }
    html += `    </div>
  </footer>
`
  }

  html += `</body>
</html>`

  return html
}

function renderElementHTML(element: any, colorPalette: any): string {
  switch (element.type) {
    case 'title':
    case 'subtitle':
      const level = element.level || 1
      const tag = `h${level}`
      return `      <${tag}>${element.content}</${tag}>\n`
    
    case 'paragraph':
      return `      <p>${element.content}</p>\n`
    
    case 'image':
      return `      <img src="${element.src}" alt="${element.alt || ''}" style="width: ${element.width || '100%'}; height: ${element.height || 'auto'};" />\n`
    
    case 'button':
      const btnClass = element.variant === 'primary' ? 'btn-primary' : element.variant === 'secondary' ? 'btn-secondary' : 'btn-outline'
      return `      <a href="${element.href || '#'}" class="btn ${btnClass}">${element.text}</a>\n`
    
    case 'form':
      let formHTML = `      <form>\n`
      element.fields.forEach((field: any) => {
        formHTML += `        <div class="form-group">\n`
        formHTML += `          <label>${field.label}${field.required ? ' *' : ''}</label>\n`
        if (field.type === 'textarea') {
          formHTML += `          <textarea placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>\n`
        } else if (field.type === 'select') {
          formHTML += `          <select ${field.required ? 'required' : ''}>\n`
          field.options?.forEach((opt: string) => {
            formHTML += `            <option value="${opt}">${opt}</option>\n`
          })
          formHTML += `          </select>\n`
        } else {
          formHTML += `          <input type="${field.type}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} />\n`
        }
        formHTML += `        </div>\n`
      })
      formHTML += `        <button type="submit" class="btn btn-primary">${element.submitText || 'Submit'}</button>\n`
      formHTML += `      </form>\n`
      return formHTML
    
    case 'highlight':
      return `      <div class="highlight highlight-${element.variant || 'info'}">${element.content}</div>\n`
    
    case 'icon-list':
      const columns = element.columns || 1
      return `      <div class="icon-list icon-list-${columns}">
        ${element.items.map((item: any) => `<div>${item.icon || '•'} ${item.text}</div>`).join('\n        ')}
      </div>\n`
    
    case 'divider':
      return `      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;" />\n`
    
    case 'testimonial':
      return `      <div>
        ${element.testimonials.map((t: any) => `
        <div class="testimonial-card">
          <p>"${t.content}"</p>
          <p><strong>${t.name}</strong>${t.role ? `, ${t.role}` : ''}</p>
          ${t.rating ? `<p>${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</p>` : ''}
        </div>
        `).join('')}
      </div>\n`
    
    case 'faq':
      return `      <div>
        ${element.items.map((item: any) => `
        <div class="faq-item">
          <div class="faq-question">${item.question}</div>
          <div>${item.answer}</div>
        </div>
        `).join('')}
      </div>\n`
    
    default:
      return ''
  }
}

export function HTMLExporter({ open, onClose, onBack }: { open: boolean; onClose: () => void; onBack?: () => void }) {
  const { currentPage } = useLandingPageStore()
  const [copied, setCopied] = React.useState(false)
  const [htmlContent, setHtmlContent] = React.useState('')

  React.useEffect(() => {
    if (currentPage && open) {
      setHtmlContent(generateHTML(currentPage))
    }
  }, [currentPage, open])

  const handleDownload = () => {
    if (!htmlContent) return
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentPage?.name || 'landing-page'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (!currentPage) return null

  const t = useTranslations('LandingPageCreator')
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
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
            <DialogTitle className="flex-1">Export HTML</DialogTitle>
          </div>
          <DialogDescription>
            Export your landing page as a standalone HTML file
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download HTML
            </Button>
            <Button variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy HTML
                </>
              )}
            </Button>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">HTML Preview</label>
            <textarea
              className="w-full h-64 p-3 border rounded-md font-mono text-xs"
              value={htmlContent}
              readOnly
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


