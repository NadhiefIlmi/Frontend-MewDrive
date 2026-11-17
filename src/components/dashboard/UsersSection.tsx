/**
 * UsersSection Component
 * Modern Neo-Brutalist User Management
 * Fully responsive: structured table on desktop (md+), tactile cards & bottom sheet on mobile (<md)
 */

import { useState, useMemo } from "react";
import {
  Plus,
  MoreHorizontal,
  Shield,
  Eye,
  Edit3,
  Lock,
  Power,
  Trash2,
  HardDrive,
  Loader2,
  X,
  Search,
  Users,
  UserCheck,
  User as UserIcon,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/dashboard";

// ─── Format storage bytes adaptif (B / KB / MB / GB) ────────────────────────
function formatStorage(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024)       return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes > 0)           return `${Math.round(bytes)} B`;
  return "0 B";
}

// ─── Mobile Bottom Sheet Menu ─────────────────────────────────────────────────
function MobileUserMenu({
  user,
  onClose,
  onView,
  onEdit,
  onPermissions,
  onStorage,
  onPasswordReset,
  onToggle,
  onDelete,
}: {
  user: User;
  onClose: () => void;
  onView: () => void;
  onEdit: () => void;
  onPermissions: () => void;
  onStorage: () => void;
  onPasswordReset: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const pct = user.storageQuota > 0
    ? Math.round((user.storageUsed / user.storageQuota) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/50 backdrop-blur-xs" onClick={onClose}>
      <div
        className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-t-2 border-x-2 border-ink bg-card p-5 shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20" />

        {/* User preview header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink font-display text-sm font-bold shadow-brutal-xs ${user.color}`}>
              {user.initial}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-display text-base font-bold text-foreground">{user.name}</p>
              </div>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-2 py-0.5 text-[11px] font-bold ${user.role === "Admin" ? "bg-lilac" : "bg-sky"}`}>
                  {user.role === "Admin" && <Shield className="size-3" />}
                  {user.role}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-2 py-0.5 text-[11px] font-bold ${user.status === "Active" ? "bg-lime" : "bg-muted text-muted-foreground"}`}>
                  <span className={`size-1.5 rounded-full ${user.status === "Active" ? "bg-emerald-700" : "bg-ink/40"}`} />
                  {user.status === "Active" ? "Aktif" : "Nonaktif"}
                </span>
                <span className="rounded-full border border-ink/40 bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Storage {pct}%
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" className="rounded-full hover:bg-muted" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>

        <div className="my-3.5 border-t-2 border-ink/15" />

        {/* Touch-Friendly Action List */}
        <div className="space-y-1">
          <button
            onClick={onView}
            className="flex w-full items-center gap-3.5 rounded-xl border-2 border-transparent px-3.5 py-3 text-left text-sm font-bold transition-all hover:border-ink hover:bg-sun active:scale-[0.98]"
          >
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-sky/50">
              <Eye className="size-4 shrink-0" />
            </div>
            <div>
              <p className="leading-tight">Lihat Detail Pengguna</p>
              <p className="text-xs font-medium text-muted-foreground">Informasi akun, histori & statistik</p>
            </div>
          </button>

          <button
            onClick={onEdit}
            className="flex w-full items-center gap-3.5 rounded-xl border-2 border-transparent px-3.5 py-3 text-left text-sm font-bold transition-all hover:border-ink hover:bg-sun active:scale-[0.98]"
          >
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-sun/60">
              <Edit3 className="size-4 shrink-0" />
            </div>
            <div>
              <p className="leading-tight">Edit Profil</p>
              <p className="text-xs font-medium text-muted-foreground">Ubah nama, email, dan detail akun</p>
            </div>
          </button>

          <button
            onClick={onPermissions}
            className="flex w-full items-center gap-3.5 rounded-xl border-2 border-transparent px-3.5 py-3 text-left text-sm font-bold transition-all hover:border-ink hover:bg-sun active:scale-[0.98]"
          >
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-lilac/60">
              <Shield className="size-4 shrink-0" />
            </div>
            <div>
              <p className="leading-tight">Kelola Hak Akses</p>
              <p className="text-xs font-medium text-muted-foreground">Atur role dan hak akses fitur</p>
            </div>
          </button>

          <button
            onClick={onStorage}
            className="flex w-full items-center gap-3.5 rounded-xl border-2 border-transparent px-3.5 py-3 text-left text-sm font-bold transition-all hover:border-ink hover:bg-sun active:scale-[0.98]"
          >
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-lime/60">
              <HardDrive className="size-4 shrink-0" />
            </div>
            <div>
              <p className="leading-tight">Atur Kuota Storage</p>
              <p className="text-xs font-medium text-muted-foreground">Sesuaikan batas kapasitas penyimpanan</p>
            </div>
          </button>

          <button
            onClick={onPasswordReset}
            className="flex w-full items-center gap-3.5 rounded-xl border-2 border-transparent px-3.5 py-3 text-left text-sm font-bold transition-all hover:border-ink hover:bg-sun active:scale-[0.98]"
          >
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-background">
              <Lock className="size-4 shrink-0" />
            </div>
            <div>
              <p className="leading-tight">Reset Password</p>
              <p className="text-xs font-medium text-muted-foreground">Buat password baru untuk user</p>
            </div>
          </button>

          <button
            onClick={onToggle}
            className="flex w-full items-center gap-3.5 rounded-xl border-2 border-transparent px-3.5 py-3 text-left text-sm font-bold transition-all hover:border-ink hover:bg-sun active:scale-[0.98]"
          >
            <div className={`grid size-8 place-items-center rounded-lg border-2 border-ink ${user.status === "Active" ? "bg-coral/30" : "bg-lime/60"}`}>
              <Power className="size-4 shrink-0" />
            </div>
            <div>
              <p className="leading-tight">{user.status === "Active" ? "Nonaktifkan Akun" : "Aktifkan Akun"}</p>
              <p className="text-xs font-medium text-muted-foreground">
                {user.status === "Active" ? "Cegah user melakukan login sementara" : "Pulihkan akses login user"}
              </p>
            </div>
          </button>

          <div className="my-2 border-t-2 border-ink/15" />

          <button
            onClick={onDelete}
            className="flex w-full items-center gap-3.5 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-3.5 py-3 text-left text-sm font-bold text-red-600 transition-all hover:border-red-600 hover:bg-red-500/20 active:scale-[0.98]"
          >
            <div className="grid size-8 place-items-center rounded-lg border-2 border-red-600 bg-red-100 text-red-600">
              <Trash2 className="size-4 shrink-0" />
            </div>
            <div>
              <p className="leading-tight">Hapus User</p>
              <p className="text-xs font-medium text-red-500/80">Hapus permanen akun dan seluruh datanya</p>
            </div>
          </button>
        </div>

        {/* Safe area spacer for iOS */}
        <div className="mt-4 h-safe-bottom" />
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface UsersSectionProps {
  users: User[];
  isLoading?: boolean;
  openUserMenuId: number | null;
  onUserMenuToggle: (id: number | null) => void;
  onUserAdd: () => void;
  onUserEdit: (user: User) => void;
  onUserView: (user: User) => void;
  onUserPermissions: (user: User) => void;
  onUserStorage: (user: User) => void;
  onUserToggle: (id: number) => void;
  onUserDelete: (id: number) => void;
  onPasswordReset: (id: number) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function UsersSection({
  users,
  isLoading = false,
  openUserMenuId,
  onUserMenuToggle,
  onUserAdd,
  onUserEdit,
  onUserView,
  onUserPermissions,
  onUserStorage,
  onUserToggle,
  onUserDelete,
  onPasswordReset,
}: UsersSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "USER">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DISABLED">("ALL");
  const [menuOpenUp, setMenuOpenUp] = useState<Record<number, boolean>>({});

  // Statistical calculations
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const adminCount = users.filter((u) => u.role === "Admin").length;
    const userCount = users.filter((u) => u.role === "User").length;
    const activeCount = users.filter((u) => u.status === "Active").length;
    const disabledCount = totalUsers - activeCount;
    const totalUsed = users.reduce((acc, u) => acc + (u.storageUsed || 0), 0);
    const totalQuota = users.reduce((acc, u) => acc + (u.storageQuota || 0), 0);
    return {
      totalUsers,
      adminCount,
      userCount,
      activeCount,
      disabledCount,
      totalUsed,
      totalQuota,
    };
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Role filter
      if (roleFilter === "ADMIN" && user.role !== "Admin") return false;
      if (roleFilter === "USER" && user.role !== "User") return false;

      // Status filter
      if (statusFilter === "ACTIVE" && user.status !== "Active") return false;
      if (statusFilter === "DISABLED" && user.status !== "Disabled") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = user.name.toLowerCase().includes(q);
        const matchesEmail = user.email.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail) return false;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  const activeMenuUser = openUserMenuId !== null
    ? users.find((u) => u.id === openUserMenuId) ?? null
    : null;

  const handleDesktopMenuToggle = (
    e: React.MouseEvent<HTMLButtonElement>,
    userId: number,
    idx: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const isLastThree = idx >= filteredUsers.length - 3;
    const shouldOpenUp = isLastThree || spaceBelow < 340;

    setMenuOpenUp((prev) => ({ ...prev, [userId]: shouldOpenUp }));
    onUserMenuToggle(openUserMenuId === userId ? null : userId);
  };

  return (
    <div className="mt-6 space-y-6 sm:mt-8 sm:space-y-8">
      {/* ── 1. Quick Stats Overview (Cockpit Summary) ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {/* Total Users */}
        <div className="rounded-2xl border-2 border-ink bg-card p-3.5 shadow-brutal-sm sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total User</span>
            <div className="grid size-8 place-items-center rounded-xl border-2 border-ink bg-sun shadow-brutal-xs">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-display text-2xl font-bold sm:text-3xl">{stats.totalUsers}</p>
            <span className="text-xs font-semibold text-muted-foreground">akun</span>
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {stats.activeCount} aktif • {stats.disabledCount} nonaktif
          </p>
        </div>

        {/* Administrators */}
        <div className="rounded-2xl border-2 border-ink bg-card p-3.5 shadow-brutal-sm sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin</span>
            <div className="grid size-8 place-items-center rounded-xl border-2 border-ink bg-lilac shadow-brutal-xs">
              <Shield className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-display text-2xl font-bold sm:text-3xl">{stats.adminCount}</p>
            <span className="text-xs font-semibold text-muted-foreground">user</span>
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Akses kelola sistem & user
          </p>
        </div>

        {/* Regular Members */}
        <div className="rounded-2xl border-2 border-ink bg-card p-3.5 shadow-brutal-sm sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Member</span>
            <div className="grid size-8 place-items-center rounded-xl border-2 border-ink bg-sky shadow-brutal-xs">
              <UserCheck className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-display text-2xl font-bold sm:text-3xl">{stats.userCount}</p>
            <span className="text-xs font-semibold text-muted-foreground">user</span>
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Akses file drive & task pribadi
          </p>
        </div>

        {/* Total Storage Allocated */}
        <div className="rounded-2xl border-2 border-ink bg-card p-3.5 shadow-brutal-sm sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Storage</span>
            <div className="grid size-8 place-items-center rounded-xl border-2 border-ink bg-lime shadow-brutal-xs">
              <HardDrive className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-display text-2xl font-bold sm:text-3xl">{formatStorage(stats.totalUsed)}</p>
          </div>
          <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
            dari alokasi {formatStorage(stats.totalQuota)}
          </p>
        </div>
      </div>

      {/* ── 2. Interactive Toolbar (Search, Filter, & Add User) ── */}
      <div className="rounded-2xl border-2 border-ink bg-card p-3.5 sm:p-4 shadow-brutal-sm">
        {/* Mobile Toolbar (< sm): Search + Tambah on Row 1, Dropdowns on Row 2 */}
        <div className="space-y-2.5 sm:hidden">
          {/* Row 1: Search input + Add User button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari user (nama atau email)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-2 border-ink bg-background py-2 pl-9 pr-8 text-xs font-semibold outline-none transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-ink"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <Button
              size="sm"
              onClick={onUserAdd}
              className="h-9 shrink-0 border-2 border-ink bg-sun text-ink shadow-brutal hover:bg-sun/90 active:translate-x-0.5 active:translate-y-0.5 font-bold px-3 text-xs"
            >
              <Plus className="size-3.5" />
              <span>Tambah</span>
            </Button>
          </div>

          {/* Row 2: Filter Dropdowns (Role & Status) */}
          <div className="grid grid-cols-2 gap-2">
            {/* Role Dropdown */}
            <div className={`relative flex items-center rounded-xl border-2 border-ink shadow-brutal-xs transition-colors ${
              roleFilter === "ADMIN" ? "bg-lilac/30" : roleFilter === "USER" ? "bg-sky/30" : "bg-background"
            }`}>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "ALL" | "ADMIN" | "USER")}
                className="h-9 w-full appearance-none bg-transparent pl-3 pr-7 text-xs font-bold text-ink outline-none cursor-pointer"
                aria-label="Filter Role"
              >
                <option value="ALL">Semua Role</option>
                <option value="ADMIN">Role: Admin</option>
                <option value="USER">Role: User</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Status Dropdown */}
            <div className={`relative flex items-center rounded-xl border-2 border-ink shadow-brutal-xs transition-colors ${
              statusFilter === "ACTIVE" ? "bg-lime/30" : statusFilter === "DISABLED" ? "bg-muted" : "bg-background"
            }`}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "DISABLED")}
                className="h-9 w-full appearance-none bg-transparent pl-3 pr-7 text-xs font-bold text-ink outline-none cursor-pointer"
                aria-label="Filter Status"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Status: Aktif</option>
                <option value="DISABLED">Status: Nonaktif</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Desktop Toolbar (sm+) — original segmented controls layout */}
        <div className="hidden sm:flex sm:flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari user (nama atau email)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-2 border-ink bg-background py-2.5 pl-10 pr-9 text-sm font-semibold outline-none transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-ink"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Filter Pills + Add User Button */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter Tabs */}
            <div className="inline-flex rounded-xl border-2 border-ink bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => setRoleFilter("ALL")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  roleFilter === "ALL"
                    ? "border-2 border-ink bg-sun text-ink shadow-brutal-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua Role
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("ADMIN")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  roleFilter === "ADMIN"
                    ? "border-2 border-ink bg-lilac text-ink shadow-brutal-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("USER")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  roleFilter === "USER"
                    ? "border-2 border-ink bg-sky text-ink shadow-brutal-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                User
              </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="inline-flex rounded-xl border-2 border-ink bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  statusFilter === "ALL"
                    ? "border-2 border-ink bg-card text-ink shadow-brutal-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua Status
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ACTIVE")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  statusFilter === "ACTIVE"
                    ? "border-2 border-ink bg-lime text-ink shadow-brutal-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("DISABLED")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  statusFilter === "DISABLED"
                    ? "border-2 border-ink bg-muted text-foreground shadow-brutal-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Nonaktif
              </button>
            </div>

            {/* Add User Button */}
            <Button
              size="sm"
              onClick={onUserAdd}
              className="ml-auto border-2 border-ink bg-sun text-ink shadow-brutal hover:bg-sun/90 active:translate-x-0.5 active:translate-y-0.5"
            >
              <Plus className="size-4" />
              <span className="font-bold">Tambah User</span>
            </Button>
          </div>
        </div>

        {/* Counter note if filtering is active */}
        {(searchQuery || roleFilter !== "ALL" || statusFilter !== "ALL") && (
          <div className="mt-3 flex items-center justify-between border-t-2 border-ink/10 pt-2.5 text-xs font-semibold text-muted-foreground">
            <span>
              Menampilkan <span className="font-bold text-foreground">{filteredUsers.length}</span> dari {users.length} user
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="font-bold text-primary hover:underline"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Main Content Area ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-ink bg-card p-12 text-center shadow-brutal">
          <div className="grid size-12 place-items-center rounded-2xl border-2 border-ink bg-sun shadow-brutal-sm">
            <Loader2 className="size-6 animate-spin" />
          </div>
          <p className="font-display text-lg font-bold">Memuat Data Pengguna...</p>
          <p className="text-xs text-muted-foreground">Mohon tunggu sebentar selagi data disinkronkan.</p>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border-2 border-ink bg-card p-10 text-center shadow-brutal sm:p-14">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl border-2 border-ink bg-sun shadow-brutal">
            <Users className="size-8" />
          </div>
          <p className="font-display text-xl font-bold sm:text-2xl">Belum Ada Pengguna</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Tambahkan user baru ke dalam sistem untuk mengatur role, hak akses, dan kapasitas penyimpanan.
          </p>
          <Button size="default" onClick={onUserAdd} className="mt-5 border-2 border-ink bg-sun text-ink shadow-brutal">
            <Plus className="size-4" />
            <span className="font-bold">Tambah User Pertama</span>
          </Button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl border-2 border-ink bg-card p-10 text-center shadow-brutal sm:p-12">
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl border-2 border-ink bg-muted shadow-brutal-sm">
            <Search className="size-6 text-muted-foreground" />
          </div>
          <p className="font-display text-lg font-bold">Pengguna Tidak Ditemukan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tidak ada user yang cocok dengan pencarian atau filter yang dipilih.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("ALL");
              setStatusFilter("ALL");
            }}
            className="mt-4 border-2 border-ink font-bold shadow-brutal-xs"
          >
            Reset Semua Filter
          </Button>
        </div>
      ) : (
        <>
          {/* ─────────────────────────────────────────────────────────────
              DESKTOP VIEW (md+): Neo-Brutalist Structured Table
             ───────────────────────────────────────────────────────────── */}
          <div className="hidden rounded-2xl border-2 border-ink bg-card shadow-brutal md:block">
            {/* Table Header Bar */}
            <div className="grid grid-cols-[1.5fr_130px_230px_130px_70px] items-center gap-4 border-b-2 border-ink bg-sun px-6 py-4 text-xs font-bold uppercase tracking-wider text-ink select-none rounded-t-[14px] overflow-hidden">
              <div className="flex items-center gap-2">
                <UserIcon className="size-4" />
                <span>Nama Pengguna</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="size-4" />
                <span>Role</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="size-4" />
                <span>Kapasitas Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                <span>Status</span>
              </div>
              <div className="text-right">Aksi</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y-2 divide-ink/15">
              {filteredUsers.map((user, idx) => {
                const pct = user.storageQuota > 0
                  ? Math.round((user.storageUsed / user.storageQuota) * 100)
                  : 0;

                const isMenuOpen = openUserMenuId === user.id;
                const isLastRow = idx === filteredUsers.length - 1;
                const isLastThree = idx >= filteredUsers.length - 3;
                const openUp = menuOpenUp[user.id] ?? isLastThree;

                return (
                  <div
                    key={user.id}
                    className={`grid grid-cols-[1.5fr_130px_230px_130px_70px] items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/30 ${
                      isLastRow ? "rounded-b-[14px]" : ""
                    }`}
                  >
                    {/* User Identity */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className={`grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink font-display text-sm font-bold shadow-brutal-xs ${user.color}`}>
                        {user.initial}
                      </span>
                      <div className="min-w-0">
                        <button
                          onClick={() => onUserView(user)}
                          className="truncate text-left font-display text-sm font-bold text-foreground transition-colors hover:text-primary hover:underline block leading-tight"
                          title="Klik untuk melihat detail user"
                        >
                          {user.name}
                        </button>
                        <p className="truncate text-xs font-medium text-muted-foreground mt-0.5" title={user.email}>
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div>
                      {user.role === "Admin" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-lilac px-3 py-1 text-xs font-bold text-ink shadow-brutal-xs">
                          <Shield className="size-3.5" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-sky px-3 py-1 text-xs font-bold text-ink shadow-brutal-xs">
                          <UserIcon className="size-3.5" />
                          User
                        </span>
                      )}
                    </div>

                    {/* Storage Meter */}
                    <div className="pr-2">
                      <div className="flex items-baseline justify-between text-xs font-bold">
                        <span>
                          {formatStorage(user.storageUsed)}
                          <span className="ml-1 font-normal text-muted-foreground">
                            / {formatStorage(user.storageQuota)}
                          </span>
                        </span>
                        <span
                          className={`rounded-full border border-ink px-1.5 py-0.2 text-[10px] font-bold ${
                            pct > 85 ? "bg-coral text-ink" : pct > 60 ? "bg-sun text-ink" : "bg-lime text-ink"
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="relative mt-1.5 h-2.5 w-full overflow-hidden rounded-full border-2 border-ink bg-background">
                        <div
                          className={`h-full transition-all duration-300 ${
                            pct > 85 ? "bg-coral" : pct > 60 ? "bg-sun" : "bg-lime"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(pct, 0))}%` }}
                        />
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {user.status === "Active" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-lime px-3 py-1 text-xs font-bold text-ink shadow-brutal-xs">
                          <span className="size-2 rounded-full bg-emerald-700 animate-pulse" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-muted px-3 py-1 text-xs font-bold text-muted-foreground shadow-brutal-xs">
                          <span className="size-2 rounded-full bg-ink/40" />
                          Nonaktif
                        </span>
                      )}
                    </div>

                    {/* Action Dropdown Menu */}
                    <div className="relative text-right">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="ml-auto border-2 border-ink shadow-brutal-xs hover:bg-sun hover:shadow-brutal transition-all"
                        onClick={(e) => handleDesktopMenuToggle(e, user.id, idx)}
                        title="Opsi pengguna"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>

                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => onUserMenuToggle(null)}
                          />
                          <div
                            className={`absolute right-0 z-30 w-60 rounded-2xl border-2 border-ink bg-card p-2 text-left shadow-brutal animate-in fade-in-50 zoom-in-95 duration-100 ${
                              openUp
                                ? "bottom-full mb-2 origin-bottom-right"
                                : "top-full mt-2 origin-top-right"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* User Header in Dropdown */}
                            <div className="flex items-center gap-2.5 px-2 py-2 border-b-2 border-ink/15 mb-1 bg-muted/40 rounded-xl">
                              <span className={`grid size-7 shrink-0 place-items-center rounded-full border border-ink text-xs font-bold ${user.color}`}>
                                {user.initial}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold leading-tight">{user.name}</p>
                                <p className="truncate text-[11px] text-muted-foreground leading-tight">{user.role}</p>
                              </div>
                            </div>

                            {/* Dropdown Options */}
                            <div className="space-y-0.5">
                              <button
                                onClick={() => {
                                  onUserView(user);
                                  onUserMenuToggle(null);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-sun"
                              >
                                <Eye className="size-4 shrink-0 text-muted-foreground" />
                                <span>Lihat Detail</span>
                              </button>

                              <button
                                onClick={() => {
                                  onUserEdit(user);
                                  onUserMenuToggle(null);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-sun"
                              >
                                <Edit3 className="size-4 shrink-0 text-muted-foreground" />
                                <span>Edit User</span>
                              </button>

                              <button
                                onClick={() => {
                                  onUserPermissions(user);
                                  onUserMenuToggle(null);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-sun"
                              >
                                <Shield className="size-4 shrink-0 text-muted-foreground" />
                                <span>Manage Permissions</span>
                              </button>

                              <button
                                onClick={() => {
                                  onUserStorage(user);
                                  onUserMenuToggle(null);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-sun"
                              >
                                <HardDrive className="size-4 shrink-0 text-muted-foreground" />
                                <span>Storage Quota</span>
                              </button>

                              <button
                                onClick={() => {
                                  onPasswordReset(user.id);
                                  onUserMenuToggle(null);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-sun"
                              >
                                <Lock className="size-4 shrink-0 text-muted-foreground" />
                                <span>Reset Password</span>
                              </button>

                              <button
                                onClick={() => {
                                  onUserToggle(user.id);
                                  onUserMenuToggle(null);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-sun"
                              >
                                <Power className="size-4 shrink-0 text-muted-foreground" />
                                <span>{user.status === "Active" ? "Nonaktifkan Akun" : "Aktifkan Akun"}</span>
                              </button>

                              <div className="my-1 border-t-2 border-ink/15" />

                              <button
                                onClick={() => {
                                  onUserDelete(user.id);
                                  onUserMenuToggle(null);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="size-4 shrink-0" />
                                <span>Hapus User</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              MOBILE VIEW (< md): Modern Neo-Brutalist Tactile Cards
             ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredUsers.map((user) => {
              const pct = user.storageQuota > 0
                ? Math.round((user.storageUsed / user.storageQuota) * 100)
                : 0;

              return (
                <div
                  key={user.id}
                  className="rounded-2xl border-2 border-ink bg-card p-4 shadow-brutal transition-all"
                >
                  {/* Top Header: Avatar + User Info + Trigger */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`grid size-12 shrink-0 place-items-center rounded-full border-2 border-ink font-display text-base font-bold shadow-brutal-xs ${user.color}`}>
                        {user.initial}
                      </span>
                      <div className="min-w-0">
                        <button
                          onClick={() => onUserView(user)}
                          className="truncate text-left font-display text-base font-bold text-foreground hover:text-primary transition-colors block leading-tight"
                        >
                          {user.name}
                        </button>
                        <p className="truncate text-xs font-medium text-muted-foreground mt-0.5">
                          {user.email}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {user.role === "Admin" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-lilac px-2.5 py-0.5 text-[11px] font-bold text-ink">
                              <Shield className="size-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-sky px-2.5 py-0.5 text-[11px] font-bold text-ink">
                              <UserIcon className="size-3" />
                              User
                            </span>
                          )}

                          {user.status === "Active" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-lime px-2.5 py-0.5 text-[11px] font-bold text-ink">
                              <span className="size-1.5 rounded-full bg-emerald-700" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-muted px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                              <span className="size-1.5 rounded-full bg-ink/40" />
                              Nonaktif
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Trigger Bottom Sheet */}
                    <button
                      onClick={() => onUserMenuToggle(openUserMenuId === user.id ? null : user.id)}
                      className="grid size-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-background shadow-brutal-xs hover:bg-sun active:translate-x-0.5 active:translate-y-0.5"
                      title="Menu opsi user"
                    >
                      <MoreHorizontal className="size-5" />
                    </button>
                  </div>

                  {/* Storage Bar Inset */}
                  <div className="mt-3.5 rounded-xl border-2 border-ink/20 bg-muted/40 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-ink">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <HardDrive className="size-3.5 text-ink" />
                        <span>Storage</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>{formatStorage(user.storageUsed)}</span>
                        <span className="font-normal text-muted-foreground">/ {formatStorage(user.storageQuota)}</span>
                        <span
                          className={`rounded-full border border-ink px-1.5 py-0.2 text-[10px] font-bold ${
                            pct > 85 ? "bg-coral text-ink" : pct > 60 ? "bg-sun text-ink" : "bg-lime text-ink"
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full border-2 border-ink bg-background">
                      <div
                        className={`h-full transition-all duration-300 ${
                          pct > 85 ? "bg-coral" : pct > 60 ? "bg-sun" : "bg-lime"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(pct, 0))}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Card Action Buttons */}
                  <div className="mt-3.5 flex items-center gap-2 border-t-2 border-ink/10 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUserView(user)}
                      className="flex-1 border-2 border-ink text-xs font-bold shadow-brutal-xs hover:bg-sun active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <Eye className="size-3.5" />
                      <span>Detail</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUserEdit(user)}
                      className="flex-1 border-2 border-ink text-xs font-bold shadow-brutal-xs hover:bg-sun active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <Edit3 className="size-3.5" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onUserMenuToggle(openUserMenuId === user.id ? null : user.id)}
                      className="border-2 border-ink px-3 text-xs font-bold shadow-brutal-xs hover:bg-sun active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <span>Lainnya</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              MOBILE BOTTOM SHEET: Modal Menu (< md)
             ───────────────────────────────────────────────────────────── */}
          {activeMenuUser && (
            <div className="md:hidden">
              <MobileUserMenu
                user={activeMenuUser}
                onClose={() => onUserMenuToggle(null)}
                onView={() => {
                  onUserView(activeMenuUser);
                  onUserMenuToggle(null);
                }}
                onEdit={() => {
                  onUserEdit(activeMenuUser);
                  onUserMenuToggle(null);
                }}
                onPermissions={() => {
                  onUserPermissions(activeMenuUser);
                  onUserMenuToggle(null);
                }}
                onStorage={() => {
                  onUserStorage(activeMenuUser);
                  onUserMenuToggle(null);
                }}
                onPasswordReset={() => {
                  onPasswordReset(activeMenuUser.id);
                  onUserMenuToggle(null);
                }}
                onToggle={() => {
                  onUserToggle(activeMenuUser.id);
                  onUserMenuToggle(null);
                }}
                onDelete={() => {
                  onUserDelete(activeMenuUser.id);
                  onUserMenuToggle(null);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
