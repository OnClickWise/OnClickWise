'use client';

import { useState, useEffect, useRef, use } from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
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

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  email: string;
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
      addNotification('error', 'Error loading organization data');
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
      addNotification('error', 'Invalid file type. Only images are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification('error', 'File size too large. Maximum 5MB allowed.');
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

        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/upload-logo`, {
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
          
          addNotification('success', 'Logo uploaded successfully!');
          setSaving(false);
          return;
        } else {
          addNotification('error', uploadResult.error || 'Failed to upload logo');
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
          const fieldNames: { [key: string]: string } = {
            name: 'Company Name',
            slug: 'Company Slug',
            phone: 'Phone',
            address: 'Address',
            city: 'City',
            state: 'State',
            country: 'Country',
            logo_url: 'Logo',
            primary_color: 'Primary Color',
            secondary_color: 'Secondary Color',
            legal_representative_name: 'Legal Representative Name',
            legal_representative_email: 'Legal Representative Email',
            legal_representative_phone: 'Legal Representative Phone',
            legal_representative_ssn: 'Legal Representative SSN'
          };
          return fieldNames[field] || field;
        });
        
        addNotification('success', `Successfully updated: ${changedFieldsList.join(', ')}`);
      } else {
        addNotification('error', response.error || 'Error updating data');
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      addNotification('error', 'Error updating organization data');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard orgSlug={resolvedParams.org}>
        <SidebarProvider>
          <AppSidebar org={resolvedParams.org} />
          <SidebarInset>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading organization data...</p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard orgSlug={resolvedParams.org}>
      <SidebarProvider>
        <AppSidebar org={resolvedParams.org} />
        <SidebarInset>
          {/* Notifications */}
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg shadow-lg max-w-sm ${
                  notification.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : notification.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{notification.message}</span>
                  <button
                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

        {/* HEADER */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${resolvedParams.org}/dashboard`}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                  <BreadcrumbLink href={`/${resolvedParams.org}/settings`}>
                    Settings
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                  <BreadcrumbPage>Organization</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* MAIN */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="max-w-4xl mx-auto w-full space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Main data of your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name *
                      </label>
                      <Input
                        value={organizationData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Slug *
                      </label>
                      <Input
                        value={organizationData.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value)}
                        placeholder="company-slug"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <Input
                        value={organizationData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Address</CardTitle>
                  <CardDescription>
                    Company location information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <Input
                      value={organizationData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Street, number, neighborhood"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <Input
                        value={organizationData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <Input
                        value={organizationData.state || ''}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="NY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <Input
                        value={organizationData.country || ''}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="United States"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Legal Representative */}
              <Card>
                <CardHeader>
                  <CardTitle>Legal Representative</CardTitle>
                  <CardDescription>
                    Legal representative information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <Input
                        value={organizationData.legal_representative_name || ''}
                        onChange={(e) => handleInputChange('legal_representative_name', e.target.value)}
                        placeholder="Full name of the representative"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SSN/Tax ID
                      </label>
                      <Input
                        value={organizationData.legal_representative_ssn || ''}
                        onChange={(e) => handleInputChange('legal_representative_ssn', e.target.value)}
                        placeholder="000-00-0000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={organizationData.legal_representative_email || ''}
                        onChange={(e) => handleInputChange('legal_representative_email', e.target.value)}
                        placeholder="representative@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <Input
                        value={organizationData.legal_representative_phone || ''}
                        onChange={(e) => handleInputChange('legal_representative_phone', e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Branding */}
              <Card>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>
                    Logo and color customization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Logo
                    </label>
                    <div className="flex items-center gap-4">
                      <OrganizationAvatar 
                        src={logoPreview || (organizationData.logo_url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${organizationData.logo_url}` : undefined)} 
                        name={organizationData.name} 
                        size="xl"
                      />
                      <div className="flex-1">
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
                            className="cursor-pointer"
                          >
                            Upload Logo
                          </Button>
                          {(logoPreview || organizationData.logo_url) && (
                            <Button
                              onClick={handleRemoveLogo}
                              variant="outline"
                              className="cursor-pointer text-red-600 hover:text-red-700"
                            >
                              Remove Logo
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG, GIF, WebP up to 5MB
                  </p>
                </div>
              </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Color
                      </label>
                      <Input
                        type="color"
                        value={organizationData.primary_color || '#3B82F6'}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Secondary Color
                      </label>
                      <Input
                        type="color"
                        value={organizationData.secondary_color || '#1E40AF'}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
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
                  className="cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </AuthGuard>
  );
}