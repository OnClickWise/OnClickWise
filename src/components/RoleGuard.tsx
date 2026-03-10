'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'
import { useLocale } from 'next-intl'

interface RoleGuardProps {
  allowedRoles: string[];
  orgSlug: string;
  children: React.ReactNode;
  redirectTo?: string;
}

export default function RoleGuard({ 
  allowedRoles, 
  orgSlug, 
  children,
  redirectTo 
}: RoleGuardProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push(`/${locale}/${orgSlug}/login`);
        return;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      // Verificar múltiplas possibilidades de onde o role pode estar no token
      const role = payload.role || payload.type || payload.userType || payload.user_type || 'employee';
      
      // Verificar se o role está na lista de roles permitidos
      if (allowedRoles.includes(role)) {
        setIsAllowed(true);
      } else {
        // Redirect to dashboard or custom redirect
        router.push(redirectTo || `/${locale}/${orgSlug}/dashboard`);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      router.push(redirectTo || `/${locale}/${orgSlug}/dashboard`);
    }
  }, [orgSlug, router, allowedRoles, redirectTo]);

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
}

