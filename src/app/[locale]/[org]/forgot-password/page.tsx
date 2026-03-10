'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Building2, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

interface CompanyInfo {
  id: number;
  name: string;
  slug: string;
  email: string;
  logo_url?: string;
}

export default function CompanyForgotPasswordPage({ params }: { params: Promise<{ org: string; locale: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const t = useTranslations('ForgotPassword');
  const [loading, setLoading] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        
        const response = await fetch(`${apiUrl}/auth/check-company-by-slug`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slug: resolvedParams.org }),
        });

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.log('API not available');
          setCompanyInfo(null);
          setLoadingCompany(false);
          return;
        }

        const result = await response.json();

        if (result.success) {
          setCompanyInfo(result.company);
        } else {
          setCompanyInfo(null);
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
        setCompanyInfo(null);
      } finally {
        setLoadingCompany(false);
      }
    };

    fetchCompanyInfo();
  }, [resolvedParams.org]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validação básica de email
    if (!email || !email.includes('@')) {
      setError(t('invalidEmail') || 'Email inválido');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          type: 'user',
          organization_slug: resolvedParams.org
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
      } else {
        setError(result.error || t('errorRequestFailed'));
        setSuccess(false);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(t('connectionError') || 'Erro ao conectar com o servidor');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loadingCompany) {
    return (
      <div className="auth-page-container flex items-center justify-center">
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3b82f6] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">{t('loadingCompanyInfo')}</p>
        </div>
      </div>
    );
  }

  if (!companyInfo) {
    return (
      <div className="auth-page-container">
        {/* Header */}
        <header className="auth-header flex h-16 shrink-0 items-center gap-2 px-4 md:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Logo width={200} height={65} className="h-14 w-auto" />
          </div>
        </header>
        
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] relative z-10 p-4">
          <div className="max-w-md w-full">
            <div className="auth-card p-8 md:p-10">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Building2 className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="auth-title text-2xl md:text-3xl mb-3 text-red-600">{t('companyNotFound')}</h2>
                <p className="auth-subtitle mb-8">
                  {t('companyNotFoundMessage')}
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="auth-button-outline w-full flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('backToMainLogin')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-container">
      {/* Main content */}
      <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
        <div className="max-w-md w-full">
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
                      href={`/${resolvedParams.org}/login`}
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
                  onClick={() => router.push(`/${resolvedParams.locale}/${resolvedParams.org}/login`)}
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
  );
}

