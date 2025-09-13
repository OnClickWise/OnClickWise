"use client"

import { motion } from "framer-motion"
import { Rocket, ArrowRight, Sparkles } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative py-28 bg-gradient-to-b from-white via-gray-50 to-white dark:from-black dark:via-gray-900 dark:to-black text-black dark:text-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* COLUNA ESQUERDA (conteúdo principal) */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          {/* TAG */}
          <motion.div
            className="inline-flex items-center gap-2 py-2 px-5 bg-gradient-to-r from-blue-500 to-yellow-400 text-black font-semibold rounded-full shadow-lg mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="w-4 h-4 text-black" />
            It has never been so simple. Take the opportunity!
          </motion.div>

          {/* TÍTULO */}
          <motion.h1
            className="text-4xl md:text-6xl font-extrabold leading-tight max-w-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-yellow-400"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Simplify. Automate. <span className="text-black dark:text-white">OnclickWise</span> makes everything easier.
          </motion.h1>

          {/* SUBTÍTULO */}
          <motion.p
            className="mt-6 text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Manage leads, contacts, companies, deals, tasks and teams — 
            all in one powerful platform. Designed to streamline your sales 
            process and help you close more deals effortlessly.
          </motion.p>

          {/* BOTÕES */}
          <motion.div
            className="mt-10 flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-md transition">
              <Rocket className="w-5 h-5 text-yellow-400" />
              Get Started
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-yellow-400 text-yellow-500 hover:bg-yellow-400 hover:text-black font-semibold text-lg shadow-md transition">
              Learn More
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>

        {/* COLUNA DIREITA (ilustração + decorações) */}
        <motion.div
          className="hidden lg:flex relative w-full h-[450px] items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {/* ILUSTRAÇÃO MODERNA (SVG abstrato) */}
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 400 400"
            className="w-[90%] max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#3b82f6", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "#facc15", stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="200" cy="200" r="180" fill="url(#grad)" opacity="0.2" />
            <rect x="80" y="80" width="240" height="240" rx="30" fill="url(#grad)" opacity="0.3" />
            <circle cx="200" cy="200" r="100" fill="url(#grad)" />
          </motion.svg>

          {/* DECORAÇÕES FLUTUANTES */}
          <motion.div
            className="absolute top-10 left-0 w-28 h-28 bg-blue-600/30 rounded-full blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, 20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-10 right-0 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, -15, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </section>
  )
}
