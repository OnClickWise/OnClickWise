"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { Building2, Lock, Mail, Phone, Eye } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/* =======================
   COMPONENT
======================= */
export default function RegisterPage() {
  const router = useRouter();
  const { registerUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    representative_name: "",
    email: "",
    company_id: "",
    password: "",
    password_confirmation: "",
    phone: "",
  });

  /* =======================
     HELPERS
  ======================= */
  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({ ...prev, name, slug: generateSlug(name) }));
  };

  const validateForm = () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.company_id ||
      !formData.password
    ) {
      setError("Todos os campos são obrigatórios");
      return false;
    }
    if (formData.password !== formData.password_confirmation) {
      setError("As senhas não coincidem");
      return false;
    }
    if (formData.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("E-mail inválido");
      return false;
    }
    if (!termsAccepted) {
      setError("Você deve aceitar os termos de uso");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const result = await registerUser({
        organization: {
          name: formData.name,
          slug: formData.slug,
          email: formData.email,
          company_id: formData.company_id,
          password: formData.password,
          phone: formData.phone,
          address: "",
          city: "",
          state: "",
          country: "United States",
          // zipCode removido
        },
        representative: {
          name: formData.representative_name || "Nome do responsável",
          email: formData.email, // ou outro email
          position: "CEO", // ou outro cargo
          ssn: "123456789", // ou outro identificador
        },
      });

      // REDIRECIONA DIRETO PARA O DASHBOARD
      if (result.organization?.slug) {
        router.push(`/${result.organization.slug}/dashboard`);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao criar a conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* RIGHT */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 items-center justify-center p-10 rounded-r-[80px] shadow-2xl">
        <div className="max-w-md text-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Plataforma Corporativa</h2>
          </div>

          <p className="text-blue-100 text-lg">
            Centralize vendas, automações e comunicação em um único lugar.
          </p>

          <ul className="space-y-2 text-blue-100 text-sm">
            <li>✔ Cadastro por organização</li>
            <li>✔ Ambiente seguro</li>
            <li>✔ Escalável desde o início</li>
          </ul>
        </div>
      </div>

      {/* LEFT */}
      <div className="w-full lg:w-1/2 flex justify-center px-6">
        <div className="w-full max-w-xl py-10">
          <div className="flex justify-center mb-6">
            <Logo width={160} height={0} />
          </div>

          <div className="bg-white rounded-xl shadow-xl p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Section title="Informações da empresa" icon={Building2}>
                <InputField
                  label="Nome da empresa"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                />

                <InputField
                  label="Nome do responsável"
                  name="representative_name"
                  value={formData.representative_name}
                  onChange={handleInputChange}
                />

                <InputBlock label="URL da empresa">
                  <Input value={formData.slug} disabled />
                </InputBlock>

                <div className="grid sm:grid-cols-2 gap-4">
                  <InputField
                    label="CNPJ / ID"
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleInputChange}
                  />

                  <InputField
                    label="E-mail corporativo"
                    name="email"
                    type="email"
                    icon={Mail}
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <InputField
                  label="Telefone"
                  name="phone"
                  icon={Phone}
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Section>

              <Section title="Segurança" icon={Lock}>
                <PasswordField
                  label="Senha"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  show={showPassword}
                  toggle={() => setShowPassword(!showPassword)}
                />

                <PasswordField
                  label="Confirmar senha"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                  show={showConfirmPassword}
                  toggle={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </Section>

              <label className="flex gap-3 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="accent-blue-600 mt-1"
                />
                Aceito os termos de uso
              </label>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? "Criando conta..." : "Criar Conta"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =======================
   UI HELPERS
======================= */
function Section({ title, icon: Icon, children }: any) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="w-5 h-5 text-blue-600" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function InputBlock({ label, children }: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function InputField({ label, icon: Icon, ...props }: any) {
  return (
    <InputBlock label={label}>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        )}
        <Input {...props} className={Icon ? "pl-10" : ""} />
      </div>
    </InputBlock>
  );
}

function PasswordField({ label, value, onChange, show, toggle, name }: any) {
  return (
    <InputBlock label={label}>
      <div className="relative">
        <Input
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="h-11 rounded-lg pr-10"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <Eye size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </InputBlock>
  );
}