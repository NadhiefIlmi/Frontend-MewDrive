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

  const togglePermission = (name: string) => {
    setSelectedNames(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const applyPreset = (role: 'Admin' | 'User') => {
    const adminPerms = new Set(allPermissions.map(p => p.name));
    const userPerms  = new Set(
      allPermissions
        .filter(p => p.category !== 'admin')
        .map(p => p.name)
    );
    setSelectedNames(role === 'Admin' ? adminPerms : userPerms);
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

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-ui border-2 border-ink bg-card p-6 shadow-brutal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* User info */}
        <div className="mb-6 rounded-ui border-2 border-ink bg-sun p-4">
          <div className="flex items-center gap-3">
            <span className={`grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink text-sm font-bold ${user.color}`}>
              {user.initial}
            </span>
            <div>
              <h3 className="font-display font-bold">{user.name}</h3>
              <p className="text-sm font-semibold text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="font-semibold">Memuat izin...</span>
          </div>
        ) : error ? (
          <div className="rounded-ui border-2 border-ink bg-coral p-4 text-center font-bold">
            {error}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Presets */}
            <div className="rounded-ui border-2 border-ink bg-background p-4">
              <h4 className="mb-3 font-display font-bold">Preset Cepat</h4>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => applyPreset('User')} className="flex-1">
                  <User className="mr-2 size-4" /> Pengguna Standar
                </Button>
                <Button type="button" variant="outline" onClick={() => applyPreset('Admin')} className="flex-1">
                  <Shield className="mr-2 size-4" /> Administrator
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Klik preset untuk mengatur ulang izin ke default role.
              </p>
            </div>

            {/* Permission Categories */}
            {categories.map(cat => {
              const perms = byCategory(cat);
              if (perms.length === 0) return null;
              const CatIcon = CATEGORY_ICONS[cat]!;
              const isAdmin = cat === 'admin';
              return (
                <div key={cat} className="rounded-ui border-2 border-ink bg-background p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-display font-bold">
                    <CatIcon className="size-5" />
                    {CATEGORY_LABELS[cat]}
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {perms.map(p => {
                      const isSelected = selectedNames.has(p.name);
                      const Icon = ICON_MAP[p.name] ?? Shield;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePermission(p.name)}
                          className={`flex items-start gap-3 rounded-ui border-2 border-ink p-3 text-left transition-colors ${
                            isSelected
                              ? isAdmin ? "bg-coral shadow-brutal-sm" : "bg-lime shadow-brutal-sm"
                              : isAdmin ? "bg-card hover:bg-coral/20" : "bg-card hover:bg-lime/20"
                          }`}
                        >
                          <div className="flex shrink-0 items-center gap-2">
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
            <div className="rounded-ui border-2 border-ink bg-sun p-4">
              <h4 className="mb-2 font-display font-bold">Ringkasan Izin</h4>
              <p className="text-sm font-semibold">
                {selectedNames.size} dari {allPermissions.length} izin dipilih
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {Array.from(selectedNames).map(name => {
                  const p = allPermissions.find(x => x.name === name);
                  return p ? (
                    <span key={name} className="inline-block rounded-full border border-ink bg-lime px-2 py-1 text-xs font-bold">
                      {getLabel(p)}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Simpan Izin"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
