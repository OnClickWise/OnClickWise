


"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Sparkles } from "lucide-react"

export function LogoTicker() {
  const logos = [
    { name: "Wise", image: "/wse.svg" },
    { name: "Wise", image: "/wse.svg" },
    { name: "Wise", image: "/wse.svg" },
    { name: "Wise", image: "/wse.svg" },
    { name: "Wise", image: "/wse.svg" },
    { name: "Wise", image: "/wse.svg" },
    { name: "Wise", image: "/wse.svg" },
    { name: "Wise", image: "/wse.svg" },
  ]

  // duplicamos para dar efeito de loop contínuo
  const duplicatedLogos = [...logos, ...logos]

  return (
    <section className="relative py-16 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="container mx-auto px-6 text-center">
        
        {/* TAG */}
        <div className="inline-flex items-center gap-2 py-2 px-5 bg-gradient-to-r from-blue-500 to-yellow-400 text-black font-semibold rounded-full shadow-lg mb-10">
          <Sparkles className="w-4 h-4 text-black" />
          Trusted by leading teams
        </div>

        {/* TÍTULO */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-12">
          Companies that already use <span className="text-blue-600">LeadWise</span>
        </h2>

        {/* CARROSSEL */}
        <div className="relative w-full overflow-hidden">
          <motion.div
            className="flex gap-16"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 20,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {duplicatedLogos.map((logo, i) => (
              <div
                key={i}
                className="flex items-center justify-center w-40 h-24 bg-white dark:bg-gray-800 shadow-md rounded-xl p-4"
              >
                <Image
                  src={logo.image}
                  alt={logo.name}
                  width={120}
                  height={60}
                  className="object-contain"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* DECORAÇÃO DE FUNDO */}
      <motion.div
        className="absolute top-10 left-0 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl"
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 right-0 w-72 h-72 bg-yellow-400/20 rounded-full blur-3xl"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </section>
  )
}
