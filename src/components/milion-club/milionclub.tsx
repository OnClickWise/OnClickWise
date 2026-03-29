"use client"

import { useEffect, useState } from "react"
import { Navbar } from "./Navbar"
import { Hero } from "./Hero"
import { Lead } from "./Lead"
import { Form } from "./Form"
import { Footer } from "./Footer"

export function MillionClubLanding({ orgSlug }: { orgSlug: string }) {
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  return (
    <div
      className="relative min-h-screen text-white
      bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/million-club/bg-milion.png')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b
        from-black/80 via-black/70 to-gray-900/90"
      />

      {/* Conteúdo */}
      <div className="relative z-10">
        <Navbar />

        {success && (
          <div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50
            bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500
            text-black px-6 py-4 rounded-xl shadow-2xl"
          >
            🚀 Inscrição confirmada! Em breve você receberá acesso ao Million Club.
          </div>
        )}

        <Hero />
        <Lead />
        <Form onSuccess={() => setSuccess(true)} />
        <Footer />
      </div>
    </div>
  )
}
