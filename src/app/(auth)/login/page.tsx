'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Loader2 } from 'lucide-react';

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
        
        // Disparar evento para ClientLocaleProvider atualizar o locale do usuário
        window.dispatchEvent(new Event('userLoggedIn'));
        
        // Redirecionar para o dashboard
        router.push(`/${result.organization.slug}/dashboard`);
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
    <div className="min-h-screen bg-background">
      {/* Header similar ao dashboard */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">OnClickWise</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="max-w-md w-full">
            {/* Login Form */}
            <div className="bg-card border rounded-xl p-8 shadow-sm">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-card-foreground mb-2">{t('pageTitle')}</h1>
                <p className="text-muted-foreground">{t('pageDescription')}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-2">
                    {t('companyEmail')}
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full"
                    placeholder={t('emailPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-2">
                    {t('password')}
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full"
                    placeholder={t('passwordPlaceholder')}
                  />
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('signingIn')}
                    </>
                  ) : (
                    t('signIn')
                  )}
                </Button>

                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    {t('noAccount')}{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/register')}
                      className="text-primary hover:text-primary/80 font-medium cursor-pointer"
                    >
                      {t('signUp')}
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