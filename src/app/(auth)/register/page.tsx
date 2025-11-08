'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';

interface CompanyData {
  name: string;
  slug: string;
  email: string;
  company_id: string;
  password: string;
  password_confirm: string;
  phone: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('Register');
  const tTerms = useTranslations('Register.termsContent');
  const tPrivacy = useTranslations('Register.privacyContent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [modalContent, setModalContent] = useState<'terms' | 'privacy'>('terms');
  const [formData, setFormData] = useState<CompanyData>({
    name: '',
    slug: '',
    email: '',
    company_id: '',
    password: '',
    password_confirm: '',
    phone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.company_id || !formData.password) {
      setError(t('errorAllFieldsRequired'));
      return false;
    }

    if (formData.password !== formData.password_confirm) {
      setError(t('errorPasswordsDoNotMatch'));
      return false;
    }

    if (formData.password.length < 6) {
      setError(t('errorPasswordMinLength'));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t('errorInvalidEmail'));
      return false;
    }

    if (!termsAccepted) {
      setError(t('errorAcceptTerms'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization: {
            name: formData.name,
            slug: formData.slug,
            email: formData.email,
            company_id: formData.company_id,
            password: formData.password,
            phone: formData.phone,
            address: '',
            city: '',
            state: '',
            country: 'United States',
            zipCode: '',
          },
          representative: {
            name: formData.name, // Use company name as representative name
            email: formData.email,
            position: 'Owner',
            ssn: '000-00-0000' // Default value
          }
        }),
      });

