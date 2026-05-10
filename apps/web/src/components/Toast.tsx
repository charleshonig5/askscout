"use client";

/**
 * Lightweight toast notification system.
 *
 * Why we built this: every settings/account API call previously had a
 * silent catch (an empty `catch` block). If the network dropped or
 * the server 500'd, users saw the optimistic UI update but the real
 * save failed quietly — the next reload would surface the discrepancy
 * with no explanation. Toasts fill that gap by surfacing errors at the
 * moment they happen, while keeping the success path quiet (the UI
 * already changes visibly when things work, so success toasts are just
 * noise).
 *
 * Pattern: top-right stack of small cards. Newest at the top. Each
 * toast auto-dismisses after 4s, dismissible by click. Animations are
 * a translate-from-right + fade so the stack reads as "incoming
 * information" rather than blocking.
 *
 * No third-party library — react-hot-toast / sonner / etc. would
 * pull in styling we'd have to override anyway. This stays under 100
 * lines and fits the design system tokens in globals.css.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X } from "lucide-react";

interface Toast {
  id: number;
  variant: "error";
  title: string;
  /** Optional secondary line under the title. Use for actionable
   *  hints, e.g. "Try again" or "Check your connection." */
  description?: string;
}

interface ToastContextValue {
  /** Show an error toast. The most common copy pattern is
   *  `showError("Couldn't save", "Try again in a moment.")` —
   *  short imperative title + a hint underneath. */
  showError: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  // Stable id source so concurrent toast triggers don't collide.
  // `useRef` survives re-renders without triggering one.
  const nextId = useRef(1);
  // Track every pending auto-dismiss timer so we can clear them on
  // unmount. The provider lives at the app root and never unmounts
  // during a session in practice, but tracking timers means a hot
  // reload (or a future scenario where the provider does unmount)
  // never leaves a setTimeout pointing at dead state.
  const timers = useRef<Set<number>>(new Set());

  // Defer the portal until after the first client paint — server-side
  // there's no `document`, so we render `null` on the server and the
  // first client render, then mount the portal once `useEffect` runs.
  useEffect(() => {
    setMounted(true);
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      pending.clear();
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showError = useCallback((title: string, description?: string) => {
    const id = nextId.current++;
    setToasts((prev) => [{ id, variant: "error", title, description }, ...prev]);
    // Auto-dismiss after AUTO_DISMISS_MS. Cleanup happens through
    // the dismiss call's normal state filter so manual dismissal
    // (clicking the toast) and timer dismissal converge on the
    // same code path.
    const timerId = window.setTimeout(() => {
      timers.current.delete(timerId);
      dismiss(id);
    }, AUTO_DISMISS_MS);
    timers.current.add(timerId);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showError }}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="toast-stack"
            // Polite live region — screen readers announce new toasts
            // without interrupting whatever they're currently reading.
            // Errors aren't urgent enough to warrant aria-live="assertive".
            role="region"
            aria-label="Notifications"
            aria-live="polite"
          >
            {toasts.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`toast toast-${t.variant}`}
                onClick={() => dismiss(t.id)}
                // role="alert" rather than the default <button> role so
                // assistive tech treats new toasts as announcements
                // first, dismissable controls second.
                role="alert"
              >
                <span className="toast-icon" aria-hidden>
                  <AlertCircle size={16} strokeWidth={1.5} />
                </span>
                <span className="toast-body">
                  <span className="toast-title">{t.title}</span>
                  {t.description && (
                    <span className="toast-desc">{t.description}</span>
                  )}
                </span>
                <span className="toast-close" aria-label="Dismiss">
                  <X size={14} strokeWidth={1.5} aria-hidden />
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
