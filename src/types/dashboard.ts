/**
 * Dashboard Types
 * Shared types for dashboard components
 */

import { FileText } from "lucide-react";
import type { User as ApiUser } from "@/lib/api";

export type Section =
  | "home"
  | "files"
  | "recent"
  | "favorites"
  | "notes"
  | "trash"
  | "users"
  | "storage"
  | "settings";

export type DocumentItem = {
  id: number;
  name: string;
  type: string;
  size: string;
  date: string;
  color: string;
  Icon: typeof FileText;
  favorite: boolean;
  trashed?: boolean;
};

export type Note = {
  id: number;
  title: string;
  body: string;
  color: string;
  date: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "User";
  storageUsed: number;   // GB (number)
  storageQuota: number;  // GB (number)
  status: "Active" | "Disabled";
  initial: string;       // derived from name
  color: string;         // tailwind class, assigned by index
  createdAt?: string;    // ISO string from backend
  lastLoginAt?: string | null;
};

export type FolderItem = {
  name: string;
  count: number;
  color: string;
  Icon: typeof FileText;
};

// ─── API Folder type (dari backend Task 4) ──────────────────────────────────
export type ApiFolderItem = {
  id: number;
  user_id: number;
  parent_id: number | null;
  name: string;
  color: string;
  icon: string;
  is_starred: boolean;
  is_trashed: boolean;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
};

// Warna folder untuk display (cycling by index)
export const FOLDER_COLORS = [
  "bg-lilac", "bg-sky", "bg-lime", "bg-sun", "bg-coral",
];

export function getFolderColor(index: number): string {
  return FOLDER_COLORS[index % FOLDER_COLORS.length] ?? "bg-lilac";
}

// ─── Colour palette untuk avatar user ──────────────────────────────────────
const AVATAR_COLORS = [
  "bg-lime", "bg-lilac", "bg-sky", "bg-sun", "bg-coral",
];

/**
 * Konversi ApiUser (snake_case, bytes) → frontend User (camelCase, GB)
 * Initial dan color diturunkan dari nama dan id supaya konsisten.
 */
export function apiUserToUser(apiUser: ApiUser): User {
  const bytes = Number(apiUser.storage_quota);
  const usedBytes = Number(apiUser.storage_used);

  // Simpan bytes mentah — display layer yang handle format
  const storageQuota = bytes;
  const storageUsed  = usedBytes;

  const initial = apiUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const color = AVATAR_COLORS[apiUser.id % AVATAR_COLORS.length] ?? "bg-lime";

  const role = apiUser.role.toUpperCase() === "ADMIN" ? "Admin" : "User";
  const status = apiUser.status === "active" ? "Active" : "Disabled";

  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role,
    storageUsed,
    storageQuota,
    status,
    initial,
    color,
    createdAt: apiUser.created_at,
    lastLoginAt: apiUser.last_login_at,
  };
}

/**
 * Konversi GB → bytes untuk dikirim ke backend.
 */
export function gbToBytes(gb: number): number {
  return Math.round(gb * 1073741824);
}
