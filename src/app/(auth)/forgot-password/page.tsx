'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Building2, Loader2, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          type: 'user'
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || t('errorRequestFailed'));
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
  };

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
            {/* Forgot Password Form */}
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
                      <label htmlFor="email" className="auth-label">
                        {t('email')}
                      </label>
                      <div className="auth-input-wrapper">
                        <Mail className="auth-input-icon" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="auth-input has-icon"
                          placeholder={t('emailPlaceholder')}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="auth-error">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="auth-button-primary w-full flex items-center justify-center"
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

                    <div className="text-center pt-2">
                      <Link
                        href="/login"
                        className="text-sm text-[#3b82f6] hover:text-[#2563eb] font-semibold cursor-pointer inline-flex items-center gap-2 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        {t('backToLogin')}
                      </Link>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#3b82f6]/10 to-[#2563eb]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Mail className="w-10 h-10 text-[#3b82f6]" />
                  </div>
                  <h2 className="auth-title text-2xl md:text-3xl mb-3">
                    {t('emailSent')}
                  </h2>
                  <p className="auth-subtitle text-sm mb-6">
                    {t('emailSentMessage')}
                  </p>
                  <button
                    onClick={() => router.push('/login')}
                    className="auth-button-primary w-full"
                  >
                    {t('backToLogin')}
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

