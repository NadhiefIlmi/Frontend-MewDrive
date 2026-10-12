/**
 * UsersSection Component
 * User management table
 */

import { Plus, MoreHorizontal, Shield, Eye, Edit3, Lock, Power, Trash2, HardDrive, Loader2 } from "lucide-react";
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
  return (
    <div className="mt-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Kelola User</h2>
        <Button onClick={onUserAdd}>
          <Plus className="size-5" /> Add User
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-ui border-2 border-ink bg-card p-10 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="font-semibold">Memuat data user...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-ui border-2 border-ink bg-card p-10 text-center">
          <p className="font-display text-xl font-bold">Belum ada user</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tambahkan user pertama
          </p>
        </div>
      ) : (
        <div className="relative overflow-visible rounded-ui border-2 border-ink bg-card shadow-brutal">
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
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink text-sm font-bold ${user.color}`}
                >
                  {user.initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Role */}
              <div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-3 py-1 text-xs font-bold ${
                    user.role === "Admin" ? "bg-lilac" : "bg-sky"
                  }`}
                >
                  {user.role === "Admin" && <Shield className="size-3" />}
                  {user.role}
                </span>
              </div>

              {/* Storage */}
              <div>
                <div className="mb-1 flex items-center justify-between text-xs font-bold">
                  <span>
                    {formatStorage(user.storageUsed)} / {formatStorage(user.storageQuota)}
                  </span>
                  <span className="text-muted-foreground">
                    {user.storageQuota > 0
                      ? `${Math.round((user.storageUsed / user.storageQuota) * 100)}%`
                      : "0%"}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full border-2 border-ink bg-background">
                  <div
                    className={`h-full ${
                      user.storageQuota > 0 && user.storageUsed / user.storageQuota > 0.8
                        ? "bg-coral"
                        : "bg-lime"
                    }`}
                    style={{
                      width: user.storageQuota > 0
                        ? `${(user.storageUsed / user.storageQuota) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <span
                  className={`inline-block rounded-full border-2 border-ink px-3 py-1 text-xs font-bold ${
                    user.status === "Active" ? "bg-lime" : "bg-muted"
                  }`}
                >
                  {user.status}
                </span>
              </div>

              {/* Actions */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    onUserMenuToggle(
                      openUserMenuId === user.id ? null : user.id
                    )
                  }
                >
                  <MoreHorizontal className="size-5" />
                </Button>

                {openUserMenuId === user.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => onUserMenuToggle(null)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-ui border-2 border-ink bg-card p-2 shadow-brutal">
                      <UserActionMenuItem
                        Icon={Eye}
                        label="Lihat Detail"
                        onClick={() => onUserView(user)}
                      />
                      <UserActionMenuItem
                        Icon={Edit3}
                        label="Edit User"
                        onClick={() => onUserEdit(user)}
                      />
                      <UserActionMenuItem
                        Icon={Shield}
                        label="Manage Permissions"
                        onClick={() => onUserPermissions(user)}
                      />
                      <UserActionMenuItem
                        Icon={HardDrive}
                        label="Storage Quota"
                        onClick={() => onUserStorage(user)}
                      />
                      <UserActionMenuItem
                        Icon={Lock}
                        label="Reset Password"
                        onClick={() => onPasswordReset(user.id)}
                      />
                      <UserActionMenuItem
                        Icon={Power}
                        label={
                          user.status === "Active" ? "Disable" : "Enable"
                        }
                        onClick={() => onUserToggle(user.id)}
                      />
                      <div className="my-1 border-t-2 border-ink" />
                      <UserActionMenuItem
                        Icon={Trash2}
                        label="Delete User"
                        onClick={() => onUserDelete(user.id)}
                        danger
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
