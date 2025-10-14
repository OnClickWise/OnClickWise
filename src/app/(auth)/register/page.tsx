'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Eye, EyeOff } from 'lucide-react';

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
      setError('All required fields must be filled');
      return false;
    }

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }

    if (!termsAccepted) {
      setError('You must accept the terms and conditions');
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
      const response = await fetch('http://localhost:3000/auth/register', {
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
        setError('API not available. Please try again later.');
        return;
      }

      const result = await response.json();

      if (result.success) {
        // Salvar token no localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('organization', JSON.stringify(result.organization));
        
        // Redirecionar para o dashboard
        router.push(`/${result.organization.slug}/dashboard`);
      } else {
        setError(result.error || 'Error creating account');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Connection error. Please try again.');
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
              <h1 className="text-2xl font-bold text-foreground mb-1">Create Your Account</h1>
              <p className="text-muted-foreground text-sm">Get started with OnClickWise in just a few steps</p>
            </div>

            {/* Registration Form */}
            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Company Information */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h2 className="text-base font-semibold text-card-foreground mb-2">Company Information</h2>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-card-foreground mb-1">
                        Company Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleNameChange}
                        required
                        className="w-full"
                        placeholder="Enter your company name"
                      />
                    </div>

                    <div>
                      <label htmlFor="slug" className="block text-sm font-medium text-card-foreground mb-1">
                        Company URL
                      </label>
                      <Input
                        id="slug"
                        name="slug"
                        type="text"
                        value={formData.slug}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder="will-be-generated-automatically"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        onclickwise.com/{formData.slug}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="company_id" className="block text-sm font-medium text-card-foreground mb-1">
                        Company ID (EIN) *
                      </label>
                      <Input
                        id="company_id"
                        name="company_id"
                        type="text"
                        value={formData.company_id}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                        placeholder="Enter your company EIN"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-1">
                        Company Email *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                        placeholder="company@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-card-foreground mb-1">
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h2 className="text-base font-semibold text-card-foreground mb-2">Security</h2>
                
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-1">
                        Password *
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
                          placeholder="Minimum 6 characters"
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
                        Confirm Password *
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
                          placeholder="Confirm your password"
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
                  <h2 className="text-base font-semibold text-card-foreground mb-2">Terms and Conditions</h2>
                
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
                        I accept the{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setModalContent('terms');
                            setShowTermsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 underline cursor-pointer"
                        >
                          Terms of Use
                        </button>
                        {' '}and{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setModalContent('privacy');
                            setShowTermsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 underline cursor-pointer"
                        >
                          Privacy Policy
                        </button>
                        {' '}of the platform.
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
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/login')}
                    className="flex-1 cursor-pointer"
                  >
                    I already have an account
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
                  {modalContent === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
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
                  Terms of Use
                </button>
                <button
                  onClick={() => setModalContent('privacy')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 cursor-pointer ${
                    modalContent === 'privacy'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Privacy Policy
                </button>
              </div>
              
              <div className="space-y-6 text-sm text-gray-700 max-h-96 overflow-y-auto">
                {modalContent === 'terms' ? (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg">Terms of Use</h4>
                  
                    <div className="space-y-4">
                      <p className="text-xs text-gray-500">
                        <strong>Last updated:</strong> October 10, 2025
                      </p>
                      
                      <p>
                        Welcome to OnClickWise! These Terms of Use ("Terms") govern the use of the OnClickWise platform ("Platform", "service"), including registration, access and use by corporate users. By creating an account, using or accessing the Platform, you agree to these Terms. If you do not agree with any part, do not use the Platform.
                      </p>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">1. Definitions</h5>
                        <p className="mb-2">For the purposes of these Terms:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li><strong>User:</strong> any individual who represents a company and registers on the Platform.</li>
                          <li><strong>Client Company or Company:</strong> legal entity registered on the Platform through the User.</li>
                          <li><strong>Registration Data:</strong> data you provide at registration, including but not limited to: Company name, Slug, EIN, Company email, Phone, Full address (ZIP, city, state, country), Password / password confirmation, Responsible name, Responsible email, Responsible position, Responsible SSN.</li>
                          <li><strong>Services:</strong> all functionalities offered by the OnClickWise Platform, including CRM, lead management, company information viewing, etc.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">2. Registration and provided data</h5>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>To use the Platform services, you must provide complete and true Registration Data.</li>
                          <li>You declare that the Registration Data, especially Legal Entity (company) and Individual (responsible) are correct, updated and that you have authorization to provide them.</li>
                          <li>It is the User's obligation to keep this information updated. In case of relevant change (for example change of responsible, new SSN, address etc.), the User must update the data on the Platform.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">3. Password use, security and responsibility</h5>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Upon completing registration, you will choose a password. You are responsible for maintaining password confidentiality.</li>
                          <li>You agree to immediately notify OnClickWise of any unauthorized use of your account or any other security breach.</li>
                          <li>OnClickWise will not be responsible for losses or damages arising from misuse of your account, unless resulting from proven serious failure on OnClickWise's part.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">4. Collection, use and processing of personal data</h5>
                        <p className="mb-2">Personal data (responsible name, email, SSN, etc.) collected is used for: company user identification, security, service provision and maintenance, support, account-related communication, compliance with legal and regulatory obligations.</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>OnClickWise is committed to respecting the General Data Protection Law – Law No. 13.709/2018 ("LGPD") in the processing of personal data.</li>
                          <li>Data will be stored in a secure environment, with reasonable technical and administrative measures to protect against unauthorized access, disclosure, alteration or destruction.</li>
                          <li>OnClickWise will not share your personal data with third parties, except when necessary to comply with legal obligation, court order, or with express consent, or for the execution of contracted services that depend on third parties, who are obliged to maintain confidentiality.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg">Privacy Policy</h4>
                    
                    <div className="space-y-4">
                      <p className="text-xs text-gray-500">
                        <strong>Last updated:</strong> October 10, 2025
                      </p>
                      
                      <p>
                        OnClickWise values your privacy and the protection of your personal data. This Privacy Policy clearly explains how we collect, use, store, share and protect information provided by users and companies that use our platform.
                      </p>

                      <p>
                        By registering or using the Platform, you agree to the practices described below.
                      </p>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">1. Data collected</h5>
                        <p className="mb-2">During registration and use of the Platform, we may collect the following data:</p>
                        
                        <div className="ml-4 space-y-2">
                          <div>
                            <strong>Company Data:</strong>
                            <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                              <li>Company name</li>
                              <li>Company slug</li>
                              <li>EIN</li>
                              <li>Company email</li>
                              <li>Phone</li>
                              <li>Address (ZIP, city, state, country)</li>
                            </ul>
                          </div>
                          
                          <div>
                            <strong>Account Responsible Data:</strong>
                            <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                              <li>Full name</li>
                              <li>Position</li>
                              <li>Responsible email (if different)</li>
                              <li>SSN</li>
                            </ul>
                          </div>
                          
                          <div>
                            <strong>Access data:</strong>
                            <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                              <li>Password (stored encrypted)</li>
                              <li>Access logs (date, time, IP)</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">2. Purpose of data use</h5>
                        <p className="mb-2">OnClickWise uses collected data to:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Identify and authenticate companies and registration responsible.</li>
                          <li>Allow access and use of the Platform (CRM, lead capture, information management).</li>
                          <li>Comply with legal and regulatory obligations.</li>
                          <li>Perform administrative and operational communication with users.</li>
                          <li>Improve our services, fix failures, implement new features.</li>
                          <li>Protect Platform security and prevent fraud.</li>
                          <li>Send relevant communications (only with prior consent for marketing communications).</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">3. Data sharing</h5>
                        <p className="mb-2">Your data is not sold or shared with third parties for commercial purposes.</p>
                        <p className="mb-2">We may share your data only in the following cases:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>With service providers and partners who act on behalf of OnClickWise (e.g., hosting providers, technical support), always under confidentiality obligation.</li>
                          <li>To comply with legal, regulatory obligations or comply with court orders.</li>
                          <li>To protect rights, security or property of OnClickWise, users or third parties.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">4. Storage and security</h5>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Data is stored on secure servers, located in Brazil or abroad, as per applicable legislation.</li>
                          <li>Passwords are stored encrypted.</li>
                          <li>We apply technical and administrative measures to protect against unauthorized access, losses, destruction or improper alteration.</li>
                          <li>Despite our efforts, no system is 100% secure. In case of security incident that may affect your data, we will notify you as required by LGPD.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">5. Data retention</h5>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>We will keep data while your account is active or as necessary to provide our services.</li>
                          <li>After account deletion request, data will be deleted or anonymized, except if there is need for retention due to legal or regulatory obligation.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">6. Data subject rights</h5>
                        <p className="mb-2">According to the General Data Protection Law (Law No. 13.709/2018 – LGPD), you have the right to:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Confirm if we process your personal data.</li>
                          <li>Access personal data we have about you.</li>
                          <li>Correct incomplete, inaccurate or outdated data.</li>
                          <li>Request anonymization, blocking or elimination of unnecessary or excessive data.</li>
                          <li>Request data portability to another provider.</li>
                          <li>Request deletion of data processed based on consent.</li>
                          <li>Revoke consent at any time.</li>
                          <li>Obtain information about who we share your data with.</li>
                        </ul>
                        <p className="mt-2">To exercise your rights, contact us at: [OnClickWise contact email].</p>
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
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}