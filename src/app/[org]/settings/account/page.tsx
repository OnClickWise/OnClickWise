"use client"

import React, { useState, useEffect } from 'react'
import { use } from 'react'
import { useTranslations, useLocale } from 'next-intl'
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
import { useApi } from '@/hooks/useApi'
import { generateAvatar } from '@/utils/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/avatar'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { User, Lock, Save, Upload, X, Globe } from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  profile_image?: string
  created_at: string
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

export default function AccountPage({ params }: { params: Promise<{ org: string }> }) {
  const resolvedParams = use(params)
  const { apiCall, isClient } = useApi()
  const t = useTranslations('AccountSettings')
  const locale = useLocale()
  
  const [userData, setUserData] = useState<UserData>({
    id: '',
    name: '',
    email: '',
    role: '',
    profile_image: '',
    created_at: ''
  })
  
  const [originalData, setOriginalData] = useState<UserData>({
    id: '',
    name: '',
    email: '',
    role: '',
    profile_image: '',
    created_at: ''
  })
  
  const [profilePreview, setProfilePreview] = useState<string>('')
  const [profileFile, setProfileFile] = useState<File | null>(null)
  
  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const loadUserData = async () => {
    if (!isClient) return
    
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        addNotification('error', t('authTokenNotFound'))
        return
      }

      const response = await apiCall('/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.success && response.user) {
        setUserData(response.user)
        setOriginalData(response.user)
        setProfilePreview(response.user.profile_image 
          ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${response.user.profile_image}` 
          : '')
      } else {
        addNotification('error', t('failedToLoadUserData'))
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      addNotification('error', t('errorLoadingUserData'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isClient) {
      loadUserData()
    }
  }, [isClient])

  const handleProfileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        addNotification('error', t('fileSizeTooLarge'))
        return
      }
      
      if (!file.type.startsWith('image/')) {
        addNotification('error', t('pleaseSelectImage'))
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setProfileFile(file)
    }
  }

  const handleRemoveProfile = () => {
    setProfilePreview('')
    setProfileFile(null)
    setUserData(prev => ({ ...prev, profile_image: '' }))
    // Reset the file input to allow selecting the same file again
    const fileInput = document.getElementById('profile-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSave = async () => {
    if (!isClient) return
    
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        addNotification('error', t('authTokenNotFound'))
        return
      }

      // Handle profile image upload first
      if (profileFile) {
        const formData = new FormData()
        formData.append('profile_image', profileFile)
        
        const uploadResponse = await apiCall('/auth/upload-profile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
        
        if (uploadResponse.success && uploadResponse.profile_url) {
          setUserData(prev => ({ ...prev, profile_image: uploadResponse.profile_url }))
          setOriginalData(prev => ({ ...prev, profile_image: uploadResponse.profile_url }))
          setProfileFile(null)
          
          // Dispatch event to update sidebar
          window.dispatchEvent(new CustomEvent('userUpdated'))
          
          addNotification('success', t('profileImageUpdated'))
          return
        } else {
          addNotification('error', t('failedToUploadImage'))
          return
        }
      }

      // Detect changed fields
      const changedFields: any = {}
      if (userData.name !== originalData.name) changedFields.name = userData.name
      if (userData.profile_image !== originalData.profile_image) changedFields.profile_image = userData.profile_image

      if (Object.keys(changedFields).length === 0) {
        addNotification('info', t('noChangesToSave'))
        return
      }

      const response = await apiCall('/auth/update-user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(changedFields)
      })

      if (response.success) {
        setOriginalData(userData)
        window.dispatchEvent(new CustomEvent('userUpdated'))
        
        const updatedFields = Object.keys(changedFields).join(', ')
        addNotification('success', t('userDataUpdated', { fields: updatedFields }))
      } else {
        addNotification('error', response.error || t('failedToUpdateUserData'))
      }
    } catch (error) {
      console.error('Error updating user:', error)
      addNotification('error', t('errorUpdatingUserData'))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!isClient) return
    
    if (newPassword !== confirmPassword) {
      addNotification('error', t('passwordsDoNotMatch'))
      return
    }
    
    if (newPassword.length < 6) {
      addNotification('error', t('passwordMinLength'))
      return
    }
    
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        addNotification('error', t('authTokenNotFound'))
        return
      }

      const response = await apiCall('/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      })

      if (response.success) {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        addNotification('success', t('passwordChangedSuccess'))
      } else {
        addNotification('error', response.error || t('failedToChangePassword'))
      }
    } catch (error) {
      console.error('Error changing password:', error)
      addNotification('error', t('errorChangingPassword'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isClient) {
    return (
      <AuthGuard orgSlug={resolvedParams.org}>
        <RoleGuard allowedRoles={['admin', 'master', 'employee']} orgSlug={resolvedParams.org}>
        <SidebarProvider>
          <AppSidebar org={resolvedParams.org} />
          <SidebarInset>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">{t('loadingAccountData')}</p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
        </RoleGuard>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard orgSlug={resolvedParams.org}>
      <RoleGuard allowedRoles={['admin', 'master', 'employee']} orgSlug={resolvedParams.org}>
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
                    {t('dashboard')}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                    <BreadcrumbLink href={`/${resolvedParams.org}/settings`}>
                      {t('settings')}
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                    <BreadcrumbPage>{t('account')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* MAIN */}
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="max-w-4xl mx-auto w-full space-y-6">

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('profileInformation')}
            </CardTitle>
            <CardDescription>
              {t('profileInformationDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <UserAvatar 
                  src={profilePreview || (userData.profile_image ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${userData.profile_image}` : undefined)} 
                  name={userData.name} 
                  size="xl"
                />
                {(profilePreview && profilePreview !== '') && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={handleRemoveProfile}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileUpload}
                    className="hidden"
                    id="profile-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('profile-upload')?.click()}
                    className="cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t('uploadPhoto')}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('photoFormats')}
                </p>
              </div>
            </div>

            <Separator />

            {/* User Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  {t('fullName')}
                </label>
                <Input
                  id="name"
                  value={userData.name}
                  onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('fullNamePlaceholder')}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {t('emailAddress')}
                </label>
                <Input
                  id="email"
                  value={userData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {t('emailCannotBeChanged')}
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  {t('role')}
                </label>
                <Input
                  id="role"
                  value={userData.role}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="created" className="text-sm font-medium">
                  {t('memberSince')}
                </label>
                <Input
                  id="created"
                  value={new Date(userData.created_at).toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US')}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="cursor-pointer"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? t('saving') : t('saveChanges')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('languageRegion')}
            </CardTitle>
            <CardDescription>
              {t('languageRegionDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  {t('displayLanguage')}
                </label>
                <LanguageSwitcher variant="full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t('changePassword')}
            </CardTitle>
            <CardDescription>
              {t('changePasswordDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="current-password" className="text-sm font-medium">
                {t('currentPassword')}
              </label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('currentPasswordPlaceholder')}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                {t('newPassword')}
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                {t('confirmNewPassword')}
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
              />
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handlePasswordChange} 
                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                className="cursor-pointer"
              >
                <Lock className="h-4 w-4 mr-2" />
                {isLoading ? t('changing') : t('changePassword')}
              </Button>
            </div>
          </CardContent>
        </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      </RoleGuard>
    </AuthGuard>
  )
}

