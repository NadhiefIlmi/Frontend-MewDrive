/**
 * MobileBottomNav Component
 * Bottom navigation bar for mobile — replaces hamburger menu on small screens.
 * Hidden on lg+ screens (desktop uses DashboardSidebar instead).
 *
 * Layout (5 slots):
 *   Home | Dokumen | [FAB +] | Favorit | Catatan
 *
 * FAB sheet berisi:
 *   — Aksi buat baru: Upload, Folder baru, Catatan baru
 *   — Navigasi cepat: Sampah, (User Management jika admin)
 */

import { useState } from "react";
import {
  Grid2X2,
  Folder,
  Star,
  StickyNote,
  Plus,
  Upload,
  FolderPlus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { Section } from "@/types/dashboard";
import { useAuth } from "@/contexts/AuthContext";

interface MobileBottomNavProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  onFileUpload: () => void;
  onFolderCreate: () => void;
  onNoteCreate: () => void;
  userRole?: string | undefined;
}

const NAV_ITEMS = [
  { Icon: Grid2X2,    label: "Beranda",  id: "home"      as Section },
  { Icon: Folder,     label: "Dokumen",  id: "files"     as Section },
  // slot tengah = FAB
  { Icon: Star,       label: "Favorit",  id: "favorites" as Section },
  { Icon: StickyNote, label: "Catatan",  id: "notes"     as Section },
] as const;

export function MobileBottomNav({
  activeSection,
  onSectionChange,
  onFileUpload,
  onFolderCreate,
  onNoteCreate,
  userRole,
}: MobileBottomNavProps) {
  const [fabOpen, setFabOpen] = useState(false);
  const { can } = useAuth();
  const canCreate  = can("create_files");
  const isAdmin    = userRole === "ADMIN";

  const handleAction = (fn: () => void) => {
    setFabOpen(false);
    fn();
  };

  const handleNav = (section: Section) => {
    setFabOpen(false);
    onSectionChange(section);
  };

  return (
    <>
      {/* FAB backdrop */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* FAB action sheet */}
      {fabOpen && (
        <div className="fixed bottom-[60px] left-1/2 z-50 w-52 -translate-x-1/2 rounded-ui border-2 border-ink bg-card p-1.5 shadow-brutal lg:hidden">

          {/* ── Buat baru ──────────────────────────────── */}
          {canCreate && (
            <>
              <p className="px-2 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Buat baru
              </p>

              {/* Upload file */}
              <button
                onClick={() => handleAction(onFileUpload)}
                className="flex w-full items-center gap-2.5 rounded-ui px-2 py-2 text-sm font-semibold hover:bg-lime"
              >
                <span className="grid size-7 flex-shrink-0 place-items-center rounded-ui border-2 border-ink bg-sky shadow-brutal-sm">
                  <Upload className="size-3.5" />
                </span>
                Unggah file
              </button>

              {/* Folder baru */}
              <button
                onClick={() => handleAction(onFolderCreate)}
                className="flex w-full items-center gap-2.5 rounded-ui px-2 py-2 text-sm font-semibold hover:bg-lime"
              >
                <span className="grid size-7 flex-shrink-0 place-items-center rounded-ui border-2 border-ink bg-sun shadow-brutal-sm">
                  <FolderPlus className="size-3.5" />
                </span>
                Folder baru
              </button>

              {/* Catatan baru */}
              <button
                onClick={() => handleAction(onNoteCreate)}
                className="flex w-full items-center gap-2.5 rounded-ui px-2 py-2 text-sm font-semibold hover:bg-lime"
              >
                <span className="grid size-7 flex-shrink-0 place-items-center rounded-ui border-2 border-ink bg-lilac shadow-brutal-sm">
                  <StickyNote className="size-3.5" />
                </span>
                Catatan baru
              </button>
            </>
          )}

          {/* ── Navigasi cepat ─────────────────────────── */}
          <div className={canCreate ? "mt-1 border-t-2 border-ink pt-1" : ""}>
            <p className="px-2 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Lainnya
            </p>

            {/* Sampah */}
            <button
              onClick={() => handleNav("trash")}
              className={`flex w-full items-center gap-2.5 rounded-ui px-2 py-2 text-sm font-semibold transition-colors hover:bg-coral/30 ${
                activeSection === "trash" ? "bg-coral/20" : ""
              }`}
            >
              <span className="grid size-7 flex-shrink-0 place-items-center rounded-ui border-2 border-ink bg-coral shadow-brutal-sm">
                <Trash2 className="size-3.5" />
              </span>
              Sampah
            </button>

            {/* User Management (admin only) */}
            {isAdmin && (
              <button
                onClick={() => handleNav("users")}
                className={`flex w-full items-center gap-2.5 rounded-ui px-2 py-2 text-sm font-semibold transition-colors hover:bg-sky/30 ${
                  activeSection === "users" ? "bg-sky/20" : ""
                }`}
              >
                <span className="grid size-7 flex-shrink-0 place-items-center rounded-ui border-2 border-ink bg-sky shadow-brutal-sm">
                  <Users className="size-3.5" />
                </span>
                User Management
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom nav bar ─────────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center border-t-2 border-ink bg-card px-1 lg:hidden"
        aria-label="Navigasi bawah"
      >
        {/* Left 2 items */}
        {NAV_ITEMS.slice(0, 2).map(({ Icon, label, id }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={() => { setFabOpen(false); onSectionChange(id); }}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5"
            >
              <span
                className={`grid size-7 place-items-center rounded-ui transition-all ${
                  active ? "border-2 border-ink bg-lilac shadow-brutal-sm" : "hover:bg-accent"
                }`}
              >
                <Icon className="size-4" />
              </span>
              <span className={`text-[9px] font-bold leading-none ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
            </button>
          );
        })}

        {/* FAB centre */}
        <button
          aria-label={fabOpen ? "Tutup menu" : "Menu tambah & lainnya"}
          onClick={() => setFabOpen((prev) => !prev)}
          className={`relative z-10 mx-1.5 flex size-11 flex-shrink-0 items-center justify-center rounded-full border-2 border-ink shadow-brutal transition-all active:scale-95 ${
            fabOpen ? "bg-coral" : "bg-lime"
          }`}
        >
          {fabOpen
            ? <X    className="size-5" />
            : <Plus className="size-5" />
          }
        </button>

        {/* Right 2 items */}
        {NAV_ITEMS.slice(2).map(({ Icon, label, id }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={() => { setFabOpen(false); onSectionChange(id); }}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5"
            >
              <span
                className={`grid size-7 place-items-center rounded-ui transition-all ${
                  active ? "border-2 border-ink bg-lilac shadow-brutal-sm" : "hover:bg-accent"
                }`}
              >
                <Icon className="size-4" />
              </span>
              <span className={`text-[9px] font-bold leading-none ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
