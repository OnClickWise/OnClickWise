'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import AuthGuard from '@/components/AuthGuard';
import RoleGuard from '@/components/RoleGuard';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrganizationAvatar } from '@/components/ui/avatar';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { getApiBaseUrl, resolveMediaUrl } from '@/lib/api-url';
import {
  Building2,
  Mail,
  MapPin,
  Palette,
  Phone,
  Save,
  ShieldUser,
  Upload,
  X,
} from 'lucide-react';

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

const EMPTY_ORGANIZATION: OrganizationData = {
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
  legal_representative_ssn: '',
};

const EDITABLE_FIELDS: Array<keyof OrganizationData> = [
  'name',
  'slug',
  'email',
  'company_id',
  'phone',
  'address',
  'city',
  'state',
  'country',
  'primary_color',
  'secondary_color',
  'legal_representative_name',
  'legal_representative_email',
  'legal_representative_phone',
  'legal_representative_ssn',
];

function SectionCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}

export default function OrgPage({
  params,
}: {
  params: Promise<{ org: string; locale: string }>;
}) {
  const { org, locale } = use(params);
  const { apiCall, isClient } = useApi();
  const { token } = useAuth();
  const t = useTranslations('OrgSettings');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoVersion, setLogoVersion] = useState<number>(Date.now());
  const [organizationData, setOrganizationData] = useState<OrganizationData>(EMPTY_ORGANIZATION);
  const [originalData, setOriginalData] = useState<OrganizationData>(EMPTY_ORGANIZATION);

  useEffect(() => {
    if (isClient) {
      void loadOrganizationData();
    }
  }, [isClient]);

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 5000);
  };

  const loadOrganizationData = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/organization/user-organization', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.success && response.organization) {
        const normalized = {
          ...EMPTY_ORGANIZATION,
          ...response.organization,
        };
        setOrganizationData(normalized);
        setOriginalData(normalized);
        setLogoVersion(Date.now());
      } else {
        addNotification('error', t('errors.loadingData'));
      }
    } catch (error) {
      console.error('Settings - Error loading organization data:', error);
      addNotification('error', t('errors.loadingData'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof OrganizationData, value: string) => {
    setOrganizationData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    setOrganizationData((prev) => ({
      ...prev,
      logo_url: '',
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const optimizeLogoFile = async (file: File): Promise<File> => {
    const isRasterImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!isRasterImage) {
      return file;
    }

    const imageBitmap = await createImageBitmap(file);
    const maxDimension = 1024;
    const scale = Math.min(1, maxDimension / Math.max(imageBitmap.width, imageBitmap.height));
    const targetWidth = Math.max(1, Math.round(imageBitmap.width * scale));
    const targetHeight = Math.max(1, Math.round(imageBitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
    imageBitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.82);
    });

    if (!blob) return file;

    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(selectedFile.type)) {
      addNotification('error', t('errors.invalidFileType'));
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      addNotification('error', t('errors.fileTooLarge'));
      return;
    }

    let fileToUpload = selectedFile;
    try {
      fileToUpload = await optimizeLogoFile(selectedFile);
    } catch (error) {
      console.warn('Falha ao otimizar logo, usando arquivo original', error);
    }

    const maxUploadSize = 900 * 1024;
    if (fileToUpload.size > maxUploadSize) {
      addNotification('error', 'A imagem está muito grande para o servidor. Use uma imagem menor que 900KB.');
      return;
    }

    setLogoPreview(URL.createObjectURL(fileToUpload));
    setLogoFile(fileToUpload);
  };

  const hasChanges = useMemo(() => {
    if (logoFile) return true;

    return EDITABLE_FIELDS.some((field) => {
      return organizationData[field] !== originalData[field];
    });
  }, [logoFile, organizationData, originalData]);

  const handleSave = async () => {
    setSaving(true);

    try {
      let nextData = { ...organizationData };
      let uploadedLogo = false;

      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);

        const uploadResponse = await fetch(`${getApiBaseUrl()}/organization/logo`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadResult.success) {
          addNotification('error', uploadResult.error || t('errors.uploadFailed'));
          return;
        }

        nextData = {
          ...nextData,
          logo_url: uploadResult.logo_url || uploadResult.organization?.logo_url || nextData.logo_url,
        };

        setOrganizationData(nextData);
        setLogoPreview(null);
        setLogoFile(null);
        setLogoVersion(Date.now());
        uploadedLogo = true;
      }

      const changedFields: Partial<OrganizationData> = {};

      EDITABLE_FIELDS.forEach((field) => {
        if (nextData[field] !== originalData[field]) {
          changedFields[field] = nextData[field];
        }
      });

      if (Object.keys(changedFields).length > 0) {
        const response = await apiCall('/organization/update', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(changedFields),
        });

        if (!response.success) {
          addNotification('error', response.error || t('errors.updateFailed'));
          return;
        }

        if (response.organization) {
          nextData = {
            ...EMPTY_ORGANIZATION,
            ...response.organization,
          };
          setOrganizationData(nextData);
        }
      }

      setOriginalData(nextData);
      window.dispatchEvent(new CustomEvent('organizationUpdated'));

      if (uploadedLogo && Object.keys(changedFields).length > 1) {
        addNotification('success', 'Logo e dados da organização atualizados com sucesso.');
      } else if (uploadedLogo) {
        addNotification('success', t('success.logoUploaded'));
      } else {
        addNotification('success', t('success.updated'));
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      addNotification('error', t('errors.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const currentLogo = logoPreview || resolveMediaUrl(organizationData.logo_url);
  const currentLogoWithVersion =
    logoPreview || !currentLogo
      ? currentLogo
      : `${currentLogo}${currentLogo.includes('?') ? '&' : '?'}t=${logoVersion}`;

  const sections = [
    { id: 'basic-info', label: t('basicInfo.title') },
    { id: 'address', label: t('address.title') },
    { id: 'legal-representative', label: t('legalRep.title') },
    { id: 'branding', label: t('branding.title') },
  ];

  if (loading) {
    return (
      <AuthGuard orgSlug={org}>
        <RoleGuard allowedRoles={['admin', 'master']} orgSlug={org}>
          <SidebarProvider>
            <AppSidebar org={org} />
            <SidebarInset>
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
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
    <AuthGuard orgSlug={org}>
      <RoleGuard allowedRoles={['admin', 'master']} orgSlug={org}>
        <SidebarProvider>
          <AppSidebar org={org} />
          <SidebarInset>
            <div className="fixed right-2 top-2 z-50 w-[calc(100vw-1rem)] space-y-2 sm:right-4 sm:top-4 sm:w-auto sm:max-w-sm">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg p-3 shadow-lg ${
                    notification.type === 'success'
                      ? 'border border-green-200 bg-green-50 text-green-800'
                      : notification.type === 'error'
                        ? 'border border-red-200 bg-red-50 text-red-800'
                        : 'border border-blue-200 bg-blue-50 text-blue-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex-1 text-sm font-medium">{notification.message}</span>
                    <button
                      onClick={() => setNotifications((prev) => prev.filter((item) => item.id !== notification.id))}
                      className="text-lg leading-none text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href={`/${locale}/${org}/dashboard`}>
                      {t('breadcrumb.dashboard')}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href={`/${locale}/${org}/settings`}>
                      {t('breadcrumb.settings')}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{t('breadcrumb.organization')}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-6 bg-muted/30 p-4 md:p-6">
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <Card className="border-border/70 shadow-sm">
                  <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <OrganizationAvatar src={currentLogoWithVersion} name={organizationData.name} size="xl" className="shadow-sm" />
                      <div className="min-w-0 space-y-2">
                        <div>
                          <h1 className="truncate text-3xl font-semibold tracking-tight">{organizationData.name || 'Organização'}</h1>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Centralize os dados da empresa, identidade visual e informações legais em um único lugar.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {organizationData.slug && <Badge variant="secondary">/{organizationData.slug}</Badge>}
                          {organizationData.email && <Badge variant="outline">{organizationData.email}</Badge>}
                          {organizationData.city && <Badge variant="outline">{organizationData.city}</Badge>}
                        </div>

                        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <Building2 className="h-4 w-4 shrink-0" />
                            <span className="truncate">{organizationData.company_id || 'Documento não informado'}</span>
                          </div>
                          <div className="flex min-w-0 items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span className="truncate">{organizationData.email || 'Email não informado'}</span>
                          </div>
                          <div className="flex min-w-0 items-center gap-2">
                            <Phone className="h-4 w-4 shrink-0" />
                            <span className="truncate">{organizationData.phone || 'Telefone não informado'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      {hasChanges ? (
                        <Badge className="bg-amber-500 text-white hover:bg-amber-500">Alterações não salvas</Badge>
                      ) : (
                        <Badge variant="outline">Tudo sincronizado</Badge>
                      )}
                      <Button onClick={handleSave} disabled={saving || !hasChanges} className="min-w-44">
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? t('saving') : t('saveButton')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
                  <aside className="xl:sticky xl:top-24 xl:self-start">
                    <Card className="border-border/70 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Seções</CardTitle>
                        <CardDescription>Navegue pelas áreas da organização.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        {sections.map((section) => (
                          <a
                            key={section.id}
                            href={`#${section.id}`}
                            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <span>{section.label}</span>
                            <span className="text-xs">#</span>
                          </a>
                        ))}
                      </CardContent>
                    </Card>
                  </aside>

                  <div className="space-y-6">
                    <SectionCard id="basic-info" title={t('basicInfo.title')} description={t('basicInfo.description')}>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">{t('basicInfo.nameLabel')}</label>
                          <Input value={organizationData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder={t('basicInfo.namePlaceholder')} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">{t('basicInfo.slugLabel')}</label>
                          <Input value={organizationData.slug} onChange={(e) => handleInputChange('slug', e.target.value)} placeholder={t('basicInfo.slugPlaceholder')} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">{t('basicInfo.emailLabel')}</label>
                          <Input type="email" value={organizationData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} placeholder={t('basicInfo.emailPlaceholder')} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">{t('basicInfo.companyIdLabel')}</label>
                          <Input value={organizationData.company_id || ''} onChange={(e) => handleInputChange('company_id', e.target.value)} placeholder={t('basicInfo.companyIdPlaceholder')} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-foreground">{t('basicInfo.phoneLabel')}</label>
                          <Input value={organizationData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder={t('basicInfo.phonePlaceholder')} />
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard id="address" title={t('address.title')} description={t('address.description')}>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">{t('address.addressLabel')}</label>
                          <Input value={organizationData.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} placeholder={t('address.addressPlaceholder')} />
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{t('address.cityLabel')}</label>
                            <Input value={organizationData.city || ''} onChange={(e) => handleInputChange('city', e.target.value)} placeholder={t('address.cityPlaceholder')} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{t('address.stateLabel')}</label>
                            <Input value={organizationData.state || ''} onChange={(e) => handleInputChange('state', e.target.value)} placeholder={t('address.statePlaceholder')} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{t('address.countryLabel')}</label>
                            <Input value={organizationData.country || ''} onChange={(e) => handleInputChange('country', e.target.value)} placeholder={t('address.countryPlaceholder')} />
                          </div>
                        </div>
                        <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <MapPin className="h-4 w-4" />
                            Endereço público
                          </div>
                          <p className="mt-2">
                            {[organizationData.address, organizationData.city, organizationData.state, organizationData.country].filter(Boolean).join(', ') || 'Nenhum endereço cadastrado até o momento.'}
                          </p>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard id="legal-representative" title={t('legalRep.title')} description={t('legalRep.description')}>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">{t('legalRep.nameLabel')}</label>
                          <Input value={organizationData.legal_representative_name || ''} onChange={(e) => handleInputChange('legal_representative_name', e.target.value)} placeholder={t('legalRep.namePlaceholder')} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">{t('legalRep.ssnLabel')}</label>
                          <Input value={organizationData.legal_representative_ssn || ''} onChange={(e) => handleInputChange('legal_representative_ssn', e.target.value)} placeholder={t('legalRep.ssnPlaceholder')} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">{t('legalRep.emailLabel')}</label>
                          <Input type="email" value={organizationData.legal_representative_email || ''} onChange={(e) => handleInputChange('legal_representative_email', e.target.value)} placeholder={t('legalRep.emailPlaceholder')} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">{t('legalRep.phoneLabel')}</label>
                          <Input value={organizationData.legal_representative_phone || ''} onChange={(e) => handleInputChange('legal_representative_phone', e.target.value)} placeholder={t('legalRep.phonePlaceholder')} />
                        </div>
                      </div>
                      <div className="mt-4 rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <ShieldUser className="h-4 w-4" />
                          Responsável legal
                        </div>
                        <p className="mt-2">
                          {organizationData.legal_representative_name
                            ? `${organizationData.legal_representative_name}${organizationData.legal_representative_email ? ` · ${organizationData.legal_representative_email}` : ''}`
                            : 'Nenhum responsável legal cadastrado.'}
                        </p>
                      </div>
                    </SectionCard>

                    <SectionCard id="branding" title={t('branding.title')} description={t('branding.description')}>
                      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
                        <div className="space-y-6">
                          <div className="rounded-xl border p-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                              <div className="relative">
                                <OrganizationAvatar src={currentLogoWithVersion} name={organizationData.name} size="xl" />
                                {(currentLogo || organizationData.logo_url) && (
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    className="absolute -right-2 -top-2 h-7 w-7 rounded-full"
                                    onClick={handleRemoveLogo}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold">{t('branding.logoLabel')}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{t('branding.logoInfo')}</p>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                                  onChange={handleLogoUpload}
                                  className="hidden"
                                />
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {logoFile || currentLogoWithVersion ? 'Trocar logo' : t('branding.uploadButton')}
                                  </Button>
                                  {logoFile && <Badge variant="outline">{logoFile.name}</Badge>}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">{t('branding.primaryColorLabel')}</label>
                              <div className="flex items-center gap-3 rounded-xl border p-3">
                                <input
                                  type="color"
                                  value={organizationData.primary_color || '#3B82F6'}
                                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                                  className="h-10 w-14 cursor-pointer rounded-md border bg-transparent p-0.5"
                                />
                                <Input
                                  value={organizationData.primary_color || '#3B82F6'}
                                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                                  className="font-mono uppercase"
                                  maxLength={7}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">{t('branding.secondaryColorLabel')}</label>
                              <div className="flex items-center gap-3 rounded-xl border p-3">
                                <input
                                  type="color"
                                  value={organizationData.secondary_color || '#1E40AF'}
                                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                                  className="h-10 w-14 cursor-pointer rounded-md border bg-transparent p-0.5"
                                />
                                <Input
                                  value={organizationData.secondary_color || '#1E40AF'}
                                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                                  className="font-mono uppercase"
                                  maxLength={7}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 rounded-xl border p-4">
                          <div className="flex items-center gap-2 text-base font-semibold">
                            <Palette className="h-4 w-4" />
                            Preview da marca
                          </div>
                          <p className="text-sm text-muted-foreground">Uma visão rápida de como logo e cores aparecem juntos no painel.</p>
                          <div className="overflow-hidden rounded-2xl border bg-background">
                            <div
                              className="flex items-center justify-between p-4 text-white"
                              style={{
                                background: `linear-gradient(135deg, ${organizationData.primary_color || '#3B82F6'}, ${organizationData.secondary_color || '#1E40AF'})`,
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <OrganizationAvatar src={currentLogoWithVersion} name={organizationData.name} size="md" />
                                <div>
                                  <p className="font-semibold">{organizationData.name || 'Sua organização'}</p>
                                  <p className="text-xs text-white/80">/{organizationData.slug || 'slug-da-organizacao'}</p>
                                </div>
                              </div>
                              <Badge className="border-white/30 bg-white/15 text-white hover:bg-white/15">Ativa</Badge>
                            </div>
                            <div className="space-y-4 p-4">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border p-3">
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Cor primária</p>
                                  <div className="mt-2 h-10 rounded-lg" style={{ backgroundColor: organizationData.primary_color || '#3B82F6' }} />
                                </div>
                                <div className="rounded-xl border p-3">
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Cor secundária</p>
                                  <div className="mt-2 h-10 rounded-lg" style={{ backgroundColor: organizationData.secondary_color || '#1E40AF' }} />
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-3">
                                <button
                                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                                  style={{ backgroundColor: organizationData.primary_color || '#3B82F6' }}
                                >
                                  Ação principal
                                </button>
                                <button
                                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                                  style={{ backgroundColor: organizationData.secondary_color || '#1E40AF' }}
                                >
                                  Ação secundária
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </SectionCard>

                    <div className="flex justify-end">
                      <Button onClick={handleSave} disabled={saving || !hasChanges} className="min-w-44">
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? t('saving') : t('saveButton')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </RoleGuard>
    </AuthGuard>
  );
}
