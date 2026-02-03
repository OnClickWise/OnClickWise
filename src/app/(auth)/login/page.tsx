'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building2,
  Loader2,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('GeneralLogin');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('organization', JSON.stringify(result.organization));
        localStorage.setItem('lastActivity', Date.now().toString());

        window.dispatchEvent(new Event('userLoggedIn'));
        window.location.href = `/${result.organization.slug}/dashboard`;
      } else {
        let errorMessage = result.error || t('loginFailed');
        if (
          result.error === 'Invalid email or password' ||
          result.error?.toLowerCase().includes('invalid email or password')
        ) {
          errorMessage = t('invalidEmailOrPassword');
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* LADO ESQUERDO – FORMULÁRIO */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo width={180} height={0} className="h-auto" />
          </div>

          {/* Card */}
          <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 md:p-10">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('pageTitle')}
              </h1>

              {t('pageDescription') && (
                <p className="text-gray-600 text-sm sm:text-base mt-2">
                  {t('pageDescription')}
                </p>
              )}
            </div>

            {/* FORMULÁRIO MELHORADO */}
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('companyEmail')}
                </label>

                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder={t('emailPlaceholder')}
                    className="
                      pl-10 h-11 rounded-lg
                      border-gray-300
                      focus:border-blue-500
                      focus:ring-2 focus:ring-blue-500/20
                      transition
                    "
                  />
                </div>
              </div>

              {/* PASSWORD COM OLHINHO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('password')}
                </label>

                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder={t('passwordPlaceholder')}
                    className="
                      pr-10 h-11 rounded-lg
                      border-gray-300
                      focus:border-blue-500
                      focus:ring-2 focus:ring-blue-500/20
                      transition
                    "
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="
                      absolute right-3 top-1/2 -translate-y-1/2
                      text-gray-400 hover:text-gray-600
                      transition
                    "
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* SUBMIT */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('signingIn')}
                  </>
                ) : (
                  t('signIn')
                )}
              </Button>

              {/* LINKS */}
              <div className="text-center space-y-3 text-sm text-gray-600 pt-2">
                <p>
                  {t('noAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/register')}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    {t('signUp')}
                  </button>
                </p>

                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* LADO DIREITO – BRANDING */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 items-center justify-center p-10 rounded-l-[80px] shadow-2xl">
        <div className="max-w-md text-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">
              Plataforma Corporativa
            </h2>
          </div>

          <p className="text-blue-100 text-lg leading-relaxed">
            Centralize os processo da empresa, gerencie organizações e usuários
            com segurança, performance e controle total.
          </p>

          <ul className="space-y-3 text-blue-100 text-sm pt-4">
            <li>✔ Login seguro por organização</li>
            <li>✔ Controle de acesso por empresa</li>
            <li>✔ Ambiente corporativo escalável</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
