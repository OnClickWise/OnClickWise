'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Connection error. Please try again.');
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading company information...</p>
        </div>
      </div>
    );
  }

  if (!companyInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">Company Not Found</CardTitle>
            <CardDescription className="text-muted-foreground">
              The company you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              className="w-full cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Main Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Notificação de inatividade */}
      <InactivityNotification 
        isVisible={showNotification} 
        onClose={handleCloseNotification} 
      />

      {/* Main content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
            {/* Company Info Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <OrganizationAvatar 
                    src={companyInfo.logo_url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${companyInfo.logo_url}` : undefined} 
                    name={companyInfo.name} 
                    size="xl"
                  />
                  <div>
                    <h2 className="text-lg font-semibold text-card-foreground">{companyInfo.name}</h2>
                    <p className="text-sm text-muted-foreground">{companyInfo.email}</p>
                    <Badge variant="secondary" className="mt-1">
                      <Shield className="w-3 h-3 mr-1" />
                      Company Portal
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Login Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Sign In</CardTitle>
                <CardDescription className="text-center">
                  Access your account at {companyInfo.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="pl-10"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="pl-10"
                        placeholder="Your password"
                      />
                    </div>
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
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Don't have an account?{' '}
                      Contact your administrator
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
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