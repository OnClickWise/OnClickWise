'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Lock, User, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import InactivityNotification from '@/components/InactivityNotification';
import { useInactivityNotification } from '@/hooks/useInactivityNotification';
import { useAuth } from '@/hooks/useAuth';
import { generateOrgLogo } from '@/utils/avatar';
import { OrganizationAvatar } from '@/components/ui/avatar';

interface CompanyInfo {
  id: number;
  name: string;
  slug: string;
  email: string;
  logo_url?: string;
}

export default function CompanyLoginPage({ params }: { params: Promise<{ org: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { getLastVisitedUrl } = useAuth();
  const t = useTranslations('OrgLogin');
  const [loading, setLoading] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [error, setError] = useState('');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  // Hook para gerenciar notificação de inatividade
  const { showNotification, handleCloseNotification, hideNotification } = useInactivityNotification(resolvedParams.org);

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

        // Check if response is HTML (API not running)
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
        // If there's an error, assume company doesn't exist
        setCompanyInfo(null);
      } finally {
        setLoadingCompany(false);
      }
    };

    fetchCompanyInfo();
  }, [resolvedParams.org]);

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
        body: JSON.stringify({
          ...formData,
          organization_slug: resolvedParams.org
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Salvar token no localStorage com timestamp de atividade
        const now = Date.now();
        localStorage.setItem('token', result.token);
        localStorage.setItem('organization', JSON.stringify(result.organization));
        localStorage.setItem('lastActivity', now.toString());
        
        // Disparar evento para ClientLocaleProvider atualizar o locale do usuário
        window.dispatchEvent(new Event('userLoggedIn'));
        
        // Esconder notificação de inatividade após login bem-sucedido
        hideNotification();
        
        // Verificar se é senha temporária
        if (result.user?.is_temporary_password) {
          setShowPasswordModal(true);
        } else {
          // Tentar obter a última URL visitada
          const lastUrl = getLastVisitedUrl(result.organization.slug);
          
          // Redirecionar para a última URL visitada ou dashboard
          if (lastUrl) {
            router.push(lastUrl);
          } else {
            router.push(`/${result.organization.slug}/dashboard`);
          }
        }
      } else {
        // Mapear mensagens de erro da API para chaves de tradução
        let errorMessage = result.error || t('loginFailed');
        if (result.error === 'Invalid email or password' || result.error?.toLowerCase().includes('invalid email or password')) {
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

  const handlePasswordChangeSuccess = () => {
    setShowPasswordModal(false);
    // Redirecionar para a última URL visitada ou dashboard após troca de senha
    const organization = JSON.parse(localStorage.getItem('organization') || '{}');
    const lastUrl = getLastVisitedUrl(organization.slug);
    
    if (lastUrl) {
      router.push(lastUrl);
    } else {
      router.push(`/${organization.slug}/dashboard`);
    }
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    // Fazer logout se cancelar
    localStorage.removeItem('token');
    localStorage.removeItem('organization');
  };

  if (loadingCompany) {
    return (
      <div className="auth-page-container flex items-center justify-center p-4">
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-[#3b82f6] border-t-transparent mx-auto mb-3 sm:mb-4"></div>
          <p className="text-gray-600 font-medium text-sm sm:text-base">{t('loadingCompanyInfo')}</p>
        </div>
      </div>
    );
  }

  if (!companyInfo) {
    return (
      <div className="auth-page-container flex items-center justify-center p-3 sm:p-4">
        <div className="auth-card max-w-md w-full relative z-10">
          <div className="p-5 sm:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
              <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
            </div>
            <h2 className="auth-title text-xl sm:text-2xl mb-2 sm:mb-3 text-red-600">{t('companyNotFound')}</h2>
            <p className="auth-subtitle text-sm sm:text-base mb-6 sm:mb-8">
              {t('companyNotFoundMessage')}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="auth-button-outline w-full flex items-center justify-center text-sm sm:text-base py-2 sm:py-2.5 px-4"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {t('backToMainLogin')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-container">
      {/* Notificação de inatividade */}
      <InactivityNotification 
        isVisible={showNotification} 
        onClose={handleCloseNotification} 
      />

      {/* Main content */}
      <div className="flex items-center justify-center min-h-screen p-3 sm:p-4 relative z-10">
        <div className="max-w-md w-full">
            {/* Company Info Card */}
            <div className="auth-card mb-4 sm:mb-6 p-4 sm:p-6">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <OrganizationAvatar 
                  src={companyInfo.logo_url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${companyInfo.logo_url}` : undefined} 
                  name={companyInfo.name} 
                  size="xl"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{companyInfo.name}</h2>
                  <Badge className="mt-1.5 sm:mt-2 bg-gradient-to-r from-[#facc15] to-[#fbbf24] text-black border-none px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
                    <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    {t('companyPortal')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <div className="auth-card p-5 sm:p-8 md:p-10">
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="auth-title text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3">{t('signIn')}</h1>
                <p className="auth-subtitle text-sm sm:text-base">
                  {t('accessAccount', { companyName: companyInfo.name })}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="email" className="auth-label">
                    {t('emailAddress')}
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

                <div className="text-center space-y-2 sm:space-y-3 pt-2">
                  <p className="text-xs sm:text-sm text-gray-600">
                    {t('noAccount')}{' '}
                    {t('contactAdmin')}
                  </p>
                  <p className="text-xs sm:text-sm">
                    <button
                      type="button"
                      onClick={() => router.push(`/${resolvedParams.org}/forgot-password`)}
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

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={handleClosePasswordModal}
        onSuccess={handlePasswordChangeSuccess}
      />
    </div>
  );
}