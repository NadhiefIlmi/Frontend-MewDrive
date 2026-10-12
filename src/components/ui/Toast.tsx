/**
 * Toast Notification System
 * Posisi: kanan atas
 * Tipe: success (hijau), error (merah), info (biru)
 */

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

// ─── Single Toast Item ────────────────────────────────────────────────────────
function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const config = {
    success: {
      bg: "bg-lime border-ink",
      icon: <CheckCircle className="size-5 shrink-0 text-green-700" />,
    },
    error: {
      bg: "bg-coral border-ink",
      icon: <XCircle className="size-5 shrink-0 text-red-700" />,
    },
    info: {
      bg: "bg-sky border-ink",
      icon: <Info className="size-5 shrink-0 text-blue-700" />,
    },
  }[toast.type];

  return (
    <div
      className={`flex items-start gap-3 rounded-ui border-2 px-4 py-3 shadow-brutal transition-all duration-300 ${config.bg} ${
        visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
      }`}
    >
      {config.icon}
      <p className="flex-1 text-sm font-bold leading-tight">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="grid size-5 shrink-0 place-items-center rounded hover:opacity-60"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

// ─── Toast Container ──────────────────────────────────────────────────────────
export function ToastContainer({ toasts, onDismiss }: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ─── useToast hook ────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toast = (message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-dismiss setelah 3 detik
    setTimeout(() => dismiss(id), 3000);
  };

  // Shorthand helpers
  const success = (msg: string) => toast(msg, "success");
  const error   = (msg: string) => toast(msg, "error");
  const info    = (msg: string) => toast(msg, "info");

  return { toasts, toast, success, error, info, dismiss };
}
