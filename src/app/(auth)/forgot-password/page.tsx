'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Building2, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const t = useTranslations('ForgotPassword');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'user' }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || t('errorRequestFailed'));
      }
    } catch {
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white">

      {/* LEFT — FORM */}
      <div className="w-full lg:w-1/2 h-screen flex justify-center px-4 sm:px-6">
        <div
          className="w-full max-w-md overflow-y-auto py-10
                     scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        >

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo width={160} height={0} />
          </div>

          {/* Card */}
          <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8">

            {!success ? (
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {t('pageTitle')}
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm">
                    {t('pageDescription')}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('email')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder={t('emailPlaceholder')}
                        className="pl-10 h-11 rounded-lg"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700
                               text-white rounded-lg font-semibold
                               flex items-center justify-center transition"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('sending')}
                      </>
                    ) : (
                      t('sendInstructions')
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="w-full flex items-center justify-center gap-2
                               text-sm font-semibold text-blue-600 hover:underline pt-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('backToLogin')}
                  </button>
                </form>
              </>
            ) : (
              /* SUCCESS */
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl
                                flex items-center justify-center mx-auto mb-5">
                  <Mail className="w-10 h-10 text-blue-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('emailSent')}
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                  {t('emailSentMessage')}
                </p>

                <button
                  onClick={() => router.push('/login')}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700
                             text-white rounded-lg font-semibold transition"
                >
                  {t('backToLogin')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT — BRANDING */}
      <div
        className="hidden lg:flex w-1/2 items-center justify-center p-10
                   bg-gradient-to-br from-blue-700 to-blue-900
                   rounded-l-[80px] shadow-2xl"
      >
        <div className="max-w-md text-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20
                            flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">
              Recuperação de Acesso
            </h2>
          </div>

          <p className="text-blue-100 text-lg leading-relaxed">
            Enviaremos instruções seguras para redefinir sua senha
            e restaurar o acesso à sua conta.
          </p>

          <ul className="space-y-3 text-blue-100 text-sm pt-4">
            <li>✔ Processo rápido e seguro</li>
            <li>✔ Link temporário por e-mail</li>
            <li>✔ Proteção corporativa</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
