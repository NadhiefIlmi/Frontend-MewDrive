/**
 * UsersSection Component
 * User management table — responsive: card di mobile, table di desktop
 * Mobile card menu pakai bottom sheet bukan dropdown
 */

import { Plus, MoreHorizontal, Shield, Eye, Edit3, Lock, Power, Trash2, HardDrive, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserActionMenuItem } from "./MenuItem";
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
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div
        className="rounded-t-2xl border-t-2 border-ink bg-card p-4 shadow-brutal"
        onClick={e => e.stopPropagation()}
      >
        {/* User info + close */}
        <div className="mb-1 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink text-xs font-bold ${user.color}`}>
              {user.initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="my-3 border-t-2 border-ink/20" />

        {/* Menu items — large touch targets */}
        <div className="space-y-0.5">
          <button onClick={onView}          className="flex w-full items-center gap-3 rounded-ui px-3 py-3 text-left text-sm font-semibold hover:bg-muted active:bg-muted">
            <Eye       className="size-5 shrink-0" /> Lihat Detail
          </button>
          <button onClick={onEdit}          className="flex w-full items-center gap-3 rounded-ui px-3 py-3 text-left text-sm font-semibold hover:bg-muted active:bg-muted">
            <Edit3     className="size-5 shrink-0" /> Edit User
          </button>
          <button onClick={onPermissions}   className="flex w-full items-center gap-3 rounded-ui px-3 py-3 text-left text-sm font-semibold hover:bg-muted active:bg-muted">
            <Shield    className="size-5 shrink-0" /> Manage Permissions
          </button>
          <button onClick={onStorage}       className="flex w-full items-center gap-3 rounded-ui px-3 py-3 text-left text-sm font-semibold hover:bg-muted active:bg-muted">
            <HardDrive className="size-5 shrink-0" /> Storage Quota
          </button>
          <button onClick={onPasswordReset} className="flex w-full items-center gap-3 rounded-ui px-3 py-3 text-left text-sm font-semibold hover:bg-muted active:bg-muted">
            <Lock      className="size-5 shrink-0" /> Reset Password
          </button>
          <button onClick={onToggle}        className="flex w-full items-center gap-3 rounded-ui px-3 py-3 text-left text-sm font-semibold hover:bg-muted active:bg-muted">
            <Power     className="size-5 shrink-0" />
            {user.status === "Active" ? "Disable" : "Enable"}
          </button>
          <div className="my-2 border-t-2 border-ink/20" />
          <button onClick={onDelete}        className="flex w-full items-center gap-3 rounded-ui px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 active:bg-red-50">
            <Trash2    className="size-5 shrink-0" /> Delete User
          </button>
        </div>

        {/* Safe area spacer (iOS home bar) */}
        <div className="mt-2 h-safe-bottom" />
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
  const activeMenuUser = openUserMenuId !== null
    ? users.find(u => u.id === openUserMenuId) ?? null
    : null;

  return (
    <div className="mt-6 sm:mt-10">
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
        <h2 className="font-display text-xl font-bold sm:text-2xl">Kelola User</h2>
        <Button size="sm" onClick={onUserAdd}>
          <Plus className="size-4 sm:size-5" />
          <span className="hidden xs:inline">Add User</span>
          <span className="xs:hidden">Tambah</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-ui border-2 border-ink bg-card p-10 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="font-semibold">Memuat data user...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-ui border-2 border-ink bg-card p-8 text-center sm:p-10">
          <p className="font-display text-lg font-bold sm:text-xl">Belum ada user</p>
          <p className="mt-1 text-sm text-muted-foreground">Tambahkan user pertama</p>
        </div>
      ) : (
        <>
          {/* ── Desktop table (md+) ── */}
          <div className="relative hidden overflow-visible rounded-ui border-2 border-ink bg-card shadow-brutal md:block">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_120px_200px_120px_80px] items-center gap-4 border-b-2 border-ink bg-sun p-4 text-sm font-bold uppercase">
              <div>Name</div>
              <div>Role</div>
              <div>Storage</div>
              <div>Status</div>
              <div></div>
            </div>

            {/* Table Body */}
            {users.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-[1fr_120px_200px_120px_80px] items-center gap-4 border-b-2 border-ink p-4 last:border-b-0"
              >
                {/* Name & Email */}
                <div className="flex items-center gap-3">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink text-sm font-bold ${user.color}`}>
                    {user.initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <span className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-3 py-1 text-xs font-bold ${user.role === "Admin" ? "bg-lilac" : "bg-sky"}`}>
                    {user.role === "Admin" && <Shield className="size-3" />}
                    {user.role}
                  </span>
                </div>

                {/* Storage */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold">
                    <span>{formatStorage(user.storageUsed)} / {formatStorage(user.storageQuota)}</span>
                    <span className="text-muted-foreground">
                      {user.storageQuota > 0 ? `${Math.round((user.storageUsed / user.storageQuota) * 100)}%` : "0%"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full border-2 border-ink bg-background">
                    <div
                      className={`h-full ${user.storageQuota > 0 && user.storageUsed / user.storageQuota > 0.8 ? "bg-coral" : "bg-lime"}`}
                      style={{ width: user.storageQuota > 0 ? `${(user.storageUsed / user.storageQuota) * 100}%` : "0%" }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <span className={`inline-block rounded-full border-2 border-ink px-3 py-1 text-xs font-bold ${user.status === "Active" ? "bg-lime" : "bg-muted"}`}>
                    {user.status}
                  </span>
                </div>

                {/* Actions — desktop dropdown */}
                <div className="relative">
                  <Button variant="ghost" size="icon-sm" onClick={() => onUserMenuToggle(openUserMenuId === user.id ? null : user.id)}>
                    <MoreHorizontal className="size-5" />
                  </Button>
                  {openUserMenuId === user.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => onUserMenuToggle(null)} />
                      <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-ui border-2 border-ink bg-card p-2 shadow-brutal">
                        <UserActionMenuItem Icon={Eye}       label="Lihat Detail"       onClick={() => onUserView(user)} />
                        <UserActionMenuItem Icon={Edit3}     label="Edit User"           onClick={() => onUserEdit(user)} />
                        <UserActionMenuItem Icon={Shield}    label="Manage Permissions"  onClick={() => onUserPermissions(user)} />
                        <UserActionMenuItem Icon={HardDrive} label="Storage Quota"       onClick={() => onUserStorage(user)} />
                        <UserActionMenuItem Icon={Lock}      label="Reset Password"      onClick={() => onPasswordReset(user.id)} />
                        <UserActionMenuItem Icon={Power}     label={user.status === "Active" ? "Disable" : "Enable"} onClick={() => onUserToggle(user.id)} />
                        <div className="my-1 border-t-2 border-ink" />
                        <UserActionMenuItem Icon={Trash2}    label="Delete User"         onClick={() => onUserDelete(user.id)} danger />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Mobile cards (< md) ── */}
          <div className="flex flex-col gap-3 md:hidden">
            {users.map((user) => {
              const pct = user.storageQuota > 0
                ? Math.round((user.storageUsed / user.storageQuota) * 100)
                : 0;

              return (
                <div
                  key={user.id}
                  className="rounded-ui border-2 border-ink bg-card p-4 shadow-brutal-sm"
                >
                  {/* Top row: avatar + info + menu trigger */}
                  <div className="flex items-start gap-3">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink text-sm font-bold ${user.color}`}>
                      {user.initial}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-2 py-0.5 text-xs font-bold ${user.role === "Admin" ? "bg-lilac" : "bg-sky"}`}>
                          {user.role === "Admin" && <Shield className="size-3" />}
                          {user.role}
                        </span>
                        <span className={`inline-block rounded-full border-2 border-ink px-2 py-0.5 text-xs font-bold ${user.status === "Active" ? "bg-lime" : "bg-muted"}`}>
                          {user.status}
                        </span>
                      </div>
                    </div>

                    {/* Trigger bottom sheet */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0"
                      onClick={() => onUserMenuToggle(openUserMenuId === user.id ? null : user.id)}
                    >
                      <MoreHorizontal className="size-5" />
                    </Button>
                  </div>

                  {/* Storage bar */}
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs font-bold">
                      <span>{formatStorage(user.storageUsed)} / {formatStorage(user.storageQuota)}</span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full border-2 border-ink bg-background">
                      <div
                        className={`h-full ${pct > 80 ? "bg-coral" : "bg-lime"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Mobile bottom sheet — rendered outside card loop, no overflow/z-index issues ── */}
          {activeMenuUser && (
            <div className="md:hidden">
              <MobileUserMenu
                user={activeMenuUser}
                onClose={() => onUserMenuToggle(null)}
                onView={() => { onUserView(activeMenuUser); onUserMenuToggle(null); }}
                onEdit={() => { onUserEdit(activeMenuUser); onUserMenuToggle(null); }}
                onPermissions={() => { onUserPermissions(activeMenuUser); onUserMenuToggle(null); }}
                onStorage={() => { onUserStorage(activeMenuUser); onUserMenuToggle(null); }}
                onPasswordReset={() => { onPasswordReset(activeMenuUser.id); onUserMenuToggle(null); }}
                onToggle={() => { onUserToggle(activeMenuUser.id); onUserMenuToggle(null); }}
                onDelete={() => { onUserDelete(activeMenuUser.id); onUserMenuToggle(null); }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
