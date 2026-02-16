'use client';

import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import {
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
} from 'lucide-react';

/* =======================
   COMPONENT
======================= */
export default function RegisterPage() {
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
            <form className="space-y-6">
              <Section title="Informações da empresa" icon={Building2}>
                <InputField label="Nome da empresa" name="name" />

                <InputField
                  label="Nome do responsável"
                  name="representative_name"
                />

                <InputBlock label="URL da empresa">
                  <Input disabled />
                </InputBlock>

                <div className="grid sm:grid-cols-2 gap-4">
                  <InputField label="CNPJ / ID" name="company_id" />

                  <InputField
                    label="E-mail corporativo"
                    name="email"
                    type="email"
                    icon={Mail}
                  />
                </div>

                <InputField
                  label="Telefone"
                  name="phone"
                  icon={Phone}
                />
              </Section>

              <Section title="Segurança" icon={Lock}>
                <PasswordField label="Senha" name="password" />
                <PasswordField
                  label="Confirmar senha"
                  name="password_confirmation"
                />
              </Section>

              <button
                type="submit"
                className="w-full h-11 bg-blue-600 text-white rounded-lg font-semibold"
              >
                Criar Conta
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

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
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

function InputBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function InputField({
  label,
  icon: Icon,
  ...props
}: {
  label: string;
  icon?: React.ElementType;
} & React.ComponentProps<typeof Input>) {
  return (
    <InputBlock label={label}>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        )}
        <Input {...props} className={Icon ? 'pl-10' : ''} />
      </div>
    </InputBlock>
  );
}

function PasswordField({
  label,
  ...props
}: {
  label: string;
} & React.ComponentProps<typeof Input>) {
  return (
    <InputBlock label={label}>
      <div className="relative">
        <Input type="password" {...props} />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <Eye size={18} />
        </button>
      </div>
    </InputBlock>
  );
}
