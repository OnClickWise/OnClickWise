"use client"

import { ArrowRight, Laptop, Briefcase, BookOpen, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (!el) return
  const offset = el.getBoundingClientRect().top + window.scrollY - 80
  window.scrollTo({ top: offset, behavior: "smooth" })
}

export function Hero() {
  return (
    <section className="pt-32 pb-24 px-4 text-center relative overflow-hidden">
      
      {/* Detalhe decorativo */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 opacity-20">
        <Sparkles size={220} className="text-yellow-400" />
      </div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight"
      >
        Bem-vindo ao
        <span className="text-yellow-400 drop-shadow-[0_0_12px_rgba(255,215,0,0.4)]">
          {" "}Million Club DeFi
        </span>
        <br />
        Rumo ao seu primeiro
        <span className="text-yellow-400"> milhão no DeFi</span>
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="mt-6 text-gray-400 max-w-3xl mx-auto text-lg"
      >
        Aprenda estratégias reais de cripto, DeFi e renda digital.
        Uma comunidade focada em crescimento financeiro,
        mentalidade vencedora e execução.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => scrollTo("formulario")}
          className="
            bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500
            text-black px-7 py-3 rounded-xl font-bold
            flex items-center gap-2 justify-center
            shadow-xl
          "
        >
          Entrar para o Million Club <ArrowRight />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          onClick={() => scrollTo("lead")}
          className="
            border border-gray-700 text-white
            px-7 py-3 rounded-xl
            hover:bg-white/5 transition
          "
        >
          Ver como funciona
        </motion.button>
      </motion.div>

      {/* Pilares */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="mt-16 flex flex-wrap justify-center gap-10 text-gray-300"
      >
        <Pillar icon={<Laptop />} label="Estratégias DeFi" />
        <Pillar icon={<Briefcase />} label="Renda Digital" />
        <Pillar icon={<BookOpen />} label="Mentalidade Milionária" />
      </motion.div>
    </section>
  )
}

function Pillar({ icon, label }: { icon: JSX.Element; label: string }) {
  return (
    <motion.span
      whileHover={{ y: -6 }}
      className="
        flex items-center gap-2 font-semibold
        px-4 py-2 rounded-full
        bg-gray-900/60 backdrop-blur
        border border-gray-800
      "
    >
      <span className="text-yellow-400">{icon}</span>
      {label}
    </motion.span>
  )
}
