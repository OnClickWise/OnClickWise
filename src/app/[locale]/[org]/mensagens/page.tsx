'use client';

import { useParams } from 'next/navigation';
import { InternalChatWidget } from '@/components/chat/internal-chat-widget';

export default function MensagensPage() {
  const params = useParams();
  const org = typeof params?.org === 'string' ? params.org : '';

  if (!org) {
    return <div>Tenant invalido</div>;
  }

  return <InternalChatWidget mode="page" initialOpen />;
}
