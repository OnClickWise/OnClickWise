'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Building2, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { Logo } from '@/components/Logo';

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
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization: {
            name: formData.name,
            slug: formData.slug,
            email: formData.email,
            id: formData.company_id,
            phone: formData.phone,
            address: '',
            city: '',
            state: '',
            country: 'United States',
            zipCode: '',
          },
          representative: {
            name: '', // Será preenchido depois nas configurações
            email: '', // Será preenchido depois nas configurações
            position: '', // Será preenchido depois nas configurações
            ssn: '', // Será preenchido depois nas configurações
             password: formData.password,
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
      console.log(result);
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
    <>
      <div className="auth-page-container">
        {/* Header */}
        <header className="auth-header flex h-14 shrink-0 items-center gap-2 px-3 sm:px-4 md:px-8 sticky top-0 z-10 w-full max-w-full overflow-x-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <Logo width={170} height={0} className="w-[170px] h-auto" />
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex flex-col px-2 sm:px-3 pt-4 sm:pt-6 pb-4 sm:pb-6 w-full max-w-full overflow-x-hidden min-h-0">
          <div className="w-full max-w-2xl mx-auto relative z-10">
            {/* Header */}
            <div className="text-center mb-4 sm:mb-6 w-full px-2 sm:px-0">
              <h1 className="auth-title text-xl sm:text-2xl md:text-3xl break-words w-full">{t('pageTitle')}</h1>
            </div>

            {/* Registration Form */}
            <div className="auth-card p-4 sm:p-6 md:p-8 w-full">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 w-full">
                {/* Company Information */}
                <div className="auth-section w-full">
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 break-words">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#3b82f6] flex-shrink-0" />
                    <span className="break-words">{t('companyInformation')}</span>
                  </h2>
                  
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <div className="w-full">
                      <label htmlFor="name" className="auth-label">
                        {t('companyName')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleNameChange}
                        required
                        className="auth-input w-full max-w-full"
                        placeholder={t('companyNamePlaceholder')}
                      />
                    </div>

                    <div className="w-full">
                      <label htmlFor="slug" className="auth-label">
                        {t('companyUrl')}
                      </label>
                      <Input
                        id="slug"
                        name="slug"
                        type="text"
                        value={formData.slug}
                        onChange={handleInputChange}
                        className="auth-input w-full max-w-full"
                        placeholder={t('companyUrlPlaceholder')}
                      />
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 font-medium break-words">
                        {formData.slug 
                          ? <>onclickwise.com/<span className="text-[#3b82f6]">{formData.slug}</span></>
                          : <>{t('companyUrlPreview').split('/')[0]}/<span className="text-[#3b82f6]">{t('companyUrlPreview').split('/')[1]}</span></>
                        }
                      </p>
                    </div>

                    <div className="w-full">
                      <label htmlFor="company_id" className="auth-label">
                        {t('companyId')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="company_id"
                        name="company_id"
                        type="text"
                        value={formData.company_id}
                        onChange={handleInputChange}
                        required
                        className="auth-input w-full max-w-full"
                        placeholder={t('companyIdPlaceholder')}
                      />
                    </div>

                    <div className="w-full">
                      <label htmlFor="email" className="auth-label">
                        {t('companyEmail')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="auth-input w-full max-w-full"
                        placeholder={t('companyEmailPlaceholder')}
                      />
                    </div>

                    <div className="w-full">
                      <label htmlFor="phone" className="auth-label">
                        {t('phoneNumber')}
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="auth-input w-full max-w-full"
                        placeholder={t('phoneNumberPlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div className="auth-section w-full">
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 break-words">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-[#3b82f6] flex-shrink-0" />
                    <span className="break-words">{t('security')}</span>
                  </h2>
                
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <div className="w-full">
                      <label htmlFor="password" className="auth-label">
                        {t('password')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative w-full">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          className="auth-input w-full max-w-full pr-10"
                          placeholder={t('passwordPlaceholder')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#3b82f6] transition-colors cursor-pointer p-1"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="w-full">
                      <label htmlFor="password_confirm" className="auth-label">
                        {t('confirmPassword')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative w-full">
                        <Input
                          id="password_confirm"
                          name="password_confirm"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.password_confirm}
                          onChange={handleInputChange}
                          required
                          className="auth-input w-full max-w-full pr-10"
                          placeholder={t('confirmPasswordPlaceholder')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#3b82f6] transition-colors cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="auth-section w-full">
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('termsAndConditions')}</h2>
                
                  <div className="flex items-start space-x-2 sm:space-x-3 w-full">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 sm:mt-1 h-4 w-4 sm:h-5 sm:w-5 text-[#3b82f6] focus:ring-[#3b82f6] border-gray-300 rounded cursor-pointer flex-shrink-0"
                    />
                    <div className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words flex-1 min-w-0">
                      <span className="break-words">
                        {t('acceptTerms')}{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setModalContent('terms');
                            setShowTermsModal(true);
                          }}
                          className="text-[#3b82f6] hover:text-[#2563eb] font-semibold underline cursor-pointer transition-colors break-words text-xs sm:text-sm"
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
                          className="text-[#3b82f6] hover:text-[#2563eb] font-semibold underline cursor-pointer transition-colors break-words text-xs sm:text-sm"
                        >
                          {t('privacyPolicy')}
                        </button>
                        {' '}{t('ofThePlatform')}
                      </span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="auth-error mt-2">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 w-full">
                  <button
                    type="submit"
                    disabled={loading}
                    className="auth-button-primary flex-1 flex items-center justify-center w-full py-3 sm:py-3.5 text-sm sm:text-base font-semibold min-h-[44px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        <span className="text-xs sm:text-sm sm:text-base">{t('creatingAccount')}</span>
                      </>
                    ) : (
                      <span className="text-sm sm:text-base">{t('createAccount')}</span>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="auth-button-outline flex-1 w-full py-3 sm:py-3.5 text-xs sm:text-sm md:text-base font-semibold min-h-[44px]"
                    disabled={loading}
                  >
                    {t('alreadyHaveAccount')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-x-hidden">
          <div className="auth-card w-full max-w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto overflow-x-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
                <h3 className="text-base sm:text-xl font-semibold text-card-foreground break-words flex-1 min-w-0">
                  {modalContent === 'terms' ? t('termsModalTitle') : t('privacyModalTitle')}
                </h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer p-1 flex-shrink-0"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
                <button
                  onClick={() => setModalContent('terms')}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                    modalContent === 'terms'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('termsModalTitle')}
                </button>
                <button
                  onClick={() => setModalContent('privacy')}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                    modalContent === 'privacy'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('privacyModalTitle')}
                </button>
              </div>
              
              <div className="space-y-4 sm:space-y-6 text-xs sm:text-sm text-gray-700 max-h-[60vh] sm:max-h-96 overflow-y-auto">
                {modalContent === 'terms' ? (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">{t('termsModalTitle')}</h4>
                  
                    <div className="space-y-3 sm:space-y-4">
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        <strong>{tTerms('lastUpdated')}</strong> {tTerms('lastUpdatedDate')}
                      </p>
                      
                      <p className="text-xs sm:text-sm">{tTerms('welcomeText')}</p>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{tTerms('section1Title')}</h5>
                        <p className="mb-1.5 sm:mb-2 text-xs sm:text-sm">{tTerms('section1Intro')}</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-xs sm:text-sm">
                          <li>{tTerms('section1User')}</li>
                          <li>{tTerms('section1Company')}</li>
                          <li>{tTerms('section1RegistrationData')}</li>
                          <li>{tTerms('section1Services')}</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{tTerms('section2Title')}</h5>
                        <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-xs sm:text-sm">
                          <li>{tTerms('section2Item1')}</li>
                          <li>{tTerms('section2Item2')}</li>
                          <li>{tTerms('section2Item3')}</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{tTerms('section3Title')}</h5>
                        <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-xs sm:text-sm">
                          <li>{tTerms('section3Item1')}</li>
                          <li>{tTerms('section3Item2')}</li>
                          <li>{tTerms('section3Item3')}</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{tTerms('section4Title')}</h5>
                        <p className="mb-1.5 sm:mb-2 text-xs sm:text-sm">{tTerms('section4Intro')}</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-xs sm:text-sm">
                          <li>{tTerms('section4Item1')}</li>
                          <li>{tTerms('section4Item2')}</li>
                          <li>{tTerms('section4Item3')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">{t('privacyModalTitle')}</h4>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        <strong>{tPrivacy('lastUpdated')}</strong> {tPrivacy('lastUpdatedDate')}
                      </p>
                      
                      <p className="text-xs sm:text-sm">{tPrivacy('introText')}</p>
                      <p className="text-xs sm:text-sm">{tPrivacy('agreementText')}</p>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{tPrivacy('section1Title')}</h5>
                        <p className="mb-1.5 sm:mb-2 text-xs sm:text-sm">{tPrivacy('section1Intro')}</p>
                        
                        <div className="ml-2 sm:ml-4 space-y-2">
                          <div>
                            <strong className="text-xs sm:text-sm">{tPrivacy('section1CompanyData')}</strong>
                            <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 mt-1 text-xs sm:text-sm">
                              <li>{tPrivacy('section1CompanyName')}</li>
                              <li>{tPrivacy('section1CompanySlug')}</li>
                              <li>{tPrivacy('section1CompanyEIN')}</li>
                              <li>{tPrivacy('section1CompanyEmail')}</li>
                              <li>{tPrivacy('section1CompanyPhone')}</li>
                              <li>{tPrivacy('section1CompanyAddress')}</li>
                            </ul>
                          </div>
                          
                          <div>
                            <strong className="text-xs sm:text-sm">{tPrivacy('section1ResponsibleData')}</strong>
                            <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 mt-1 text-xs sm:text-sm">
                              <li>{tPrivacy('section1ResponsibleName')}</li>
                              <li>{tPrivacy('section1ResponsiblePosition')}</li>
                              <li>{tPrivacy('section1ResponsibleEmail')}</li>
                              <li>{tPrivacy('section1ResponsibleSSN')}</li>
                            </ul>
                          </div>
                          
                          <div>
                            <strong className="text-xs sm:text-sm">{tPrivacy('section1AccessData')}</strong>
                            <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 mt-1 text-xs sm:text-sm">
                              <li>{tPrivacy('section1AccessPassword')}</li>
                              <li>{tPrivacy('section1AccessLogs')}</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{tPrivacy('section2Title')}</h5>
                        <p className="mb-1.5 sm:mb-2 text-xs sm:text-sm">{tPrivacy('section2Intro')}</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-xs sm:text-sm">
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
                        <h5 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{tPrivacy('section3Title')}</h5>
                        <p className="mb-1.5 sm:mb-2 text-xs sm:text-sm">{tPrivacy('section3Intro1')}</p>
                        <p className="mb-1.5 sm:mb-2 text-xs sm:text-sm">{tPrivacy('section3Intro2')}</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-xs sm:text-sm">
                          <li>{tPrivacy('section3Item1')}</li>
                          <li>{tPrivacy('section3Item2')}</li>
                          <li>{tPrivacy('section3Item3')}</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{tPrivacy('section4Title')}</h5>
                        <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-xs sm:text-sm">
                          <li>{tPrivacy('section4Item1')}</li>
                          <li>{tPrivacy('section4Item2')}</li>
                          <li>{tPrivacy('section4Item3')}</li>
                          <li>{tPrivacy('section4Item4')}</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{tPrivacy('section5Title')}</h5>
                        <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-xs sm:text-sm">
                          <li>{tPrivacy('section5Item1')}</li>
                          <li>{tPrivacy('section5Item2')}</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{tPrivacy('section6Title')}</h5>
                        <p className="mb-1.5 sm:mb-2 text-xs sm:text-sm">{tPrivacy('section6Intro')}</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-xs sm:text-sm">
                          <li>{tPrivacy('section6Item1')}</li>
                          <li>{tPrivacy('section6Item2')}</li>
                          <li>{tPrivacy('section6Item3')}</li>
                          <li>{tPrivacy('section6Item4')}</li>
                          <li>{tPrivacy('section6Item5')}</li>
                          <li>{tPrivacy('section6Item6')}</li>
                          <li>{tPrivacy('section6Item7')}</li>
                          <li>{tPrivacy('section6Item8')}</li>
                        </ul>
                        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm">{tPrivacy('section6Contact')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 sm:mt-6 flex justify-end">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="auth-button-primary cursor-pointer px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base min-h-[44px] w-full sm:w-auto"
                >
                  {t('closeModal')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}