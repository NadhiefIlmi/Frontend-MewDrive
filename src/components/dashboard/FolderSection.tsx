/**
 * FolderSection Component
 * List folder + CRUD (create, rename, trash) dengan icon picker — terhubung ke API Task 4
 */

import { useState, useEffect, useRef } from "react";
import {
  Folder, FolderHeart, FolderOpen, FolderPlus,
  MoreHorizontal, Pencil, Trash2, Star, StarOff, Loader2, X, MoveRight,
  Briefcase, BookOpen, Music, ImageIcon, Video, Home, Code2,
  FileText, Users, Archive, Layers, Palette, Globe, Heart,
  Coffee, Gamepad2, GraduationCap, Camera, Plane, ShoppingBag,
  ChevronRight, Upload, HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { type ApiFolderItem, getFolderColor } from "@/types/dashboard";
import { MoveDialog, type MoveTarget } from "@/components/dashboard/MoveDialog";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useQueryClient } from "@tanstack/react-query";

// ─── Icon registry ────────────────────────────────────────────────────────────
export const FOLDER_ICONS: { name: string; label: string; Icon: React.ElementType }[] = [
  { name: "folder",        label: "Default",    Icon: Folder },
  { name: "folder-heart",  label: "Favorit",    Icon: FolderHeart },
  { name: "folder-open",   label: "Terbuka",    Icon: FolderOpen },
  { name: "briefcase",     label: "Kerja",      Icon: Briefcase },
  { name: "book-open",     label: "Belajar",    Icon: BookOpen },
  { name: "music",         label: "Musik",      Icon: Music },
  { name: "image",         label: "Foto",       Icon: ImageIcon },
  { name: "video",         label: "Video",      Icon: Video },
  { name: "home",          label: "Rumah",      Icon: Home },
  { name: "code2",         label: "Kode",       Icon: Code2 },
  { name: "file-text",     label: "Dokumen",    Icon: FileText },
  { name: "users",         label: "Tim",        Icon: Users },
  { name: "archive",       label: "Arsip",      Icon: Archive },
  { name: "layers",        label: "Proyek",     Icon: Layers },
  { name: "palette",       label: "Desain",     Icon: Palette },
  { name: "globe",         label: "Web",        Icon: Globe },
  { name: "heart",         label: "Pribadi",    Icon: Heart },
  { name: "coffee",        label: "Santai",     Icon: Coffee },
  { name: "gamepad2",      label: "Game",       Icon: Gamepad2 },
  { name: "graduation-cap",label: "Pendidikan", Icon: GraduationCap },
  { name: "camera",        label: "Kamera",     Icon: Camera },
  { name: "plane",         label: "Travel",     Icon: Plane },
  { name: "shopping-bag",  label: "Belanja",    Icon: ShoppingBag },
];

export function getFolderIcon(iconName: string): React.ElementType {
  return FOLDER_ICONS.find(i => i.name === iconName)?.Icon ?? Folder;
}

// ─── Color options ────────────────────────────────────────────────────────────
// name = nilai yang dikirim ke backend (harus cocok dengan VALID_COLORS di validator)
// cls  = Tailwind class untuk tampilan
const COLOR_OPTIONS = [
  { name: "gray",   label: "Abu",    cls: "bg-muted" },
  { name: "purple", label: "Ungu",   cls: "bg-lilac" },
  { name: "blue",   label: "Biru",   cls: "bg-sky" },
  { name: "green",  label: "Hijau",  cls: "bg-lime" },
  { name: "yellow", label: "Kuning", cls: "bg-sun" },
  { name: "red",    label: "Merah",  cls: "bg-coral" },
  { name: "pink",   label: "Pink",   cls: "bg-pink-200" },
  { name: "orange", label: "Oranye", cls: "bg-orange-200" },
  { name: "teal",   label: "Teal",   cls: "bg-teal-200" },
];

const VALID_COLOR_NAMES = new Set(COLOR_OPTIONS.map(c => c.name));

// Mapping backward-compat: nilai lama (Tailwind alias) → class
// Dibutuhkan agar folder yang sudah tersimpan di DB dengan nilai lama tetap tampil benar
const LEGACY_COLOR_MAP: Record<string, string> = {
  default: "bg-muted",
  lilac:   "bg-lilac",
  sky:     "bg-sky",
  lime:    "bg-lime",
  sun:     "bg-sun",
  coral:   "bg-coral",
};

