'use client';

import { Input } from '@/components/ui/input';
import { Building2, ArrowLeft, Mail } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* LEFT */}
      <div className="w-full lg:w-1/2 h-screen flex justify-center px-4 sm:px-6">
        <div className="w-full max-w-md py-10">
          <div className="flex justify-center mb-6">
            <Logo width={160} height={0} />
          </div>

          <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Recuperar senha
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Informe seu e-mail para receber as instruções.
              </p>
            </div>

            <form className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  E-mail
                </label>

                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="email@empresa.com"
                    className="pl-10 h-11 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center"
              >
                Enviar instruções
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para login
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="hidden lg:flex w-1/2 items-center justify-center p-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-l-[80px]">
        <div className="text-white max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">
              Recuperação de Acesso
            </h2>
          </div>

          <p className="text-blue-100 text-lg">
            Enviaremos instruções seguras para redefinir sua senha.
          </p>
        </div>
      </div>
    </div>
  );
}
