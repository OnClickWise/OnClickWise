"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Upload,
  Image as ImageIcon
} from 'lucide-react'

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

interface BlockEditorProps {
  block: LandingPageBlock
  onSave: (blockId: string, updates: Partial<LandingPageBlock>) => void
  onClose: () => void
}

export function BlockEditor({ block, onSave, onClose }: BlockEditorProps) {
  const [editedContent, setEditedContent] = useState<BlockContent>(block.content)
  const [editedTitle, setEditedTitle] = useState(block.title)

  const handleSave = () => {
    onSave(block.id, {
      title: editedTitle,
      content: editedContent
    })
    onClose()
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setEditedContent(prev => ({
          ...prev,
          imageUrl: e.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const addFeature = () => {
    setEditedContent(prev => ({
      ...prev,
      features: [...(prev.features || []), { icon: '⭐', title: 'Novo Recurso', description: 'Descrição do recurso' }]
    }))
  }

  const updateFeature = (index: number, field: string, value: string) => {
    setEditedContent(prev => ({
      ...prev,
      features: prev.features?.map((feature, i) => 
        i === index ? { ...feature, [field]: value } : feature
      ) || []
    }))
  }

  const removeFeature = (index: number) => {
    setEditedContent(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || []
    }))
  }

  const addTestimonial = () => {
    setEditedContent(prev => ({
      ...prev,
      testimonials: [...(prev.testimonials || []), { 
        name: 'Nome do Cliente', 
        role: 'Cargo', 
        company: 'Empresa', 
        content: 'Depoimento do cliente' 
      }]
    }))
  }

  const updateTestimonial = (index: number, field: string, value: string) => {
    setEditedContent(prev => ({
      ...prev,
      testimonials: prev.testimonials?.map((testimonial, i) => 
        i === index ? { ...testimonial, [field]: value } : testimonial
      ) || []
    }))
  }

  const removeTestimonial = (index: number) => {
    setEditedContent(prev => ({
      ...prev,
      testimonials: prev.testimonials?.filter((_, i) => i !== index) || []
    }))
  }

  const addPlan = () => {
    setEditedContent(prev => ({
      ...prev,
      plans: [...(prev.plans || []), { 
        name: 'Novo Plano', 
        price: 'R$ 0', 
        period: 'mês', 
        features: ['Feature 1', 'Feature 2'], 
        buttonText: 'Escolher Plano',
        popular: false
      }]
    }))
  }

  const updatePlan = (index: number, field: string, value: string | boolean) => {
    setEditedContent(prev => ({
      ...prev,
      plans: prev.plans?.map((plan, i) => 
        i === index ? { ...plan, [field]: value } : plan
      ) || []
    }))
  }

  const removePlan = (index: number) => {
    setEditedContent(prev => ({
      ...prev,
      plans: prev.plans?.filter((_, i) => i !== index) || []
    }))
  }

  const addPlanFeature = (planIndex: number) => {
    setEditedContent(prev => ({
      ...prev,
      plans: prev.plans?.map((plan, i) => 
        i === planIndex ? { ...plan, features: [...plan.features, 'Nova Feature'] } : plan
      ) || []
    }))
  }

  const updatePlanFeature = (planIndex: number, featureIndex: number, value: string) => {
    setEditedContent(prev => ({
      ...prev,
      plans: prev.plans?.map((plan, i) => 
        i === planIndex ? { 
          ...plan, 
          features: plan.features.map((feature, j) => j === featureIndex ? value : feature)
        } : plan
      ) || []
    }))
  }

  const removePlanFeature = (planIndex: number, featureIndex: number) => {
    setEditedContent(prev => ({
      ...prev,
      plans: prev.plans?.map((plan, i) => 
        i === planIndex ? { 
          ...plan, 
          features: plan.features.filter((_, j) => j !== featureIndex)
        } : plan
      ) || []
    }))
  }

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Edit Block: {block.type}</CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Título do Bloco */}
          <div>
            <label className="block text-sm font-medium mb-2">Block Title</label>
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="Block title"
            />
          </div>

          {/* Hero Block */}
          {block.type === 'hero' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Hero Content</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Main Title</label>
                  <Input
                    value={editedContent.title || ''}
                    onChange={(e) => setEditedContent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Main title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subtítulo</label>
                  <Input
                    value={editedContent.subtitle || ''}
                    onChange={(e) => setEditedContent(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Subtítulo"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={editedContent.description || ''}
                    onChange={(e) => setEditedContent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Texto do Botão</label>
                  <Input
                    value={editedContent.buttonText || ''}
                    onChange={(e) => setEditedContent(prev => ({ ...prev, buttonText: e.target.value }))}
                    placeholder="Texto do botão"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Link do Botão</label>
                  <Input
                    value={editedContent.buttonLink || ''}
                    onChange={(e) => setEditedContent(prev => ({ ...prev, buttonLink: e.target.value }))}
                    placeholder="#contact"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Features Block */}
          {block.type === 'features' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recursos</h3>
                <Button onClick={addFeature} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Recurso
                </Button>
              </div>
              <div className="space-y-4">
                {(editedContent.features || []).map((feature, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Recurso {index + 1}</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeFeature(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Ícone</label>
                        <Input
                          value={feature.icon}
                          onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                          placeholder="⭐"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Título</label>
                        <Input
                          value={feature.title}
                          onChange={(e) => updateFeature(index, 'title', e.target.value)}
                          placeholder="Título do recurso"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Descrição</label>
                        <Input
                          value={feature.description}
                          onChange={(e) => updateFeature(index, 'description', e.target.value)}
                          placeholder="Descrição do recurso"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Testimonials Block */}
          {block.type === 'testimonials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Depoimentos</h3>
                <Button onClick={addTestimonial} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Depoimento
                </Button>
              </div>
              <div className="space-y-4">
                {(editedContent.testimonials || []).map((testimonial, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Depoimento {index + 1}</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeTestimonial(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nome</label>
                        <Input
                          value={testimonial.name}
                          onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                          placeholder="Nome do cliente"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Cargo</label>
                        <Input
                          value={testimonial.role}
                          onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                          placeholder="Cargo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Empresa</label>
                        <Input
                          value={testimonial.company}
                          onChange={(e) => updateTestimonial(index, 'company', e.target.value)}
                          placeholder="Empresa"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Depoimento</label>
                        <textarea
                          value={testimonial.content}
                          onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
                          placeholder="Depoimento do cliente"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Block */}
          {block.type === 'pricing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Planos de Preço</h3>
                <Button onClick={addPlan} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Plano
                </Button>
              </div>
              <div className="space-y-4">
                {(editedContent.plans || []).map((plan, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Plano {index + 1}</h4>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={plan.popular || false}
                            onChange={(e) => updatePlan(index, 'popular', e.target.checked)}
                          />
                          <span className="text-sm">Popular</span>
                        </label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removePlan(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nome do Plano</label>
                        <Input
                          value={plan.name}
                          onChange={(e) => updatePlan(index, 'name', e.target.value)}
                          placeholder="Nome do plano"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Preço</label>
                        <Input
                          value={plan.price}
                          onChange={(e) => updatePlan(index, 'price', e.target.value)}
                          placeholder="R$ 99"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Período</label>
                        <Input
                          value={plan.period}
                          onChange={(e) => updatePlan(index, 'period', e.target.value)}
                          placeholder="mês"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Texto do Botão</label>
                        <Input
                          value={plan.buttonText}
                          onChange={(e) => updatePlan(index, 'buttonText', e.target.value)}
                          placeholder="Escolher Plano"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">Features</label>
                        <Button onClick={() => addPlanFeature(index)} size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2">
                            <Input
                              value={feature}
                              onChange={(e) => updatePlanFeature(index, featureIndex, e.target.value)}
                              placeholder="Feature do plano"
                            />
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => removePlanFeature(index, featureIndex)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Contact Block */}
          {block.type === 'contact' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações de Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    value={editedContent.contactInfo?.email || ''}
                    onChange={(e) => setEditedContent(prev => ({
                      ...prev,
                      contactInfo: { 
                        email: e.target.value,
                        phone: prev.contactInfo?.phone || '',
                        address: prev.contactInfo?.address || ''
                      }
                    }))}
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  <Input
                    value={editedContent.contactInfo?.phone || ''}
                    onChange={(e) => setEditedContent(prev => ({
                      ...prev,
                      contactInfo: { 
                        email: prev.contactInfo?.email || '',
                        phone: e.target.value,
                        address: prev.contactInfo?.address || ''
                      }
                    }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Endereço</label>
                  <Input
                    value={editedContent.contactInfo?.address || ''}
                    onChange={(e) => setEditedContent(prev => ({
                      ...prev,
                      contactInfo: { 
                        email: prev.contactInfo?.email || '',
                        phone: prev.contactInfo?.phone || '',
                        address: e.target.value
                      }
                    }))}
                    placeholder="Rua, Cidade, Estado"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Text Block */}
          {block.type === 'text' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Conteúdo de Texto</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Conteúdo HTML</label>
                <textarea
                  value={editedContent.content || ''}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="<p>Seu conteúdo HTML aqui...</p>"
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Você pode usar HTML para formatar o texto (p, h1, h2, strong, em, etc.)
                </p>
              </div>
            </div>
          )}

          {/* Image Block */}
          {block.type === 'image' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Imagem</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Upload de Imagem</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Button variant="outline" type="button">
                        <Upload className="h-4 w-4 mr-2" />
                        Escolher Imagem
                      </Button>
                    </label>
                    {editedContent.imageUrl && (
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Imagem carregada</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">URL da Imagem</label>
                  <Input
                    value={editedContent.imageUrl || ''}
                    onChange={(e) => setEditedContent(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Texto Alternativo</label>
                  <Input
                    value={editedContent.imageAlt || ''}
                    onChange={(e) => setEditedContent(prev => ({ ...prev, imageAlt: e.target.value }))}
                    placeholder="Descrição da imagem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Legenda</label>
                  <Input
                    value={editedContent.caption || ''}
                    onChange={(e) => setEditedContent(prev => ({ ...prev, caption: e.target.value }))}
                    placeholder="Legenda da imagem"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Block - Não editável, usa os campos do formulário */}
          {block.type === 'form' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Form</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  This block uses the fields configured in the &ldquo;Form&rdquo; tab. 
                  To edit the fields, go to the &ldquo;Form&rdquo; tab.
                </p>
                <Badge className="mt-2">
                  {block.content ? 'Configured' : 'Not configured'}
                </Badge>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
