"use client"

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'date'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

interface BlockRendererProps {
  block: LandingPageBlock
  config: {
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    textColor: string
    formFields: FormField[]
  }
}

export function BlockRenderer({ block, config }: BlockRendererProps) {
  if (!block.visible) return null

  const renderHeroBlock = () => (
    <div 
      className="px-8 py-16 text-center"
      style={{ 
        background: `linear-gradient(135deg, ${config.primaryColor}15, ${config.secondaryColor}15)`
      }}
    >
      <h1 
        className="text-4xl font-bold mb-4"
        style={{ color: config.textColor }}
      >
        {block.content.title || 'Título Principal'}
      </h1>
      <h2 
        className="text-xl mb-6 opacity-90"
        style={{ color: config.textColor }}
      >
        {block.content.subtitle || 'Subtítulo'}
      </h2>
      <p 
        className="text-lg mb-8 max-w-2xl mx-auto opacity-80"
        style={{ color: config.textColor }}
      >
        {block.content.description || 'Descrição da seção'}
      </p>
      {block.content.buttonText && (
        <Button
          style={{
            backgroundColor: config.primaryColor,
            borderColor: config.primaryColor,
            color: 'white'
          }}
        >
          {block.content.buttonText}
        </Button>
      )}
    </div>
  )

  const renderFeaturesBlock = () => (
    <div className="px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: config.textColor }}>
          Nossos Recursos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(block.content.features || []).map((feature, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: config.textColor }}>
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderTestimonialsBlock = () => (
    <div className="px-8 py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: config.textColor }}>
          O que nossos clientes dizem
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(block.content.testimonials || []).map((testimonial, index) => (
            <Card key={index} className="p-6">
              <CardContent className="p-0">
                <p className="text-gray-600 mb-4">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    {testimonial.avatar ? (
                      <Image src={testimonial.avatar} alt={testimonial.name} width={40} height={40} className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-sm font-medium">{testimonial.name[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: config.textColor }}>{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role} - {testimonial.company}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )

  const renderPricingBlock = () => (
    <div className="px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: config.textColor }}>
          Nossos Planos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(block.content.plans || []).map((plan, index) => (
            <Card key={index} className={`p-6 ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
              <CardContent className="p-0">
                {plan.popular && (
                  <Badge className="mb-4" style={{ backgroundColor: config.primaryColor }}>
                    Mais Popular
                  </Badge>
                )}
                <h3 className="text-2xl font-bold mb-2" style={{ color: config.textColor }}>
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold" style={{ color: config.primaryColor }}>
                    {plan.price}
                  </span>
                  <span className="text-gray-500">/{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full"
                  style={{
                    backgroundColor: plan.popular ? config.primaryColor : config.secondaryColor,
                    borderColor: plan.popular ? config.primaryColor : config.secondaryColor,
                    color: 'white'
                  }}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )

  const renderContactBlock = () => (
    <div className="px-8 py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8" style={{ color: config.textColor }}>
          Entre em Contato
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {block.content.contactInfo?.email && (
            <div>
              <h3 className="font-semibold mb-2" style={{ color: config.textColor }}>Email</h3>
              <p className="text-gray-600">{block.content.contactInfo.email}</p>
            </div>
          )}
          {block.content.contactInfo?.phone && (
            <div>
              <h3 className="font-semibold mb-2" style={{ color: config.textColor }}>Telefone</h3>
              <p className="text-gray-600">{block.content.contactInfo.phone}</p>
            </div>
          )}
          {block.content.contactInfo?.address && (
            <div>
              <h3 className="font-semibold mb-2" style={{ color: config.textColor }}>Endereço</h3>
              <p className="text-gray-600">{block.content.contactInfo.address}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderTextBlock = () => (
    <div className="px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <div 
          className="prose prose-lg max-w-none"
          style={{ color: config.textColor }}
          dangerouslySetInnerHTML={{ __html: block.content.content || '<p>Conteúdo do texto...</p>' }}
        />
      </div>
    </div>
  )

  const renderImageBlock = () => (
    <div className="px-8 py-12">
      <div className="max-w-4xl mx-auto text-center">
        {block.content.imageUrl ? (
          <Image 
            src={block.content.imageUrl} 
            alt={block.content.imageAlt || 'Imagem'} 
            width={800}
            height={400}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Imagem não definida</span>
          </div>
        )}
        {block.content.caption && (
          <p className="mt-4 text-gray-600">{block.content.caption}</p>
        )}
      </div>
    </div>
  )

  const renderFormBlock = () => (
    <div className="px-8 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h3 
            className="text-2xl font-semibold mb-2"
            style={{ color: config.textColor }}
          >
            Entre em Contato
          </h3>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <form className="space-y-4">
              {config.formFields.map((field) => (
                <div key={field.id}>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: config.textColor }}
                  >
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ 
                        borderColor: config.primaryColor + '40',
                        '--tw-ring-color': config.primaryColor + '50'
                      } as React.CSSProperties}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      required={field.required}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ 
                        borderColor: config.primaryColor + '40',
                        '--tw-ring-color': config.primaryColor + '50'
                      } as React.CSSProperties}
                    >
                      <option value="">Selecione uma opção</option>
                      {field.options?.map((option, index) => (
                        <option key={index} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={field.id}
                        required={field.required}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        style={{ accentColor: config.primaryColor }}
                      />
                      <label htmlFor={field.id} className="text-sm text-gray-700">
                        {field.label}
                      </label>
                    </div>
                  ) : (
                    <input
                      type={field.type === 'text' ? 'text' : field.type}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ 
                        borderColor: config.primaryColor + '40',
                        '--tw-ring-color': config.primaryColor + '50'
                      } as React.CSSProperties}
                    />
                  )}
                </div>
              ))}
              
              <Button
                type="submit"
                className="w-full py-3 text-lg font-semibold"
                style={{
                  backgroundColor: config.primaryColor,
                  borderColor: config.primaryColor,
                  color: 'white'
                }}
              >
                Enviar Mensagem
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  switch (block.type) {
    case 'hero':
      return renderHeroBlock()
    case 'features':
      return renderFeaturesBlock()
    case 'testimonials':
      return renderTestimonialsBlock()
    case 'pricing':
      return renderPricingBlock()
    case 'contact':
      return renderContactBlock()
    case 'text':
      return renderTextBlock()
    case 'image':
      return renderImageBlock()
    case 'form':
      return renderFormBlock()
    default:
      return null
  }
}
