import React, { useEffect } from 'react';
import { Check, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  variant?: 'success' | 'warning' | 'info';
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  isVisible,
  variant = 'success',
  onDismiss,
  duration = 2000
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onDismiss]);

  const iconMap = {
    success: <Check size={16} style={{ color: 'var(--color-exercise-ring)' }} />,
    warning: <AlertTriangle size={16} style={{ color: 'var(--color-orange)' }} />,
    info: <Check size={16} style={{ color: 'var(--color-recovery-ring)' }} />
  };

  return (
    <div className={`ios-toast ${isVisible ? 'visible' : ''}`}>
      {iconMap[variant]}
      {message}
    </div>
  );
};
