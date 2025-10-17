"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Eye, 
  Save, 
  Download, 
  Settings,
  Layout,
  Trash2,
  Move,
  EyeOff,
  Edit
} from 'lucide-react'
import { FormFieldEditor } from '@/components/FormFieldEditor'
import { LandingPagePreview } from '@/components/LandingPagePreview'
import { BlockRenderer } from '@/components/BlockRenderer'
import { BlockEditor } from '@/components/BlockEditor'
import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'date'
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // Para campos select
}

interface BlockContent {
  // Hero Block
  title?: string
  subtitle?: string
  description?: string
  buttonText?: string
  buttonLink?: string
  backgroundImage?: string
  
  // Features Block
  features?: Array<{
    icon: string
    title: string
    description: string
  }>
  
  // Testimonials Block
  testimonials?: Array<{
    name: string
    role: string
    company: string
    content: string
    avatar?: string
  }>
  
  // Pricing Block
  plans?: Array<{
    name: string
    price: string
    period: string
    features: string[]
    buttonText: string
    popular?: boolean
  }>
  
  // Contact Block
  contactInfo?: {
    email: string
    phone: string
    address: string
  }
  
  // Text Block
  content?: string
  
  // Image Block
  imageUrl?: string
  imageAlt?: string
  caption?: string
}

interface LandingPageBlock {
  id: string
  type: 'hero' | 'features' | 'testimonials' | 'pricing' | 'contact' | 'text' | 'image' | 'form'
  title: string
  content: BlockContent
  order: number
  visible: boolean
}

interface LandingPageConfig {
  id: string
  name: string
  template: string
  title: string
  subtitle: string
  description: string
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  formFields: FormField[]
  ctaText: string
  ctaButtonText: string
  blocks: LandingPageBlock[]
}

