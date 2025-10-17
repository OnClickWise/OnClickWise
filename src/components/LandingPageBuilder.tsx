"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'date'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
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
}

interface LandingPageBuilderProps {
  config: LandingPageConfig
  onConfigChange: (updates: Partial<LandingPageConfig>) => void
}

export function LandingPageBuilder({ config, onConfigChange }: LandingPageBuilderProps) {
  const renderFormField = (field: FormField) => {
    const baseClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
    
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            key={field.id}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className={baseClasses}
            style={{ 
              borderColor: config.primaryColor + '40',
              '--tw-ring-color': config.primaryColor + '50'
            } as React.CSSProperties}
          />
        )
      
      case 'select':
        return (
          <select
            key={field.id}
            required={field.required}
            className={baseClasses}
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
        )
      
      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center gap-2">
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
        )
      
      case 'date':
        return (
          <input
            key={field.id}
            type="date"
            placeholder={field.placeholder}
            required={field.required}
            className={baseClasses}
            style={{ 
              borderColor: config.primaryColor + '40',
              '--tw-ring-color': config.primaryColor + '50'
            } as React.CSSProperties}
          />
        )
      
      default:
        return (
          <input
            key={field.id}
            type={field.type === 'text' ? 'text' : field.type}
            placeholder={field.placeholder}
            required={field.required}
            className={baseClasses}
            style={{ 
              borderColor: config.primaryColor + '40',
              '--tw-ring-color': config.primaryColor + '50'
            } as React.CSSProperties}
          />
        )
    }
  }

  return (
    <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Landing Page Preview */}
        <div 
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ backgroundColor: config.backgroundColor }}
        >
          {/* Hero Section */}
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
              {config.title}
            </h1>
            <h2 
              className="text-xl mb-6 opacity-90"
              style={{ color: config.textColor }}
            >
              {config.subtitle}
            </h2>
            <p 
              className="text-lg mb-8 max-w-2xl mx-auto opacity-80"
              style={{ color: config.textColor }}
            >
              {config.description}
            </p>
          </div>

          {/* Form Section */}
          <div className="px-8 py-12">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h3 
                  className="text-2xl font-semibold mb-2"
                  style={{ color: config.textColor }}
                >
                  {config.ctaText}
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
                        {renderFormField(field)}
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
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = config.secondaryColor
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = config.primaryColor
                      }}
                    >
                      {config.ctaButtonText}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div 
            className="px-8 py-6 text-center border-t"
            style={{ 
              borderColor: config.primaryColor + '20',
              backgroundColor: config.primaryColor + '05'
            }}
          >
            <p 
              className="text-sm opacity-70"
              style={{ color: config.textColor }}
            >
              © 2024 Sua Empresa. Todos os direitos reservados.
            </p>
          </div>
        </div>

        {/* Builder Controls */}
        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <h4 className="font-semibold text-gray-900 mb-3">Controles do Builder</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Template:</span>
              <span className="ml-2 font-medium">{config.template || 'Nenhum selecionado'}</span>
            </div>
            <div>
              <span className="text-gray-600">Campos:</span>
              <span className="ml-2 font-medium">{config.formFields.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
