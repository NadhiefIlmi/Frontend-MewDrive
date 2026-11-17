/**
 * DashboardSidebar Component
 * Sidebar Navigasi Neo-Brutalisme MewDrive — Responsif Desktop & Mobile,
 * Ikon Kategori Berbingkai, Tombol Tambah Baru Berisi Menu Interaktif,
 * dan Widget Penyimpanan (Storage) yang Bersih & Fungsional.
 */

import { useState } from "react";
import {
  Plus,
  Upload,
  FolderPlus,
  StickyNote,
  X,
  HardDrive,
  Sparkles,
} from "lucide-react";
import catLogo from "@/assets/cat.webp";
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

  // Warna aktif per section — konsisten dengan Neo-Brutalisme MewDrive
  const activeBgMap: Record<string, string> = {
    home:      "bg-lime text-ink",
    files:     "bg-sky text-ink",
    favorites: "bg-sun text-ink",
    notes:     "bg-lilac text-ink",
    tasks:     "bg-teal-200 text-ink",
    trash:     "bg-coral text-ink",
    users:     "bg-orange-200 text-ink",
    storage:   "bg-sun text-ink",
    settings:  "bg-lilac text-ink",
  };

  // Hitung persentase storage dari bytes
  const pct = storageQuota > 0 ? Math.min(100, Math.round((storageUsed / storageQuota) * 100)) : 0;

  const formatStorage = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024)       return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes > 0)           return `${Math.round(bytes)} B`;
    return "0 B";
  };

  // Warna progress bar berdasarkan persentase
  const barColor = pct >= 90 ? "bg-coral" : pct >= 70 ? "bg-sun" : "bg-lime";

  // Tombol "Tambah baru" hanya muncul jika punya izin create_files
  const canCreate = can('create_files');

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          aria-label="Tutup navigasi"
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Main Sidebar Aside */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r-2 border-ink bg-card transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* ─── 1. Header & Brand ─── */}
        <div className="flex items-center justify-between border-b-2 border-ink/15 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <img
              src={catLogo}
              alt="Cat Logo"
              width={40}
              height={40}
              className="size-10 rounded-2xl border-2 border-ink object-cover shadow-brutal-xs"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-2xl font-black tracking-tight text-ink">
                  MewDrive
                </span>
                <span className="rounded-full border border-ink/30 bg-sun/40 px-2 py-0.2 text-[10px] font-extrabold text-ink">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground leading-none">
                Workspace Cloud
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl border-2 border-ink bg-background hover:bg-coral/30 shadow-brutal-xs transition-all lg:hidden"
            aria-label="Tutup navigasi"
          >
            <X className="size-4 text-ink" />
          </button>
        </div>

        {/* ─── 2. Action Button ("Tambah Baru") ─── */}
        {canCreate && (
          <div className="relative z-30 px-4 pt-4 sm:px-5">
            <button
              type="button"
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-full inline-flex items-center justify-between gap-2.5 rounded-2xl border-2 border-ink bg-sun hover:bg-sun/90 p-3 font-display font-bold text-sm text-ink shadow-brutal-xs hover:shadow-brutal-sm hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="grid size-7 place-items-center rounded-xl border-2 border-ink bg-card text-ink shadow-[1px_1px_0px_#000]">
                  <Plus className={`size-4 transition-transform duration-200 ${showAddMenu ? "rotate-45" : ""}`} />
                </div>
                <span>Tambah baru</span>
              </div>
              <span className="rounded-lg border border-ink/30 bg-card/60 px-2 py-0.5 text-[10px] font-extrabold uppercase text-ink">
                + Buat
              </span>
            </button>

            {/* Dropdown Popup Menu */}
            {showAddMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowAddMenu(false)}
                />
                <div className="absolute left-4 right-4 top-full mt-2 z-30 rounded-2xl border-2 border-ink bg-card p-2 shadow-brutal space-y-1 sm:left-5 sm:right-5">
                  <button
                    type="button"
                    onClick={() => handleAction(onFileUpload)}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all hover:bg-sky/30 border border-transparent hover:border-ink/20"
                  >
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-sky text-ink shadow-[1px_1px_0px_#000]">
                      <Upload className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">Unggah File</p>
                      <p className="text-[10px] font-semibold text-muted-foreground truncate">
                        PDF, Foto, Dokumen (Maks. 15 MB)
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(onFolderCreate)}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all hover:bg-sun/40 border border-transparent hover:border-ink/20"
                  >
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-sun text-ink shadow-[1px_1px_0px_#000]">
                      <FolderPlus className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">Folder Baru</p>
                      <p className="text-[10px] font-semibold text-muted-foreground truncate">
                        Struktur pengelompokan berkas
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(onNoteCreate)}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all hover:bg-lilac/40 border border-transparent hover:border-ink/20"
                  >
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-lilac text-ink shadow-[1px_1px_0px_#000]">
                      <StickyNote className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">Catatan Baru</p>
                      <p className="text-[10px] font-semibold text-muted-foreground truncate">
                        Tulis ide &amp; daftar tugas
                      </p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── 3. Navigation Links List ─── */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 sm:px-4 space-y-1">
          <div className="px-2.5 pt-1 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Menu Utama
            </span>
          </div>

          <nav className="space-y-1.5" aria-label="Navigasi utama">
            {visibleNav.map(({ Icon, label, id, adminOnly }) => {
              const active = activeSection === id;
              const activeStyle = activeBgMap[id] ?? "bg-lilac text-ink";

              return (
                <button
                  key={id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    onSectionChange(id);
                    onClose();
                  }}
                  className={`group flex w-full items-center justify-between gap-3 rounded-2xl p-2.5 text-left transition-all duration-150 ${
                    active
                      ? `${activeStyle} border-2 border-ink shadow-brutal-xs translate-x-1 font-bold`
                      : "bg-transparent text-foreground/80 hover:text-foreground hover:bg-muted/60 border-2 border-transparent hover:border-ink/20 hover:translate-x-0.5"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`grid size-8 shrink-0 place-items-center rounded-xl border-2 transition-all ${
                        active
                          ? "border-ink bg-card text-ink shadow-[1px_1px_0px_#000]"
                          : "border-ink/20 bg-background text-muted-foreground group-hover:border-ink group-hover:text-ink shadow-xs"
                      }`}
                    >
                      <Icon className={`size-4 ${active ? "stroke-[2.4px]" : "stroke-[2px]"}`} />
                    </div>
                    <span className="truncate font-display text-xs sm:text-sm font-bold">
                      {label}
                    </span>
                  </div>

                  {/* Badges / Active indicator */}
                  <div className="shrink-0 flex items-center">
                    {adminOnly ? (
                      <span className="rounded-full border border-ink/30 bg-orange-200 px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-orange-950">
                        Admin
                      </span>
                    ) : active ? (
                      <span className="size-2 rounded-full border border-ink bg-ink shadow-xs" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ─── 4. Storage Card Widget (Bottom) ─── */}
        <div className="p-3 sm:p-4 border-t-2 border-ink/15 mt-auto">
          <button
            type="button"
            onClick={() => {
              onSectionChange("storage");
              onClose();
            }}
            className={`w-full rounded-2xl border-2 border-ink bg-sun/30 p-3.5 text-left shadow-brutal-xs hover:shadow-brutal-sm hover:-translate-y-0.5 active:translate-y-0 transition-all group cursor-pointer ${
              activeSection === "storage" ? "ring-2 ring-ink ring-offset-2 bg-sun" : ""
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid size-7 place-items-center rounded-lg border-2 border-ink bg-sun text-ink shadow-[1px_1px_0px_#000]">
                  <HardDrive className="size-3.5" />
                </div>
                <div>
                  <span className="font-display text-xs font-bold text-foreground block leading-tight">
                    Storage
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    Kapasitas akun
                  </span>
                </div>
              </div>
              <span className="rounded-lg border-2 border-ink bg-card px-1.5 py-0.2 font-mono text-[11px] font-bold text-ink shadow-[1px_1px_0px_#000]">
                {pct}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 overflow-hidden rounded-full border-2 border-ink bg-card p-0.2">
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${Math.max(3, pct)}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>
                {storageQuota > 0
                  ? `${formatStorage(storageUsed)} / ${formatStorage(storageQuota)}`
                  : "Memuat..."}
              </span>
              <span className="text-ink font-extrabold group-hover:underline">
                Kelola →
              </span>
            </div>

            {pct >= 90 && (
              <p className="mt-1 text-[10px] font-extrabold text-red-700 flex items-center gap-1">
                ⚠ Storage hampir penuh!
              </p>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