export default function LandingPageBuilderPage({
  params,
}: {
  params: { org: string }
}) {
  const [currentStep, setCurrentStep] = useState<'blocks' | 'form' | 'preview'>('blocks')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [editingBlock, setEditingBlock] = useState<LandingPageBlock | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [landingPageConfig, setLandingPageConfig] = useState<LandingPageConfig>({
    id: '',
    name: '',
    template: 'matheus-boaventura-prieto',
    title: 'Bem-vindo à nossa plataforma',
    subtitle: 'Transforme seus leads em clientes',
    description: 'Descubra como nossa solução pode ajudar seu negócio a crescer exponencialmente.',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    formFields: [
      {
        id: '1',
        type: 'text',
        label: 'Full Name',
        placeholder: 'John Doe',
        required: true
      },
      {
        id: '2',
        type: 'email',
        label: 'Email',
        placeholder: 'you@example.com',
        required: true
      },
      {
        id: '3',
        type: 'phone',
        label: 'WhatsApp',
        placeholder: '+55 11 91234-5678',
        required: false
      },
      {
        id: '4',
        type: 'select',
        label: 'Interest',
        placeholder: 'Selecione uma opção',
        required: true,
        options: ['Product', 'Service', 'Support', 'Partnership']
      },
      {
        id: '5',
        type: 'select',
        label: 'Unit',
        placeholder: 'Selecione uma unidade',
        required: true,
        options: ['New York', 'London', 'São Paulo', 'Tokyo']
      }
    ],
    ctaText: 'Pronto para começar?',
    ctaButtonText: 'Começar Agora',
    blocks: [
      {
        id: 'hero-1',
        type: 'hero',
        title: 'Seção Principal',
        order: 1,
        visible: true,
        content: {
          title: 'Bem-vindo à nossa plataforma',
          subtitle: 'Transforme seus leads em clientes',
          description: 'Descubra como nossa solução pode ajudar seu negócio a crescer exponencialmente.',
          buttonText: 'Começar Agora',
          buttonLink: '#contact'
        }
      },
      {
        id: 'form-1',
        type: 'form',
        title: 'Formulário de Contato',
        order: 2,
        visible: true,
        content: {}
      }
    ]
  })



  // Carregar dados do template existente
  const loadTemplateData = async () => {
    try {
      // Aqui você implementaria a chamada para a API para buscar os dados do template
      // Por enquanto, vamos simular com dados padrão
      const templateData = {
        id: 'matheus-boaventura-prieto',
        name: 'Template Matheus Boaventura Prieto',
        template: 'matheus-boaventura-prieto',
        title: 'Bem-vindo à nossa plataforma',
        subtitle: 'Transforme seus leads em clientes',
        description: 'Descubra como nossa solução pode ajudar seu negócio a crescer exponencialmente.',
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        formFields: [
          {
            id: '1',
            type: 'text' as const,
            label: 'Full Name',
            placeholder: 'John Doe',
            required: true
          },
          {
            id: '2',
            type: 'email' as const,
            label: 'Email',
            placeholder: 'you@example.com',
            required: true
          },
          {
            id: '3',
            type: 'phone' as const,
            label: 'WhatsApp',
            placeholder: '+55 11 91234-5678',
            required: false
          },
          {
            id: '4',
            type: 'select' as const,
            label: 'Interest',
            placeholder: 'Selecione uma opção',
            required: true,
            options: ['Product', 'Service', 'Support', 'Partnership']
          },
          {
            id: '5',
            type: 'select' as const,
            label: 'Unit',
            placeholder: 'Selecione uma unidade',
            required: true,
            options: ['New York', 'London', 'São Paulo', 'Tokyo']
          }
        ],
        ctaText: 'Pronto para começar?',
        ctaButtonText: 'Começar Agora',
        blocks: [
          {
            id: 'hero-1',
            type: 'hero' as const,
            title: 'Seção Principal',
            order: 1,
            visible: true,
            content: {
              title: 'Welcome to Acme Corp',
              subtitle: 'Innovative SaaS solutions for modern businesses',
              description: 'Transform your business with our cutting-edge solutions designed for the modern world.',
              buttonText: 'Get Started',
              buttonLink: '#contact'
            }
          },
          {
            id: 'features-1',
            type: 'features' as const,
            title: 'Nossos Serviços',
            order: 2,
            visible: true,
            content: {
              features: [
                {
                  icon: '☁️',
                  title: 'Cloud Hosting',
                  description: 'Professional cloud hosting tailored to your business.'
                },
                {
                  icon: '🤖',
                  title: 'AI Automation',
                  description: 'Professional automation tailored to your business.'
                },
                {
                  icon: '💼',
                  title: 'Consulting',
                  description: 'Professional consulting tailored to your business.'
                }
              ]
            }
          },
          {
            id: 'testimonials-1',
            type: 'testimonials' as const,
            title: 'Perguntas Frequentes',
            order: 3,
            visible: true,
            content: {
              testimonials: [
                {
                  name: 'How do I get started?',
                  role: 'FAQ',
                  company: '',
                  content: 'Simply sign up and explore our products or services with a free trial.'
                },
                {
                  name: 'Can I cancel anytime?',
                  role: 'FAQ',
                  company: '',
                  content: 'Yes, you can cancel your subscription at any time without penalties.'
                },
                {
                  name: 'Do you provide customer support?',
                  role: 'FAQ',
                  company: '',
                  content: 'Of course! We provide 24/7 support for all plans.'
                }
              ]
            }
          },
          {
            id: 'form-1',
            type: 'form' as const,
            title: 'Contact Us',
            order: 4,
            visible: true,
            content: {}
          }
        ]
      }
      
      setLandingPageConfig(templateData)
    } catch (error) {
      console.error('Erro ao carregar template:', error)
      alert('Error loading template data')
    } finally {
      // Loading handled by hook
    }
  }

  // Carregar dados quando o componente monta
  React.useEffect(() => {
    loadTemplateData()
  }, [])


  const handleFormFieldAdd = (field: Omit<FormField, 'id'>) => {
    const newField: FormField = {
      ...field,
      id: Date.now().toString()
    }
    setLandingPageConfig(prev => ({
      ...prev,
      formFields: [...prev.formFields, newField]
    }))
  }

  const handleFormFieldUpdate = (fieldId: string, updates: Partial<FormField>) => {
    setLandingPageConfig(prev => ({
      ...prev,
      formFields: prev.formFields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }))
  }

  const handleFormFieldRemove = (fieldId: string) => {
    setLandingPageConfig(prev => ({
      ...prev,
      formFields: prev.formFields.filter(field => field.id !== fieldId)
    }))
  }

  // Funções para gerenciar blocos
  const handleAddBlock = (blockType: LandingPageBlock['type']) => {
    // Check if form already exists
    if (blockType === 'form' && landingPageConfig.blocks.some(block => block.type === 'form')) {
      alert('Only one form is allowed per page')
      return
    }
    
    const newBlock: LandingPageBlock = {
      id: Date.now().toString(),
      type: blockType,
      title: `New ${blockType}`,
      order: landingPageConfig.blocks.length + 1,
      visible: true,
      content: {}
    }
    
    setLandingPageConfig(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }))
  }

  const handleUpdateBlock = (blockId: string, updates: Partial<LandingPageBlock>) => {
    setLandingPageConfig(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      )
    }))
  }

  const handleRemoveBlock = (blockId: string) => {
    const block = landingPageConfig.blocks.find(b => b.id === blockId)
    
    // Don't allow removing required blocks
    if (block && (block.type === 'hero' || block.type === 'form')) {
      alert('This block is required and cannot be removed')
      return
    }
    
    setLandingPageConfig(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId)
    }))
  }


  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/landing-pages/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: landingPageConfig.name || 'Landing Page',
          template: landingPageConfig.template,
          title: landingPageConfig.title,
          subtitle: landingPageConfig.subtitle,
          description: landingPageConfig.description,
          primaryColor: landingPageConfig.primaryColor,
          secondaryColor: landingPageConfig.secondaryColor,
          backgroundColor: landingPageConfig.backgroundColor,
          textColor: landingPageConfig.textColor,
          formFields: landingPageConfig.formFields,
          ctaText: landingPageConfig.ctaText,
          ctaButtonText: landingPageConfig.ctaButtonText,
          blocks: landingPageConfig.blocks,
          isPublished: false
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save landing page')
      }

      await response.json()
      alert('Landing page saved successfully!')
    } catch (error) {
      console.error('Error saving landing page:', error)
      alert('Error saving landing page')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/landing-pages/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: landingPageConfig.name || 'Landing Page',
          template: landingPageConfig.template,
          title: landingPageConfig.title,
          subtitle: landingPageConfig.subtitle,
          description: landingPageConfig.description,
          primaryColor: landingPageConfig.primaryColor,
          secondaryColor: landingPageConfig.secondaryColor,
          backgroundColor: landingPageConfig.backgroundColor,
          textColor: landingPageConfig.textColor,
          formFields: landingPageConfig.formFields,
          ctaText: landingPageConfig.ctaText,
          ctaButtonText: landingPageConfig.ctaButtonText,
          blocks: landingPageConfig.blocks,
          isPublished: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to publish landing page')
      }

      const result = await response.json()
      alert(`Landing page published successfully!\n\nPublic URL: ${result.publicUrl || 'URL will be available after publishing'}`)
    } catch (error) {
      console.error('Error publishing landing page:', error)
      alert('Error publishing landing page')
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { id: 'blocks', title: 'Blocks', icon: Layout },
    { id: 'form', title: 'Form', icon: Settings },
    { id: 'preview', title: 'Preview', icon: Eye }
  ]

  if (isLoading) {
    return (
      <AuthGuard orgSlug={params.org}>
        <SidebarProvider>
          <AppSidebar org={params.org} />
          <SidebarInset>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading template...</p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard orgSlug={params.org}>
      <SidebarProvider>
        <AppSidebar org={params.org} />
        <SidebarInset>
          {/* HEADER */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${params.org}/dashboard`}>
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${params.org}/marketing`}>
                    Marketing
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Landing Page Builder</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* MAIN CONTENT */}
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Landing Page Builder</h1>
            <p className="text-gray-600">Create and customize your landing page for lead capture</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
                          <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            {isLoading ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            onClick={handlePublish}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                          >
                            <Download className="h-4 w-4" />
                            {isLoading ? 'Publishing...' : 'Publish'}
                          </Button>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-4 mt-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index
            
            return (
              <div key={step.id} className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep(step.id as 'blocks' | 'form' | 'preview')}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                  ${isActive 
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : isCompleted 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {step.title}
                </button>
                {index < steps.length - 1 && (
                  <div className="w-4 h-px bg-gray-300" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Sidebar */}
        {!isPreviewMode && (
          <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
            
            {currentStep === 'blocks' && (
              <div className="space-y-6">
                  <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Manage Blocks
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Add, edit and organize your landing page blocks
                  </p>
                  </div>
                  
                {/* Required Blocks */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Required Blocks</h4>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Hero</strong> and <strong>Form</strong> are required blocks and cannot be removed.
                    </p>
                  </div>
                  </div>
                  
                {/* Add New Blocks */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Add Block</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: 'features', label: 'Features', icon: '⭐' },
                      { type: 'testimonials', label: 'Testimonials', icon: '💬' },
                      { type: 'pricing', label: 'Pricing', icon: '💰' },
                      { type: 'contact', label: 'Contact', icon: '📞' },
                      { type: 'text', label: 'Text', icon: '📝' },
                      { type: 'image', label: 'Image', icon: '🖼️' }
                    ].map((blockType) => (
                      <button
                        key={blockType.type}
                        onClick={() => handleAddBlock(blockType.type as LandingPageBlock['type'])}
                        className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                      >
                        <span className="text-lg">{blockType.icon}</span>
                        <span className="text-sm font-medium">{blockType.label}</span>
                      </button>
                    ))}
                  </div>
                  </div>
                  
                {/* Existing Blocks List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Page Blocks</h4>
                  <div className="space-y-2">
                    {landingPageConfig.blocks
                      .sort((a, b) => a.order - b.order)
                      .map((block) => (
                        <div
                          key={block.id}
                          className={`flex items-center justify-between gap-3 p-3 border rounded-lg ${
                            block.type === 'hero' || block.type === 'form' 
                              ? 'border-blue-200 bg-blue-50' 
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Move className="h-4 w-4 text-gray-400 cursor-move flex-shrink-0" />
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {block.title}
                              </span>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                ({block.type})
                              </span>
                              {(block.type === 'hero' || block.type === 'form') && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex-shrink-0">
                                  Required
                                </span>
                              )}
                            </div>
                    </div>
                    
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setEditingBlock(block)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit block"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateBlock(block.id, { visible: !block.visible })}
                              className={`p-1.5 rounded transition-colors ${
                                block.visible 
                                  ? 'text-green-600 hover:bg-green-50' 
                                  : 'text-gray-400 hover:bg-gray-50'
                              }`}
                              title={block.visible ? 'Hide block' : 'Show block'}
                            >
                              {block.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleRemoveBlock(block.id)}
                              disabled={block.type === 'hero' || block.type === 'form'}
                              className={`p-1.5 rounded transition-colors ${
                                block.type === 'hero' || block.type === 'form'
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                              title={
                                block.type === 'hero' || block.type === 'form'
                                  ? 'Required block - cannot be removed'
                                  : 'Remove block'
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                    </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 'form' && (
              <FormFieldEditor
                fields={landingPageConfig.formFields}
                onAdd={handleFormFieldAdd}
                onUpdate={handleFormFieldUpdate}
                onRemove={handleFormFieldRemove}
              />
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {isPreviewMode ? (
            <LandingPagePreview config={landingPageConfig} />
          ) : (
            <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                {/* Landing Page Preview */}
                <div 
                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                  style={{ backgroundColor: landingPageConfig.backgroundColor }}
                >
                  {/* Renderizar blocos dinamicamente */}
                  {landingPageConfig.blocks
                    .sort((a, b) => a.order - b.order)
                    .map((block) => (
                      <BlockRenderer
                        key={block.id}
                        block={block}
                        config={{
                          primaryColor: landingPageConfig.primaryColor,
                          secondaryColor: landingPageConfig.secondaryColor,
                          backgroundColor: landingPageConfig.backgroundColor,
                          textColor: landingPageConfig.textColor,
                          formFields: landingPageConfig.formFields
                        }}
                      />
                    ))}
                </div>

                {/* Builder Controls */}
                <div className="mt-6 p-4 bg-white rounded-lg shadow">
                  <h4 className="font-semibold text-gray-900 mb-3">Controles do Builder</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Template:</span>
                      <span className="ml-2 font-medium">{landingPageConfig.template || 'Nenhum selecionado'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Blocos:</span>
                      <span className="ml-2 font-medium">{landingPageConfig.blocks.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Campos:</span>
                      <span className="ml-2 font-medium">{landingPageConfig.formFields.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Modal de Edição de Bloco */}
          {editingBlock && (
            <BlockEditor
              block={editingBlock}
              onSave={handleUpdateBlock}
              onClose={() => setEditingBlock(null)}
            />
          )}
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
