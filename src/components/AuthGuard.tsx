'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  orgSlug: string;
}

export default function AuthGuard({ children, orgSlug }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      const parts = pathname?.split('/').filter(Boolean) ?? [];
      const locale = ['pt', 'en', 'es', 'fr'].includes(parts[0]) ? parts[0] : 'pt';
      router.replace(`/${locale}/${orgSlug}/login`);
      return;
    }

    setIsChecking(false);
  }, [router, pathname, orgSlug]);

  if (isChecking) {
    return null;
  }

  return <>{children}</>;
}
