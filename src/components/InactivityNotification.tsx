'use client';

import { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';

interface InactivityNotificationProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function InactivityNotification({ isVisible, onClose }: InactivityNotificationProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsClosing(false);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isClosing ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
    }`}>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">
              Session Expired
            </h3>
            <p className="text-sm text-yellow-700">
              You have been disconnected due to inactivity for more than 30 minutes. 
              Please log in again to continue and dismiss this notification.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-yellow-600 hover:text-yellow-800 transition-colors"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
