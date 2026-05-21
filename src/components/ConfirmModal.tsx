import React from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  requiresInput?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
  requiresInput
}) => {
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) setInputValue('');
  }, [isOpen]);

  if (!isOpen) return null;

  const iconMap = {
    danger: <Trash2 size={24} style={{ color: 'var(--color-red)' }} />,
    warning: <AlertTriangle size={24} style={{ color: 'var(--color-orange)' }} />,
    info: <Info size={24} style={{ color: 'var(--color-recovery-ring)' }} />
  };

  const canConfirm = requiresInput ? inputValue === requiresInput : true;

  return (
    <div className="ios-confirm-overlay" onClick={onCancel}>
      <div className="ios-confirm-card" onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom: '12px' }}>{iconMap[variant]}</div>
        <h3>{title}</h3>
        <p>{message}</p>
        {requiresInput && (
          <div style={{ marginBottom: '16px' }}>
            <input
              className="ios-input"
              placeholder={`Type "${requiresInput}" to confirm`}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              style={{ textAlign: 'center', marginBottom: 0 }}
              autoFocus
            />
          </div>
        )}
        <div className="ios-confirm-actions">
          <button
            className={`ios-btn ${variant === 'danger' ? 'ios-btn-danger' : 'ios-btn-primary'}`}
            onClick={onConfirm}
            disabled={!canConfirm}
            style={{ opacity: canConfirm ? 1 : 0.4, cursor: canConfirm ? 'pointer' : 'not-allowed' }}
          >
            {confirmLabel}
          </button>
          <button className="ios-btn ios-btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
