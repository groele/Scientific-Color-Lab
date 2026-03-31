import type { CSSProperties } from 'react';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CopyToast } from '@/components/ui/copy-toast';

interface ToastEntry {
  id: string;
  message: string;
}

interface CopyFeedbackEntry extends ToastEntry {
  x: number;
  y: number;
  placement: 'above' | 'below';
}

interface ToastContextValue {
  pushToast: (message: string) => void;
  pushCopyFeedback: (message: string, anchor?: Element | null) => void;
  setCopyAnchor: (anchor?: Element | null) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedbackEntry[]>([]);
  const fallbackAnchorRef = useRef<Element | null>(null);

  const pushToast = useCallback((message: string) => {
    const entry = { id: crypto.randomUUID(), message };
    setToasts((current) => [...current, entry].slice(-4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== entry.id));
    }, 1800);
  }, []);

  const pushCopyFeedback = useCallback(
    (message: string, anchor?: Element | null) => {
      const target = anchor ?? fallbackAnchorRef.current;
      fallbackAnchorRef.current = null;
      const rect = target?.getBoundingClientRect();
      if (!rect) {
        pushToast(message);
        return;
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const entry = {
        id: crypto.randomUUID(),
        message,
        x: Math.min(Math.max(rect.left + rect.width / 2, 88), viewportWidth - 88),
        y: rect.top > 72 ? rect.top - 8 : rect.bottom + 8,
        placement: rect.top > 72 ? 'above' : 'below',
      } satisfies CopyFeedbackEntry;

      setCopyFeedback((current) => [...current, entry].slice(-3));
      window.setTimeout(() => {
        setCopyFeedback((current) => current.filter((feedback) => feedback.id !== entry.id));
      }, Math.min(1400, Math.max(1000, viewportHeight / 1.5)));
    },
    [pushToast],
  );

  const setCopyAnchor = useCallback((anchor?: Element | null) => {
    fallbackAnchorRef.current = anchor ?? null;
  }, []);

  const value = useMemo(
    () => ({ pushToast, pushCopyFeedback, setCopyAnchor }),
    [pushCopyFeedback, pushToast, setCopyAnchor],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-50">
        {copyFeedback.map((toast) => (
          <CopyToast
            key={toast.id}
            message={toast.message}
            variant="local"
            className="absolute"
            style={
              {
                left: toast.x,
                top: toast.y,
                transform: toast.placement === 'above' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <CopyToast key={toast.id} message={toast.message} variant="global" />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider.');
  }

  return context;
}
