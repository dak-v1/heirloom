import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

export interface ToastInput {
  title: string;
  body?: string;
  image?: string;
  tone?: "default" | "success" | "warning";
  action?: { label: string; onClick: () => void };
  /** ms; 0 keeps it until dismissed. */
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: number;
}

const ToastContext = createContext<(t: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (t: ToastInput) => {
      const id = next.current++;
      setItems((list) => [...list.slice(-2), { ...t, id }]);
      const ms = t.duration ?? 5000;
      if (ms > 0) window.setTimeout(() => dismiss(id), ms);
    },
    [dismiss],
  );
  const value = useMemo(() => push, [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone ?? "default"}`}>
            {t.image && <img className="toast__img" src={t.image} alt="" />}
            <div className="toast__text">
              <strong>{t.title}</strong>
              {t.body && <span>{t.body}</span>}
            </div>
            {t.action && (
              <button
                type="button"
                className="toast__action"
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
            <button type="button" className="toast__close" aria-label="Dismiss notification" onClick={() => dismiss(t.id)}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
