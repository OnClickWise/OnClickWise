"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import {
  Mail,
  Eye,
  EyeOff,
  Lock,
  Phone,
  LayoutGrid,
  Users,
  Zap,
  Building2,
  User,
  Hash,
  Link2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    representative_name: "",
    email: "",
    company_id: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((p) => ({ ...p, name: val, slug: generateSlug(val) }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) return setError("Informe o nome da empresa");
    if (!formData.email.trim()) return setError("Informe o e-mail");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return setError("E-mail inválido");
    if (formData.password.length < 6)
      return setError("A senha deve ter no mínimo 6 caracteres");
    if (formData.password !== formData.confirmPassword)
      return setError("As senhas não coincidem");
    if (!termsAccepted)
      return setError("Aceite os termos de uso para continuar");

    setLoading(true);
    try {
      const result = await registerUser({
        organization: {
          name: formData.name,
          slug: formData.slug,
          email: formData.email,
          company_id: formData.company_id,
          password: formData.password,
          phone: formData.phone,
        },
        representative: {
          name: formData.representative_name || formData.name,
          email: formData.email,
          position: "",
          ssn: "",
        },
      });

      // API pode retornar o slug em caminhos diferentes
      const orgSlug =
        result.organization?.slug ||
        result.slug ||
        result.data?.organization?.slug ||
        result.data?.slug;

      if (orgSlug) {
        router.push(`/pt/${orgSlug}/dashboard`);
      } else if (result.success !== false) {
        // Cadastro criado mas slug não retornado: vai para login
        router.push(`/login`);
      } else {
        setError(result.message || result.error || "Erro ao criar a conta. Tente novamente.");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao criar a conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* LEFT */}
      <div
        className="hidden lg:flex w-[45%] flex-shrink-0 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #1a56db 0%, #1e429f 50%, #1e3a8a 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 max-w-sm px-10 text-white space-y-10">
          <Logo width={160} height={0} className="brightness-0 invert" />
          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight">Comece agora</h1>
            <p className="text-blue-200 text-base leading-relaxed">
              Crie sua organização e gerencie tudo em um único lugar.
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

      {/* RIGHT */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 bg-white overflow-y-auto">
        <div className="w-full max-w-[480px] space-y-4 py-10">
          <div className="flex justify-center lg:hidden">
            <Logo width={150} height={0} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Criar conta</h2>
            <p className="text-gray-500 text-sm mt-1">Preencha os dados da sua organização.</p>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            {/* Secao empresa */}
            <div className="flex items-center gap-2 py-1">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-gray-800">Informações da empresa</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Nome da empresa</label>
              <Input name="name" placeholder="Minha Empresa" value={formData.name} onChange={handleNameChange}
                className="h-11 rounded-lg border-gray-200 text-gray-900 placeholder:text-gray-400" required />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Nome do responsável</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input name="representative_name" placeholder="Nome completo" value={formData.representative_name} onChange={handleChange}
                  className="pl-9 h-11 rounded-lg border-gray-200 text-gray-900 placeholder:text-gray-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">URL da empresa</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input name="slug" placeholder="minha-empresa" value={formData.slug} onChange={handleChange}
                  className="pl-9 h-11 rounded-lg border-gray-200 text-gray-900 placeholder:text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">CNPJ / ID</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input name="company_id" placeholder="00.000.000/0001-00" value={formData.company_id} onChange={handleChange}
                    className="pl-9 h-11 rounded-lg border-gray-200 text-gray-900 placeholder:text-gray-400" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">E-mail corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input name="email" type="email" placeholder="email@empresa.com" value={formData.email} onChange={handleChange}
                    className="pl-9 h-11 rounded-lg border-gray-200 text-gray-900 placeholder:text-gray-400" required />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input name="phone" placeholder="(00) 00000-0000" value={formData.phone} onChange={handleChange}
                  className="pl-9 h-11 rounded-lg border-gray-200 text-gray-900 placeholder:text-gray-400" />
              </div>
            </div>

            {/* Secao seguranca */}
            <div className="flex items-center gap-2 pt-2 pb-1">
              <Lock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-gray-800">Segurança</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Senha</label>
              <div className="relative">
                <Input name="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres"
                  value={formData.password} onChange={handleChange}
                  className="pr-10 h-11 rounded-lg border-gray-200 text-gray-900" required />
                <button type="button" onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Confirmar senha</label>
              <div className="relative">
                <Input name="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="Repita a senha"
                  value={formData.confirmPassword} onChange={handleChange}
                  className="pr-10 h-11 rounded-lg border-gray-200 text-gray-900" required />
                <button type="button" onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                className="accent-blue-600 w-4 h-4 flex-shrink-0" />
              <span className="text-sm text-gray-600">
                Aceito os{" "}
                <button type="button" className="text-blue-600 hover:underline">termos de uso</button>
              </span>
            </label>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-11 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Criando conta...
                </span>
              ) : (
                "Criar Conta"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Já tem uma conta?{" "}
            <button type="button" onClick={() => router.push("/login")} className="text-blue-600 font-semibold hover:text-blue-700">
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}