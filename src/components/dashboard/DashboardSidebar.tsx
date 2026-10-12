/**
 * DashboardSidebar Component
 * Left sidebar with navigation and add menu
 */

import { useState } from "react";
import {
  Plus,
  Upload,
  FolderPlus,
  StickyNote,
  X,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuItem } from "./MenuItem";
import catLogo from "@/assets/cat.png";
import { navigation } from "@/lib/dashboard-constants";
import type { Section } from "@/types/dashboard";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  onFileUpload: () => void;
  onFolderCreate: () => void;
  onNoteCreate: () => void;
  userRole?: string | undefined;
  storageUsed?: number;   // bytes
  storageQuota?: number;  // bytes
}

export function DashboardSidebar({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
  onFileUpload,
  onFolderCreate,
  onNoteCreate,
  userRole,
  storageUsed = 0,
  storageQuota = 0,
}: DashboardSidebarProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const { can } = useAuth();

  const handleAction = (action: () => void) => {
    setShowAddMenu(false);
    action();
  };

  const isAdmin = userRole === "ADMIN";
  const visibleNav = navigation.filter((item) => !item.adminOnly || isAdmin);

  // Hitung dari bytes
  const pct = storageQuota > 0 ? Math.min(100, Math.round((storageUsed / storageQuota) * 100)) : 0;

  const formatStorage = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024)       return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes > 0)           return `${Math.round(bytes)} B`;
    return "0 B";
  };

  // Warna bar berdasarkan persentase
  const barColor = pct >= 90 ? "bg-coral" : pct >= 70 ? "bg-sun" : "bg-lime";

  // Tombol "Tambah baru" hanya muncul kalau punya izin create_files
  const canCreate = can('create_files');

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <Button
          variant="ghost"
          aria-label="Tutup menu"
          className="fixed inset-0 z-30 h-auto w-auto rounded-none border-0 bg-ink/30 p-0 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Add menu overlay */}
      {showAddMenu && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowAddMenu(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r-2 border-ink bg-card p-5 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3 font-display text-2xl font-bold">
            <img
              src={catLogo}
              alt="Cat Logo"
              className="size-10 rounded-ui border-2 border-ink object-cover shadow-brutal-sm"
            />
            MewDrive
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Tutup navigasi"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        {/* Tombol Tambah — hanya tampil jika punya izin create */}
        {canCreate && (
          <div className="relative z-30">
            <Button
              className="w-full"
              onClick={() => setShowAddMenu(!showAddMenu)}
            >
              <Plus className="size-5" /> Tambah baru
            </Button>
            {showAddMenu && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-ui border-2 border-ink bg-card p-2 shadow-brutal">
                <MenuItem
                  Icon={Upload}
                  label="Unggah file"
                  onClick={() => handleAction(onFileUpload)}
                />
                <MenuItem
                  Icon={FolderPlus}
                  label="Folder baru"
                  onClick={() => handleAction(onFolderCreate)}
                />
                <MenuItem
                  Icon={StickyNote}
                  label="Catatan baru"
                  onClick={() => handleAction(onNoteCreate)}
                />
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className={`${canCreate ? "mt-8" : "mt-0"} space-y-2`} aria-label="Navigasi utama">
          {visibleNav.map(({ Icon, label, id }) => {
            const active = activeSection === id;
            return (
              <Button
                key={id}
                variant="ghost"
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  onSectionChange(id);
                  onClose();
                }}
                className={`h-auto w-full justify-start px-3 py-2.5 ${
                  active
                    ? "border-ink bg-lilac shadow-brutal-sm hover:bg-lilac"
                    : "hover:border-ink"
                }`}
              >
                <Icon className="size-5" /> {label}
              </Button>
            );
          })}
        </nav>

        {/* Storage Widget */}
        <button
          onClick={() => {
            onSectionChange("storage");
            onClose();
          }}
          className={`mt-auto rounded-ui border-2 border-ink bg-sun p-4 text-left shadow-brutal-sm transition-transform hover:-translate-y-1 ${
            activeSection === "storage"
              ? "ring-2 ring-ink ring-offset-2"
              : ""
          }`}
        >
          <div className="mb-2 flex items-center justify-between font-bold">
            <span>Storage</span>
            <HardDrive className="size-5" />
          </div>
          <div className="h-3 overflow-hidden rounded-full border-2 border-ink bg-card">
            <div
              className={`h-full transition-all ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-semibold">
            {storageQuota > 0
              ? `${formatStorage(storageUsed)} dari ${formatStorage(storageQuota)}`
              : "Memuat..."}
          </p>
          {pct >= 90 && (
            <p className="mt-1 text-xs font-bold text-red-700">⚠ Storage hampir penuh!</p>
          )}
        </button>
      </aside>
    </>
  );
}
