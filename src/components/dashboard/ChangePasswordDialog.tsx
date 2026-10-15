/**
 * ChangePasswordDialog
 * Dialog untuk user ganti password sendiri.
 * Wajib input password lama dulu — tidak ada bypass.
 */

import { useState } from "react";
import { X, KeyRound, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Props = {
  onClose: () => void;
};

export function ChangePasswordDialog({ onClose }: Props) {
  const [currentPassword, setCurrentPassword]   = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [showCurrent, setShowCurrent]           = useState(false);
  const [showNew, setShowNew]                   = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [success, setSuccess]                   = useState(false);
  const [error, setError]                       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validasi frontend
    if (!currentPassword) {
      setError("Password saat ini wajib diisi");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password baru minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Password baru tidak boleh sama dengan password lama");
      return;
    }

    setLoading(true);
    const res = await api.changePassword(currentPassword, newPassword);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      // Tutup otomatis setelah 1.5 detik
      setTimeout(onClose, 1500);
    } else {
      const code = res.error?.code;
      if (code === "WRONG_CURRENT_PASSWORD") {
        setError("Password saat ini salah");
      } else if (code === "VALIDATION_ERROR") {
        setError(res.error?.message ?? "Input tidak valid");
      } else {
        setError("Gagal mengubah password, coba lagi");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-ui border-2 border-ink bg-card shadow-brutal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-ink p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-ui border-2 border-ink bg-lilac">
              <KeyRound className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold">Ganti Password</h2>
              <p className="text-xs text-muted-foreground">Masukkan password lama untuk konfirmasi</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="grid size-14 place-items-center rounded-full border-2 border-ink bg-lime">
                <Check className="size-7" />
              </span>
              <p className="font-bold">Password berhasil diubah!</p>
              <p className="text-sm text-muted-foreground">Menutup...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Password lama */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Password Saat Ini</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan password lama"
                    autoComplete="current-password"
                    className="w-full rounded-ui border-2 border-ink bg-background px-3 py-2.5 pr-10 text-sm font-semibold outline-none focus:ring-2 focus:ring-ink"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Password baru */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Password Baru</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    autoComplete="new-password"
                    className="w-full rounded-ui border-2 border-ink bg-background px-3 py-2.5 pr-10 text-sm font-semibold outline-none focus:ring-2 focus:ring-ink"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi password baru */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Konfirmasi Password Baru</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password baru"
                    autoComplete="new-password"
                    className="w-full rounded-ui border-2 border-ink bg-background px-3 py-2.5 pr-10 text-sm font-semibold outline-none focus:ring-2 focus:ring-ink"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {/* Indikator cocok/tidak */}
                {confirmPassword && (
                  <p className={`text-xs font-semibold ${
                    newPassword === confirmPassword ? "text-green-600" : "text-red-600"
                  }`}>
                    {newPassword === confirmPassword ? "✓ Password cocok" : "✗ Password tidak cocok"}
                  </p>
                )}
              </div>

              {/* Error message */}
              {error && (
                <p className="rounded-ui border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 dark:border-red-900 dark:bg-red-950/30">
                  {error}
                </p>
              )}

              {/* Tombol aksi */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="size-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    "Simpan"
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
