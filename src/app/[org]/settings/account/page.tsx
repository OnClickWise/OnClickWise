"use client"

import React, { useState, useEffect } from 'react'
import { use } from 'react'
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
import { useApi } from '@/hooks/useApi'
import { generateAvatar } from '@/utils/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/avatar'
import { User, Lock, Save, Upload, X } from 'lucide-react'

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
        addNotification('error', 'Authentication token not found')
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
          ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${response.user.profile_image}` 
          : '')
      } else {
        addNotification('error', 'Failed to load user data')
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      addNotification('error', 'Error loading user data')
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
        addNotification('error', 'File size must be less than 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        addNotification('error', 'Please select an image file')
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
  }

  const handleSave = async () => {
    if (!isClient) return
    
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        addNotification('error', 'Authentication token not found')
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
          
          addNotification('success', 'Profile image updated successfully')
          return
        } else {
          addNotification('error', 'Failed to upload profile image')
          return
        }
      }

      // Detect changed fields
      const changedFields: any = {}
      if (userData.name !== originalData.name) changedFields.name = userData.name
      if (userData.profile_image !== originalData.profile_image) changedFields.profile_image = userData.profile_image

      if (Object.keys(changedFields).length === 0) {
        addNotification('info', 'No changes to save')
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
        addNotification('success', `User data updated successfully: ${updatedFields}`)
      } else {
        addNotification('error', response.error || 'Failed to update user data')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      addNotification('error', 'Error updating user data')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!isClient) return
    
    if (newPassword !== confirmPassword) {
      addNotification('error', 'New passwords do not match')
      return
    }
    
    if (newPassword.length < 6) {
      addNotification('error', 'New password must be at least 6 characters')
      return
    }
    
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        addNotification('error', 'Authentication token not found')
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
        addNotification('success', 'Password changed successfully')
      } else {
        addNotification('error', response.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      addNotification('error', 'Error changing password')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isClient) {
    return (
      <AuthGuard orgSlug={resolvedParams.org}>
        <SidebarProvider>
          <AppSidebar org={resolvedParams.org} />
          <SidebarInset>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading account data...</p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    )
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
                    <BreadcrumbPage>Account</BreadcrumbPage>
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
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <UserAvatar 
                  src={profilePreview || (userData.profile_image ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${userData.profile_image}` : undefined)} 
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
                    Upload Photo
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>

            <Separator />

            {/* User Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="name"
                  value={userData.name}
                  onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  value={userData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Role
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
                  Member Since
                </label>
                <Input
                  id="created"
                  value={new Date(userData.created_at).toLocaleDateString()}
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
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="current-password" className="text-sm font-medium">
                Current Password
              </label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                New Password
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm New Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
              />
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handlePasswordChange} 
                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                className="cursor-pointer"
              >
                <Lock className="h-4 w-4 mr-2" />
                {isLoading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </CardContent>
            </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}

