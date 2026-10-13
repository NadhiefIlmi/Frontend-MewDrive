/**
 * ConfirmDialog — pengganti window.confirm() yang sesuai desain.
 * Mobile: bottom sheet muncul dari bawah.
 * Desktop (sm+): modal centered di tengah layar.
 * Mendukung aksi destruktif (tombol merah).
 */

import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
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
  const iconBg  = variant === "destructive" ? "bg-coral" : "bg-sun";
  const Icon    = variant === "destructive" ? Trash2 : AlertTriangle;

  const innerContent = (
    <>
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
        <div className="flex items-center gap-3">
          <span className={`grid size-9 shrink-0 place-items-center rounded-ui border-2 border-ink sm:size-10 ${iconBg}`}>
            <Icon className="size-4 sm:size-5" />
          </span>
          <h2 className="font-display text-lg font-bold sm:text-xl">{title}</h2>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onCancel} disabled={loading}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Pesan */}
      <p className="mb-5 text-sm font-medium leading-relaxed text-muted-foreground sm:mb-6">
        {message}
      </p>

      {/* Tombol */}
      <div className="flex gap-2 sm:gap-3">
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
              <Loader2 className="size-4 animate-spin" />
              Memproses...
            </span>
          ) : confirmLabel}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile: bottom sheet (< sm) ── */}
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden"
        onClick={onCancel}
      >
        <div
          className="rounded-t-2xl border-t-2 border-ink bg-card p-4"
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="mb-3 flex justify-center">
            <div className="h-1 w-10 rounded-full bg-ink/20" />
          </div>
          {innerContent}
          {/* Safe area spacer */}
          <div className="mt-2 h-safe-bottom" />
        </div>
      </div>

      {/* ── Desktop: centered modal (sm+) ── */}
      <div
        className="fixed inset-0 z-50 hidden place-items-center bg-ink/40 p-4 sm:grid"
        onClick={onCancel}
      >
        <div
          className="w-full max-w-sm rounded-ui border-2 border-ink bg-card p-6 shadow-brutal"
          onClick={e => e.stopPropagation()}
        >
          {innerContent}
        </div>
      </div>
    </>
  );
}
