'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Loader2, Mail, Lock } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('GeneralLogin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        // Salvar token no localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('organization', JSON.stringify(result.organization));
        localStorage.setItem('lastActivity', Date.now().toString());
        
        // Disparar evento para ClientLocaleProvider atualizar o locale do usuário
        window.dispatchEvent(new Event('userLoggedIn'));
        
        // Usar window.location.href para garantir redirecionamento completo
        // Isso evita problemas com AuthGuard que pode verificar antes do router.push
        window.location.href = `/${result.organization.slug}/dashboard`;
      } else {
        setError(result.error || t('loginFailed'));
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Header */}
      <header className="auth-header flex h-16 shrink-0 items-center gap-2 px-4 md:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Logo width={200} height={65} className="h-14 w-auto" />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-8 md:pt-12 pb-12">
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] relative z-10">
          <div className="max-w-md w-full">
            {/* Login Form */}
            <div className="auth-card p-8 md:p-10">
              <div className="text-center mb-8">
                <h1 className="auth-title text-3xl md:text-4xl mb-3">{t('pageTitle')}</h1>
                {t('pageDescription') && (
                  <p className="auth-subtitle text-base">{t('pageDescription')}</p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="auth-label">
                    {t('companyEmail')}
                  </label>
                  <div className="auth-input-wrapper">
                    <Mail className="auth-input-icon" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="auth-input has-icon"
                      placeholder={t('emailPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="auth-label">
                    {t('password')}
                  </label>
                  <div className="auth-input-wrapper">
                    <Lock className="auth-input-icon" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="auth-input has-icon"
                      placeholder={t('passwordPlaceholder')}
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
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('signingIn')}
                    </>
                  ) : (
                    t('signIn')
                  )}
                </button>

                <div className="text-center space-y-4 pt-2">
                  <p className="text-gray-600 text-sm">
                    {t('noAccount')}{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/register')}
                      className="text-[#3b82f6] hover:text-[#2563eb] font-semibold cursor-pointer transition-colors"
                    >
                      {t('signUp')}
                    </button>
                  </p>
                  <p className="text-sm">
                    <button
                      type="button"
                      onClick={() => router.push('/forgot-password')}
                      className="text-[#3b82f6] hover:text-[#2563eb] font-semibold cursor-pointer transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}