/**
 * ResetPasswordDialog — pengganti window.prompt() untuk reset password user.
 * Admin input password baru + konfirmasi, dengan toggle show/hide.
 */

import { useState } from "react";
import { X, Eye, EyeOff, KeyRound, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/dashboard";

interface ResetPasswordDialogProps {
  user: User;
  onClose: () => void;
  onReset: (userId: number, newPassword: string) => Promise<void>;
}

export function ResetPasswordDialog({ user, onClose, onReset }: ResetPasswordDialogProps) {
  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const passwordTooShort = password.length > 0 && password.length < 6;
  const mismatch         = confirm.length > 0 && confirm !== password;
  const canSubmit        = password.length >= 6 && confirm === password && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await onReset(user.id, password);
    } catch {
      setError("Gagal mereset password. Coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-ui border-2 border-ink bg-card p-6 shadow-brutal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-ui border-2 border-ink bg-sun">
              <KeyRound className="size-4" />
            </span>
            <h2 className="font-display text-xl font-bold">Reset Password</h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Info user */}
        <div className="mb-5 flex items-center gap-3 rounded-ui border-2 border-ink bg-sun/50 p-3">
          <span className={`grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink text-sm font-bold ${user.color}`}>
            {user.initial}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display font-bold">{user.name}</p>
            <p className="truncate text-xs font-semibold text-muted-foreground">{user.email}</p>
          </div>
          {user.role === "Admin" && (
            <Shield className="ml-auto size-4 shrink-0 text-coral" />
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password baru */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">
              Password Baru
            </label>
            <div className="relative">
              <input
                autoFocus
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 karakter"
                className={`w-full rounded-ui border-2 bg-background px-4 py-2.5 pr-10 font-semibold outline-none focus:ring-2 focus:ring-ink ${
                  passwordTooShort ? "border-red-500" : "border-ink"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {passwordTooShort && (
              <p className="mt-1 text-xs font-bold text-red-600">Minimal 6 karakter</p>
            )}
          </div>

          {/* Konfirmasi password */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Ulangi password baru"
                className={`w-full rounded-ui border-2 bg-background px-4 py-2.5 pr-10 font-semibold outline-none focus:ring-2 focus:ring-ink ${
                  mismatch ? "border-red-500" : "border-ink"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {mismatch && (
              <p className="mt-1 text-xs font-bold text-red-600">Password tidak sama</p>
            )}
          </div>

          {error && (
            <p className="rounded-ui border-2 border-ink bg-coral px-3 py-2 text-sm font-bold">
              {error}
            </p>
          )}

          {/* Tombol */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={!canSubmit}>
              {loading
                ? <Loader2 className="size-4 animate-spin" />
                : "Reset Password"
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
