"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

export default function CallToAction() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-background to-muted overflow-hidden">
      {/* Texto animado rolando no fundo */}
      <div className="overflow-hidden">
        <motion.div
          animate={{ x: "-50%" }}
          transition={{
            duration: 50,
            repeat: Infinity,
            ease: "linear",
          }}
          className="flex flex-none gap-16 pr-16 text-5xl md:text-7xl lg:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-blue-400 to-yellow-400 opacity-20"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6">
              <Star className="w-10 h-10 text-yellow-400 flex-shrink-0" />
              <span className="tracking-tight">Try it for free</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Conteúdo principal (overlay) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-6 space-y-6 max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-500 to-yellow-400 bg-clip-text text-transparent leading-tight">
            Boost your productivity today 
          </h2>
          <p className="text-muted-foreground text-lg">
            Start your free trial and experience the power of simplified
            management with all the tools your team needs.
          </p>
          <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-yellow-400 text-white font-semibold text-lg shadow-lg hover:scale-105 transition-transform">
            Get Started Free
          </button>
        </div>
      </div>
    </section>
  );
}
