'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Mail,
  Eye,
} from "lucide-react";
import { Logo } from "@/components/Logo";

/* =======================
   PAGE
======================= */

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* LEFT — FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo width={180} height={0} />
          </div>

          {/* Card */}
          <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 md:p-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Entrar na plataforma
              </h1>

              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Acesse sua conta corporativa.
              </p>
            </div>

            {/* FORM */}
            <form className="space-y-6">
              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  E-mail corporativo
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    name="email"
                    type="email"
                    placeholder="email@empresa.com"
                    className="pl-10 h-11 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Senha
                </label>

                <div className="relative">
                  <Input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="pr-10 h-11 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  />

                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* SUBMIT */}
              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
              >
                Entrar
              </Button>

              {/* LINKS */}
              <div className="text-center text-sm text-gray-600 space-y-3 pt-2">
                <p>
                  Não tem conta?{" "}
                  <button
                    type="button"
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Criar conta
                  </button>
                </p>

                <button
                  type="button"
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT — BRAND */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 items-center justify-center p-10 rounded-l-[80px] shadow-2xl">
        <div className="max-w-md text-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Plataforma Corporativa</h2>
          </div>

          <p className="text-blue-100 text-lg leading-relaxed">
            Gerencie organizações, usuários e processos com segurança,
            performance e controle total.
          </p>

          <ul className="space-y-3 text-blue-100 text-sm pt-4">
            <li>✔ Login seguro por organização</li>
            <li>✔ Controle de acesso corporativo</li>
            <li>✔ Infraestrutura escalável</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

