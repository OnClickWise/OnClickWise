"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  category: 'business' | 'saas' | 'ecommerce' | 'agency'
  preview: string
  features: string[]
}

interface TemplateSelectorProps {
  onSelect: (templateId: string) => void
  selectedTemplate: string
}

const templates: Template[] = [
  {
    id: 'modern-saas',
    name: 'SaaS Moderno',
    description: 'Template perfeito para produtos SaaS com foco em conversão',
    category: 'saas',
    preview: '/templates/modern-saas.jpg',
    features: ['Hero Section', 'Features Grid', 'Testimonials', 'Pricing', 'Contact Form']
  },
  {
    id: 'business-corporate',
    name: 'Corporativo',
    description: 'Design profissional para empresas B2B',
    category: 'business',
    preview: '/templates/business-corporate.jpg',
    features: ['Hero Section', 'About Us', 'Services', 'Team', 'Contact Form']
  },
  {
    id: 'ecommerce-product',
    name: 'E-commerce',
    description: 'Ideal para lançamento de produtos e vendas online',
    category: 'ecommerce',
    preview: '/templates/ecommerce-product.jpg',
    features: ['Product Showcase', 'Benefits', 'Reviews', 'FAQ', 'Order Form']
  },
  {
    id: 'agency-creative',
    name: 'Agência Criativa',
    description: 'Template versátil para agências e freelancers',
    category: 'agency',
    preview: '/templates/agency-creative.jpg',
    features: ['Portfolio', 'Services', 'Process', 'Case Studies', 'Contact Form']
  },
  {
    id: 'minimal-clean',
    name: 'Minimalista',
    description: 'Design limpo e focado na conversão',
    category: 'business',
    preview: '/templates/minimal-clean.jpg',
    features: ['Hero Section', 'Value Proposition', 'Social Proof', 'Simple Form']
  },
  {
    id: 'tech-startup',
    name: 'Startup Tech',
    description: 'Template dinâmico para startups de tecnologia',
    category: 'saas',
    preview: '/templates/tech-startup.jpg',
    features: ['Animated Hero', 'Product Demo', 'Team', 'Investors', 'Signup Form']
  }
]

const categoryLabels = {
  business: 'Negócios',
  saas: 'SaaS',
  ecommerce: 'E-commerce',
  agency: 'Agência'
}

const categoryColors = {
  business: 'bg-blue-100 text-blue-800',
  saas: 'bg-green-100 text-green-800',
  ecommerce: 'bg-purple-100 text-purple-800',
  agency: 'bg-orange-100 text-orange-800'
}

export function TemplateSelector({ onSelect, selectedTemplate }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory)

  const categories = [
    { id: 'all', name: 'Todos', count: templates.length },
    ...Object.entries(
      templates.reduce((acc, template) => {
        acc[template.category] = (acc[template.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([category, count]) => ({
      id: category,
      name: categoryLabels[category as keyof typeof categoryLabels],
      count
    }))
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Escolha um Template
        </h3>
        <p className="text-gray-600 text-sm">
          Selecione um template como base para sua landing page
        </p>
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Categorias</h4>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={`
              cursor-pointer transition-all duration-200 hover:shadow-md
              ${selectedTemplate === template.id 
                ? 'ring-2 ring-blue-500 border-blue-200' 
                : 'hover:border-gray-300'
              }
            `}
            onClick={() => onSelect(template.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                {selectedTemplate === template.id && (
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Template Preview */}
              <div className="mb-4">
                <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-gray-500 text-sm">
                    Preview do Template
                  </div>
                </div>
              </div>

              {/* Category Badge */}
              <div className="flex items-center justify-between mb-3">
                <Badge 
                  className={categoryColors[template.category]}
                >
                  {categoryLabels[template.category]}
                </Badge>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-700">Inclui:</h5>
                <div className="flex flex-wrap gap-1">
                  {template.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            Nenhum template encontrado nesta categoria
          </p>
        </div>
      )}
    </div>
  )
}
