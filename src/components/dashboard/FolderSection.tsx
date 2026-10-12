/**
 * FolderSection Component
 * List folder + CRUD (create, rename, trash) dengan icon picker — terhubung ke API Task 4
 */

import { useState, useEffect } from "react";
import {
  Folder, FolderHeart, FolderOpen,
  MoreHorizontal, Pencil, Trash2, Star, StarOff, Loader2, X, MoveRight,
  Briefcase, BookOpen, Music, ImageIcon, Video, Home, Code2,
  FileText, Users, Archive, Layers, Palette, Globe, Heart,
  Coffee, Gamepad2, GraduationCap, Camera, Plane, ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { type ApiFolderItem, getFolderColor } from "@/types/dashboard";
import { MoveDialog, type MoveTarget } from "@/components/dashboard/MoveDialog";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
const COLOR_OPTIONS = [
  { name: "default", label: "Abu",    cls: "bg-muted" },
  { name: "lilac",   label: "Ungu",   cls: "bg-lilac" },
  { name: "sky",     label: "Biru",   cls: "bg-sky" },
  { name: "lime",    label: "Hijau",  cls: "bg-lime" },
  { name: "sun",     label: "Kuning", cls: "bg-sun" },
  { name: "coral",   label: "Merah",  cls: "bg-coral" },
];

function getColorClass(colorName: string): string {
  return COLOR_OPTIONS.find(c => c.name === colorName)?.cls ?? getFolderColor(0);
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
      <div className="grid grid-cols-6 gap-1.5 rounded-ui border-2 border-ink bg-background p-3">
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
function CreateFolderDialog({
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
  const [color, setColor]   = useState("default");
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-ui border-2 border-ink bg-card p-6 shadow-brutal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Folder Baru</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}><X className="size-4" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-4 rounded-ui border-2 border-ink bg-background p-4">
            <span className={`grid size-14 place-items-center rounded-ui border-2 border-ink ${previewColor}`}>
              <PreviewIcon className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-bold">
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
              className="w-full rounded-ui border-2 border-ink bg-background px-4 py-2.5 font-semibold outline-none focus:ring-2 focus:ring-ink"
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
  const [color, setColor]   = useState(folder.color ?? "default");
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-ui border-2 border-ink bg-card p-6 shadow-brutal" onClick={e => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Edit Folder</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}><X className="size-4" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-4 rounded-ui border-2 border-ink bg-background p-4">
            <span className={`grid size-14 place-items-center rounded-ui border-2 border-ink ${previewColor}`}>
              <PreviewIcon className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-bold">
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
              className="w-full rounded-ui border-2 border-ink bg-background px-4 py-2.5 font-semibold outline-none focus:ring-2 focus:ring-ink"
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
  const colorCls   = folder.color && folder.color !== "default"
    ? getColorClass(folder.color)
    : getFolderColor(index);
  const isMenuOpen = menuOpenId === folder.id;
  const { can } = useAuth();

  return (
    <button
      type="button"
      onClick={() => onOpen(folder)}
      className={`group relative flex h-36 w-full flex-col items-start justify-between rounded-ui border-2 border-ink p-4 shadow-brutal-sm transition-transform hover:-translate-y-1 text-left ${colorCls}`}
      aria-label={`Buka folder ${folder.name}`}
    >
      {/* Top row */}
      <div className="flex w-full items-start justify-between">
        <FolderIcon className="size-9" />
        <button
          type="button"
          className="grid size-7 place-items-center rounded-ui border-2 border-ink bg-card/80 hover:bg-card"
          onClick={e => { e.stopPropagation(); onMenuToggle(isMenuOpen ? null : folder.id); }}
          data-folder-menu
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {/* Name + starred */}
      <div className="w-full">
        <div className="flex items-center gap-1.5">
          {folder.is_starred && <Star className="size-3 shrink-0 fill-current text-amber-500" />}
          <p className="truncate font-display text-lg font-bold">{folder.name}</p>
        </div>
        <p className="text-xs font-semibold text-foreground/60">Folder</p>
      </div>

      {/* Dropdown menu */}
      {isMenuOpen && (
        <div
          className="absolute right-2 top-10 z-20 min-w-[160px] rounded-ui border-2 border-ink bg-card p-1 shadow-brutal"
          onClick={e => e.stopPropagation()}
          data-folder-menu
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-semibold hover:bg-muted"
            onClick={e => { e.stopPropagation(); onToggleStar(folder); onMenuToggle(null); }}
          >
            {folder.is_starred ? <StarOff className="size-4" /> : <Star className="size-4" />}
            {folder.is_starred ? "Hapus bintang" : "Beri bintang"}
          </button>
          {can('edit_files') && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-semibold hover:bg-muted"
              onClick={e => { e.stopPropagation(); onEdit(folder); onMenuToggle(null); }}
            >
              <Pencil className="size-4" /> Edit Folder
            </button>
          )}
          {can('edit_files') && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-semibold hover:bg-muted"
              onClick={e => { e.stopPropagation(); onMove(folder); onMenuToggle(null); }}
            >
              <MoveRight className="size-4" /> Pindahkan
            </button>
          )}
          {can('delete_files') && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              onClick={e => { e.stopPropagation(); onTrash(folder); onMenuToggle(null); }}
            >
              <Trash2 className="size-4" /> Hapus
            </button>
          )}
        </div>
      )}
    </button>
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
  loadingMore = false,
  onLoadMore,
}: FolderSectionProps) {
  const [showCreate, setShowCreate]       = useState(false);
  const [editingFolder, setEditingFolder]   = useState<ApiFolderItem | null>(null);
  const [movingFolder, setMovingFolder]     = useState<ApiFolderItem | null>(null);
  const [trashingFolder, setTrashingFolder] = useState<ApiFolderItem | null>(null);
  const [menuOpenId, setMenuOpenId]         = useState<number | null>(null);
  const { can } = useAuth();

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
    <>
      {/* Breadcrumb + tombol Folder Baru sejajar */}
      <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
        {/* Breadcrumb */}
        {breadcrumb.length > 0 ? (
          <nav className="flex items-center gap-1 text-sm font-semibold flex-wrap">
            <button
              onClick={() => onBreadcrumbNavigate?.(-1)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              File saya
            </button>
            {breadcrumb.map((crumb, idx) => (
              <span key={crumb.id} className="flex items-center gap-1">
                <span className="text-muted-foreground">/</span>
                {idx === breadcrumb.length - 1 ? (
                  <span className="font-bold text-foreground">{crumb.name}</span>
                ) : (
                  <button
                    onClick={() => onBreadcrumbNavigate?.(idx)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.name}
                  </button>
                )}
              </span>
            ))}
          </nav>
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">Folder</span>
        )}

        {/* Tombol aksi sejajar kanan */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-2">
            {can('create_files') && (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowCreate(true)}>
                <Folder className="size-4" /> Folder Baru
              </Button>
            )}
            {onUploadClick && can('create_files') && (
              <Button variant="outline" size="sm" className="gap-2" onClick={onUploadClick}>
                <span className="text-base leading-none">↑</span> Upload File
              </Button>
            )}
          </div>
          {onUploadClick && can('create_files') && (
            <p className="text-xs text-muted-foreground">Maks. 15 MB per file</p>
          )}
        </div>
      </div>

      {/* Grid folder — kalau kosong tidak tampilkan apa-apa */}
      {folders.length > 0 && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
            <div className="mt-4 flex flex-col items-center gap-1">
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-ui border-2 border-ink bg-card px-5 py-2.5 text-sm font-bold shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal disabled:pointer-events-none disabled:opacity-60"
              >
                {loadingMore ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <span>Muat lebih banyak</span>
                )}
              </button>
              <p className="text-xs text-muted-foreground">
                Menampilkan {folders.length} dari {foldersTotal} folder
              </p>
            </div>
          )}
        </>
      )}

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
    </>
  );
}