// Mapping legacy color value → valid color name untuk pengiriman ke backend
const LEGACY_TO_VALID: Record<string, string> = {
  default: "gray",
  lilac:   "purple",
  sky:     "blue",
  lime:    "green",
  sun:     "yellow",
  coral:   "red",
};

/** Normalize nilai warna dari DB agar selalu valid untuk dikirim ke backend */
function normalizeColor(color: string | null | undefined): string {
  if (!color) return "gray";
  if (VALID_COLOR_NAMES.has(color)) return color;
  return LEGACY_TO_VALID[color] ?? "gray";
}

function getColorClass(colorName: string): string {
  return (
    COLOR_OPTIONS.find(c => c.name === colorName)?.cls ??
    LEGACY_COLOR_MAP[colorName] ??
    getFolderColor(0)
  );
}

// ─── Icon Picker ──────────────────────────────────────────────────────────────
function IconPicker({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (name: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Pilih Icon</p>
      <div className="grid grid-cols-5 gap-1.5 rounded-ui border-2 border-ink bg-background p-2 sm:grid-cols-6 sm:p-3">
        {FOLDER_ICONS.map(({ name, label, Icon }) => (
          <button
            key={name}
            type="button"
            title={label}
            onClick={() => onChange(name)}
            className={`grid place-items-center rounded-ui border-2 p-2 transition-all ${
              selected === name
                ? "border-ink bg-lime shadow-brutal-sm"
                : "border-transparent hover:border-ink hover:bg-muted"
            }`}
          >
            <Icon className="size-5" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Color Picker ─────────────────────────────────────────────────────────────
function ColorPicker({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (name: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Warna Folder</p>
      <div className="flex gap-2">
        {COLOR_OPTIONS.map(({ name, label, cls }) => (
          <button
            key={name}
            type="button"
            title={label}
            onClick={() => onChange(name)}
            className={`size-8 rounded-full border-2 transition-all ${cls} ${
              selected === name ? "border-ink shadow-brutal-sm scale-110" : "border-transparent hover:border-ink"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Create Folder Dialog ─────────────────────────────────────────────────────
export function CreateFolderDialog({
  parentId,
  onClose,
  onCreated,
}: {
  parentId?: number | null;
  onClose: () => void;
  onCreated: (folder: ApiFolderItem) => void;
}) {
  const [name, setName]     = useState("");
  const [icon, setIcon]     = useState("folder");
  const [color, setColor]   = useState("gray");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const PreviewIcon = getFolderIcon(icon);
  const previewColor = getColorClass(color);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const res = await api.createFolder({ name: name.trim(), parent_id: parentId ?? null, color, icon });
    setLoading(false);
    if (res.success && res.data) {
      onCreated(res.data as ApiFolderItem);
    } else {
      setError(res.error?.message ?? "Gagal membuat folder");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-3 sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-ui border-2 border-ink bg-card p-4 shadow-brutal sm:p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold sm:text-xl">Folder Baru</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}><X className="size-4" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 rounded-ui border-2 border-ink bg-background p-3">
            <span className={`grid size-12 shrink-0 place-items-center rounded-ui border-2 border-ink sm:size-14 ${previewColor}`}>
              <PreviewIcon className="size-6 sm:size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-bold sm:text-lg">
                {name.trim() || "Nama folder"}
              </p>
              <p className="text-xs text-muted-foreground">Preview folder</p>
            </div>
          </div>

          {/* Nama */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Nama Folder</p>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nama folder..."
              maxLength={255}
              className="w-full rounded-ui border-2 border-ink bg-background px-3 py-2 font-semibold outline-none focus:ring-2 focus:ring-ink sm:px-4 sm:py-2.5"
            />
          </div>

          {/* Icon Picker */}
          <IconPicker selected={icon} onChange={setIcon} />

          {/* Color Picker */}
          <ColorPicker selected={color} onChange={setColor} />

          {error && <p className="text-sm font-bold text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Batal</Button>
            <Button type="submit" className="flex-1" disabled={!name.trim() || loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Buat Folder"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Folder Dialog ───────────────────────────────────────────────────────
export function EditFolderDialog({
  folder,
  onClose,
  onSaved,
}: {
  folder: ApiFolderItem;
  onClose: () => void;
  onSaved: (folder: ApiFolderItem) => void;
}) {
  const [name, setName]     = useState(folder.name);
  const [icon, setIcon]     = useState(folder.icon ?? "folder");
  const [color, setColor]   = useState(normalizeColor(folder.color));
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const PreviewIcon  = getFolderIcon(icon);
  const previewColor = getColorClass(color);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const res = await api.updateFolder(folder.id, { name: name.trim(), icon, color });
    setLoading(false);
    if (res.success && res.data) {
      onSaved(res.data as ApiFolderItem);
    } else {
      setError(res.error?.message ?? "Gagal menyimpan");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-3 sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-ui border-2 border-ink bg-card p-4 shadow-brutal sm:p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold sm:text-xl">Edit Folder</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}><X className="size-4" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 rounded-ui border-2 border-ink bg-background p-3">
            <span className={`grid size-12 shrink-0 place-items-center rounded-ui border-2 border-ink sm:size-14 ${previewColor}`}>
              <PreviewIcon className="size-6 sm:size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-bold sm:text-lg">
                {name.trim() || "Nama folder"}
              </p>
              <p className="text-xs text-muted-foreground">Preview folder</p>
            </div>
          </div>

          {/* Nama */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Nama Folder</p>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={255}
              className="w-full rounded-ui border-2 border-ink bg-background px-3 py-2 font-semibold outline-none focus:ring-2 focus:ring-ink sm:px-4 sm:py-2.5"
            />
          </div>

          {/* Icon Picker */}
          <IconPicker selected={icon} onChange={setIcon} />

          {/* Color Picker */}
          <ColorPicker selected={color} onChange={setColor} />

          {error && <p className="text-sm font-bold text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Batal</Button>
            <Button type="submit" className="flex-1" disabled={!name.trim() || loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Folder Card ──────────────────────────────────────────────────────────────
export function FolderCard({
  folder,
  index,
  onOpen,
  onEdit,
  onTrash,
  onToggleStar,
  onMove,
  menuOpenId,
  onMenuToggle,
}: {
  folder: ApiFolderItem;
  index: number;
  onOpen: (folder: ApiFolderItem) => void;
  onEdit: (folder: ApiFolderItem) => void;
  onTrash: (folder: ApiFolderItem) => void;
  onToggleStar: (folder: ApiFolderItem) => void;
  onMove: (folder: ApiFolderItem) => void;
  menuOpenId: number | null;
  onMenuToggle: (id: number | null) => void;
}) {
  const FolderIcon = getFolderIcon(folder.icon ?? "folder");
  const colorCls   = folder.color && folder.color !== "gray"
    ? getColorClass(folder.color)
    : getFolderColor(index);
  const isMenuOpen = menuOpenId === folder.id;
  const { can } = useAuth();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuUp, setMenuUp] = useState(false);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMenuOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // 270px = tinggi menu (~200px) + bottom nav bar (~64px) + buffer
      const spaceBelow = window.innerHeight - rect.bottom;
      setMenuUp(spaceBelow < 270);
    }
    onMenuToggle(isMenuOpen ? null : folder.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(folder)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(folder); } }}
      className={`group relative flex flex-col justify-between rounded-2xl border-2 border-ink p-3.5 sm:p-4 shadow-brutal-sm hover:shadow-brutal transition-all duration-200 hover:-translate-y-0.5 text-left cursor-pointer min-h-[125px] sm:min-h-[145px] ${colorCls} ${isMenuOpen ? 'z-30' : 'z-0'}`}
      aria-label={`Buka folder ${folder.name}`}
    >
      {/* Top row: Icon badge + Action buttons */}
      <div className="flex w-full items-start justify-between gap-2">
        <div className="grid size-10 sm:size-11 place-items-center rounded-xl border-2 border-ink bg-card/90 text-ink shadow-[1px_1px_0px_0px_#000] group-hover:scale-105 transition-transform">
          <FolderIcon className="size-5 sm:size-6 text-ink" />
        </div>

        <div className="flex items-center gap-1">
          {/* Quick star toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(folder);
            }}
            className="grid size-7 place-items-center rounded-lg border-2 border-ink bg-card/80 hover:bg-card shadow-brutal-xs transition-colors"
            title={folder.is_starred ? "Hapus bintang" : "Beri bintang"}
          >
            <Star className={`size-3.5 ${folder.is_starred ? "fill-amber-400 text-amber-500" : "text-muted-foreground"}`} />
          </button>

          {/* More options menu */}
          <button
            ref={btnRef}
            type="button"
            className="grid size-7 place-items-center rounded-lg border-2 border-ink bg-card/80 hover:bg-sun shadow-brutal-xs transition-colors"
            onClick={handleMenuToggle}
            data-folder-menu
            title="Opsi folder"
          >
            <MoreHorizontal className="size-3.5 text-ink" />
          </button>
        </div>
      </div>

      {/* Bottom row: Name + Badge */}
      <div className="w-full pt-2">
        <p className="truncate font-display text-sm sm:text-base font-bold text-foreground leading-snug">
          {folder.name}
        </p>
        <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-ink/20 bg-background/60 px-2 py-0.2 text-[10px] font-bold text-foreground/70">
            Folder
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-ink font-bold text-[10px]">
            Buka →
          </span>
        </div>
      </div>

      {/* Dropdown menu */}
      {isMenuOpen && (
        <div
          className={`absolute right-2 z-50 min-w-[160px] rounded-2xl border-2 border-ink bg-card p-1.5 shadow-brutal ${menuUp ? 'bottom-10' : 'top-10'}`}
          onClick={e => e.stopPropagation()}
          data-folder-menu
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-sun"
            onClick={e => { e.stopPropagation(); onToggleStar(folder); onMenuToggle(null); }}
          >
            {folder.is_starred ? <StarOff className="size-4" /> : <Star className="size-4" />}
            {folder.is_starred ? "Hapus bintang" : "Beri bintang"}
          </button>
          {can('edit_files') && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-sun"
              onClick={e => { e.stopPropagation(); onEdit(folder); onMenuToggle(null); }}
            >
              <Pencil className="size-4" /> Edit Folder
            </button>
          )}
          {can('edit_files') && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-sun"
              onClick={e => { e.stopPropagation(); onMove(folder); onMenuToggle(null); }}
            >
              <MoveRight className="size-4" /> Pindahkan
            </button>
          )}
          {can('delete_files') && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
              onClick={e => { e.stopPropagation(); onTrash(folder); onMenuToggle(null); }}
            >
              <Trash2 className="size-4" /> Hapus Folder
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main FolderSection ───────────────────────────────────────────────────────
interface FolderSectionProps {
  folders: ApiFolderItem[];
  loading: boolean;
  currentParentId: number | null;
  breadcrumb?: { id: number; name: string }[];
  onBreadcrumbNavigate?: (index: number) => void;
  onFolderOpen: (folder: ApiFolderItem) => void;
  onFolderCreated: (folder: ApiFolderItem) => void;
  onFolderRenamed: (folder: ApiFolderItem) => void;
  onFolderTrashed: (folderId: number) => void;
  onFolderStarToggled: (folder: ApiFolderItem) => void;
  onFlash: (msg: string, type?: "success" | "error" | "info") => void;
  forceShowCreate?: boolean;
  onCreateDialogClosed?: () => void;
  onUploadClick?: () => void;
  /** Total folder dari API (untuk hitung hasMore) */
  foldersTotal?: number;
  /** Total files dari API (opsional untuk ringkasan cockpit) */
  filesTotal?: number;
  /** Sedang loading halaman berikutnya */
  loadingMore?: boolean;
  /** Callback untuk muat halaman berikutnya */
  onLoadMore?: () => void;
}

export function FolderSection({
  folders,
  loading,
  currentParentId,
  breadcrumb = [],
  onBreadcrumbNavigate,
  onFolderOpen,
  onFolderCreated,
  onFolderRenamed,
  onFolderTrashed,
  onFolderStarToggled,
  onFlash,
  forceShowCreate = false,
  onCreateDialogClosed,
  onUploadClick,
  foldersTotal = 0,
  filesTotal = 0,
  loadingMore = false,
  onLoadMore,
}: FolderSectionProps) {
  const [showCreate, setShowCreate]       = useState(false);
  const [editingFolder, setEditingFolder]   = useState<ApiFolderItem | null>(null);
  const [movingFolder, setMovingFolder]     = useState<ApiFolderItem | null>(null);
  const [trashingFolder, setTrashingFolder] = useState<ApiFolderItem | null>(null);
  const [menuOpenId, setMenuOpenId]         = useState<number | null>(null);
  const { can } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (forceShowCreate) setShowCreate(true);
  }, [forceShowCreate]);

  // Close menu saat klik di luar — tanpa fixed overlay yang block cursor
  useEffect(() => {
    if (menuOpenId === null) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-folder-menu]')) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpenId]);

  const handleTrash = (folder: ApiFolderItem) => {
    setTrashingFolder(folder);
  };

  const confirmTrash = async () => {
    if (!trashingFolder) return;
    const res = await api.trashFolder(trashingFolder.id);
    if (res.success) {
      onFolderTrashed(trashingFolder.id);
      onFlash(`"${trashingFolder.name}" dipindahkan ke sampah`);
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    } else {
      onFlash(res.error?.message ?? "Gagal menghapus folder", "error");
    }
    setTrashingFolder(null);
  };

  const handleToggleStar = async (folder: ApiFolderItem) => {
    const res = await api.updateFolder(folder.id, { is_starred: !folder.is_starred });
    if (res.success && res.data) {
      onFolderStarToggled(res.data as ApiFolderItem);
      onFlash(res.data.is_starred ? `"${folder.name}" ditandai ★` : "Tanda bintang dihapus");
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    }
  };

  if (loading) {
    return (
      <div className="mt-10 flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="font-semibold">Memuat folder...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* ─── Cockpit Stats Overview ─── */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
        {/* Total Folder */}
        <div className="group rounded-2xl border-2 border-ink bg-card p-3 sm:p-4 shadow-brutal-xs hover:shadow-brutal-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Folder</span>
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-sun shadow-[1px_1px_0px_#000]">
              <Folder className="size-4 text-ink" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-2xl sm:text-3xl font-bold">{foldersTotal || folders.length}</span>
            <span className="text-xs font-bold text-muted-foreground">folder</span>
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground truncate">
            {folders.length} folder ditampilkan
          </p>
        </div>

        {/* Total File */}
        <div className="group rounded-2xl border-2 border-ink bg-card p-3 sm:p-4 shadow-brutal-xs hover:shadow-brutal-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Berkas</span>
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-lilac shadow-[1px_1px_0px_#000]">
              <FileText className="size-4 text-ink" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-2xl sm:text-3xl font-bold">{filesTotal}</span>
            <span className="text-xs font-bold text-muted-foreground">file</span>
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground truncate">
            Dokumen, foto & berkas
          </p>
        </div>

        {/* Posisi Lokasi */}
        <div className="group rounded-2xl border-2 border-ink bg-card p-3 sm:p-4 shadow-brutal-xs hover:shadow-brutal-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lokasi</span>
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-sky shadow-[1px_1px_0px_#000]">
              <HardDrive className="size-4 text-ink" />
            </div>
          </div>
          <div className="mt-2">
            <p className="truncate font-display text-base sm:text-lg font-bold text-foreground">
              {breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].name : "Direktori Utama"}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground truncate">
            {breadcrumb.length > 0 ? `${breadcrumb.length} tingkat sub-folder` : "Root directory"}
          </p>
        </div>

        {/* Kuota File */}
        <div className="group rounded-2xl border-2 border-ink bg-card p-3 sm:p-4 shadow-brutal-xs hover:shadow-brutal-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Batas Unggah</span>
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-lime shadow-[1px_1px_0px_#000]">
              <Upload className="size-4 text-ink" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-2xl sm:text-3xl font-bold">15 MB</span>
            <span className="text-xs font-bold text-muted-foreground">/ berkas</span>
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground truncate">
            Maksimal per berkas
          </p>
        </div>
      </div>

      {/* ─── Breadcrumb Navigation & Action Toolbar ─── */}
      <div className="rounded-2xl border-2 border-ink bg-card p-2 sm:p-3 shadow-brutal-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Breadcrumb Path Bar */}
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => onBreadcrumbNavigate?.(-1)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-ink px-3 py-1.5 text-xs sm:text-sm font-bold transition-all hover:-translate-y-0.5 ${
              breadcrumb.length === 0
                ? "bg-sun text-ink shadow-brutal-xs"
                : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Home className="size-3.5" />
            <span>Dokumen saya</span>
          </button>

          {breadcrumb.map((crumb, idx) => {
            const isLast = idx === breadcrumb.length - 1;
            return (
              <div key={crumb.id} className="flex shrink-0 items-center gap-1.5">
                <ChevronRight className="size-3.5 text-ink/40" />
                {isLast ? (
                  <span className="inline-flex max-w-[140px] sm:max-w-[200px] truncate items-center rounded-xl border-2 border-ink bg-sun px-3 py-1.5 text-xs sm:text-sm font-bold text-ink shadow-brutal-xs">
                    {crumb.name}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onBreadcrumbNavigate?.(idx)}
                    className="inline-flex max-w-[110px] sm:max-w-[160px] truncate items-center rounded-xl border-2 border-ink bg-background px-2.5 py-1.5 text-xs sm:text-sm font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:-translate-y-0.5"
                  >
                    {crumb.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 items-center gap-2 self-end md:self-auto w-full md:w-auto">
          {can('create_files') && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-ink bg-card px-3.5 py-2 text-xs sm:text-sm font-bold text-foreground shadow-brutal-xs transition-all hover:bg-muted hover:-translate-y-0.5 active:translate-y-0"
            >
              <FolderPlus className="size-4 text-ink" />
              <span>Folder Baru</span>
            </button>
          )}

          {onUploadClick && can('create_files') && (
            <button
              type="button"
              onClick={onUploadClick}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-ink bg-lime px-3.5 py-2 text-xs sm:text-sm font-bold text-ink shadow-brutal-xs transition-all hover:-translate-y-0.5 hover:shadow-brutal-sm active:translate-y-0"
            >
              <Upload className="size-4" />
              <span>Upload File</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Folder Section Directory ─── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg sm:text-xl font-bold flex items-center gap-2">
              Direktori Folder
            </h2>
            <span className="rounded-full border-2 border-ink bg-sun/40 px-2.5 py-0.5 text-xs font-bold text-ink">
              {foldersTotal || folders.length}
            </span>
          </div>
          {breadcrumb.length > 0 && (
            <button
              type="button"
              onClick={() => onBreadcrumbNavigate?.(breadcrumb.length - 2)}
              className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground hover:underline"
            >
              ← Kembali ke level atas
            </button>
          )}
        </div>

        {folders.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-ink/40 bg-card/60 p-8 sm:p-10 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl border-2 border-ink bg-sun/30 shadow-brutal-xs">
              <Folder className="size-6 text-muted-foreground" />
            </div>
            <p className="font-display text-base font-bold text-foreground">
              {breadcrumb.length > 0 ? "Folder ini belum memiliki sub-folder" : "Belum ada folder"}
            </p>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Buat folder untuk merapikan dan mengelompokkan dokumenmu.
            </p>
            {can('create_files') && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border-2 border-ink bg-sun px-4 py-2 text-xs sm:text-sm font-bold text-ink shadow-brutal-xs hover:-translate-y-0.5 transition-all"
              >
                <FolderPlus className="size-4" />
                <span>Buat Folder Baru</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {folders.map((folder, idx) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  index={idx}
                  onOpen={onFolderOpen}
                  onEdit={setEditingFolder}
                  onTrash={handleTrash}
                  onToggleStar={handleToggleStar}
                  onMove={setMovingFolder}
                  menuOpenId={menuOpenId}
                  onMenuToggle={setMenuOpenId}
                />
              ))}
            </div>

            {/* Load More — tampil jika masih ada yang belum dimuat */}
            {folders.length < foldersTotal && (
              <div className="mt-5 flex flex-col items-center gap-1">
                <button
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 rounded-xl border-2 border-ink bg-card px-5 py-2.5 text-sm font-bold shadow-brutal-xs transition-all hover:-translate-y-0.5 hover:shadow-brutal-sm disabled:pointer-events-none disabled:opacity-60"
                >
                  {loadingMore ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <span>Muat lebih banyak folder</span>
                  )}
                </button>
                <p className="text-xs text-muted-foreground">
                  Menampilkan {folders.length} dari {foldersTotal} folder
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      {showCreate && (
        <CreateFolderDialog
          parentId={currentParentId}
          onClose={() => { setShowCreate(false); onCreateDialogClosed?.(); }}
          onCreated={(f) => {
            onFolderCreated(f);
            setShowCreate(false);
            onCreateDialogClosed?.();
            onFlash(`Folder "${f.name}" berhasil dibuat`);
          }}
        />
      )}

      {editingFolder && (
        <EditFolderDialog
          folder={editingFolder}
          onClose={() => setEditingFolder(null)}
          onSaved={(f) => {
            onFolderRenamed(f);
            setEditingFolder(null);
            onFlash(`Folder "${f.name}" berhasil diupdate`);
          }}
        />
      )}

      {movingFolder && (
        <MoveDialog
          target={{ type: "folder", item: movingFolder }}
          onClose={() => setMovingFolder(null)}
          onMoved={() => {
            onFolderTrashed(movingFolder.id);
            setMovingFolder(null);
          }}
          onFlash={onFlash}
        />
      )}

      {trashingFolder && (
        <ConfirmDialog
          title="Pindah ke Sampah"
          message={`Folder "${trashingFolder.name}" akan dipindahkan ke sampah. Kamu bisa memulihkannya nanti.`}
          confirmLabel="Pindahkan"
          variant="destructive"
          onConfirm={confirmTrash}
          onCancel={() => setTrashingFolder(null)}
        />
      )}
    </div>
  );
}
