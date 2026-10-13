import { useState, useEffect } from "react";
import {
  X, Shield, User, CheckCircle, XCircle,
  Eye, Upload, Download, Share2, Trash2, Users, HardDrive, Loader2, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type Permission } from "@/lib/api";
import type { User as DashboardUser } from "@/types/dashboard";

// ─── Icon map ────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  create_files:       Upload,
  view_files:         Eye,
  edit_files:         Pencil,
  delete_files:       Trash2,
  download_files:     Download,
  share_files:        Share2,
  manage_users:       Users,
  storage_management: HardDrive,
};

// Label Indonesia untuk tiap permission
const PERMISSION_LABELS: Record<string, { label: string; description: string }> = {
  create_files:       { label: 'Buat File',            description: 'Upload dan membuat file baru' },
  view_files:         { label: 'Lihat File',            description: 'Melihat dan mengakses file sendiri' },
  edit_files:         { label: 'Edit File',             description: 'Mengubah file yang sudah ada' },
  delete_files:       { label: 'Hapus File',            description: 'Menghapus file sendiri' },
  download_files:     { label: 'Unduh File',            description: 'Mengunduh file ke perangkat lokal' },
  share_files:        { label: 'Bagikan File',          description: 'Membuat dan mengelola tautan berbagi publik' },
  manage_users:       { label: 'Kelola Pengguna',       description: 'Membuat, mengedit, dan menghapus akun pengguna' },
  storage_management: { label: 'Kelola Penyimpanan',    description: 'Mengatur kuota dan penggunaan penyimpanan' },
};

const CATEGORY_LABELS: Record<string, string> = {
  files:   'Manajemen File',
  sharing: 'Berbagi',
  admin:   'Fungsi Admin',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  files:   Upload,
  sharing: Share2,
  admin:   Shield,
};

