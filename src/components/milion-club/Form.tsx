"use client"

import { useEffect, useState } from "react"
import { Mail, Phone, User, Coins, Layers, Sparkles, X } from "lucide-react"
import { motion } from "framer-motion"
import { CreateLeadRequest } from "@/services/LeadService"
import { getApiBaseUrl } from "@/lib/api-url"


interface Props {
  orgSlug: string
  onSuccess: () => void
}

const trilhas = [
  "DeFi para Iniciantes",
  "Renda Passiva com Cripto",
  "Trading Estratégico",
  "Airdrops & Early Access",
  "Mentalidade Milionária",
  "Gestão de Risco",
  "Comunidade VIP"
]

export function Form({ orgSlug, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    whatsapp: "",
    capital: "",
    trilhas: [] as string[],
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [loadingOrg, setLoadingOrg] = useState(true)

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const apiUrl = getApiBaseUrl()
        const fullUrl = `${apiUrl}/auth/check-company-by-slug`
        
        // Debug
        if (typeof window !== 'undefined') {
          (window as any).DEBUG_MILLION_CLUB = {
            apiBaseUrl: apiUrl,
            fullUrl: fullUrl,
            orgSlug: orgSlug,
            apiUrlEnv: process.env.NEXT_PUBLIC_API_URL,
          }
        }
        
        const res = await fetch(fullUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: orgSlug }),
        })

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const data = await res.json()
        if (data?.company?.id) {
          setOrganizationId(data.company.id)
        } else {
          setError("Organização não encontrada")
        }
      } catch (err: any) {
        setError(`Erro ao carregar organização: ${err.message}`)
      } finally {
        setLoadingOrg(false)
      }
    }

    fetchOrg()
  }, [orgSlug])

  const formatPhone = (v: string) =>
    v.replace(/\D/g, "").slice(0, 11)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!organizationId) {
      setError("Aguarde o carregamento da organização...")
      return
    }

    if (formData.trilhas.length === 0) {
      setError("Selecione pelo menos uma trilha de interesse")
      return
    }

    setLoading(true)
    setError("")

    try {
      const lead: CreateLeadRequest = {
        name: formData.name,
        email: formData.email,
        phone: `55${formatPhone(formData.whatsapp)}`,
        source: "Landing Page - Million Club",
        status: "New",
        interest: formData.trilhas.join(","),
        description: `Capital inicial: ${formData.capital || "Não informado"}`,
        show_on_pipeline: true,
      }

      const res = await fetch(`${getApiBaseUrl()}/leads/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, organization_id: organizationId }),
      })

      if (res.ok) {
        onSuccess()
        setFormData({ email: "", name: "", whatsapp: "", capital: "", trilhas: [] })
      } else {
        const errText = await res.text()
        setError(`Erro ao enviar inscrição: ${res.status} - ${errText}`)
      }
    } catch (err: any) {
      setError(`Erro inesperado: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.section
      id="formulario"
      className="py-28 px-4"
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.form
        onSubmit={handleSubmit}
        initial={{ scale: 0.96 }}
        whileInView={{ scale: 1 }}
        transition={{ duration: 0.6 }}
        className="
          max-w-2xl mx-auto space-y-6 rounded-3xl
          bg-gray-900/80 backdrop-blur-xl
          border border-gray-800
          p-10 shadow-2xl
        "
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center gap-2 text-yellow-400">
            <Sparkles />
            <Layers />
          </div>

          <h3 className="text-3xl font-extrabold">
            Entrar no <span className="text-yellow-400">Million Club</span>
          </h3>

          <p className="text-gray-400 text-sm">
            Comunidade exclusiva focada em DeFi, renda e mentalidade milionária
          </p>
        </div>

        {error && <p className="text-red-400 text-center">{error}</p>}

        <Input
          icon={<Mail />}
          placeholder="Email"
          value={formData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(p => ({ ...p, email: e.target.value }))
          }
        />
        <Input
          icon={<User />}
          placeholder="Nome completo"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(p => ({ ...p, name: e.target.value }))
          }
        />
        <Input
          icon={<Phone />}
          placeholder="WhatsApp"
          value={formData.whatsapp}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(p => ({ ...p, whatsapp: e.target.value }))
          }
        />
        <Input
          icon={<Coins />}
          placeholder="Capital inicial (opcional)"
          value={formData.capital}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(p => ({ ...p, capital: e.target.value }))
          }
        />

        {/* Trilhas */}
        <div className="space-y-3">
          <label className="text-sm text-gray-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-yellow-400" />
            Trilhas de interesse
          </label>

          <select
            onChange={(e) =>
              !formData.trilhas.includes(e.target.value) &&
              setFormData(p => ({
                ...p,
                trilhas: [...p.trilhas, e.target.value],
              }))
            }
            className="
              w-full bg-gray-800/70 border border-gray-700
              p-3 rounded-xl text-white
              focus:ring-2 focus:ring-yellow-500
            "
          >
            <option value="">Selecione uma trilha</option>
            {trilhas.filter(t => !formData.trilhas.includes(t)).map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2">
            {formData.trilhas.map(t => (
              <motion.span
                key={t}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="
                  bg-gradient-to-r from-yellow-400 to-amber-500
                  text-black px-4 py-1.5 rounded-full
                  flex items-center gap-2 font-medium
                "
              >
                {t}
                <X
                  className="w-4 h-4 cursor-pointer hover:opacity-70"
                  onClick={() =>
                    setFormData(p => ({
                      ...p,
                      trilhas: p.trilhas.filter(x => x !== t),
                    }))
                  }
                />
              </motion.span>
            ))}
          </div>
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={loading || loadingOrg || !organizationId}
          className={`
            w-full py-4 rounded-xl font-bold text-black
            bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500
            shadow-xl
            ${(loading || loadingOrg) ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          {loadingOrg ? "Carregando..." : loading ? "Enviando..." : "Confirmar acesso"}
        </motion.button>
      </motion.form>
    </motion.section>
  )
}

function Input({ icon, ...props }: any) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-3 text-gray-400">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`
          w-full py-3 bg-transparent text-white
          border-b border-gray-700 outline-none
          ${icon ? "pl-10" : "pl-3"}
          focus:border-yellow-400 transition
        `}
      />
    </div>
  )
}
