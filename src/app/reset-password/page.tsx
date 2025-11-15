'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Building2, Loader2, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
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

    // Validações
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          new_password: password,
          type: type
        }),
      });

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setError(t('connectionError') || 'Erro ao conectar com o servidor');
        setLoading(false);
        return;
      }

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setError(''); // Limpar qualquer erro anterior
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          if (org) {
            router.push(`/${org}/login`);
          } else {
            router.push('/login');
          }
        }, 3000);
      } else {
        setError(result.error || t('errorResetFailed'));
        setSuccess(false);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError(t('connectionError') || 'Erro ao conectar com o servidor');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <div className="auth-page-container flex items-center justify-center">
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3b82f6] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-container">
      {/* Header */}
      <header className="auth-header flex h-14 shrink-0 items-center gap-2 px-3 sm:px-4 md:px-8 sticky top-0 z-10 w-full max-w-full overflow-x-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <Logo width={200} height={65} className="h-10 sm:h-14 w-auto" />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-4 px-2 sm:px-3 md:px-4 pt-3 md:pt-4 pb-4 w-full max-w-full overflow-x-hidden">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] relative z-10 w-full">
          <div className="w-full max-w-md mx-auto">
            {/* Reset Password Form */}
            <div className="auth-card p-4 md:p-8 w-full">
              {!success ? (
                <>
                  <div className="text-center mb-6">
                    <h1 className="auth-title text-2xl md:text-3xl mb-2">
                      {t('pageTitle')}
                    </h1>
                    <p className="auth-subtitle text-sm">
                      {t('pageDescription')}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="password" className="auth-label">
                        {t('newPassword')}
                      </label>
                      <div className="auth-input-wrapper">
                        <Lock className="auth-input-icon" />
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="auth-input has-icon"
                          placeholder={t('newPasswordPlaceholder')}
                          minLength={6}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5 font-medium">
                        {t('passwordMinLength')}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="auth-label">
                        {t('confirmPassword')}
                      </label>
                      <div className="auth-input-wrapper">
                        <Lock className="auth-input-icon" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="auth-input has-icon"
                          placeholder={t('confirmPasswordPlaceholder')}
                          minLength={6}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="auth-error flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !token}
                      className="auth-button-primary w-full flex items-center justify-center"
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

                    <div className="text-center pt-2">
                      <Link
                        href={org ? `/${org}/login` : '/login'}
                        className="text-sm text-[#3b82f6] hover:text-[#2563eb] font-semibold cursor-pointer transition-colors"
                      >
                        {t('backToLogin')}
                      </Link>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="auth-title text-2xl md:text-3xl mb-3">
                    {t('passwordReset')}
                  </h2>
                  <p className="auth-subtitle text-sm mb-6">
                    {t('passwordResetMessage')}
                  </p>
                  <button
                    onClick={() => router.push(org ? `/${org}/login` : '/login')}
                    className="auth-button-primary w-full"
                  >
                    {t('goToLogin')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page-container flex items-center justify-center">
          <div className="text-center relative z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3b82f6] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Carregando...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

