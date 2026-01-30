"use client"

import { motion } from "framer-motion"
import {
  Sparkles,
  ShieldCheck,
  Globe,
  Mail
} from "lucide-react"

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="
        relative py-16 px-4
        bg-gradient-to-b from-gray-900 to-black
        border-t border-gray-800
        overflow-hidden
      "
    >
      {/* Glow decorativo */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 opacity-20">
        <Sparkles size={200} className="text-yellow-400" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6">

        {/* Logo / Nome */}
        <h3 className="text-3xl font-extrabold text-white tracking-tight">
          Million <span className="text-yellow-400">Club</span>
        </h3>

        {/* Descrição */}
        <p className="text-gray-400 max-w-3xl mx-auto leading-relaxed">
          O <span className="text-white font-semibold">Million Club</span> é uma
          comunidade focada em educação financeira, DeFi e estratégias reais
          para crescimento patrimonial sustentável e consciente.
        </p>

        {/* Selos de confiança */}
        <div className="flex flex-wrap justify-center gap-6 pt-4 text-gray-300">
          <FooterItem icon={<ShieldCheck />} text="Educação, não promessas" />
          <FooterItem icon={<Globe />} text="Comunidade global" />
          <FooterItem icon={<Mail />} text="Suporte dedicado" />
        </div>

        {/* Linha */}
        <div className="w-full h-px bg-gray-800 my-6" />

        {/* Copyright */}
        <p className="text-sm text-gray-500">
          © 2025{" "}
          <span className="text-white font-semibold">
            Million Club™
          </span>{" "}
          — Todos os direitos reservados.
        </p>
      </div>
    </motion.footer>
  )
}

function FooterItem({ icon, text }: { icon: JSX.Element; text: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="
        flex items-center gap-2
        bg-gray-900/60 backdrop-blur
        border border-gray-800
        rounded-full px-4 py-2
        text-sm font-medium
      "
    >
      <span className="text-yellow-400">{icon}</span>
      {text}
    </motion.div>
  )
}
