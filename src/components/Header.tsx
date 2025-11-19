"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function Navbar() {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  // --- i18n ---
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<"pt-BR" | "en-US">("pt-BR");
  const t = useTranslations("HomePage.Header");

  const router = useRouter();
  const pathname = usePathname();

  // Carrega idioma salvo
  useEffect(() => {
    const getUserIdentifier = () => {
      if (typeof window === "undefined") return null;
      try {
        const token = localStorage.getItem("token");
        const organizationStr = localStorage.getItem("organization");
        
        if (!token || !organizationStr) return null;
        
        const organization = JSON.parse(organizationStr);
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(atob(parts[1]));
        const userEmail = payload.email || payload.sub || "";
        const identifier = `${organization.id}_${userEmail}`.replace(/[^a-zA-Z0-9_-]/g, "_");
        
        return identifier;
      } catch (error) {
        return null;
      }
    };

    const userId = getUserIdentifier();
    if (userId) {
      const localeKey = `user_locale_${userId}`;
      const savedLocale = localStorage.getItem(localeKey);
      if (savedLocale && (savedLocale === "pt-BR" || savedLocale === "en-US")) {
        setCurrentLang(savedLocale);
      }
    } else {
      // Fallback para locale padrão
      const defaultLocale = localStorage.getItem("locale") || "pt-BR";
      setCurrentLang(defaultLocale as "pt-BR" | "en-US");
    }
  }, []);

  // Troca idioma
  const changeLanguage = (lang: "pt-BR" | "en-US") => {
    setCurrentLang(lang);
    
    const getUserIdentifier = () => {
      if (typeof window === "undefined") return null;
      try {
        const token = localStorage.getItem("token");
        const organizationStr = localStorage.getItem("organization");
        
        if (!token || !organizationStr) return null;
        
        const organization = JSON.parse(organizationStr);
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(atob(parts[1]));
        const userEmail = payload.email || payload.sub || "";
        const identifier = `${organization.id}_${userEmail}`.replace(/[^a-zA-Z0-9_-]/g, "_");
        
        return identifier;
      } catch (error) {
        return null;
      }
    };

    const userId = getUserIdentifier();
    if (userId) {
      const localeKey = `user_locale_${userId}`;
      localStorage.setItem(localeKey, lang);
    } else {
      localStorage.setItem("locale", lang);
    }

    // Dispara evento para atualizar o ClientLocaleProvider
    window.dispatchEvent(new CustomEvent("localeChange", { detail: { locale: lang } }));
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
          <a href="#home" onClick={(e) => { e.preventDefault(); document.getElementById("home")?.scrollIntoView({ behavior: "smooth" }); }} className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer">
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
            <li><a href="#home" onClick={(e) => { e.preventDefault(); document.getElementById("home")?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-blue-600 cursor-pointer">{t("home")}</a></li>
            <li><a href="#docs" onClick={(e) => { e.preventDefault(); const docs = document.getElementById("docs") || document.getElementById("features"); docs?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-blue-600 cursor-pointer">{t("docs")}</a></li>
            <li><a href="#resources" onClick={(e) => { e.preventDefault(); const resources = document.getElementById("resources") || document.getElementById("features"); resources?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-blue-600 cursor-pointer">{t("resources")}</a></li>
            <li>
              <button
                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                className="flex items-center hover:text-blue-600 cursor-pointer"
              >
                {t("products")}
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
              🌐{currentLang === "pt-BR" ? "PT" : "EN"}
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-2 w-32 z-50">
                <button onClick={() => changeLanguage("pt-BR")} className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  Português
                </button>
                <button onClick={() => changeLanguage("en-US")} className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  English
                </button>
              </div>
            )}
          </div>

          {/* BOTÃO GET STARTED */}
          <button
            onClick={() => router.push("/register")}
            className="text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer text-sm px-4 py-2"
          >
            {t("getStarted")}
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
              <li><a className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">{t("onlineStores")}</a></li>
              <li><a className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">{t("segmentation")}</a></li>
              <li><a className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">{t("marketingCRM")}</a></li>
            </ul>
            <ul>
              <li><a className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">{t("analytics")}</a></li>
              <li><a className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">{t("automation")}</a></li>
              <li><a className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">{t("integrations")}</a></li>
            </ul>
          </div>
        </div>
      )}

      {/* MENU MOBILE */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-50 dark:bg-gray-800 border-t p-4">
          <ul className="space-y-2 text-gray-900 dark:text-white font-medium">
            <li><a href="#home" onClick={(e) => { e.preventDefault(); document.getElementById("home")?.scrollIntoView({ behavior: "smooth" }); setIsMobileMenuOpen(false); }} className="block hover:text-blue-600 cursor-pointer">{t("home")}</a></li>
            <li><a href="#docs" onClick={(e) => { e.preventDefault(); const docs = document.getElementById("docs") || document.getElementById("features"); docs?.scrollIntoView({ behavior: "smooth" }); setIsMobileMenuOpen(false); }} className="block hover:text-blue-600 cursor-pointer">{t("docs")}</a></li>
            <li><a href="#resources" onClick={(e) => { e.preventDefault(); const resources = document.getElementById("resources") || document.getElementById("features"); resources?.scrollIntoView({ behavior: "smooth" }); setIsMobileMenuOpen(false); }} className="block hover:text-blue-600 cursor-pointer">{t("resources")}</a></li>
            <li><a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); setIsMobileMenuOpen(false); }} className="block hover:text-blue-600 cursor-pointer">{t("products")}</a></li>
          </ul>
        </div>
      )}
    </nav>
  );
}
