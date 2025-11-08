'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const t = useTranslations('ChangePassword');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
      setError(t('allFieldsRequired'));
      return false;
    }

    if (formData.new_password.length < 6) {
      setError(t('passwordMinLength'));
      return false;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError(t('passwordsDoNotMatch'));
      return false;
    }

    if (formData.current_password === formData.new_password) {
      setError(t('passwordMustBeDifferent'));
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
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('tokenNotFound'));
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/auth/change-temporary-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: formData.current_password,
          new_password: formData.new_password
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(result.error || t('errorChangingPassword'));
      }
    } catch (error) {
      console.error('Change password error:', error);
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">{t('passwordChanged')}</h3>
            <p className="text-green-600 mb-4">
              {t('passwordChangedMessage')}
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl text-orange-800">{t('setNewPassword')}</CardTitle>
          <CardDescription className="text-orange-600">
            {t('firstTimeMessage')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('currentPassword')}
              </label>
              <div className="relative">
                <Input
                  id="current_password"
                  name="current_password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.current_password}
                  onChange={handleInputChange}
                  required
                  className="pr-10"
                  placeholder={t('currentPasswordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('newPassword')}
              </label>
              <div className="relative">
                <Input
                  id="new_password"
                  name="new_password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.new_password}
                  onChange={handleInputChange}
                  required
                  className="pr-10"
                  placeholder={t('newPasswordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('confirmPassword')}
              </label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  required
                  className="pr-10"
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 cursor-pointer"
                disabled={loading}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-orange-600 hover:bg-orange-700 cursor-pointer"
                disabled={loading}
              >
                {loading ? t('changing') : t('changePassword')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