export function ManagePermissionsDialog({
  user,
  onClose,
  onSave,
}: {
  user: DashboardUser;
  onClose: () => void;
  onSave: (userId: number, permissions: string[]) => void;
}) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [activePreset, setActivePreset] = useState<'Admin' | 'User' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Load semua permission + permission user saat ini ───────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const [allRes, userRes] = await Promise.all([
        api.getAllPermissions(),
        api.getUserPermissions(user.id),
      ]);

      if (!allRes.success || !userRes.success) {
        setError('Gagal memuat data izin');
        setLoading(false);
        return;
      }

      setAllPermissions(allRes.data ?? []);
      setSelectedNames(new Set((userRes.data ?? []).map(p => p.name)));
      setLoading(false);
    };
    load();
  }, [user.id]);

  const applyPreset = (role: 'Admin' | 'User') => {
    const adminPerms = new Set(allPermissions.map(p => p.name));
    const userPerms  = new Set(
      allPermissions
        .filter(p => p.category !== 'admin')
        .map(p => p.name)
    );
    setSelectedNames(role === 'Admin' ? adminPerms : userPerms);
    setActivePreset(role);
  };

  const togglePermission = (name: string) => {
    setSelectedNames(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
    // Reset active preset kalau user manual toggle
    setActivePreset(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await api.setUserPermissions(user.id, Array.from(selectedNames));
    setSaving(false);
    if (res.success) {
      onSave(user.id, Array.from(selectedNames));
    } else {
      setError(res.error?.message ?? 'Gagal menyimpan izin');
    }
  };

  const categories = ['files', 'sharing', 'admin'] as const;
  const byCategory = (cat: string) => allPermissions.filter(p => p.category === cat);

  // Gunakan label Indonesia jika tersedia, fallback ke data dari API
  const getLabel = (p: Permission) => PERMISSION_LABELS[p.name]?.label ?? p.label;
  const getDesc  = (p: Permission) => PERMISSION_LABELS[p.name]?.description ?? p.description;

  const innerContent = (
    <>
      {/* User info */}
      <div className="mb-4 rounded-ui border-2 border-ink bg-sun p-3 sm:mb-5 sm:p-4">
        <div className="flex items-center gap-3">
          <span className={`grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink text-sm font-bold sm:size-10 ${user.color}`}>
            {user.initial}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display font-bold">{user.name}</h3>
            <p className="truncate text-xs font-semibold text-muted-foreground sm:text-sm">{user.email}</p>
          </div>
          <span className={`ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-ink px-2 py-0.5 text-xs font-bold ${user.role === "Admin" ? "bg-coral" : "bg-sky"}`}>
            {user.role === "Admin" && <Shield className="size-3" />}
            {user.role}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="font-semibold">Memuat izin...</span>
        </div>
      ) : error ? (
        <div className="rounded-ui border-2 border-ink bg-coral p-4 text-center font-bold">
          {error}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Presets */}
          <div className="rounded-ui border-2 border-ink bg-background p-3">
            <h4 className="mb-2.5 font-display text-sm font-bold">Preset Cepat</h4>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset('User')}
                className={`flex-1 transition-colors ${
                  activePreset === 'User'
                    ? "bg-sky border-ink shadow-brutal-sm font-bold"
                    : "hover:bg-sky/30"
                }`}
              >
                <User className="mr-1.5 size-4" /> Standar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset('Admin')}
                className={`flex-1 transition-colors ${
                  activePreset === 'Admin'
                    ? "bg-coral border-ink shadow-brutal-sm font-bold"
                    : "hover:bg-coral/30"
                }`}
              >
                <Shield className="mr-1.5 size-4" /> Admin
              </Button>
            </div>
          </div>

          {/* Permission Categories */}
          {categories.map(cat => {
            const perms = byCategory(cat);
            if (perms.length === 0) return null;
            const CatIcon = CATEGORY_ICONS[cat]!;
            const isAdmin = cat === 'admin';
            return (
              <div key={cat} className="rounded-ui border-2 border-ink bg-background p-3">
                <h4 className="mb-2.5 flex items-center gap-2 font-display text-sm font-bold">
                  <CatIcon className="size-4" />
                  {CATEGORY_LABELS[cat]}
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {perms.map(p => {
                    const isSelected = selectedNames.has(p.name);
                    const Icon = ICON_MAP[p.name] ?? Shield;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePermission(p.name)}
                        className={`flex items-start gap-2 rounded-ui border-2 border-ink p-2.5 text-left transition-colors ${
                          isSelected
                            ? isAdmin ? "bg-coral shadow-brutal-sm" : "bg-lime shadow-brutal-sm"
                            : isAdmin ? "bg-card hover:bg-coral/20" : "bg-card hover:bg-lime/20"
                        }`}
                      >
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Icon className="size-4" />
                          {isSelected
                            ? <CheckCircle className="size-4 text-lime-700" />
                            : <XCircle className="size-4 text-muted-foreground" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{getLabel(p)}</p>
                          <p className="text-xs text-muted-foreground">{getDesc(p)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Ringkasan */}
          <div className="rounded-ui border-2 border-ink bg-sun p-3">
            <h4 className="mb-1.5 font-display text-sm font-bold">Ringkasan</h4>
            <p className="text-sm font-semibold">{selectedNames.size} dari {allPermissions.length} izin dipilih</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {Array.from(selectedNames).map(name => {
                const p = allPermissions.find(x => x.name === name);
                return p ? (
                  <span key={name} className="inline-block rounded-full border border-ink bg-lime px-2 py-0.5 text-xs font-bold">
                    {getLabel(p)}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Simpan Izin"}
            </Button>
          </div>
        </form>
      )}
    </>
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
            <h2 className="font-display text-lg font-bold">Kelola Izin</h2>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>
          <div className="px-4 pb-8">
            {innerContent}
          </div>
        </div>
      </div>

      {/* ── Desktop: centered modal (sm+) ── */}
      <div
        className="fixed inset-0 z-50 hidden place-items-center bg-ink/40 p-4 sm:grid"
        onClick={onClose}
      >
        <div
          className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-ui border-2 border-ink bg-card p-6 shadow-brutal"
          onClick={e => e.stopPropagation()}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-bold">Kelola Izin</h2>
              <span className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-3 py-1 text-sm font-bold ${user.role === "Admin" ? "bg-coral" : "bg-sky"}`}>
                {user.role === "Admin" && <Shield className="size-3" />}
                {user.role}
              </span>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>
          {innerContent}
        </div>
      </div>
    </>
  );
}
