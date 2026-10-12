/**
 * ConfirmDialog — pengganti window.confirm() yang sesuai desain web.
 * Muncul di tengah layar, mendukung aksi destruktif (tombol merah).
 */

import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  /** Judul dialog */
  title: string;
  /** Pesan penjelasan */
  message: string;
  /** Label tombol konfirmasi (default: "Hapus") */
  confirmLabel?: string;
  /** Warna tombol konfirmasi: destructive (merah) atau default */
  variant?: "destructive" | "default";
  /** Loading state saat proses berjalan */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Hapus",
  variant = "destructive",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-ui border-2 border-ink bg-card p-6 shadow-brutal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`grid size-10 shrink-0 place-items-center rounded-ui border-2 border-ink ${variant === "destructive" ? "bg-coral" : "bg-sun"}`}>
              {variant === "destructive"
                ? <Trash2 className="size-5" />
                : <AlertTriangle className="size-5" />
              }
            </span>
            <h2 className="font-display text-xl font-bold">{title}</h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onCancel}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Pesan */}
        <p className="mb-6 text-sm font-medium text-muted-foreground leading-relaxed">
          {message}
        </p>

        {/* Tombol */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            className="flex-1"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Memproses...
              </span>
            ) : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
