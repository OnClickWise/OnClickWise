"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  // --- i18n ---
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("pt");

  const router = useRouter();
  const pathname = usePathname();

  // Carrega idioma salvo
  useEffect(() => {
    const stored = localStorage.getItem("lang");
    if (stored) setCurrentLang(stored);
  }, []);

  // Troca idioma
  const changeLanguage = (lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem("lang", lang);

    // Redireciona para rota do idioma (App Router)
    const cleanPath = pathname.replace(/^\/(pt|en|es|fr)/, "");
    router.push(`/${lang}${cleanPath}`);
    setLangMenuOpen(false);
  };

  // Tema claro/escuro
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <nav className="sticky fixed top-0 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-600 w-full z-50">
      <div className="flex items-center justify-between max-w mx-auto p-4">
        
        {/* LOGO + MENU ESQUERDA */}
        <div className="flex items-center space-x-6">
          <a href="#home" className="flex items-center space-x-3 rtl:space-x-reverse">
            <Image
              src="/light-logo.png"
              alt="Logo"
              width={170}
              height={0}
              className="block dark:hidden"
            />
            <Image
              src="/darck-logo.png"
              alt="Logo"
              width={170}
              height={0}
              className="hidden dark:block"
            />
          </a>

          {/* MENU DESKTOP */}
          <ul className="hidden md:flex space-x-6 text-gray-900 dark:text-white font-medium">
            <li><a href="#" className="hover:text-blue-600">Home</a></li>
            <li><a href="#docs" className="hover:text-blue-600">Docs</a></li>
            <li><a href="#resources" className="hover:text-blue-600">Resources</a></li>
            <li>
              <button
                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                className="flex items-center hover:text-blue-600"
              >
                Products
                <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 10 6">
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
            </li>
          </ul>
        </div>

        {/* AÇÕES DIREITA */}
        <div className="flex items-center space-x-4">

          {/* BOTÃO TRADUÇÃO */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="px-3 py-2 rounded-lg cursor-pointer bg-gray-200 dark:bg-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              🌐{currentLang.toUpperCase()}
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-2 w-32 z-50">
                <button onClick={() => changeLanguage("pt")} className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Português
                </button>
                <button onClick={() => changeLanguage("en")} className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  English
                </button>
                <button onClick={() => changeLanguage("es")} className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Español
                </button>
                <button onClick={() => changeLanguage("fr")} className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Français
                </button>
              </div>
            )}
          </div>

          {/* BOTÃO GET STARTED */}
          <button
            onClick={() => (window.location.href = "#login")}
            className="text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer text-sm px-4 py-2"
          >
            Get started
          </button>

          {/* TEMA */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full cursor-pointer bg-blue-500 dark:hover:bg-gray-700"
          >
            {theme === "light" ? (
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4 11a1 1 0 100-2H3a1 1 0 000 2h1zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm6-5a1 1 0 100-2h-1a1 1 0 100 2h1z"
                ></path>
              </svg>
            )}
          </button>

          {/* MENU MOBILE */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-500 rounded-lg dark:text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 17 14">
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* MEGA MENU */}
      {isMegaMenuOpen && (
        <div className="border-t border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
          <div className="max-w-screen-xl mx-auto grid grid-cols-2 gap-6 p-5">
            <ul>
              <li><a className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Online Stores</a></li>
              <li><a className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Segmentation</a></li>
              <li><a className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Marketing CRM</a></li>
            </ul>
            <ul>
              <li><a className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Analytics</a></li>
              <li><a className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Automation</a></li>
              <li><a className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Integrations</a></li>
            </ul>
          </div>
        </div>
      )}

      {/* MENU MOBILE */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-50 dark:bg-gray-800 border-t p-4">
          <ul className="space-y-2 text-gray-900 dark:text-white font-medium">
            <li><a className="block hover:text-blue-600">Home</a></li>
            <li><a className="block hover:text-blue-600">Docs</a></li>
            <li><a className="block hover:text-blue-600">Resources</a></li>
            <li><a className="block hover:text-blue-600">Products</a></li>
          </ul>
        </div>
      )}
    </nav>
  );
}
