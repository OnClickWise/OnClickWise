'use client';

import { Input } from '@/components/ui/input';
import {
  Building2,
  Lock,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT */}
      <div className="w-full lg:w-1/2 flex justify-center px-4 py-10">
        <div className="w-full max-w-md">

          <div className="flex justify-center mb-6">
            <Logo width={160} height={0} />
          </div>

          <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-center mb-2">
              Redefinir senha
            </h1>

            <p className="text-sm text-gray-600 text-center mb-6">
              Crie uma nova senha para acessar sua conta.
            </p>

            <form className="space-y-5">
              <div>
                <label className="text-sm font-medium">
                  Nova senha
                </label>

                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="password"
                    className="pl-10 h-11"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Confirmar senha
                </label>

                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="password"
                    className="pl-10 h-11"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex justify-center items-center"
              >
                Redefinir senha
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <aside className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-blue-700 to-blue-900 rounded-l-[80px]">
        <div className="text-white max-w-md space-y-6 p-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">
              Segurança da Conta
            </h2>
          </div>

          <p className="text-blue-100">
            Proteção corporativa com link temporário e criptografia avançada.
          </p>
        </div>
      </aside>
    </div>
  );
}
