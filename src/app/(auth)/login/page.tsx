
"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { Mail, Eye, EyeOff, Lock, ArrowRight, LayoutGrid, Users, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

/* =======================
   PAGE
======================= */
export default function LoginPage() {
  const { loginUser } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginUser(formData); // usa contexto Auth

      // REDIRECIONA PARA O DASHBOARD DA ORGANIZAÇÃO
      router.push(`/pt/${result.organization.slug}/dashboard`);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Erro ao tentar entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* LEFT — BRAND PANEL */}
      <div className="hidden lg:flex w-[45%] flex-shrink-0 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #1a56db 0%, #1e429f 50%, #1e3a8a 100%)" }}>
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative z-10 max-w-sm px-10 text-white space-y-10">
          <Logo width={160} height={0} className="brightness-0 invert" />

          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight">
              Bem-vindo de volta
            </h1>
            <p className="text-blue-200 text-base leading-relaxed">
              Gerencie sua operação com inteligência e velocidade.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: LayoutGrid, text: "CRM e Kanban integrados" },
              { icon: Users, text: "Gestão de equipes e leads" },
              { icon: Zap, text: "Automações e workflows" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-blue-100 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — FORM */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 bg-white">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile logo */}
          <div className="flex justify-center lg:hidden">
            <Logo width={150} height={0} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Entrar na conta</h2>
            <p className="text-gray-500 text-sm mt-1">Informe suas credenciais para continuar.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* EMAIL */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  name="email"
                  type="email"
                  placeholder="email@empresa.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-9 h-11 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-9 pr-10 h-11 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 text-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </span>
              ) : (
                <>
                  Entrar <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Não tem uma conta?{" "}
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="text-blue-600 font-semibold hover:text-blue-700"
            >
              Criar conta gratuita
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
