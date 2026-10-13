import { useState } from "react";
import { X, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/dashboard";

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024)       return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes > 0)           return `${Math.round(bytes)} B`;
  return "0 B";
}

export function StorageQuotaDialog({
  user,
  onClose,
  onSave,
}: {
  user: User;
  onClose: () => void;
  onSave: (userId: number, newQuotaGb: number) => void;
}) {
  const currentQuotaGb = Math.round(user.storageQuota / 1073741824) || 1;
  const usedGb         = user.storageUsed / 1073741824;
  const minQuotaGb     = Math.max(1, Math.ceil(usedGb));

  const [newQuotaStr, setNewQuotaStr] = useState(String(currentQuotaGb));
  const newQuota = Number(newQuotaStr) || 0;

  const storagePercentage = user.storageQuota > 0
    ? Math.round((user.storageUsed / user.storageQuota) * 100)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuotaStr || isNaN(Number(newQuotaStr)) || newQuota < 1) {
      alert("Masukkan quota yang valid (minimal 1 GB)");
      return;
    }
    if (newQuota < minQuotaGb) {
      alert(`Quota minimal adalah ${minQuotaGb} GB (storage terpakai: ${formatBytes(user.storageUsed)})`);
      return;
    }
    onSave(user.id, newQuota);
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* User info */}
      <div className="flex items-center gap-3 rounded-ui border-2 border-ink bg-lilac p-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink text-sm font-bold ${user.color}`}>
          {user.initial}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display font-bold">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Current Storage */}
      <div>
        <p className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Storage Saat Ini</p>
        <div className="rounded-ui border-2 border-ink bg-background p-3">
          <div className="mb-2 flex items-center justify-between text-sm font-bold">
            <span>{formatBytes(user.storageUsed)} / {formatBytes(user.storageQuota)}</span>
            <span className="text-muted-foreground">{storagePercentage}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full border-2 border-ink bg-card">
            <div
              className={`h-full ${storagePercentage > 80 ? "bg-coral" : "bg-lime"}`}
              style={{ width: `${Math.min(storagePercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* New Quota */}
      <div>
        <label className="mb-1.5 block text-sm font-bold">Kuota Baru (GB)</label>
        <input
          type="number"
          value={newQuotaStr}
          onChange={(e) => setNewQuotaStr(e.target.value)}
          min={minQuotaGb}
          max="10000"
          step="1"
          className="w-full rounded-ui border-2 border-ink bg-background px-4 py-2.5 font-semibold outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Minimal: {minQuotaGb} GB (terpakai: {formatBytes(user.storageUsed)})
        </p>
      </div>

      {/* Preview */}
      {newQuota !== currentQuotaGb && newQuota > 0 && (
        <div className="rounded-ui border-2 border-ink bg-sky p-3">
          <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Preview Perubahan</p>
          <div className="flex items-center justify-around gap-2">
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground">Sebelum</p>
              <p className="font-bold">{currentQuotaGb} GB</p>
            </div>
            <div className="text-xl font-bold">→</div>
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground">Sesudah</p>
              <p className="font-bold">{newQuota} GB</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Batal
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={newQuota === currentQuotaGb || newQuota < 1 || !newQuotaStr}
        >
          Simpan
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {/* ── Mobile: bottom sheet (< sm) ── */}
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden"
        onClick={onClose}
      >
        <div
          className="max-h-[92dvh] overflow-y-auto rounded-t-2xl border-t-2 border-ink bg-card"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-ink/20" />
          </div>
          <div className="flex items-center justify-between px-4 pb-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-ui border-2 border-ink bg-sun">
                <HardDrive className="size-4" />
              </span>
              <h2 className="font-display text-lg font-bold">Storage Quota</h2>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>
          <div className="px-4 pb-8">
            {formContent}
          </div>
        </div>
      </div>

      {/* ── Desktop: centered modal (sm+) ── */}
      <div
        className="fixed inset-0 z-50 hidden place-items-center bg-ink/40 p-4 sm:grid"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-ui border-2 border-ink bg-card p-6 shadow-brutal"
          onClick={e => e.stopPropagation()}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-ui border-2 border-ink bg-sun">
                <HardDrive className="size-5" />
              </span>
              <h2 className="font-display text-2xl font-bold">Storage Quota</h2>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>
          {formContent}
        </div>
      </div>
    </>
  );
}
