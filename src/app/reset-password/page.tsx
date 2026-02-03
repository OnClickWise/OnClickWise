
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import {
  Building2,
  Loader2,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Logo } from '@/components/Logo';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('ResetPassword');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [type, setType] = useState<'user' | 'organization'>('user');
  const [org, setOrg] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const typeParam = searchParams.get('type') as 'user' | 'organization' | null;
    const orgParam = searchParams.get('org');

    if (!tokenParam) {
      setError(t('tokenNotFound'));
      return;
    }

    setToken(tokenParam);
    setType(typeParam || 'user');
    setOrg(orgParam);
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError(t('fillAllFields'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (!token) {
      setError(t('tokenNotFound'));
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password: password,
          type
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(org ? `/${org}/login` : '/login');
        }, 3000);
      } else {
        setError(result.error || t('errorResetFailed'));
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
        <div className="w-full max-w-md overflow-y-auto py-10 scrollbar-thin scrollbar-thumb-gray-300">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo width={160} height={0} />
          </div>

          {/* Card */}
          <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8">

            {!success ? (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {t('pageTitle')}
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">
                    {t('pageDescription')}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('newPassword')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={t('newPasswordPlaceholder')}
                        className="pl-10 h-11 rounded-lg"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('passwordMinLength')}
                    </p>
                  </div>

                  {/* Confirm */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('confirmPassword')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder={t('confirmPasswordPlaceholder')}
                        className="pl-10 h-11 rounded-lg"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex gap-2 items-center bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('resetting')}
                      </>
                    ) : (
                      t('resetPassword')
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* SUCCESS */
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('passwordReset')}
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                  {t('passwordResetMessage')}
                </p>

                <button
                  onClick={() => router.push(org ? `/${org}/login` : '/login')}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  {t('goToLogin')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT — BRANDING */}
      <aside className="hidden lg:flex w-1/2 items-center justify-center p-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-l-[80px] shadow-2xl">
        <div className="max-w-md text-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">
              Segurança da Conta
            </h2>
          </div>

          <p className="text-blue-100 text-lg">
            Manage leads, contacts, companies, deals, tasks and teams — all in one powerful platform. 
            Designed to streamline your sales process and help you close more deals effortlessly.
          </p>

          <ul className="space-y-3 text-blue-100 text-sm pt-4">
            <li>✔ Criptografia avançada</li>
            <li>✔ Link temporário e seguro</li>
            <li>✔ Padrões corporativos</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
