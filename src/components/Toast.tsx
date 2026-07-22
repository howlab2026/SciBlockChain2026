import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import type { ToastItem, ToastType } from '../hooks/useToast';

function ToastIcon({ type }: { type: ToastType }) {
  const s = { size: 18 };
  switch (type) {
    case 'success': return <CheckCircle {...s} color="#10b981" />;
    case 'error':   return <XCircle    {...s} color="#ef4444" />;
    case 'warning': return <AlertTriangle {...s} color="#f59e0b" />;
    default:        return <Info       {...s} color="#3b82f6" />;
  }
}

const typeStyles: Record<ToastType, { border: string; bg: string; titleColor: string }> = {
  success: { border: 'rgba(16,185,129,0.4)',  bg: 'rgba(16,185,129,0.08)',  titleColor: '#34d399' },
  error:   { border: 'rgba(239,68,68,0.4)',   bg: 'rgba(239,68,68,0.08)',   titleColor: '#f87171' },
  warning: { border: 'rgba(245,158,11,0.4)',  bg: 'rgba(245,158,11,0.08)',  titleColor: '#fbbf24' },
  info:    { border: 'rgba(59,130,246,0.4)',  bg: 'rgba(59,130,246,0.08)',  titleColor: '#60a5fa' },
};

function SingleToast({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const s = typeStyles[toast.type];

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 320);
    }, 3700);
    return () => { cancelAnimationFrame(show); clearTimeout(hide); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      padding: '14px 16px',
      background: 'rgba(10,14,28,0.96)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${s.border}`,
      borderLeft: `3px solid ${s.border}`,
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
      minWidth: '280px',
      maxWidth: '360px',
      transform: visible ? 'translateX(0)' : 'translateX(110%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.32s ease',
    }}>
      <div style={{ marginTop: '1px', flexShrink: 0 }}>
        <ToastIcon type={toast.type} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: '700', fontSize: '13px', color: s.titleColor, lineHeight: '1.3' }}>
          {toast.title}
        </p>
        {toast.message && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '3px', wordBreak: 'break-word' }}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 320); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0', flexShrink: 0 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function Toast({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <SingleToast toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
