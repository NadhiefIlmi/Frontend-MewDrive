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

import { useState, useEffect } from "react";
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
const NAV_H    = 64;          // nav bar height
const FAB_D    = 52;          // FAB diameter
const FAB_R    = FAB_D / 2;  // 26
const CORNER_R = 20;         // top-left / top-right rounded corners

// ─── Responsive width hook ────────────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(390); // iPhone fallback for SSR
  useEffect(() => {
    const update = () => setW(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return w;
}

// ─── SVG path builder ─────────────────────────────────────────────────────────
// Plain rectangle with rounded top corners — NO notch.
// Top border is a straight continuous line; FAB sits on top of it.
function buildNavPath(totalWidth: number): string {
  const cr = CORNER_R;
  return [
    `M ${cr},0`,
    `H ${totalWidth - cr}`,
    `Q ${totalWidth},0 ${totalWidth},${cr}`,
    `V ${NAV_H}`,
    `H 0`,
    `V ${cr}`,
    `Q 0,0 ${cr},0`,
    `Z`,
  ].join(" ");
}

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
  { Icon: Grid2X2,    label: "Beranda", id: "home"      as Section },
  { Icon: Folder,     label: "Dokumen", id: "files"     as Section },
  { Icon: Star,       label: "Favorit", id: "favorites" as Section },
  { Icon: StickyNote, label: "Catatan", id: "notes"     as Section },
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
  const winW      = useWindowWidth();

  const handleAction = (fn: () => void) => { setFabOpen(false); fn(); };
  const handleNav    = (s: Section)     => { setFabOpen(false); onSectionChange(s); };

  const navPath = buildNavPath(winW);

  // FAB action sheet sits above the FAB: NAV_H (bar) + FAB_R (half of FAB above bar) + 8px gap
  const sheetBottom = NAV_H + FAB_R + 8;

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
          style={{ bottom: sheetBottom }}
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
      <div
        className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
        style={{ height: NAV_H }}
      >
        {/* SVG: nav bar background + border + notch cutout
            viewBox matches winW exactly → arc renders 1:1, no distortion      */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 text-ink"
          width="100%"
          height={NAV_H}
          viewBox={`0 0 ${winW} ${NAV_H}`}
        >
          <path
            d={navPath}
            className="fill-card"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>

        {/* FAB: centre sits exactly ON the nav bar top border (top:0 + -translate-y-1/2).
            Its own circular 2px border aligns with the nav bar border — visually seamless. */}
        <button
          aria-label={fabOpen ? "Tutup menu" : "Menu tambah & lainnya"}
          onClick={() => setFabOpen((p) => !p)}
          className={`absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink shadow-brutal transition-all duration-300 active:scale-95 ${
            fabOpen ? "bg-coral" : "bg-lime"
          }`}
          style={{ top: 0, width: FAB_D, height: FAB_D }}
        >
          <Plus
            className="m-auto size-6 transition-transform duration-300"
            style={{ transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)" }}
          />
        </button>

        {/* Nav items — left 2 + spacer + right 2 */}
        <div
          className="relative flex h-full items-center px-2"
          style={{ paddingTop: 4 }} // slight push-down to center below notch
        >
          {/* Left items */}
          <div className="flex flex-1 items-center justify-around">
            {NAV_ITEMS.slice(0, 2).map(({ Icon, label, id }) => (
              <NavItem
                key={id}
                Icon={Icon}
                label={label}
                active={activeSection === id}
                onClick={() => { setFabOpen(false); onSectionChange(id); }}
              />
            ))}
          </div>

          {/* Centre spacer — reserves space where FAB sits */}
          <div style={{ width: FAB_D + 8, flexShrink: 0 }} />

          {/* Right items */}
          <div className="flex flex-1 items-center justify-around">
            {NAV_ITEMS.slice(2).map(({ Icon, label, id }) => (
              <NavItem
                key={id}
                Icon={Icon}
                label={label}
                active={activeSection === id}
                onClick={() => { setFabOpen(false); onSectionChange(id); }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── NavItem sub-component ───────────────────────────────────────────────────
// Opsi C: icon always visible, label slide-up + fade-in only when active
function NavItem({
  Icon,
  label,
  active,
  onClick,
}: {
  Icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-0 py-1"
    >
      {/* Icon container */}
      <span
        className={`grid place-items-center rounded-ui transition-all duration-200 ${
          active
            ? "size-9 border-2 border-ink bg-lilac shadow-brutal-sm"
            : "size-9 hover:bg-accent"
        }`}
      >
        <Icon
          className={`transition-all duration-200 ${active ? "size-[22px]" : "size-6"}`}
        />
      </span>

      {/* Label: hidden (max-h 0, opacity 0, shifted down) when idle
              visible (max-h 16px, opacity 1, back to position) when active */}
      <span
        className={`overflow-hidden text-[10px] font-bold leading-none transition-all duration-200 ease-out ${
          active
            ? "mt-0.5 max-h-4 translate-y-0 opacity-100"
            : "max-h-0 translate-y-1 opacity-0"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
