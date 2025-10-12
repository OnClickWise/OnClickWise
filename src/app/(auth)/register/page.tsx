'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2 } from 'lucide-react';

interface CompanyData {
  name: string;
  slug: string;
  email: string;
  company_id: string; // Company ID (CNPJ, EIN, etc.)
  password: string;
  password_confirm: string;
  phone: string;
  zipCode: string; // ZIP Code - equivalent to CEP
  address: string;
  city: string;
  state: string;
  country: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CompanyData>({
    name: '',
    slug: '',
    email: '',
    company_id: '',
    password: '',
    password_confirm: '',
    phone: '',
    zipCode: '',
    address: '',
    city: '',
    state: '',
    country: 'United States'
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

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    } else {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 9)}`;
    }
  };

  const handleCompanyIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      company_id: e.target.value
    }));
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatZipCode(e.target.value);
    setFormData(prev => ({
      ...prev,
      zipCode: formattedValue
    }));
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

    // Verificar se Company ID, email e slug já existem
    try {
      const checkResponse = await fetch('http://localhost:3000/auth/check-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: formData.company_id,
          email: formData.email,
          slug: formData.slug
        }),
      });

      const checkResult = await checkResponse.json();

      if (!checkResult.success) {
        if (checkResult.error.includes('Company ID')) {
          setError('This Company ID is already registered on our platform.');
        } else if (checkResult.error.includes('email')) {
          setError('This email is already registered on our platform.');
        } else if (checkResult.error.includes('slug')) {
          setError('This company name/slug is already in use. Please choose a different name.');
        } else {
          setError(checkResult.error);
        }
        setLoading(false);
        return;
      }

      // Salvar dados da empresa no localStorage para usar na próxima página
      localStorage.setItem('companyData', JSON.stringify(formData));
      
      // Redirecionar para a página de dados do representante
      router.push('/register/representative');
    } catch (error) {
      console.error('Error checking company data:', error);
      setError('Connection error. Please try again.');
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
          <div className="max-w-4xl w-full">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">Company Information</h1>
              <p className="text-muted-foreground">Fill in your company information</p>
            </div>

        {/* Registration Form */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Information */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-card-foreground mb-4">Company Information</h2>
                
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
                      placeholder="Enter company name"
                    />
                  </div>

                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-card-foreground mb-1">
                      Company Slug
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
                  </div>

                  <div>
                    <label htmlFor="company_id" className="block text-sm font-medium text-card-foreground mb-1">
                      Company ID *
                    </label>
                    <Input
                      id="company_id"
                      name="company_id"
                      type="text"
                      value={formData.company_id}
                      onChange={handleCompanyIdChange}
                      required
                      className="w-full"
                      placeholder="Enter company ID (EIN)"
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
                      Phone
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

              {/* Address Information */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-card-foreground mb-4">Address Information</h2>
                
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-card-foreground mb-1">
                      Address
                    </label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full"
                      placeholder="Street, number, neighborhood"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-card-foreground mb-1">
                        City
                      </label>
                      <Input
                        id="city"
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder="New York"
                      />
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-card-foreground mb-1">
                        State
                      </label>
                      <Input
                        id="state"
                        name="state"
                        type="text"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder="NY"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-card-foreground mb-1">
                        ZIP Code
                      </label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        type="text"
                        value={formData.zipCode}
                        onChange={handleZipCodeChange}
                        className="w-full"
                        placeholder="12345-6789"
                        maxLength={10}
                      />
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-card-foreground mb-1">
                        Country
                      </label>
                      <Input
                        id="country"
                        name="country"
                        type="text"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder="United States"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Security</h2>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-1">
                    Password *
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div>
                  <label htmlFor="password_confirm" className="block text-sm font-medium text-card-foreground mb-1">
                    Confirm Password *
                  </label>
                  <Input
                    id="password_confirm"
                    name="password_confirm"
                    type="password"
                    value={formData.password_confirm}
                    onChange={handleInputChange}
                    required
                    className="w-full"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 cursor-pointer"
              >
                {loading ? 'Validating...' : 'Continue'}
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
    </div>
  );
}