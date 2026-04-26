import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export default function ToastHost() {
  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);
  const timersRef = useRef(new Map());

  useEffect(() => {
    const timers = timersRef.current;

    for (const toast of toasts || []) {
      if (timers.has(toast.id)) continue;
      const timer = window.setTimeout(() => {
        timers.delete(toast.id);
        removeToast(toast.id);
      }, 3500);
      timers.set(toast.id, timer);
    }

    // cleanup stale timers
    for (const [id, timer] of timers.entries()) {
      if (!(toasts || []).some((t) => t.id === id)) {
        window.clearTimeout(timer);
        timers.delete(id);
      }
    }

    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, [toasts, removeToast]);

  if (!toasts?.length) return null;

  return (
    <div className="voltee-toast-host" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={`voltee-toast ${toast.variant || 'info'}`}
          onClick={() => removeToast(toast.id)}
          title="Dismiss"
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}
