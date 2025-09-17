"use client"

import { motion } from "framer-motion"

export default function About() {
  const text = `OnclickWise is a cutting-edge SaaS platform where you can manage your business in one place. 
  You can optimize your business management, such as lead capture, customer management, team management, 
  and task management, schedule meetings, and monitor your company's sales and marketing. 
  A smart platform, we use the most modern technologies with AI integration that 
  fully automates your company's management process.`

  const words = text.split(" ")

  return (
    <section className="relative py-24 bg-white dark:bg-black text-black dark:text-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 text-center max-w-4xl">
        
        {/* TÍTULO */}
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          About OnclickWise
        </motion.h2>

        {/* TEXTO PRINCIPAL (entrada suave, sem loop infinito) */}
        <motion.p
          className="text-lg md:text-xl leading-relaxed text-gray-700 dark:text-gray-300"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.015 }, // rápido e natural
            },
          }}
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-2"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: {
                  opacity: 1,
                  y: 0,
                },
              }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
                delay: i * 0.015,
              }}
            >
              {word}
            </motion.span>
          ))}
        </motion.p>

        {/* FRASE FINAL */}
        <motion.div
          className="mt-12 text-2xl font-semibold text-blue-600 dark:text-yellow-400"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          Our innovation is dedicated to you.
        </motion.div>
      </div>

      {/* DECORAÇÃO DE FUNDO */}
      <motion.div
        className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 -right-20 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
    </section>
  )
}
