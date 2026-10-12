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
  // Input dalam GB (untuk kemudahan user), storage disimpan dalam bytes
  const currentQuotaGb = Math.round(user.storageQuota / 1073741824) || 1;
  const usedGb         = user.storageUsed / 1073741824;
  const minQuotaGb     = Math.max(1, Math.ceil(usedGb));

  // Simpan sebagai string agar field bisa dikosongkan saat mengetik
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

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-ui border-2 border-ink bg-card p-6 shadow-brutal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* User Info */}
        <div className="mb-6 rounded-ui border-2 border-ink bg-lilac p-4">
          <p className="text-sm font-bold uppercase text-muted-foreground">User</p>
          <p className="mt-1 font-display text-xl font-bold">{user.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Storage */}
          <div>
            <p className="mb-2 text-sm font-bold uppercase text-muted-foreground">Current Storage</p>
            <div className="rounded-ui border-2 border-ink bg-background p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold">
                  {formatBytes(user.storageUsed)} / {formatBytes(user.storageQuota)}
                </span>
                <span className="text-sm text-muted-foreground">{storagePercentage}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full border-2 border-ink bg-card">
                <div
                  className={`h-full ${storagePercentage > 80 ? "bg-coral" : "bg-lime"}`}
                  style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* New Quota */}
          <div>
            <label className="mb-2 block text-sm font-bold">New Quota (GB)</label>
            <input
              type="number"
              value={newQuotaStr}
              onChange={(e) => setNewQuotaStr(e.target.value)}
              min={minQuotaGb}
              max="10000"
              step="1"
              className="w-full rounded-ui border-2 border-ink bg-background px-4 py-2.5 font-semibold outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Minimal: {minQuotaGb} GB (storage terpakai: {formatBytes(user.storageUsed)})
            </p>
          </div>

          {/* Preview */}
          {newQuota !== currentQuotaGb && newQuota > 0 && (
            <div className="rounded-ui border-2 border-ink bg-sky p-4">
              <p className="text-sm font-bold uppercase text-muted-foreground">Preview</p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Before</p>
                  <p className="font-bold">{currentQuotaGb} GB</p>
                </div>
                <div className="text-2xl font-bold">→</div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">After</p>
                  <p className="font-bold">{newQuota} GB</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={newQuota === currentQuotaGb || newQuota < 1 || !newQuotaStr}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