      // Check if response is HTML (API not running)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        setError(t('errorApiNotAvailable'));
        return;
      }

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
        setError(result.error || t('errorCreatingAccount'));
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(t('errorCreatingAccount'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
          <div className="max-w-2xl w-full">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-1">{t('pageTitle')}</h1>
              <p className="text-muted-foreground text-sm">{t('pageDescription')}</p>
            </div>

            {/* Registration Form */}
            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Company Information */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h2 className="text-base font-semibold text-card-foreground mb-2">{t('companyInformation')}</h2>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-card-foreground mb-1">
                        {t('companyName')} {t('required')}
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleNameChange}
                        required
                        className="w-full"
                        placeholder={t('companyNamePlaceholder')}
                      />
                    </div>

                    <div>
                      <label htmlFor="slug" className="block text-sm font-medium text-card-foreground mb-1">
                        {t('companyUrl')}
                      </label>
                      <Input
                        id="slug"
                        name="slug"
                        type="text"
                        value={formData.slug}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder={t('companyUrlPlaceholder')}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        onclickwise.com/{formData.slug}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="company_id" className="block text-sm font-medium text-card-foreground mb-1">
                        {t('companyId')} {t('required')}
                      </label>
                      <Input
                        id="company_id"
                        name="company_id"
                        type="text"
                        value={formData.company_id}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                        placeholder={t('companyIdPlaceholder')}
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-1">
                        {t('companyEmail')} {t('required')}
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                        placeholder={t('companyEmailPlaceholder')}
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-card-foreground mb-1">
                        {t('phoneNumber')}
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder={t('phoneNumberPlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h2 className="text-base font-semibold text-card-foreground mb-2">{t('security')}</h2>
                
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-1">
                        {t('password')} {t('required')}
                      </label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          className="w-full pr-10"
                          placeholder={t('passwordPlaceholder')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password_confirm" className="block text-sm font-medium text-card-foreground mb-1">
                        {t('confirmPassword')} {t('required')}
                      </label>
                      <div className="relative">
                        <Input
                          id="password_confirm"
                          name="password_confirm"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.password_confirm}
                          onChange={handleInputChange}
                          required
                          className="w-full pr-10"
                          placeholder={t('confirmPasswordPlaceholder')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h2 className="text-base font-semibold text-card-foreground mb-2">{t('termsAndConditions')}</h2>
                
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                    <div className="text-xs text-gray-700">
                      <span>
                        {t('acceptTerms')}{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setModalContent('terms');
                            setShowTermsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 underline cursor-pointer"
                        >
                          {t('termsOfUse')}
                        </button>
                        {' '}{t('and')}{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setModalContent('privacy');
                            setShowTermsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 underline cursor-pointer"
                        >
                          {t('privacyPolicy')}
                        </button>
                        {' '}{t('ofThePlatform')}
                      </span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('creatingAccount')}
                      </>
                    ) : (
                      t('createAccount')
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/login')}
                    className="flex-1 cursor-pointer"
                    disabled={loading}
                  >
                    {t('alreadyHaveAccount')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-card-foreground">
                  {modalContent === 'terms' ? t('termsModalTitle') : t('privacyModalTitle')}
                </h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setModalContent('terms')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 cursor-pointer ${
                    modalContent === 'terms'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('termsModalTitle')}
                </button>
                <button
                  onClick={() => setModalContent('privacy')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 cursor-pointer ${
                    modalContent === 'privacy'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('privacyModalTitle')}
                </button>
              </div>
              
              <div className="space-y-6 text-sm text-gray-700 max-h-96 overflow-y-auto">
                {modalContent === 'terms' ? (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg">{t('termsModalTitle')}</h4>
                  
                    <div className="space-y-4">
                      <p className="text-xs text-gray-500">
                        <strong>{tTerms('lastUpdated')}</strong> {tTerms('lastUpdatedDate')}
                      </p>
                      
                      <p>{tTerms('welcomeText')}</p>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">{tTerms('section1Title')}</h5>
                        <p className="mb-2">{tTerms('section1Intro')}</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>{tTerms('section1User')}</li>
                          <li>{tTerms('section1Company')}</li>
                          <li>{tTerms('section1RegistrationData')}</li>
                          <li>{tTerms('section1Services')}</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">{tTerms('section2Title')}</h5>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>{tTerms('section2Item1')}</li>
                          <li>{tTerms('section2Item2')}</li>
                          <li>{tTerms('section2Item3')}</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">{tTerms('section3Title')}</h5>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>{tTerms('section3Item1')}</li>
                          <li>{tTerms('section3Item2')}</li>
                          <li>{tTerms('section3Item3')}</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">{tTerms('section4Title')}</h5>
                        <p className="mb-2">{tTerms('section4Intro')}</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>{tTerms('section4Item1')}</li>
                          <li>{tTerms('section4Item2')}</li>
                          <li>{tTerms('section4Item3')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg">{t('privacyModalTitle')}</h4>
                    
                    <div className="space-y-4">
                      <p className="text-xs text-gray-500">
                        <strong>{tPrivacy('lastUpdated')}</strong> {tPrivacy('lastUpdatedDate')}
                      </p>
                      
                      <p>{tPrivacy('introText')}</p>
                      <p>{tPrivacy('agreementText')}</p>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">{tPrivacy('section1Title')}</h5>
                        <p className="mb-2">{tPrivacy('section1Intro')}</p>
                        
                        <div className="ml-4 space-y-2">
                          <div>
                            <strong>{tPrivacy('section1CompanyData')}</strong>
                            <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                              <li>{tPrivacy('section1CompanyName')}</li>
                              <li>{tPrivacy('section1CompanySlug')}</li>
                              <li>{tPrivacy('section1CompanyEIN')}</li>
                              <li>{tPrivacy('section1CompanyEmail')}</li>
                              <li>{tPrivacy('section1CompanyPhone')}</li>
                              <li>{tPrivacy('section1CompanyAddress')}</li>
                            </ul>
                          </div>
                          
                          <div>
                            <strong>{tPrivacy('section1ResponsibleData')}</strong>
                            <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                              <li>{tPrivacy('section1ResponsibleName')}</li>
                              <li>{tPrivacy('section1ResponsiblePosition')}</li>
                              <li>{tPrivacy('section1ResponsibleEmail')}</li>
                              <li>{tPrivacy('section1ResponsibleSSN')}</li>
                            </ul>
                          </div>
                          
                          <div>
                            <strong>{tPrivacy('section1AccessData')}</strong>
                            <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                              <li>{tPrivacy('section1AccessPassword')}</li>
                              <li>{tPrivacy('section1AccessLogs')}</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">{tPrivacy('section2Title')}</h5>
                        <p className="mb-2">{tPrivacy('section2Intro')}</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>{tPrivacy('section2Item1')}</li>
                          <li>{tPrivacy('section2Item2')}</li>
                          <li>{tPrivacy('section2Item3')}</li>
                          <li>{tPrivacy('section2Item4')}</li>
                          <li>{tPrivacy('section2Item5')}</li>
                          <li>{tPrivacy('section2Item6')}</li>
                          <li>{tPrivacy('section2Item7')}</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">{tPrivacy('section3Title')}</h5>
                        <p className="mb-2">{tPrivacy('section3Intro1')}</p>
                        <p className="mb-2">{tPrivacy('section3Intro2')}</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>{tPrivacy('section3Item1')}</li>
                          <li>{tPrivacy('section3Item2')}</li>
                          <li>{tPrivacy('section3Item3')}</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">{tPrivacy('section4Title')}</h5>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>{tPrivacy('section4Item1')}</li>
                          <li>{tPrivacy('section4Item2')}</li>
                          <li>{tPrivacy('section4Item3')}</li>
                          <li>{tPrivacy('section4Item4')}</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">{tPrivacy('section5Title')}</h5>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>{tPrivacy('section5Item1')}</li>
                          <li>{tPrivacy('section5Item2')}</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">{tPrivacy('section6Title')}</h5>
                        <p className="mb-2">{tPrivacy('section6Intro')}</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>{tPrivacy('section6Item1')}</li>
                          <li>{tPrivacy('section6Item2')}</li>
                          <li>{tPrivacy('section6Item3')}</li>
                          <li>{tPrivacy('section6Item4')}</li>
                          <li>{tPrivacy('section6Item5')}</li>
                          <li>{tPrivacy('section6Item6')}</li>
                          <li>{tPrivacy('section6Item7')}</li>
                          <li>{tPrivacy('section6Item8')}</li>
                        </ul>
                        <p className="mt-2">{tPrivacy('section6Contact')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setShowTermsModal(false)}
                  className="cursor-pointer"
                >
                  {t('closeModal')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}