'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type ToastLevel = 'success' | 'error' | 'info' | 'warn';

export interface Toast {
  id: string;
  level: ToastLevel;
  message: string;
  requestId?: string;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  show: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS: Record<ToastLevel, number> = {
  success: 4000,
  info: 5000,
  warn: 7000,
  error: 10000,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setMounted(true);
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (partial: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).slice(2, 10);
      const toast: Toast = { id, ...partial };
      setToasts((prev) => [...prev, toast]);
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS[toast.level]);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const portalTarget = mounted && typeof document !== 'undefined' ? document.body : null;

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {portalTarget
        ? createPortal(
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
              {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
              ))}
            </div>,
            portalTarget,
          )
        : null}
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const color: Record<ToastLevel, string> = {
    success: 'border-green-500/40 bg-green-500/10 text-green-100',
    error: 'border-red-500/40 bg-red-500/10 text-red-100',
    warn: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-100',
    info: 'border-blue-500/40 bg-blue-500/10 text-blue-100',
  };
  const icon: Record<ToastLevel, string> = {
    success: '✓',
    error: '⚠︎',
    warn: '⚠︎',
    info: 'ⓘ',
  };

  const copyRequestId = () => {
    if (toast.requestId) navigator.clipboard.writeText(toast.requestId).catch(() => {});
  };

  return (
    <div
      className={`pointer-events-auto flex min-w-[260px] max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-md ${color[toast.level]}`}
      role="status"
    >
      <span className="font-semibold text-lg leading-none mt-0.5">{icon[toast.level]}</span>
      <div className="flex-1 text-sm">
        <p>{toast.message}</p>
        {toast.requestId && (
          <button
            onClick={copyRequestId}
            className="mt-1 text-[10px] opacity-60 hover:opacity-100 underline underline-offset-2 font-mono"
            title="Copy Request ID"
          >
            ID: {toast.requestId}
          </button>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-1 ml-2 text-xs underline underline-offset-2 opacity-80 hover:opacity-100"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-white/50 hover:text-white/90 text-sm leading-none mt-0.5"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
