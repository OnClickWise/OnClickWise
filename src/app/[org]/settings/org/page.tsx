'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useTranslations } from 'next-intl';
import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
import RoleGuard from "@/components/RoleGuard"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useApi } from "@/hooks/useApi"
import { useAuth } from "@/hooks/useAuth"
import { generateOrgLogo } from "@/utils/avatar"
import { OrganizationAvatar } from "@/components/ui/avatar"
import { X } from "lucide-react"

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  email: string;
  company_id?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  legal_representative_name?: string;
  legal_representative_email?: string;
  legal_representative_phone?: string;
  legal_representative_ssn?: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function OrgPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const resolvedParams = use(params);
  const { apiCall, isClient } = useApi();
  const { token } = useAuth();
  const t = useTranslations('OrgSettings');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    id: '',
    name: '',
    slug: '',
    email: '',
    company_id: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    legal_representative_name: '',
    legal_representative_email: '',
    legal_representative_phone: '',
    legal_representative_ssn: ''
  });
  const [originalData, setOriginalData] = useState<OrganizationData>({
    id: '',
    name: '',
    slug: '',
    email: '',
    company_id: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    legal_representative_name: '',
    legal_representative_email: '',
    legal_representative_phone: '',
    legal_representative_ssn: ''
  });

  useEffect(() => {
    if (isClient) {
      loadOrganizationData();
    }
  }, [isClient]);

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const loadOrganizationData = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/auth/user-organization', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.success && response.organization) {
        setOrganizationData(response.organization);
        setOriginalData(response.organization);
      } else {
        console.log('Settings - No organization data found or error:', response);
      }
    } catch (error) {
      console.error('Settings - Error loading organization data:', error);
      addNotification('error', t('errors.loadingData'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof OrganizationData, value: string) => {
    setOrganizationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    setOrganizationData(prev => ({
      ...prev,
      logo_url: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addNotification('error', t('errors.invalidFileType'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification('error', t('errors.fileTooLarge'));
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    setLogoFile(file);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Upload logo if there's a new file
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);

        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/upload-logo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData
        });

        const uploadResult = await uploadResponse.json();

        if (uploadResult.success) {
          // Update organization data with new logo URL
          const updatedOrgData = {
            ...organizationData,
            logo_url: uploadResult.logo_url
          };
          
          setOrganizationData(updatedOrgData);
          setLogoPreview(null);
          setLogoFile(null);
          
          // Update original data to prevent double save
          setOriginalData(updatedOrgData);
          
          // Emit event to update sidebar immediately
          window.dispatchEvent(new CustomEvent('organizationUpdated'));
          
          addNotification('success', t('success.logoUploaded'));
          setSaving(false);
          return;
        } else {
          addNotification('error', uploadResult.error || t('errors.uploadFailed'));
          setSaving(false);
          return;
        }
      }

      // Detectar apenas os campos que foram alterados
      const changedFields: Partial<OrganizationData> = {};
      
      Object.keys(organizationData).forEach((key) => {
        const field = key as keyof OrganizationData;
        if (organizationData[field] !== originalData[field]) {
          changedFields[field] = organizationData[field];
        }
      });

      // Se não há campos alterados, não fazer requisição
      if (Object.keys(changedFields).length === 0) {
        setSaving(false);
        return;
      }

      const response = await apiCall('/auth/update-organization', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(changedFields)
      });

      if (response.success) {
        // Update local data with response
        if (response.organization) {
          setOrganizationData(response.organization);
          setOriginalData(response.organization);
        }
        
        // Emit event to update sidebar
        window.dispatchEvent(new CustomEvent('organizationUpdated'));
        
        // Show success notification with details
        const changedFieldsList = Object.keys(changedFields).map(field => {
          return t(`fieldNames.${field as keyof OrganizationData}`);
        });
        
        addNotification('success', `${t('success.updated')}: ${changedFieldsList.join(', ')}`);
      } else {
        addNotification('error', response.error || t('errors.updateFailed'));
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      addNotification('error', t('errors.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard orgSlug={resolvedParams.org}>
        <RoleGuard allowedRoles={['admin', 'master']} orgSlug={resolvedParams.org}>
        <SidebarProvider>
          <AppSidebar org={resolvedParams.org} />
          <SidebarInset>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">{t('loading')}</p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
        </RoleGuard>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard orgSlug={resolvedParams.org}>
      <RoleGuard allowedRoles={['admin', 'master']} orgSlug={resolvedParams.org}>
      <SidebarProvider>
        <AppSidebar org={resolvedParams.org} />
        <SidebarInset>
          {/* Notifications */}
          <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 space-y-2 w-[calc(100vw-1rem)] sm:w-auto sm:max-w-sm">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 sm:p-4 rounded-lg shadow-lg ${
                  notification.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : notification.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-medium flex-1">{notification.message}</span>
                  <button
                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg sm:text-xl leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

        {/* HEADER */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-2 sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-1 sm:mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${resolvedParams.org}/dashboard`}>
                  {t('breadcrumb.dashboard')}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                  <BreadcrumbLink href={`/${resolvedParams.org}/settings`} className="text-sm sm:text-base">
                    {t('breadcrumb.settings')}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm sm:text-base">{t('breadcrumb.organization')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* MAIN */}
        <div className="flex flex-1 flex-col gap-2 sm:gap-4 p-2 sm:p-4 pt-0">
            <div className="max-w-4xl mx-auto w-full space-y-4 sm:space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">{t('basicInfo.title')}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {t('basicInfo.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t('basicInfo.nameLabel')}
                      </label>
                      <Input
                        value={organizationData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder={t('basicInfo.namePlaceholder')}
                        className="text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t('basicInfo.slugLabel')}
                      </label>
                      <Input
                        value={organizationData.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value)}
                        placeholder={t('basicInfo.slugPlaceholder')}
                        className="text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t('basicInfo.emailLabel')}
                      </label>
                      <Input
                        type="email"
                        value={organizationData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder={t('basicInfo.emailPlaceholder')}
                        className="text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t('basicInfo.companyIdLabel')}
                      </label>
                      <Input
                        value={organizationData.company_id || ''}
                        onChange={(e) => handleInputChange('company_id', e.target.value)}
                        placeholder={t('basicInfo.companyIdPlaceholder')}
                        className="text-sm sm:text-base"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t('basicInfo.phoneLabel')}
                      </label>
                      <Input
                        value={organizationData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder={t('basicInfo.phonePlaceholder')}
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">{t('address.title')}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {t('address.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t('address.addressLabel')}
                    </label>
                    <Input
                      value={organizationData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder={t('address.addressPlaceholder')}
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t('address.cityLabel')}
                      </label>
                      <Input
                        value={organizationData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder={t('address.cityPlaceholder')}
                        className="text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t('address.stateLabel')}
                      </label>
                      <Input
                        value={organizationData.state || ''}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder={t('address.statePlaceholder')}
                        className="text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t('address.countryLabel')}
                      </label>
                      <Input
                        value={organizationData.country || ''}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder={t('address.countryPlaceholder')}
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Legal Representative */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">{t('legalRep.title')}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {t('legalRep.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t('legalRep.nameLabel')}
                      </label>
                      <Input
                        value={organizationData.legal_representative_name || ''}
                        onChange={(e) => handleInputChange('legal_representative_name', e.target.value)}
                        placeholder={t('legalRep.namePlaceholder')}
                        className="text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t('legalRep.ssnLabel')}
                      </label>
                      <Input
                        value={organizationData.legal_representative_ssn || ''}
                        onChange={(e) => handleInputChange('legal_representative_ssn', e.target.value)}
                        placeholder={t('legalRep.ssnPlaceholder')}
                        className="text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t('legalRep.emailLabel')}
                      </label>
                      <Input
                        type="email"
                        value={organizationData.legal_representative_email || ''}
                        onChange={(e) => handleInputChange('legal_representative_email', e.target.value)}
                        placeholder={t('legalRep.emailPlaceholder')}
                        className="text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t('legalRep.phoneLabel')}
                      </label>
                      <Input
                        value={organizationData.legal_representative_phone || ''}
                        onChange={(e) => handleInputChange('legal_representative_phone', e.target.value)}
                        placeholder={t('legalRep.phonePlaceholder')}
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Branding */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">{t('branding.title')}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {t('branding.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t('branding.logoLabel')}
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <div className="relative">
                        <OrganizationAvatar 
                          src={logoPreview || (organizationData.logo_url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${organizationData.logo_url}` : undefined)} 
                          name={organizationData.name} 
                          size="xl"
                        />
                        {(logoPreview || organizationData.logo_url) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0"
                            onClick={handleRemoveLogo}
                          >
                            <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="cursor-pointer text-xs sm:text-sm h-8 sm:h-9"
                          >
                            {t('branding.uploadButton')}
                          </Button>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                          {t('branding.logoInfo')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t('branding.primaryColorLabel')}
                      </label>
                      <Input
                        type="color"
                        value={organizationData.primary_color || '#3B82F6'}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="h-10 sm:h-11 w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t('branding.secondaryColorLabel')}
                      </label>
                      <Input
                        type="color"
                        value={organizationData.secondary_color || '#1E40AF'}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        className="h-10 sm:h-11 w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="cursor-pointer w-full sm:w-auto text-sm sm:text-base"
                >
                  {saving ? t('saving') : t('saveButton')}
                </Button>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </RoleGuard>
    </AuthGuard>
  );
}