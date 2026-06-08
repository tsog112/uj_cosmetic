'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(t.id), 350);
    }, 3000);
    return () => clearTimeout(timer);
  }, [t.id, onDismiss]);

  const icons = {
    success: <CheckCircle size={18} strokeWidth={2} />,
    error:   <AlertCircle size={18} strokeWidth={2} />,
    info:    <Info size={18} strokeWidth={2} />,
  };

  const colors = {
    success: {
      bg: 'var(--color-status-done-bg)',
      border: 'var(--color-status-done-text)',
      text: 'var(--color-status-done-text)',
      icon: 'var(--color-status-done-text)',
    },
    error: {
      bg: 'var(--color-status-cancel-bg)',
      border: 'var(--color-status-cancel-text)',
      text: 'var(--color-status-cancel-text)',
      icon: 'var(--color-status-cancel-text)',
    },
    info: {
      bg: 'var(--color-brand-light)',
      border: 'var(--color-brand)',
      text: 'var(--color-brand-dark)',
      icon: 'var(--color-brand)',
    },
  };

  const c = colors[t.type];

  return (
    <div
      style={{
        background: c.bg,
        border: `1.5px solid ${c.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        transform: visible ? 'translateY(0)' : 'translateY(-24px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease',
        position: 'relative',
        overflow: 'hidden',
        maxWidth: 360,
        width: '100%',
      }}
    >
      <span style={{ color: c.icon, flexShrink: 0 }}>{icons[t.type]}</span>
      <p style={{ fontSize: 13, fontWeight: 600, color: c.text, flex: 1, lineHeight: 1.4 }}>{t.message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss(t.id), 350); }}
        style={{ color: c.text, opacity: 0.5, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 2, minHeight: 'auto' }}
        aria-label="Хаах"
      >
        <X size={14} />
      </button>
      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 2,
          background: c.icon,
          opacity: 0.35,
          borderRadius: '0 0 16px 16px',
          animation: 'toastProgress 3s linear forwards',
        }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast portal */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99990,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: 'center',
          width: '100%',
          maxWidth: 400,
          padding: '0 16px',
          pointerEvents: 'none',
        }}
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ width: '100%', pointerEvents: 'auto' }}>
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
