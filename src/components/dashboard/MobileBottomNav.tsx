/**
 * MobileBottomNav Component
 * Bottom navigation bar with Material-Design-style notched FAB (Pendekatan B).
 *
 * Technique:
 *  - SVG draws the nav bar background + border with a circular cutout (notch)
 *    at the top-center where the FAB sits.
 *  - The FAB is absolutely positioned so its centre sits on the nav bar's top
 *    edge — half above, half below — perfectly seated in the notch.
 *  - Dynamic SVG path is computed from the actual window width so the arc
 *    is never distorted across screen sizes.
 *
 * FAB sheet (two sections):
 *  "Buat baru" — Upload, Folder baru, Catatan baru   (create_files permission)
 *  "Lainnya"   — Sampah (+ Users untuk admin)
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
} from "lucide-react";
import type { Section } from "@/types/dashboard";
import { useAuth } from "@/contexts/AuthContext";

// ─── Layout constants (px) ────────────────────────────────────────────────────
const NAV_H = 64; // nav bar height
const FAB_D = 52; // FAB diameter

// ─── Types ────────────────────────────────────────────────────────────────────
interface MobileBottomNavProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  onFileUpload: () => void;
  onFolderCreate: () => void;
  onNoteCreate: () => void;
  userRole?: string | undefined;
}

const NAV_ITEMS = [
  { Icon: Grid2X2,    label: "Beranda", id: "home"      as Section, activeBg: "bg-lime" },
  { Icon: Folder,     label: "Dokumen", id: "files"     as Section, activeBg: "bg-sky" },
  { Icon: Star,       label: "Favorit", id: "favorites" as Section, activeBg: "bg-sun" },
  { Icon: StickyNote, label: "Catatan", id: "notes"     as Section, activeBg: "bg-lilac" },
] as const;

// ─── Main component ───────────────────────────────────────────────────────────
export function MobileBottomNav({
  activeSection,
  onSectionChange,
  onFileUpload,
  onFolderCreate,
  onNoteCreate,
  userRole,
}: MobileBottomNavProps) {
  const [fabOpen, setFabOpen] = useState(false);
  const { can }   = useAuth();
  const canCreate = can("create_files");
  const isAdmin   = userRole === "ADMIN";
  const handleAction = (fn: () => void) => { setFabOpen(false); fn(); };
  const handleNav    = (s: Section)     => { setFabOpen(false); onSectionChange(s); };

  return (
    <>
      {/* ── FAB backdrop ───────────────────────────────────────────────────── */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* ── FAB action sheet ───────────────────────────────────────────────── */}
      {fabOpen && (
        <div
          className="fixed left-1/2 z-50 w-52 -translate-x-1/2 rounded-ui border-2 border-ink bg-card p-1.5 shadow-brutal lg:hidden"
          style={{ bottom: "calc(max(14px, env(safe-area-inset-bottom, 14px)) + 64px + 16px)" }}
        >
          {/* Buat baru */}
          {canCreate && (
            <>
              <p className="px-2 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Buat baru
              </p>

              <button
                onClick={() => handleAction(onFileUpload)}
                className="flex w-full items-center gap-2.5 rounded-ui px-2 py-2 text-sm font-semibold hover:bg-lime"
              >
                <span className="grid size-7 flex-shrink-0 place-items-center rounded-ui border-2 border-ink bg-sky shadow-brutal-sm">
                  <Upload className="size-3.5" />
                </span>
                Unggah file
              </button>

              <button
                onClick={() => handleAction(onFolderCreate)}
                className="flex w-full items-center gap-2.5 rounded-ui px-2 py-2 text-sm font-semibold hover:bg-lime"
              >
                <span className="grid size-7 flex-shrink-0 place-items-center rounded-ui border-2 border-ink bg-sun shadow-brutal-sm">
                  <FolderPlus className="size-3.5" />
                </span>
                Folder baru
              </button>

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

          {/* Lainnya */}
          <div className={canCreate ? "mt-1 border-t-2 border-ink pt-1" : ""}>
            <p className="px-2 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Lainnya
            </p>

            <button
              onClick={() => handleNav("trash")}
              className={`flex w-full items-center gap-2.5 rounded-ui px-2 py-2 text-sm font-semibold hover:bg-coral/30 ${
                activeSection === "trash" ? "bg-coral/20" : ""
              }`}
            >
              <span className="grid size-7 flex-shrink-0 place-items-center rounded-ui border-2 border-ink bg-coral shadow-brutal-sm">
                <Trash2 className="size-3.5" />
              </span>
              Sampah
            </button>

            {isAdmin && (
              <button
                onClick={() => handleNav("users")}
                className={`flex w-full items-center gap-2.5 rounded-ui px-2 py-2 text-sm font-semibold hover:bg-sky/30 ${
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

      {/* ── Nav bar container ──────────────────────────────────────────────── */}
      {/* ── Floating Nav Bar container ────────────────────────────────────── */}
      <div
        className="fixed inset-x-3.5 z-40 max-w-lg mx-auto lg:hidden"
        style={{ bottom: "max(14px, env(safe-area-inset-bottom, 14px))" }}
      >
        <nav
          aria-label="Navigasi bawah"
          className="relative flex items-center rounded-[28px] border-2 border-ink bg-card px-2 shadow-brutal"
          style={{ height: NAV_H }}
        >
          {/* FAB: centre sits lowered on floating bar (protrudes only 6px above) */}
          <button
            aria-label={fabOpen ? "Tutup menu" : "Menu tambah & lainnya"}
            onClick={() => setFabOpen((p) => !p)}
            className={`absolute left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink shadow-brutal transition-all duration-300 active:scale-95 ${
              fabOpen ? "bg-coral" : "bg-lime"
            }`}
            style={{ top: 12, width: FAB_D, height: FAB_D }}
          >
            <Plus
              className="m-auto size-6 transition-transform duration-300"
              style={{ transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)" }}
            />
          </button>

          {/* Left items */}
          <div className="flex flex-1 items-center justify-around">
            {NAV_ITEMS.slice(0, 2).map(({ Icon, label, id, activeBg }) => (
              <NavItem
                key={id}
                Icon={Icon}
                label={label}
                active={activeSection === id}
                activeBg={activeBg}
                onClick={() => { setFabOpen(false); onSectionChange(id); }}
              />
            ))}
          </div>

          {/* Centre spacer — reserves space where FAB sits */}
          <div style={{ width: FAB_D + 8, flexShrink: 0 }} />

          {/* Right items */}
          <div className="flex flex-1 items-center justify-around">
            {NAV_ITEMS.slice(2).map(({ Icon, label, id, activeBg }) => (
              <NavItem
                key={id}
                Icon={Icon}
                label={label}
                active={activeSection === id}
                activeBg={activeBg}
                onClick={() => { setFabOpen(false); onSectionChange(id); }}
              />
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}

// ─── NavItem sub-component ───────────────────────────────────────────────────
// Icon-only with unique neobrutal signature colors + jelly bounce animation
function NavItem({
  Icon,
  label,
  active,
  activeBg,
  onClick,
}: {
  Icon: React.ElementType;
  label: string;
  active: boolean;
  activeBg: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className="relative grid place-items-center p-1 outline-none transition-transform active:scale-90"
    >
      {/* Icon container */}
      <span
        className={`grid size-10 place-items-center rounded-ui transition-all duration-200 ${
          active
            ? `border-2 border-ink ${activeBg} text-ink shadow-brutal-sm animate-jelly`
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        <Icon
          className={`transition-all duration-200 ${
            active ? "size-5 stroke-[2.3px]" : "size-5 stroke-[1.8px]"
          }`}
        />
      </span>
    </button>
  );
}
