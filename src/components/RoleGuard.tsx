'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push(`/${orgSlug}/login`);
        return;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role || payload.type || payload.userType || payload.user_type || 'employee';
      
      if (!allowedRoles.includes(role)) {
        // Redirect to dashboard or custom redirect
        router.push(redirectTo || `/${orgSlug}/dashboard`);
        return;
      }
      
      setIsAllowed(true);
    } catch (error) {
      console.error('Error checking user role:', error);
      router.push(`/${orgSlug}/dashboard`);
    }
  }, [orgSlug, router, allowedRoles, redirectTo]);

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
}

