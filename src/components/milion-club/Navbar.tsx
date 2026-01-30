"use client"

import Image from "next/image"

export function Navbar() {
  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-50
        bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600
        shadow-lg
      "
    >
      <div className="flex items-center h-14 overflow-hidden">

        {/* Logo fixa à esquerda */}
        <div className="flex items-center gap-2 px-4 min-w-[160px]">
          <Image
            src="/million-club/milion-club-logo.png"
            alt="Million Club"
            width={120}
            height={40}
            priority
            className="object-contain"
          />
        </div>

        {/* Área do texto (não invade a logo) */}
        <div className="flex-1 overflow-hidden">
          <p
            className="
              scroll-text text-sm sm:text-base md:text-lg
              font-bold text-black whitespace-nowrap
              px-4
            "
          >
            🚀 ALERTA DE OPORTUNIDADE — Comunidade exclusiva para quem busca o primeiro milhão no DeFi
          </p>
        </div>

      </div>
    </header>
  )
}
