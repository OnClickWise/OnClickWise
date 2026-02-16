'use client';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Mail,
  Lock,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { OrganizationAvatar } from '@/components/ui/avatar';

export default function CompanyLoginPage() {
  const companyInfo = {
    name: 'Empresa Exemplo',
    logo_url: '',
  };

  return (
    <div className="auth-page-container">
      {/* Main content */}
      <div className="flex items-center justify-center min-h-screen p-3 sm:p-4 relative z-10">
        <div className="max-w-md w-full">
          {/* Company Info Card */}
          <div className="auth-card mb-4 sm:mb-6 p-4 sm:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <OrganizationAvatar
                src={companyInfo.logo_url || undefined}
                name={companyInfo.name}
                size="xl"
              />

              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {companyInfo.name}
                </h2>

                <Badge className="mt-1.5 sm:mt-2 bg-gradient-to-r from-[#facc15] to-[#fbbf24] text-black border-none px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
                  <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                  Portal da Empresa
                </Badge>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="auth-card p-5 sm:p-8 md:p-10">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="auth-title text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3">
                Entrar
              </h1>

              <p className="auth-subtitle text-sm sm:text-base">
                Acesse sua conta corporativa
              </p>
            </div>

            <form className="space-y-4 sm:space-y-6">
              {/* EMAIL */}
              <div>
                <label htmlFor="email" className="auth-label">
                  E-mail
                </label>

                <div className="auth-input-wrapper">
                  <Mail className="auth-input-icon" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    className="auth-input has-icon"
                    placeholder="email@empresa.com"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label htmlFor="password" className="auth-label">
                  Senha
                </label>

                <div className="auth-input-wrapper">
                  <Lock className="auth-input-icon" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    className="auth-input has-icon"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                className="auth-button-primary w-full flex items-center justify-center"
              >
                Entrar
              </button>

              {/* LINKS */}
              <div className="text-center space-y-2 sm:space-y-3 pt-2">
                <p className="text-xs sm:text-sm text-gray-600">
                  Não tem conta? Entre em contato com o administrador.
                </p>

                <p className="text-xs sm:text-sm">
                  <button
                    type="button"
                    className="text-[#3b82f6] hover:text-[#2563eb] font-semibold transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </p>

                <button
                  type="button"
                  className="auth-button-outline w-full flex items-center justify-center text-sm sm:text-base py-2 sm:py-2.5 px-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Voltar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right branding */}
      <aside className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-blue-700 to-blue-900 rounded-l-[80px]">
        <div className="text-white max-w-md space-y-6 p-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>

            <h2 className="text-2xl font-bold">
              Portal Corporativo
            </h2>
          </div>

          <p className="text-blue-100">
            Acesso seguro para organizações com infraestrutura escalável.
          </p>
        </div>
      </aside>
    </div>
  );
}
