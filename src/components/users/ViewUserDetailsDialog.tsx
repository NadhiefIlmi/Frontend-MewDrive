import { useEffect, useState } from "react";
import {
  X, Shield, User as UserIcon, Mail, Calendar,
  HardDrive, CheckCircle, XCircle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type Permission } from "@/lib/api";
import { apiUserToUser, type User } from "@/types/dashboard";

// Label Indonesia untuk tiap permission
const PERMISSION_LABELS: Record<string, string> = {
  create_files:       'Buat File',
  view_files:         'Lihat File',
  edit_files:         'Edit File',
  delete_files:       'Hapus File',
  download_files:     'Unduh File',
  share_files:        'Bagikan File',
  manage_users:       'Kelola Pengguna',
  storage_management: 'Kelola Penyimpanan',
};

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024)       return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes > 0)           return `${Math.round(bytes)} B`;
  return "0 B";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "Belum pernah login";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari yang lalu`;
}

export function ViewUserDetailsDialog({
  user: initialUser,
  onClose,
  onEditUser,
  onManagePermissions,
}: {
  user: User;
  onClose: () => void;
  onEditUser?: (user: User) => void;
  onManagePermissions?: (user: User) => void;
}) {
  const [user, setUser] = useState<User>(initialUser);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    Promise.all([
      api.getUser(initialUser.id),
      api.getUserPermissions(initialUser.id),
    ]).then(([userRes, permRes]) => {
      if (userRes.success && userRes.data) {
        setUser(apiUserToUser(userRes.data));
      }
      if (permRes.success && permRes.data) {
        setPermissions(permRes.data);
      }
      setLoading(false);
    });
  }, [initialUser.id]);

  const storagePercentage = user.storageQuota > 0
    ? Math.round((user.storageUsed / user.storageQuota) * 100)
    : 0;

  const getPermLabel = (p: Permission) => PERMISSION_LABELS[p.name] ?? p.label;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-ui border-2 border-ink bg-card p-6 shadow-brutal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Detail Pengguna</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="font-semibold">Memuat data...</span>
          </div>
        ) : (
          <>
            {/* User Profile */}
            <div className="mb-6 rounded-ui border-2 border-ink bg-sun p-4">
              <div className="flex items-start gap-4">
                <span className={`grid size-16 shrink-0 place-items-center rounded-full border-2 border-ink text-xl font-bold ${user.color}`}>
                  {user.initial}
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-bold">{user.name}</h3>
                  <div className="mt-2 space-y-1 text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Mail className="size-4" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-2">
                      {user.role === "Admin" ? <Shield className="size-4" /> : <UserIcon className="size-4" />}
                      {user.role}
                    </div>
                    <div className="flex items-center gap-2">
                      {user.status === "Active"
                        ? <CheckCircle className="size-4 text-lime-600" />
                        : <XCircle className="size-4 text-muted-foreground" />}
                      {user.status === "Active" ? "Aktif" : "Nonaktif"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Informasi Akun */}
              <div className="rounded-ui border-2 border-ink bg-background p-4">
                <h4 className="mb-3 font-display text-lg font-bold">Informasi Akun</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="block font-bold text-muted-foreground">ID Pengguna</span>
                    <span className="font-semibold">#{String(user.id).padStart(6, "0")}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-muted-foreground">Tanggal Bergabung</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4" />
                      <span className="font-semibold">{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block font-bold text-muted-foreground">Login Terakhir</span>
                    <span className="font-semibold">{timeAgo(user.lastLoginAt)}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-muted-foreground">Status Akun</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-2 py-1 text-xs font-bold ${user.status === "Active" ? "bg-lime" : "bg-muted"}`}>
                      {user.status === "Active"
                        ? <CheckCircle className="size-3" />
                        : <XCircle className="size-3" />}
                      {user.status === "Active" ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Penyimpanan */}
              <div className="rounded-ui border-2 border-ink bg-background p-4">
                <h4 className="mb-3 font-display text-lg font-bold">
                  <HardDrive className="mb-1 inline size-4" /> Penggunaan Penyimpanan
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span>Terpakai</span>
                    <span>{storagePercentage}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full border-2 border-ink bg-card">
                    <div
                      className={`h-full transition-all ${storagePercentage > 80 ? "bg-coral" : "bg-lime"}`}
                      style={{ width: `${storagePercentage}%` }}
                    />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-bold text-muted-foreground">Digunakan</span>
                      <span className="font-semibold">{formatBytes(user.storageUsed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-muted-foreground">Tersedia</span>
                      <span className="font-semibold">
                        {formatBytes(Math.max(0, user.storageQuota - user.storageUsed))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-muted-foreground">Total Kuota</span>
                      <span className="font-semibold">{formatBytes(user.storageQuota)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Izin */}
              <div className="rounded-ui border-2 border-ink bg-background p-4">
                <h4 className="mb-3 font-display text-lg font-bold">
                  Izin Akses
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({permissions.length} aktif)
                  </span>
                </h4>
                {permissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada izin aktif</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {permissions.map((p) => (
                      <span
                        key={p.id}
                        className={`inline-flex items-center gap-1 rounded-full border border-ink px-2 py-0.5 text-xs font-bold ${
                          p.category === "admin"   ? "bg-coral/70" :
                          p.category === "sharing" ? "bg-sky/70"   :
                          "bg-lime/70"
                        }`}
                      >
                        <CheckCircle className="size-3" />
                        {getPermLabel(p)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Ringkasan Aktivitas */}
              <div className="rounded-ui border-2 border-ink bg-background p-4">
                <h4 className="mb-3 font-display text-lg font-bold">Ringkasan Aktivitas</h4>
                <p className="text-sm text-muted-foreground">
                  Log aktivitas akan tersedia setelah Task 14 (Log Aktivitas) selesai diimplementasi.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Tutup
              </Button>
              {onEditUser && (
                <Button variant="outline" className="flex-1" onClick={() => onEditUser(user)}>
                  Edit Pengguna
                </Button>
              )}
              {onManagePermissions && (
                <Button variant="outline" className="flex-1" onClick={() => onManagePermissions(user)}>
                  Kelola Izin
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
