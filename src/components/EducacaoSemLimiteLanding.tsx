"use client"

import React, { useState, useEffect } from 'react'
import { Mail, Phone, Book, ArrowRight, Laptop, Briefcase, BookOpen, ChevronDown, User, X } from 'lucide-react'
import { apiService, CreateLeadRequest } from '@/lib/api'
import Image from 'next/image'

interface EducacaoSemLimiteLandingProps {
  orgSlug: string
}

export function EducacaoSemLimiteLanding({ orgSlug }: EducacaoSemLimiteLandingProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    whatsapp: '',
    company: '',
    cursos: [] as string[],
    unidade: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  // Forçar tema escuro e buscar organização
  useEffect(() => {
    // Forçar tema escuro
    document.documentElement.classList.add('dark')
    
    // Adicionar estilos para autofill
    const styleId = 'autofill-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        /* Estilos para autofill do navegador - mantém tema escuro */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active,
        select:-webkit-autofill,
        select:-webkit-autofill:hover,
        select:-webkit-autofill:focus,
        select:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px transparent inset !important;
          -webkit-text-fill-color: white !important;
          caret-color: white !important;
          background-color: transparent !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        /* Para Chrome/Safari */
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
          -webkit-text-fill-color: white !important;
          caret-color: white !important;
        }

        /* Para Firefox */
        input:-moz-autofill {
          background-color: transparent !important;
          color: white !important;
        }

        /* Garantir que o texto fique visível após autofill */
        input[value]:not([value=""]),
        input:not(:placeholder-shown) {
          color: white !important;
          -webkit-text-fill-color: white !important;
        }
      `
      document.head.appendChild(style)
    }
    
    // Buscar informações da organização pelo slug
    const fetchOrganization = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/auth/check-company-by-slug`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slug: orgSlug }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.company) {
            setOrganizationId(result.company.id)
          }
        }
      } catch (error) {
        console.error('Erro ao buscar organização:', error)
      }
    }

    fetchOrganization()

    // Cleanup: remover tema escuro quando componente desmontar (opcional)
    return () => {
      // Não remover o tema escuro automaticamente para manter consistência
    }
  }, [orgSlug])

  // Função para scroll suave
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      const headerOffset = 80 // Ajuste para compensar o header fixo
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  // Função para formatar número de telefone brasileiro (apenas DDD + número)
  const formatPhoneNumber = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Remove código do país se estiver presente (55 no início)
    let phoneNumbers = numbers
    if (phoneNumbers.startsWith('55') && phoneNumbers.length > 11) {
      phoneNumbers = phoneNumbers.slice(2)
    }
    
    // Limita a 11 dígitos (DDD + 9 dígitos do número brasileiro)
    const limitedNumbers = phoneNumbers.slice(0, 11)
    
    // Formata baseado no tamanho (apenas DDD + número, sem código do país)
    if (limitedNumbers.length === 0) return ''
    if (limitedNumbers.length <= 2) {
      return limitedNumbers
    }
    if (limitedNumbers.length <= 9) {
      // 11 12345 ou 11 98857
      return `${limitedNumbers.slice(0, 2)} ${limitedNumbers.slice(2)}`
    }
    // Formato completo: 11 12345-6789 ou 11 98857-4156
    // Sempre formata com 5 dígitos antes do traço e 4 depois
    return `${limitedNumbers.slice(0, 2)} ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7, 11)}`
  }

  // Função para remover formatação e adicionar código do país
  const formatPhoneForDatabase = (value: string): string => {
    // Remove tudo que não é número
    let numbers = value.replace(/\D/g, '')
    
    // Remove código do país se estiver presente (55 no início)
    if (numbers.startsWith('55') && numbers.length > 11) {
      numbers = numbers.slice(2)
    }
    
    // Limita a 11 dígitos e adiciona código do país
    const phoneDigits = numbers.slice(0, 11)
    
    // Se tiver menos de 11 dígitos, retorna como está (será validado no backend)
    if (phoneDigits.length < 11) {
      return phoneDigits
    }
    
    // Adiciona código do país +55
    return `55${phoneDigits}`
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Se for o campo whatsapp, formata o número
    if (name === 'whatsapp') {
      const formatted = formatPhoneNumber(value)
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleCourseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCourse = e.target.value
    
    // Permitir seleção mesmo se for o último curso disponível
    if (selectedCourse && selectedCourse !== '' && selectedCourse !== 'Selecione um curso' && !formData.cursos.includes(selectedCourse)) {
      const newCursos = [...formData.cursos, selectedCourse]
      
      // Limpar validação imediatamente antes de atualizar o estado
      const selectElement = e.target
      if (selectElement) {
        selectElement.setCustomValidity('')
        // Forçar o navegador a reconhecer que o campo agora é válido
        selectElement.checkValidity()
      }
      
      setFormData(prev => ({
        ...prev,
        cursos: newCursos
      }))
      
      // Reset select após um pequeno delay para garantir que o React processou a mudança
      setTimeout(() => {
        const selectElement = document.getElementById('curso') as HTMLSelectElement
        if (selectElement) {
          selectElement.value = ''
          // Garantir que a validação permanece limpa após reset
          selectElement.setCustomValidity('')
        }
      }, 0)
    }
  }

  const removeCourse = (courseToRemove: string) => {
    setFormData(prev => {
      const newCursos = prev.cursos.filter(c => c !== courseToRemove)
      // Atualizar validação baseada no número de cursos
      const cursoSelect = document.getElementById('curso') as HTMLSelectElement
      if (cursoSelect) {
        if (newCursos.length === 0) {
          cursoSelect.setCustomValidity('Por favor, selecione pelo menos um curso.')
        } else {
          cursoSelect.setCustomValidity('')
        }
      }
      return {
        ...prev,
        cursos: newCursos
      }
    })
  }

  // Atualizar validação sempre que cursos mudarem
  useEffect(() => {
    const cursoSelect = document.getElementById('curso') as HTMLSelectElement
    if (cursoSelect) {
      if (formData.cursos.length === 0) {
        // Só definir validação se realmente não houver cursos
        cursoSelect.setCustomValidity('Por favor, selecione pelo menos um curso.')
      } else {
        // Limpar validação e forçar reconhecimento de válido
        cursoSelect.setCustomValidity('')
        cursoSelect.checkValidity()
      }
    }
  }, [formData.cursos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validar cursos usando a API de validação do navegador ANTES de setar loading
    if (formData.cursos.length === 0) {
      const cursoSelect = document.getElementById('curso') as HTMLSelectElement
      if (cursoSelect) {
        // Garantir que a validação personalizada está definida
        cursoSelect.setCustomValidity('Por favor, selecione pelo menos um curso.')
        cursoSelect.reportValidity()
      }
      return
    }
    
    setLoading(true)

    try {

      // Se não tiver organizationId ainda, tentar buscar novamente
      let orgId = organizationId
      if (!orgId) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        const orgResponse = await fetch(`${apiUrl}/auth/check-company-by-slug`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slug: orgSlug }),
        })

        if (orgResponse.ok) {
          const orgResult = await orgResponse.json()
          if (orgResult.success && orgResult.company) {
            orgId = orgResult.company.id
            setOrganizationId(orgId)
          }
        }
      }

      if (!orgId) {
        setError('Erro ao identificar a organização. Por favor, recarregue a página e tente novamente.')
        setLoading(false)
        return
      }

      // Preparar dados do lead
      // Formata o telefone para o banco (adiciona código do país +55)
      const phoneForDatabase = formatPhoneForDatabase(formData.whatsapp)

      const cursosText = formData.cursos.join(',')
      const cursosDetalhados = formData.cursos.map((curso, index) => 
        `  ${index + 1}. ${curso}`
      ).join('\n')
      
      const leadData: CreateLeadRequest = {
        name: formData.name.trim(),
        email: formData.email,
        phone: phoneForDatabase,
        source: 'Landing Page - Educação Sem Limite',
        status: 'New',
        location: formData.unidade,
        interest: cursosText,
        description: `Empresa: ${formData.company || 'Não informado'}\nUnidade: ${formData.unidade}\n\nCursos selecionados nesta ordem:\n${cursosDetalhados}`,
        show_on_pipeline: false
      }

      // Criar lead usando a API pública para landing pages
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      
      const response = await fetch(`${apiUrl}/leads/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...leadData,
          organization_id: orgId
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(true)
        setFormData({
          email: '',
          name: '',
          whatsapp: '',
          company: '',
          cursos: [],
          unidade: ''
        })
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' })
        // Esconder mensagem de sucesso após 5 segundos
        setTimeout(() => setSuccess(false), 5000)
      } else {
        // Tratar erro de rate limiting especificamente
        if (response.status === 429) {
          const errorMessage = result.error || 'Muitas requisições. Aguarde um momento antes de tentar novamente.'
          setError(errorMessage)
        } else {
          setError(result.error || result.message || 'Erro ao enviar inscrição. Tente novamente.')
        }
      }
    } catch (err: any) {
      console.error('Erro ao enviar inscrição:', err)
      setError('Erro ao enviar inscrição. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dark bg-gray-900 min-h-screen">
      {/* Header com texto scrolling */}
      <header className="fixed top-0 left-0 right-0 w-full overflow-hidden border-b border-red-400 bg-red-700 border-red-700 z-50">
        <div className="w-full border-t border-red-600">
          <p className="scroll-text text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white whitespace-nowrap px-2 sm:px-4 py-1 sm:py-2">
            🚨 Alerta! Grande oportunidade. Cursos gratuitos com a Educação sem Limites nas regiões da Lapa e Guarulhos
          </p>
        </div>
      </header>

      {/* Mensagem de sucesso */}
      {success && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg">
          <p className="font-semibold">Inscrição enviada com sucesso! Entraremos em contato em breve.</p>
        </div>
      )}

      {/* Hero Section */}
      <section id="home" className="bg-gray-900 pt-16 sm:pt-20">
        <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12">
          {/* Alerta */}
          <a
            href="#resources"
            onClick={(e) => handleSmoothScroll(e, 'resources')}
            className="inline-flex flex-wrap justify-between items-center py-1 px-2 sm:px-4 pr-4 mb-7 text-xs sm:text-sm md:text-base text-white bg-red-800 rounded-full hover:bg-red-700 active:bg-red-900 transition cursor-pointer"
            role="alert"
          >
            <span className="font-medium flex items-center gap-2">
              💡 Quer transformar sua carreira e alcançar novos objetivos?
            </span>
            <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
          </a>

          {/* Título */}
          <h1 className="mb-4 text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-snug sm:leading-tight text-white">
            Com a
            <span className="text-red-400"> Educação Sem Limites,</span>
            Você pode acessar Cursos Profissionalizantes na Região da Lapa e Guarulhos
            <br />
            <span className="text-red-400">100% GRATUITOS</span>!
            <br />
            Garanta já sua vaga e transforme o seu futuro!
          </h1>

          {/* Subtexto */}
          <p className="mb-4 text-base sm:text-lg md:text-xl font-normal text-gray-400 sm:px-4 md:px-8 lg:px-24">
            Se você deseja crescer, conquistar novas oportunidades e dar o próximo
            passo rumo ao sucesso, essa é a sua chance!
          </p>
          <span className="block font-bold mb-8 text-sm sm:text-base md:text-lg text-white">
            Não deixe essa oportunidade passar — o seu futuro começa agora!
          </span>

          {/* Botões */}
          <div className="flex flex-col mb-8 mt-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
            <a
              href="#resources"
              onClick={(e) => handleSmoothScroll(e, 'resources')}
              className="inline-flex justify-center items-center py-3 px-5 text-sm sm:text-base font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:ring-4 focus:ring-blue-800 transition cursor-pointer transform hover:scale-105 active:scale-95"
            >
              Saiba mais
              <ArrowRight className="ml-2 -mr-1 w-4 h-4 sm:w-5 sm:h-5" />
            </a>
            <a
              href="#formulario"
              onClick={(e) => handleSmoothScroll(e, 'formulario')}
              className="inline-flex justify-center items-center py-3 px-5 text-sm sm:text-base font-medium text-center text-white rounded-lg border border-gray-700 hover:bg-gray-700 active:bg-gray-800 focus:ring-4 focus:ring-gray-800 transition cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <Book className="mr-2 -ml-1 w-4 h-4 sm:w-5 sm:h-5" />
              Ver cursos
            </a>
          </div>

          {/* Bloco de Principais Cursos */}
          <div className="px-2 sm:px-4 mx-auto text-center md:max-w-screen-md lg:max-w-screen-lg pt-8">
            <span className="block font-semibold text-xs sm:text-sm md:text-base text-gray-400 uppercase tracking-widest">
              Principais Áreas
            </span>

            <div className="flex flex-wrap justify-center items-center mt-6 gap-4 sm:gap-6 md:gap-8 text-gray-300">
              <a
                href="#formulario"
                onClick={(e) => handleSmoothScroll(e, 'formulario')}
                className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl md:text-2xl font-bold hover:text-blue-400 active:text-blue-500 transition cursor-pointer transform hover:scale-110 active:scale-95"
              >
                <Laptop className="w-6 h-6 sm:w-8 sm:h-8" />
                Tecnologia
              </a>

              <a
                href="#formulario"
                onClick={(e) => handleSmoothScroll(e, 'formulario')}
                className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl md:text-2xl font-bold hover:text-green-400 active:text-green-500 transition cursor-pointer transform hover:scale-110 active:scale-95"
              >
                <Briefcase className="w-6 h-6 sm:w-8 sm:h-8" />
                Administração
              </a>

              <a
                href="#formulario"
                onClick={(e) => handleSmoothScroll(e, 'formulario')}
                className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl md:text-2xl font-bold hover:text-purple-400 active:text-purple-500 transition cursor-pointer transform hover:scale-110 active:scale-95"
              >
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" />
                Línguas
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="resources" className="bg-gray-900">
        <div className="gap-8 items-center py-8 px-4 mx-auto max-w-screen-xl md:grid md:grid-cols-2 xl:gap-16 sm:py-16 lg:px-6">
          {/* Imagem */}
          <div className="w-full overflow-visible relative">
            {/* Container da imagem com formato circular na esquerda */}
            <div 
              className="relative w-full rounded-lg md:rounded-l-[9999px] md:rounded-r-lg overflow-hidden"
              style={{
                boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3), 0 20px 60px rgba(59, 130, 246, 0.2)',
              }}
            >
              <Image
                src="/educacao-sem-limite/image.jpg"
                alt="Educação Sem Limite"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  // Fallback se imagem não existir
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
            
            {/* Contorno que segue exatamente o formato da imagem - mesmos border-radius */}
            <div 
              className="absolute pointer-events-none z-10 hidden md:block rounded-lg md:rounded-l-[9999px] md:rounded-r-lg"
              style={{
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
                border: '3px solid rgba(96, 165, 250, 0.9)',
                boxShadow: `
                  0 0 20px rgba(96, 165, 250, 0.8),
                  0 0 40px rgba(96, 165, 250, 0.6),
                  0 0 60px rgba(96, 165, 250, 0.4)
                `,
              }}
            ></div>
          </div>

          {/* Conteúdo */}
          <div className="mt-6 md:mt-0 text-center md:text-left">
            <h2 className="mb-4 text-2xl sm:text-3xl md:text-4xl tracking-tight font-extrabold text-white">
              O que esperar dos nossos cursos?
            </h2>

            <p className="mb-6 text-sm sm:text-base md:text-lg font-medium text-gray-300 leading-relaxed">
              Nossos cursos vão muito além da sala de aula. Ao concluir, você estará
              preparado para entrar no mercado de trabalho com
              <span className="font-bold text-blue-400"> habilidades práticas</span>,
              <span className="font-bold text-green-400"> experiência aplicada</span>
              e a confiança necessária para conquistar a sua vaga dos sonhos.
              <br /><br />
              Aprenda com especialistas, desenvolva competências valorizadas e
              esteja pronto para dar o próximo passo rumo à sua
              <span className="font-bold text-yellow-400"> carreira de sucesso</span>.
            </p>

            {/* Botão */}
            <div className="flex justify-center md:justify-start">
              <a
                href="#formulario"
                onClick={(e) => handleSmoothScroll(e, 'formulario')}
                className="inline-flex items-center text-white bg-red-600 hover:bg-red-500 active:bg-red-700 focus:ring-4 focus:ring-red-800 
          font-medium rounded-lg text-sm sm:text-base px-5 py-2.5 text-center transition cursor-pointer transform hover:scale-105 active:scale-95"
              >
                Fazer inscrição
                <ArrowRight className="ml-2 -mr-1 w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Formulário Section */}
      <section id="formulario" className="bg-gray-900 py-12 flex justify-center items-center">
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
          {/* Título e descrição */}
          <div className="max-w-screen-md mx-auto mb-12 text-center">
            <h2 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
              FAÇA A SUA INSCRIÇÃO — <span className="text-red-400">100% Gratuita</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg">
              Preencha o formulário abaixo para garantir sua vaga no curso desejado. Estamos prontos para
              ajudar você a desenvolver suas habilidades e impulsionar sua carreira!
              <br className="hidden sm:block" />
              <span className="font-semibold">Atenção:</span> a inscrição é de acordo com as vagas disponíveis. Corra!
            </p>
          </div>

          {/* Formulário */}
          <form
            onSubmit={handleSubmit}
            className="bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-10 max-w-2xl mx-auto space-y-6 border border-gray-700"
          >
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="relative z-0 w-full group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 z-10">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder=" "
                required
                className="block py-2.5 pl-10 pr-0 w-full text-sm sm:text-base text-white bg-transparent border-0 border-b-2 border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-blue-500 peer autofill:text-white autofill:bg-transparent"
              />
              <label
                htmlFor="email"
                onClick={() => document.getElementById('email')?.focus()}
                className="absolute text-sm sm:text-base text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 left-10 origin-[0] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-400 z-0 peer-placeholder-shown:cursor-text cursor-text"
              >
                Email
              </label>
            </div>

            {/* Nome Completo */}
            <div className="relative z-0 w-full group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 z-10">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                name="name"
                id="name"
                autoComplete="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder=" "
                required
                className="block py-2.5 pl-10 pr-0 w-full text-sm sm:text-base text-white bg-transparent border-0 border-b-2 border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-blue-500 peer autofill:text-white autofill:bg-transparent"
              />
              <label
                htmlFor="name"
                onClick={() => document.getElementById('name')?.focus()}
                className="absolute text-sm sm:text-base text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 left-10 origin-[0] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-400 z-0 peer-placeholder-shown:cursor-text cursor-text"
              >
                Nome Completo
              </label>
            </div>

            {/* WhatsApp e Empresa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative z-0 w-full group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 z-10">
                  <Phone className="w-5 h-5" />
                </span>
                <input
                  type="tel"
                  name="whatsapp"
                  id="whatsapp"
                  autoComplete="tel"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  placeholder=" "
                  maxLength={14}
                  required
                  className="block py-2.5 pl-10 pr-0 w-full text-sm sm:text-base text-white bg-transparent border-0 border-b-2 border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-blue-500 peer autofill:text-white autofill:bg-transparent"
                />
                <label
                  htmlFor="whatsapp"
                  onClick={() => document.getElementById('whatsapp')?.focus()}
                  className="absolute text-sm sm:text-base text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 left-10 origin-[0] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-400 z-0 peer-placeholder-shown:cursor-text cursor-text"
                >
                  WhatsApp
                </label>
              </div>
              <div className="relative z-0 w-full group">
                <input
                  type="text"
                  name="company"
                  id="company"
                  autoComplete="organization"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder=" "
                  className="block py-2.5 px-0 w-full text-sm sm:text-base text-white bg-transparent border-0 border-b-2 border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-blue-500 peer autofill:text-white autofill:bg-transparent"
                />
                <label
                  htmlFor="company"
                  onClick={() => document.getElementById('company')?.focus()}
                  className="absolute text-sm sm:text-base text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 origin-[0] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-400 peer-placeholder-shown:cursor-text cursor-text"
                >
                  Empresa (Opcional)
                </label>
              </div>
            </div>

            {/* Cursos - Seleção com Select */}
            <div className="relative z-0 w-full group">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 z-10">
                  <Book className="w-5 h-5" />
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 z-10">
                  <ChevronDown className="w-5 h-5" />
                </span>
                <select
                  id="curso"
                  name="curso"
                  autoComplete="off"
                  value=""
                  onChange={handleCourseSelect}
                  className="block w-full pl-14 pr-10 py-2.5 sm:py-3 text-sm sm:text-base text-white bg-gray-700 border-0 
            border-b-2 border-gray-600 rounded-sm appearance-none focus:outline-none focus:ring-0 focus:border-blue-500 peer cursor-pointer autofill:text-white autofill:bg-gray-700"
                  style={{ paddingLeft: '3.5rem', color: formData.cursos.length > 0 ? 'white' : 'rgba(156, 163, 175, 0.8)' }}
                >
                  {(() => {
                    const todosOsCursos = [
                      'Inglês',
                      'Informática',
                      'Excel Avançado',
                      'Atendente de Farmácia',
                      'Manutenção de Computadores',
                      'Designer Gráfico',
                      'Programador Profissional',
                      'Web Designer',
                      'Animador 3D',
                      'Gestão Empresarial',
                      'Desenvolvedor de Games',
                      'YouTuber',
                      'Operador de Caixa',
                      'Analista de Marketing',
                      'Gestão de Pessoas',
                      'Assistente Contábil',
                      'Agente de Vendas',
                      'Telemarketing',
                      'Recursos Humanos',
                      'Hotelaria',
                      'Turismo',
                      'Robótica',
                      'Manutenção de Celulares',
                      'Outros'
                    ]
                    
                    const cursosDisponiveis = todosOsCursos.filter(curso => !formData.cursos.includes(curso))
                    
                    if (cursosDisponiveis.length === 0) {
                      return <option value="" disabled>Todos os cursos selecionados</option>
                    }
                    
                    return (
                      <>
                        <option value="" disabled style={{ color: 'rgba(156, 163, 175, 0.8)' }}>
                          Selecione um curso
                        </option>
                        {cursosDisponiveis.map((curso) => (
                          <option key={curso} value={curso} style={{ color: 'white' }}>{curso}</option>
                        ))}
                      </>
                    )
                  })()}
                </select>
              </div>
              
              {/* Cursos Selecionados - Chips */}
              {formData.cursos.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {formData.cursos.map((curso) => (
                    <div
                      key={curso}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-full"
                    >
                      <span>{curso}</span>
                      <button
                        type="button"
                        onClick={() => removeCourse(curso)}
                        className="hover:bg-blue-700 rounded-full p-0.5 transition cursor-pointer"
                        aria-label={`Remover ${curso}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unidade */}
            <div className="relative z-0 w-full group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 z-10">
                <Book className="w-5 h-5" />
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 z-10">
                <ChevronDown className="w-5 h-5" />
              </span>
              <select
                id="unidade"
                name="unidade"
                autoComplete="off"
                value={formData.unidade}
                onChange={handleInputChange}
                required
                className="block w-full pl-14 pr-10 py-2.5 sm:py-3 text-sm sm:text-base text-white bg-gray-700 border-0 
          border-b-2 border-gray-600 rounded-sm appearance-none focus:outline-none focus:ring-0 focus:border-blue-500 peer cursor-pointer autofill:text-white autofill:bg-gray-700"
                style={{ paddingLeft: '3.5rem', color: formData.unidade ? 'white' : 'rgba(156, 163, 175, 0.8)' }}
              >
                <option value="" disabled style={{ color: 'rgba(156, 163, 175, 0.8)' }}>Selecione uma Unidade</option>
                <option style={{ color: 'white' }}>Unidade da Lapa</option>
                <option style={{ color: 'white' }}>Unidade de Guarulhos</option>
              </select>
            </div>

            {/* Botão */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto sm:max-w-xs py-3 mt-4 px-6 text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-4 
          focus:outline-none focus:ring-red-800 font-medium rounded-lg text-sm sm:text-base transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transform hover:scale-105 active:scale-95 disabled:transform-none disabled:hover:scale-100"
              >
                {loading ? 'Enviando...' : 'Enviar Inscrição'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 md:p-10 bg-gray-800">
        <div className="mx-auto max-w-screen-xl text-center">
          {/* Logo / Marca */}
          <a
            href="#"
            aria-label="Educação Sem Limites"
            className="flex justify-center items-center text-2xl font-semibold text-white"
          >
            Educação Sem Limites
          </a>

          {/* Texto principal */}
          <p className="my-6 text-gray-400 leading-relaxed">
            Nossos cursos vão muito além da sala de aula. Ao concluir, você estará
            preparado para entrar no mercado de trabalho com
            <span className="font-bold text-blue-400"> habilidades práticas</span>,
            <span className="font-bold text-green-400"> experiência aplicada</span>
            e a confiança necessária para conquistar a sua vaga dos sonhos.
            <br /><br />
            Aprenda com especialistas, desenvolva competências valorizadas e
            esteja pronto para dar o próximo passo rumo à sua
            <span className="font-bold text-yellow-400"> carreira de sucesso</span>.
          </p>

          {/* Links úteis */}
          <div className="flex justify-center space-x-6 mb-6 text-gray-300">
            <a href="#resources" onClick={(e) => handleSmoothScroll(e, 'resources')} className="hover:text-blue-400 active:text-blue-500 transition cursor-pointer">Sobre</a>
            <a href="#formulario" onClick={(e) => handleSmoothScroll(e, 'formulario')} className="hover:text-blue-400 active:text-blue-500 transition cursor-pointer">Cursos</a>
            <a href="#formulario" onClick={(e) => handleSmoothScroll(e, 'formulario')} className="hover:text-blue-400 active:text-blue-500 transition cursor-pointer">Contato</a>
          </div>

          {/* Linha divisória */}
          <hr className="my-6 border-gray-700" />

          {/* Direitos autorais */}
          <span className="text-sm text-gray-400 sm:text-center">
            © 2025
            <a href="#" className="hover:underline font-medium"> Educação Sem Limites™</a>.
            Todos os direitos reservados.
          </span>
        </div>
      </footer>

    </div>
  )
}

