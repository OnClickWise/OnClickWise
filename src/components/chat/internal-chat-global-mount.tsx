"use client";

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { InternalChatWidget } from '@/components/chat/internal-chat-widget';

export function InternalChatGlobalMount() {
  const pathname = usePathname() || '';

  if (pathname.includes('/login') || pathname.includes('/forgot-password')) {
    return null;
  }

  if (pathname.endsWith('/mensagens')) {
    return null;
  }

  return <InternalChatWidget mode="floating" />;
}
