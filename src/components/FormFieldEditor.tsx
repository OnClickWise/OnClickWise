"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trash2, 
  Move, 
  Type, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  User, 
  Building,
  CheckSquare,
  List,
  ChevronDown
} from 'lucide-react'

interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'date'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

interface FormFieldEditorProps {
  fields: FormField[]
  onAdd: (field: Omit<FormField, 'id'>) => void
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void
  onRemove: (fieldId: string) => void
}

const fieldTypes = [
  {
    type: 'text' as const,
    label: 'Texto',
    icon: Type,
    description: 'Campo de texto simples'
  },
  {
    type: 'email' as const,
    label: 'Email',
    icon: Mail,
    description: 'Campo de email com validação'
  },
  {
    type: 'phone' as const,
    label: 'Telefone',
    icon: Phone,
    description: 'Campo de telefone'
  },
  {
    type: 'textarea' as const,
    label: 'Texto Longo',
    icon: Type,
    description: 'Área de texto multilinha'
  },
  {
    type: 'select' as const,
    label: 'Seleção',
    icon: ChevronDown,
    description: 'Lista de opções'
  },
  {
    type: 'checkbox' as const,
    label: 'Checkbox',
    icon: CheckSquare,
    description: 'Caixa de seleção'
  },
  {
    type: 'date' as const,
    label: 'Data',
    icon: Calendar,
    description: 'Seletor de data'
  }
]

const getFieldIcon = (type: string) => {
  const fieldType = fieldTypes.find(ft => ft.type === type)
  return fieldType?.icon || Type
}

const getFieldLabel = (type: string) => {
  const fieldType = fieldTypes.find(ft => ft.type === type)
  return fieldType?.label || 'Campo'
}

export function FormFieldEditor({ fields, onAdd, onUpdate, onRemove }: FormFieldEditorProps) {
  const [showAddField, setShowAddField] = useState(false)
  const [newField, setNewField] = useState<Omit<FormField, 'id'>>({
    type: 'text',
    label: '',
    placeholder: '',
    required: false
  })

  const handleAddField = () => {
    if (newField.label.trim()) {
      onAdd(newField)
      setNewField({
        type: 'text',
        label: '',
        placeholder: '',
        required: false
      })
      setShowAddField(false)
    }
  }

  const handleFieldTypeChange = (type: FormField['type']) => {
    setNewField(prev => ({
      ...prev,
      type,
      placeholder: type === 'select' ? '' : prev.placeholder,
      options: type === 'select' ? ['Opção 1', 'Opção 2'] : undefined
    }))
  }

  const handleOptionChange = (index: number, value: string) => {
    if (newField.options) {
      const newOptions = [...newField.options]
      newOptions[index] = value
      setNewField(prev => ({ ...prev, options: newOptions }))
    }
  }

  const handleAddOption = () => {
    if (newField.options) {
      setNewField(prev => ({
        ...prev,
        options: [...(prev.options || []), `Opção ${(prev.options?.length || 0) + 1}`]
      }))
    }
  }

  const handleRemoveOption = (index: number) => {
    if (newField.options && newField.options.length > 1) {
      const newOptions = newField.options.filter((_, i) => i !== index)
      setNewField(prev => ({ ...prev, options: newOptions }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Campos do Formulário
        </h3>
        <p className="text-gray-600 text-sm">
          Adicione e configure os campos que aparecerão no formulário
        </p>
      </div>

      {/* Add New Field */}
      {!showAddField ? (
        <Button
          onClick={() => setShowAddField(true)}
          className="w-full flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Campo
        </Button>
      ) : (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Novo Campo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Field Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Campo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {fieldTypes.map((fieldType) => {
                  const Icon = fieldType.icon
                  return (
                    <button
                      key={fieldType.type}
                      onClick={() => handleFieldTypeChange(fieldType.type)}
                      className={`
                        flex items-center gap-2 p-3 rounded-lg border text-left transition-colors
                        ${newField.type === fieldType.type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      <div>
                        <div className="text-sm font-medium">{fieldType.label}</div>
                        <div className="text-xs text-gray-500">{fieldType.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Field Label */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rótulo do Campo
              </label>
              <input
                type="text"
                value={newField.label}
                onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Ex: Nome, Email, Telefone..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Placeholder */}
            {newField.type !== 'select' && newField.type !== 'checkbox' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Placeholder
                </label>
                <input
                  type="text"
                  value={newField.placeholder}
                  onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                  placeholder="Texto que aparece dentro do campo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Options for Select */}
            {newField.type === 'select' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opções
                </label>
                <div className="space-y-2">
                  {newField.options?.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {newField.options && newField.options.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveOption(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Opção
                  </Button>
                </div>
              </div>
            )}

            {/* Required */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required"
                checked={newField.required}
                onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="required" className="text-sm font-medium text-gray-700">
                Campo obrigatório
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleAddField}
                disabled={!newField.label.trim()}
                className="flex-1"
              >
                Adicionar Campo
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddField(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Fields */}
      <div className="space-y-3">
        {fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Type className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Nenhum campo adicionado ainda</p>
            <p className="text-xs text-gray-400">Clique em "Adicionar Campo" para começar</p>
          </div>
        ) : (
          fields.map((field, index) => {
            const Icon = getFieldIcon(field.type)
            return (
              <Card key={field.id} className="group hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{field.label}</span>
                          {field.required && (
                            <Badge variant="destructive" className="text-xs">
                              Obrigatório
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {getFieldLabel(field.type)}
                          </Badge>
                        </div>
                        {field.placeholder && (
                          <p className="text-sm text-gray-500 mt-1">
                            Placeholder: "{field.placeholder}"
                          </p>
                        )}
                        {field.options && (
                          <p className="text-sm text-gray-500 mt-1">
                            {field.options.length} opções
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdate(field.id, { required: !field.required })}
                        className="h-8 w-8 p-0"
                      >
                        {field.required ? '✓' : '○'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemove(field.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
