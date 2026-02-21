'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  orgSlug: string;
}

export default function AuthGuard({ children, orgSlug }: AuthGuardProps) {
  return <>{children}</>;
}
