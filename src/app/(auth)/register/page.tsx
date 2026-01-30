'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Building2, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { Logo } from '@/components/Logo';

/* =======================
   TYPES
======================= */

interface CompanyData {
  name: string;
  slug: string;
  email: string;
  company_id: string;
  password: string;
  password_confirm: string;
  phone: string;
}

/* =======================
   PAGE
======================= */

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('Register');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [formData, setFormData] = useState<CompanyData>({
    name: '',
    slug: '',
    email: '',
    company_id: '',
    password: '',
    password_confirm: '',
    phone: ''
  });

  /* =======================
     LOGIC (INALTERADA)
  ======================= */

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.company_id || !formData.password) {
      setError(t('errorAllFieldsRequired'));
      return false;
    }
    if (formData.password !== formData.password_confirm) {
      setError(t('errorPasswordsDoNotMatch'));
      return false;
    }
    if (formData.password.length < 6) {
      setError(t('errorPasswordMinLength'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(t('errorInvalidEmail'));
      return false;
    }
    if (!termsAccepted) {
      setError(t('errorAcceptTerms'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization: {
            name: formData.name,
            slug: formData.slug,
            email: formData.email,
            company_id: formData.company_id,
            password: formData.password,
            phone: formData.phone,
            address: '',
            city: '',
            state: '',
            country: 'United States',
            zipCode: '',
          },
          representative: {}
        }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('organization', JSON.stringify(result.organization));
        router.push(`/${result.organization.slug}/dashboard`);
      } else {
        setError(result.error || t('errorCreatingAccount'));
      }
    } catch {
      setError(t('errorCreatingAccount'));
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     UI
  ======================= */

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden">

      {/* LEFT — FORM (SCROLL AQUI) */}
      <div className="flex flex-col bg-gray-50 h-full overflow-hidden">

        {/* Header fixo */}
        <div className="h-16 flex items-center justify-center border-b bg-white shrink-0">
          <Logo width={170} height={0} />
        </div>

        {/* Conteúdo rolável */}
        <main className="flex-1 overflow-y-auto px-4 py-10">
          <div className="max-w-2xl mx-auto">

            {/* Title */}
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-gray-900">
                {t('pageTitle')}
              </h3>
              <p className="text-gray-500 mt-2">
                Crie sua conta e comece em minutos
              </p>
            </div>

            {/* Card */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-10">

                {/* Company */}
                <section className="space-y-6">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Building2 className="text-blue-600 w-5 h-5" />
                    {t('companyInformation')}
                  </h2>

                  <InputBlock label={t('companyName')} required>
                    <Input value={formData.name} onChange={handleNameChange} />
                  </InputBlock>

                  <InputBlock label={t('companyUrl')}>
                    <Input name="slug" value={formData.slug} onChange={handleInputChange} />
                    <p className="text-xs text-gray-500 mt-1">
                      onclickwise.com/<span className="text-blue-600 font-medium">
                        {formData.slug || 'sua-empresa'}
                      </span>
                    </p>
                  </InputBlock>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <InputBlock label={t('companyId')} required>
                      <Input name="company_id" value={formData.company_id} onChange={handleInputChange} />
                    </InputBlock>

                    <InputBlock label={t('companyEmail')} required>
                      <Input type="email" name="email" value={formData.email} onChange={handleInputChange} />
                    </InputBlock>
                  </div>

                  <InputBlock label={t('phoneNumber')}>
                    <Input name="phone" value={formData.phone} onChange={handleInputChange} />
                  </InputBlock>
                </section>

                {/* Security */}
                <section className="space-y-6">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Lock className="text-blue-600 w-5 h-5" />
                    {t('security')}
                  </h2>

                  <PasswordField
                    label={t('password')}
                    value={formData.password}
                    onChange={handleInputChange}
                    show={showPassword}
                    toggle={() => setShowPassword(!showPassword)}
                    name="password"
                  />

                  <PasswordField
                    label={t('confirmPassword')}
                    value={formData.password_confirm}
                    onChange={handleInputChange}
                    show={showConfirmPassword}
                    toggle={() => setShowConfirmPassword(!showConfirmPassword)}
                    name="password_confirm"
                  />
                </section>

                {/* Terms */}
                <label className="flex gap-3 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="accent-blue-600 mt-1"
                  />
                  {t('acceptTerms')}
                </label>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white h-12 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : t('createAccount')}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="flex-1 border h-12 rounded-xl font-semibold hover:bg-gray-50 transition"
                  >
                    {t('alreadyHaveAccount')}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </main>
      </div>  

      {/* RIGHT — VISUAL (imagem como fundo) */}
      <aside
        className=" lg:flex relative items-center justify-center text-white"
        style={{
          backgroundImage: "url('/bg-login4.png')",
        }}
      >
        {/* Overlay escuro para contraste */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-indigo-900/90" />

        {/* Conteúdo */}
        <div className="relative z-10 max-w-md text-center space-y-6 px-10">
          <h2 className="text-3xl font-bold">Onclickwise</h2>
          <p className="text-white/90 text-lg">
            Centralize vendas, automações e comunicação em um único lugar.
          </p>
        </div>
      </aside>


    </div>
  );
}

/* =======================
   UI HELPERS
======================= */

function InputBlock({ label, required, children }: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function PasswordField({ label, value, onChange, show, toggle, name }: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <Input
          name={name}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="pr-10"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
