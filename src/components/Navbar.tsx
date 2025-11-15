"use client"

import { motion } from "framer-motion"
import { Menu, LogIn, UserPlus } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { Logo } from "@/components/Logo"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const NavLink = [
    { name: "About Us", href: "#" },
    { name: "Services & Products", href: "#services" },
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQs", href: "#faqs" },
    { name: "Partners", href: "#partners" },
  ]

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto grid grid-cols-3 items-center py-4 px-4 md:px-8">
        
        {/* LOGO */}
        <motion.div
          className="flex items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link href="/">
            <Logo width={240} height={80} className="h-12 w-auto" />
          </Link>
        </motion.div>

        {/* MENU DESKTOP */}
        <nav className="hidden md:block">
          <ul className="flex justify-center gap-6 text-sm font-medium">
            {NavLink.map((link, idx) => (
              <motion.li
                key={link.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <a
                  href={link.href}
                  className="relative text-gray-800 dark:text-gray-200 hover:text-blue-500 dark:hover:text-yellow-400 transition-colors"
                >
                  {link.name}
                  <motion.span
                    className="absolute left-0 -bottom-1 h-[2px] w-0 bg-gradient-to-r from-blue-500 to-yellow-400"
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                </a>
              </motion.li>
            ))}
          </ul>
        </nav>

        {/* BOTÕES */}
        <div className="flex justify-end gap-3">
          <Link href="/login" className="hidden md:flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <LogIn size={16} />
            Login
          </Link>
          <Link href="/register" className="hidden md:flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-yellow-400 text-white hover:opacity-90 shadow-md transition">
            <UserPlus size={16} />
            Sign Up
          </Link>

          {/* BOTÃO MOBILE */}
          <button
            className="md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* MENU MOBILE */}
      {isOpen && (
        <motion.nav
          className="md:hidden bg-white/95 dark:bg-black/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          <ul className="flex flex-col gap-4 p-6 text-sm font-medium">
            {NavLink.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className="block text-gray-800 dark:text-gray-200 hover:text-blue-500 dark:hover:text-yellow-400 transition"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              </li>
            ))}
            <li>
              <Link href="/login" className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition" onClick={() => setIsOpen(false)}>
                <LogIn size={16} />
                Login
              </Link>
            </li>
            <li>
              <Link href="/register" className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-yellow-400 text-white hover:opacity-90 shadow-md transition" onClick={() => setIsOpen(false)}>
                <UserPlus size={16} />
                Sign Up
              </Link>
            </li>
          </ul>
        </motion.nav>
      )}
    </header>
  )
}

