import { useState, useEffect } from 'react';

export function useApi() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  return { isClient };
}
