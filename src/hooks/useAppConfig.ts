import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

interface AppConfigStatus {
  active: boolean;
  reason?: string;
  uiMode: number;
  loading: boolean;
}

export function useAppConfig(intervalMs: number = 15000): AppConfigStatus {
  const [status, setStatus] = useState<AppConfigStatus>({
    active: false,
    uiMode: 0,
    loading: true
  });

  const checkStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStatus({ active: false, uiMode: 0, loading: false });
        return;
      }

      const response = await apiService.getAppConfig();
      if (response.success && response.data) {
        const activeValue = response.data.active;
        let isActive = false;
        if (typeof activeValue === 'boolean') {
          isActive = activeValue;
        } else if (typeof activeValue === 'number') {
          isActive = activeValue === 1;
        } else if (typeof activeValue === 'string') {
          isActive = activeValue === 'true' || activeValue === '1' || activeValue === 't';
        }
        const uiMode = response.data.uiMode !== undefined ? (typeof response.data.uiMode === 'number' ? response.data.uiMode : parseInt(String(response.data.uiMode)) || 0) : 0;
        setStatus({
          active: isActive,
          reason: response.data.reason,
          uiMode: uiMode,
          loading: false
        });
      } else {
        setStatus(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, intervalMs);
    return () => clearInterval(interval);
  }, []);

  return status;
}

