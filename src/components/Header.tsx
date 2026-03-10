'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { ThemeToggle } from '@/components/layout/theme-toggle';
import { NotificationBell } from './NotificationBell';

export default function Navbar() {
  const router = useRouter();
  const t = useTranslations('HomePage.Header');

  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* =====================
     I18N
  ===================== */
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<'pt-BR' | 'en-US'>('pt-BR');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as 'pt-BR' | 'en-US' | null;
    if (savedLocale) setCurrentLang(savedLocale);
  }, []);

  const changeLanguage = (lang: 'pt-BR' | 'en-US') => {
    setCurrentLang(lang);
    localStorage.setItem('locale', lang);
    window.dispatchEvent(
      new CustomEvent('localeChange', { detail: { locale: lang } })
    );
    setLangMenuOpen(false);
  };

  /* =====================
     UI
  ===================== */

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-900 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3">

        {/* LEFT */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center"
          >
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
          </button>

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700 dark:text-gray-200">
            <li className="hover:text-blue-600 cursor-pointer">{t('home')}</li>
            <li className="hover:text-blue-600 cursor-pointer">{t('docs')}</li>
            <li className="hover:text-blue-600 cursor-pointer">{t('resources')}</li>
            <li>
              <button
                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                {t('products')}
                <svg className="w-3 h-3" viewBox="0 0 10 6" fill="none">
                  <path
                    d="m1 1 4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
          </ul>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">

          {/* Language */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 dark:text-white"
            >
              🌐 {currentLang === 'pt-BR' ? 'PT' : 'EN'}
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg">
                <button
                  onClick={() => changeLanguage('pt-BR')}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Português
                </button>
                <button
                  onClick={() => changeLanguage('en-US')}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  English
                </button>
              </div>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push('/register')}
            className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-semibold"
          >
            {t('getStarted')}
          </button>


          {/* Notificações */}
          <NotificationBell />
          {/* Theme Toggle (GLOBAL) */}
          <ThemeToggle />

          {/* Mobile Menu */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 17 14">
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

      {/* Mega Menu */}
      {isMegaMenuOpen && (
        <div className="border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 p-4 text-sm">
            <span className="hover:text-blue-600 cursor-pointer">{t('onlineStores')}</span>
            <span className="hover:text-blue-600 cursor-pointer">{t('analytics')}</span>
            <span className="hover:text-blue-600 cursor-pointer">{t('automation')}</span>
            <span className="hover:text-blue-600 cursor-pointer">{t('integrations')}</span>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-4">
          <ul className="space-y-3 text-sm font-medium">
            <li>{t('home')}</li>
            <li>{t('docs')}</li>
            <li>{t('resources')}</li>
            <li>{t('products')}</li>
          </ul>
        </div>
      )}
    </nav>
  );
}
