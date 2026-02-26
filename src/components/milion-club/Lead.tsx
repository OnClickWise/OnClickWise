"use client"

import Image from "next/image"
import {
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Brain,
  Sparkles
} from "lucide-react"
import { motion } from "framer-motion"
import { ReactNode } from "react"

export function Lead() {
  return (
    <section id="lead" className="py-28 px-4 relative overflow-hidden">

      {/* Glow decorativo */}
      <div className="absolute -top-40 right-0 opacity-20">
        <Sparkles size={260} className="text-yellow-400" />
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">

        {/* Imagem */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Image
            src="/million-club/milion-club-logo.png"
            alt="Million Club"
            width={600}
            height={400}
            priority
            className="
              rounded-3xl shadow-2xl
              brightness-90 contrast-110 saturate-125
              border border-gray-800
            "
          />
        </motion.div>

        {/* Conteúdo */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Título */}
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            O que você vai aprender no
            <span className="text-yellow-400"> Million Club</span>?
          </h2>

          {/* Copy */}
          <p className="text-gray-300 leading-relaxed text-lg">
            Aqui você não compra promessas.
            <span className="text-white font-semibold">
              {" "}Você aprende estratégias aplicáveis
            </span>,
            gestão de risco e mentalidade de longo prazo
            para operar no DeFi de forma profissional.
          </p>

          <p className="text-gray-400">
            Tudo focado em consistência,
            disciplina e construção de patrimônio real.
          </p>

          {/* Benefícios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <Benefit icon={<TrendingUp />} text="Estratégias que funcionam no mundo real" />
            <Benefit icon={<ShieldCheck />} text="Gestão de risco profissional" />
            <Benefit icon={<Brain />} text="Mentalidade vencedora e foco" />
          </div>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() =>
              document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" })
            }
            className="
              mt-6 inline-flex items-center gap-2
              bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500
              text-black px-7 py-3 rounded-xl font-bold
              shadow-xl
            "
          >
            Quero participar <ArrowRight />
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

function Benefit({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="
        flex items-center gap-3
        bg-gray-900/70 backdrop-blur
        border border-gray-800
        rounded-xl px-4 py-3
      "
    >
      <span className="text-yellow-400">{icon}</span>
      <span className="text-gray-200 text-sm font-medium">{text}</span>
    </motion.div>
  )
}
