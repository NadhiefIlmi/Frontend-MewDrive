/**
 * TrashSection Component
 * Menampilkan berkas dan folder yang ada di sampah (trashed).
 * Desain Neo-Brutalisme MewDrive responsif di desktop & mobile,
 * dilengkapi Cockpit Hero Banner, Stats Overview, Filter/Search Toolbar,
 * Multi-select & Bulk Restore, Empty Trash, serta Empty State yang informatif & interaktif.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Trash2, RotateCcw, Loader2, Folder,
  FileText, FileImage, FileArchive, FileSpreadsheet, File,
  CheckSquare, Square, AlertTriangle, Clock, ArrowRight,
  ShieldCheck, Sparkles, Search, Compass, Check,
  Presentation, Video, Music, HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type FileItem, type Folder as ApiFolderT } from "@/lib/api";
import { getFolderIcon } from "@/components/dashboard/FolderSection";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Helpers: File Icon & Color ───────────────────────────────────────────────
function getFileIcon(mimeType: string, extension?: string): React.ElementType {
  const ext = (extension || "").toLowerCase();
  if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) {
    return FileImage;
  }
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint") || ["pptx", "ppt"].includes(ext)) {
    return Presentation;
  }
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || ["xlsx", "xls", "csv"].includes(ext)) {
    return FileSpreadsheet;
  }
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar") || mimeType.includes("gzip") || mimeType.includes("7z") || ["zip", "rar", "7z"].includes(ext)) {
    return FileArchive;
  }
  if (mimeType.includes("pdf") || ext === "pdf") {
    return FileText;
  }
  if (mimeType.startsWith("video/") || ["mp4", "webm", "mkv"].includes(ext)) {
    return Video;
  }
  if (mimeType.startsWith("audio/") || ["mp3", "wav", "ogg"].includes(ext)) {
    return Music;
  }
  return File;
}

function getFileColorCls(mimeType: string, extension?: string): string {
  const ext = (extension || "").toLowerCase();
  if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "bg-lilac";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || ["xlsx", "xls", "csv"].includes(ext)) return "bg-lime";
  if (mimeType.includes("presentation") || ["pptx", "ppt"].includes(ext)) return "bg-sun";
  if (mimeType.includes("pdf") || ext === "pdf") return "bg-coral";
  if (mimeType.includes("zip") || mimeType.includes("rar") || ["zip", "rar", "7z"].includes(ext)) return "bg-orange-200";
  if (mimeType.startsWith("video/")) return "bg-sky";
  if (mimeType.startsWith("audio/")) return "bg-teal-200";
  return "bg-sky";
}

function getFileBadgeCls(mimeType: string, extension?: string): string {
  const ext = (extension || "").toLowerCase();
  if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return "bg-lilac/40 text-purple-950 border-purple-400";
  }
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || ["xlsx", "xls", "csv"].includes(ext)) {
    return "bg-lime/40 text-emerald-950 border-emerald-500";
  }
  if (mimeType.includes("presentation") || ["pptx", "ppt"].includes(ext)) {
    return "bg-sun/50 text-amber-950 border-amber-500";
  }
  if (mimeType.includes("pdf") || ext === "pdf") {
    return "bg-coral/30 text-red-950 border-red-400";
  }
  if (mimeType.includes("zip") || ["zip", "rar", "7z"].includes(ext)) {
    return "bg-orange-200/50 text-orange-950 border-orange-400";
  }
  return "bg-sky/30 text-sky-950 border-sky-400";
}

const COLOR_MAP: Record<string, string> = {
  gray:    "bg-muted",
  purple:  "bg-lilac",
  blue:    "bg-sky",
  green:   "bg-lime",
  yellow:  "bg-sun",
  red:     "bg-coral",
  pink:    "bg-pink-200",
  orange:  "bg-orange-200",
  teal:    "bg-teal-200",
  default: "bg-muted",
  lilac:   "bg-lilac",
  sky:     "bg-sky",
  lime:    "bg-lime",
  sun:     "bg-sun",
  coral:   "bg-coral",
};

function resolveFolderColor(color: string): string {
  return COLOR_MAP[color] ?? "bg-muted";
}

function formatBytes(bytes: number | string): string {
  const num = typeof bytes === "string" ? Number(bytes) : bytes;
  if (!num || isNaN(num) || num <= 0) return "0 B";
  if (num >= 1073741824) return `${(num / 1073741824).toFixed(1)} GB`;
  if (num >= 1048576)    return `${(num / 1048576).toFixed(1)} MB`;
  if (num >= 1024)       return `${(num / 1024).toFixed(0)} KB`;
  return `${Math.round(num)} B`;
}

function formatRelative(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const diffD  = Math.floor(diffMs / 86400000);
  if (diffD < 1)   return "Hari ini";
  if (diffD === 1) return "Kemarin";
  if (diffD < 7)   return `${diffD} hari lalu`;
  if (diffD < 30)  return `${Math.floor(diffD / 7)} minggu lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Trash Item types ─────────────────────────────────────────────────────────
type TrashItem =
  | { kind: "file";   data: FileItem }
  | { kind: "folder"; data: ApiFolderT };

function trashItemId(item: TrashItem): string {
  return `${item.kind}-${item.data.id}`;
}

// ─── Trashed Folder Row ───────────────────────────────────────────────────────
function TrashedFolderRow({
  folder,
  selected,
  onToggleSelect,
  onRestore,
  onDelete,
}: {
  folder: ApiFolderT;
  selected: boolean;
  onToggleSelect: () => void;
  onRestore: (folder: ApiFolderT) => void;
  onDelete: (folder: ApiFolderT) => void;
}) {
  const FolderIcon = getFolderIcon((folder as any).icon ?? "folder");
  const colorCls   = resolveFolderColor(folder.color);

  return (
    <div
      className={`group flex items-center justify-between gap-3 rounded-2xl border-2 border-ink p-3 sm:p-3.5 shadow-brutal-xs hover:shadow-brutal-sm transition-all ${
        selected ? "bg-sun/30 border-ink shadow-brutal-sm" : "bg-card"
      }`}
    >
      {/* Left: Checkbox + Icon + Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={onToggleSelect}
          className="grid size-7 shrink-0 place-items-center rounded-lg border-2 border-ink bg-card hover:bg-muted shadow-brutal-xs transition-colors"
          title={selected ? "Batalkan pilihan" : "Pilih folder"}
        >
          {selected
            ? <CheckSquare className="size-4 text-ink fill-sun" />
            : <Square className="size-4 text-muted-foreground" />
          }
        </button>

        <div className={`grid size-10 sm:size-11 shrink-0 place-items-center rounded-xl border-2 border-ink ${colorCls} shadow-[1px_1px_0px_#000]`}>
          <FolderIcon className="size-5 text-ink" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm sm:text-base font-bold text-foreground">
            {folder.name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <span className="rounded border border-ink/20 bg-background/80 px-1.5 py-0.2 text-[10px] font-bold text-foreground/80">
              Folder
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              • Dihapus {formatRelative(folder.trashed_at ?? folder.updated_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onRestore(folder)}
          title="Pulihkan folder"
          className="inline-flex items-center gap-1 rounded-xl border-2 border-ink bg-lime/40 hover:bg-lime px-2.5 py-1.5 text-xs font-bold text-emerald-950 shadow-brutal-xs hover:-translate-y-0.5 transition-all"
        >
          <RotateCcw className="size-3.5" />
          <span className="hidden sm:inline">Pulihkan</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(folder)}
          title="Hapus folder permanen"
          className="inline-flex items-center gap-1 rounded-xl border-2 border-ink bg-coral/30 hover:bg-coral px-2.5 py-1.5 text-xs font-bold text-red-950 shadow-brutal-xs hover:-translate-y-0.5 transition-all"
        >
          <Trash2 className="size-3.5" />
          <span className="hidden sm:inline">Hapus Permanen</span>
        </button>
      </div>
    </div>
  );
}

// ─── Trashed File Row ─────────────────────────────────────────────────────────
function TrashedFileRow({
  file,
  selected,
  onToggleSelect,
  onRestore,
  onDelete,
}: {
  file: FileItem;
  selected: boolean;
  onToggleSelect: () => void;
  onRestore: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}) {
  const Icon     = getFileIcon(file.mime_type, file.extension);
  const colorCls = getFileColorCls(file.mime_type, file.extension);
  const badgeCls = getFileBadgeCls(file.mime_type, file.extension);

  return (
    <div
      className={`group flex items-center justify-between gap-3 rounded-2xl border-2 border-ink p-3 sm:p-3.5 shadow-brutal-xs hover:shadow-brutal-sm transition-all ${
        selected ? "bg-sun/30 border-ink shadow-brutal-sm" : "bg-card"
      }`}
    >
      {/* Left: Checkbox + Icon + Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={onToggleSelect}
          className="grid size-7 shrink-0 place-items-center rounded-lg border-2 border-ink bg-card hover:bg-muted shadow-brutal-xs transition-colors"
          title={selected ? "Batalkan pilihan" : "Pilih file"}
        >
          {selected
            ? <CheckSquare className="size-4 text-ink fill-sun" />
            : <Square className="size-4 text-muted-foreground" />
          }
        </button>

        <div className={`grid size-10 sm:size-11 shrink-0 place-items-center rounded-xl border-2 border-ink ${colorCls} shadow-[1px_1px_0px_#000]`}>
          <Icon className="size-5 text-ink" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm sm:text-base font-bold text-foreground">
            {file.name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <span className={`rounded border px-1.5 py-0.2 text-[10px] font-bold uppercase ${badgeCls}`}>
              {file.extension || "FILE"}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              • {formatBytes(file.size)}
            </span>
            <span className="text-xs font-semibold text-muted-foreground hidden xs:inline">
              • Dihapus {formatRelative(file.trashed_at ?? file.updated_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onRestore(file)}
          title="Pulihkan berkas"
          className="inline-flex items-center gap-1 rounded-xl border-2 border-ink bg-lime/40 hover:bg-lime px-2.5 py-1.5 text-xs font-bold text-emerald-950 shadow-brutal-xs hover:-translate-y-0.5 transition-all"
        >
          <RotateCcw className="size-3.5" />
          <span className="hidden sm:inline">Pulihkan</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(file)}
          title="Hapus berkas permanen"
          className="inline-flex items-center gap-1 rounded-xl border-2 border-ink bg-coral/30 hover:bg-coral px-2.5 py-1.5 text-xs font-bold text-red-950 shadow-brutal-xs hover:-translate-y-0.5 transition-all"
        >
          <Trash2 className="size-3.5" />
          <span className="hidden sm:inline">Hapus Permanen</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main TrashSection ────────────────────────────────────────────────────────
interface TrashSectionProps {
  onFlash: (msg: string, type?: "success" | "error" | "info") => void;
  onStorageChanged?: () => void;
  onSectionChange?: (section: any) => void;
  isActive?: boolean;
}

export function TrashSection({ onFlash, onStorageChanged, onSectionChange, isActive }: TrashSectionProps) {
  const queryClient = useQueryClient();
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [bulkLoading,    setBulkLoading]    = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab]     = useState<"all" | "folders" | "files">("all");

  // Dialog states
  const [deletingFile,    setDeletingFile]    = useState<FileItem | null>(null);
  const [deletingFolder,  setDeletingFolder]  = useState<ApiFolderT | null>(null);
  const [confirmEmpty,    setConfirmEmpty]    = useState(false);

  const TRASH_LIMIT = 50;

  // ── React Query — real-time cache ─────────────────────────────────────────
  const { data: queryData, isLoading: loading, refetch } = useQuery({
    queryKey: ["trash"],
    queryFn: async () => {
      const [filesRes, foldersRes] = await Promise.all([
        api.getFileTrash({ page: 1, limit: TRASH_LIMIT }),
        api.getFolderTrash({ page: 1, limit: TRASH_LIMIT }),
      ]);
      return {
        files:   filesRes.data?.files                       ?? [],
        folders: (foldersRes.data?.folders ?? []) as ApiFolderT[],
      };
    },
    staleTime: 0,
  });

  // Auto-refetch saat tab Sampah aktif
  useEffect(() => {
    if (isActive) {
      refetch();
    }
  }, [isActive, refetch]);

  const trashedFiles   = queryData?.files   ?? [];
  const trashedFolders = queryData?.folders ?? [];

  const invalidateTrash = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["trash"] });
  }, [queryClient]);

  // Combined list sorted by trashed_at desc
  const allItems: TrashItem[] = useMemo(() => {
    return [
      ...trashedFolders.map(f => ({ kind: "folder" as const, data: f })),
      ...trashedFiles.map(f => ({ kind: "file" as const, data: f })),
    ].sort((a, b) => {
      const ta = new Date(a.data.trashed_at ?? a.data.updated_at).getTime();
      const tb = new Date(b.data.trashed_at ?? b.data.updated_at).getTime();
      return tb - ta;
    });
  }, [trashedFolders, trashedFiles]);

  const total = allItems.length;

  // Filtered by Search & Tab
  const filteredItems = useMemo(() => {
    let result = allItems;
    if (activeTab === "folders") {
      result = result.filter(item => item.kind === "folder");
    } else if (activeTab === "files") {
      result = result.filter(item => item.kind === "file");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => item.data.name.toLowerCase().includes(q));
    }
    return result;
  }, [allItems, activeTab, searchQuery]);

  // ── Selection ────────────────────────────────────────────────────────────────
  const toggleSelect = (item: TrashItem) => {
    const key = trashItemId(item);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredItems.map(trashItemId)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ── Single restore ────────────────────────────────────────────────────────────
  const handleRestoreFile = async (file: FileItem) => {
    const res = await api.restoreFile(file.id);
    if (res.success) {
      queryClient.setQueryData<typeof queryData>(["trash"], old => old ? { ...old, files: old.files.filter(f => f.id !== file.id) } : old);
      onFlash(`"${file.name}" berhasil dipulihkan`);
      onStorageChanged?.();
    } else {
      onFlash(res.error?.message ?? "Gagal memulihkan file", "error");
    }
  };

  const handleRestoreFolder = async (folder: ApiFolderT) => {
    const res = await api.restoreFolder(folder.id);
    if (res.success) {
      queryClient.setQueryData<typeof queryData>(["trash"], old => old ? { ...old, folders: old.folders.filter(f => f.id !== folder.id) } : old);
      onFlash(`"${folder.name}" berhasil dipulihkan`);
    } else {
      onFlash(res.error?.message ?? "Gagal memulihkan folder", "error");
    }
  };

  // ── Single delete ─────────────────────────────────────────────────────────────
  const handleDeleteFile = (file: FileItem) => {
    setDeletingFile(file);
  };

  const confirmDeleteFile = async () => {
    if (!deletingFile) return;
    const res = await api.deleteFilePermanent(deletingFile.id);
    if (res.success) {
      queryClient.setQueryData<typeof queryData>(["trash"], old => old ? { ...old, files: old.files.filter(f => f.id !== deletingFile!.id) } : old);
      onFlash(`"${deletingFile.name}" dihapus permanen`);
      onStorageChanged?.();
    } else {
      onFlash(res.error?.message ?? "Gagal menghapus file", "error");
    }
    setDeletingFile(null);
  };

  const handleDeleteFolder = (folder: ApiFolderT) => {
    setDeletingFolder(folder);
  };

  const confirmDeleteFolder = async () => {
    if (!deletingFolder) return;
    const res = await api.deleteFolderPermanent(deletingFolder.id);
    if (res.success) {
      queryClient.setQueryData<typeof queryData>(["trash"], old => old ? { ...old, folders: old.folders.filter(f => f.id !== deletingFolder!.id) } : old);
      onFlash(`"${deletingFolder.name}" dihapus permanen`);
      onStorageChanged?.();
    } else {
      onFlash(res.error?.message ?? "Gagal menghapus folder", "error");
    }
    setDeletingFolder(null);
  };

  // ── Bulk restore ──────────────────────────────────────────────────────────────
  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);

    const fileIds   = [...selectedIds].filter(k => k.startsWith("file-"))  .map(k => Number(k.slice(5)));
    const folderIds = [...selectedIds].filter(k => k.startsWith("folder-")).map(k => Number(k.slice(7)));

    let restoredCount = 0;

    if (fileIds.length > 0) {
      const res = await api.bulkRestoreFiles(fileIds);
      if (res.success && res.data) restoredCount += res.data.restored.length;
    }
    if (folderIds.length > 0) {
      const res = await api.bulkRestoreFolders(folderIds);
      if (res.success && res.data) restoredCount += res.data.restored.length;
    }

    setBulkLoading(false);
    setSelectedIds(new Set());
    onFlash(`${restoredCount} item berhasil dipulihkan`);
    onStorageChanged?.();
    invalidateTrash();
  };

  // ── Empty trash ───────────────────────────────────────────────────────────────
  const handleEmptyTrash = () => {
    setConfirmEmpty(true);
  };

  const confirmEmptyTrash = async () => {
    setConfirmEmpty(false);
    setBulkLoading(true);
    for (const folder of trashedFolders) {
      await api.deleteFolderPermanent(folder.id);
    }
    const res = await api.emptyTrash();
    setBulkLoading(false);
    if (res.success) {
      onFlash(`Sampah dikosongkan: ${res.data?.deleted ?? 0} file dihapus permanen`);
      onStorageChanged?.();
      invalidateTrash();
    } else {
      onFlash(res.error?.message ?? "Gagal mengosongkan sampah", "error");
    }
  };

  return (
    <section className="space-y-6 pt-2">

      {/* ─── 1. Cockpit Hero Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-coral/20 p-5 sm:p-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className="grid size-12 sm:size-14 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-card text-red-600 shadow-brutal-xs">
            <Trash2 className="size-6 sm:size-7" />
          </div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/30 bg-background/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink mb-1.5">
              Penyimpanan sementara
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Sampah
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground max-w-xl leading-relaxed">
              File dan folder yang dihapus akan tersimpan di sini sebelum dihapus permanen secara otomatis setelah 30 hari.
            </p>
          </div>
        </div>

        {/* Status Pill Badge */}
        <div className="shrink-0 self-start md:self-center">
          <div className={`inline-flex items-center gap-2 rounded-xl border-2 border-ink px-4 py-2 font-bold shadow-brutal-xs ${
            total > 0 ? "bg-sun text-ink" : "bg-lime text-ink"
          }`}>
            <Clock className="size-4" />
            <span className="text-xs sm:text-sm">
              {loading ? "Memuat..." : total > 0 ? `${total} Item di Sampah` : "Sampah Bersih"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2. Loading State ─── */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-ink" />
          <p className="font-display text-base font-bold text-foreground">Memuat data sampah...</p>
        </div>
      )}

      {/* ─── 4. Empty State (Ketika Sampah Kosong) ─── */}
      {!loading && total === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-ink/40 bg-card p-6 sm:p-10 text-center shadow-brutal-sm space-y-6">
          <div className="relative mx-auto size-20 sm:size-24">
            <div className="grid size-full place-items-center rounded-2xl border-2 border-ink bg-lime shadow-brutal rotate-3 hover:rotate-0 transition-transform">
              <ShieldCheck className="size-10 sm:size-12 text-ink" />
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Sampah kosong
            </h2>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
              File dan folder yang dihapus akan muncul di sini. Saat ini tidak ada berkas yang menunggu pembersihan.
            </p>
          </div>

          {/* Quick Guide Step Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2 text-left">
            <div className="rounded-xl border-2 border-ink bg-muted/40 p-3 shadow-brutal-xs space-y-1">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-sun border border-ink text-[11px] font-extrabold text-ink">
                1
              </span>
              <p className="font-bold text-xs text-foreground">Penyimpanan Aman</p>
              <p className="text-[11px] text-muted-foreground">Berkas tidak langsung hilang saat kamu hapus.</p>
            </div>

            <div className="rounded-xl border-2 border-ink bg-muted/40 p-3 shadow-brutal-xs space-y-1">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-sky border border-ink text-[11px] font-extrabold text-ink">
                2
              </span>
              <p className="font-bold text-xs text-foreground">Masa Simpan 30 Hari</p>
              <p className="text-[11px] text-muted-foreground">Kamu punya waktu 30 hari untuk memulihkan file.</p>
            </div>

            <div className="rounded-xl border-2 border-ink bg-muted/40 p-3 shadow-brutal-xs space-y-1">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-coral/60 border border-ink text-[11px] font-extrabold text-ink">
                3
              </span>
              <p className="font-bold text-xs text-foreground">Kosongkan Kapan Saja</p>
              <p className="text-[11px] text-muted-foreground">Bersihkan sampah kapan saja untuk menghemat storage.</p>
            </div>
          </div>

          {/* Action CTA Button */}
          {onSectionChange && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onSectionChange("files")}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-sun hover:bg-sun/90 px-6 py-2.5 text-xs sm:text-sm font-bold text-ink shadow-brutal-xs hover:shadow-brutal hover:-translate-y-0.5 transition-all"
              >
                <Compass className="size-4" />
                <span>Kembali ke Dokumen Saya</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── 5. Content when Items Exist ─── */}
      {!loading && total > 0 && (
        <div className="space-y-4">

          {/* Retention Notice Box */}
          <div className="rounded-2xl border-2 border-ink bg-sun/30 p-3.5 sm:p-4 shadow-brutal-xs flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-sun shadow-[1px_1px_0px_#000]">
                <AlertTriangle className="size-4 text-ink" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground leading-snug">
                Item di sampah akan dihapus permanen secara otomatis setelah <span className="font-bold">30 hari</span>. Pulihkan sekarang jika masih diperlukan.
              </p>
            </div>
            <span className="hidden md:inline-flex shrink-0 items-center gap-1 rounded-xl border border-ink/30 bg-card px-2.5 py-1 text-xs font-bold text-foreground">
              <Clock className="size-3 text-muted-foreground" />
              Auto-clean 30 hari
            </span>
          </div>

          {/* Interactive Action Toolbar */}
          <div className="rounded-2xl border-2 border-ink bg-card p-3 sm:p-4 shadow-brutal-sm flex flex-col md:flex-row md:items-center justify-between gap-3">

            {/* Left: Filter Tabs & Multi-select Checkboxes */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-ink px-3 py-1.5 text-xs sm:text-sm font-bold transition-all ${
                    activeTab === "all"
                      ? "bg-sun text-ink shadow-brutal-xs"
                      : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>Semua</span>
                  <span className="rounded-md border border-ink/30 bg-background/80 px-1.5 py-0.2 text-[10px] font-extrabold">
                    {total}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("folders")}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-ink px-3 py-1.5 text-xs sm:text-sm font-bold transition-all ${
                    activeTab === "folders"
                      ? "bg-sky text-ink shadow-brutal-xs"
                      : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Folder className="size-3.5" />
                  <span>Folder</span>
                  <span className="rounded-md border border-ink/30 bg-background/80 px-1.5 py-0.2 text-[10px] font-extrabold">
                    {trashedFolders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("files")}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-ink px-3 py-1.5 text-xs sm:text-sm font-bold transition-all ${
                    activeTab === "files"
                      ? "bg-lilac text-ink shadow-brutal-xs"
                      : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <FileText className="size-3.5" />
                  <span>File</span>
                  <span className="rounded-md border border-ink/30 bg-background/80 px-1.5 py-0.2 text-[10px] font-extrabold">
                    {trashedFiles.length}
                  </span>
                </button>
              </div>

              {/* Select All Toggle */}
              {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-ink bg-card hover:bg-muted px-3 py-1.5 text-xs font-bold text-foreground shadow-brutal-xs transition-all"
                >
                  <Square className="size-3.5" />
                  <span>Batal Pilih</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={selectAll}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-ink bg-card hover:bg-muted px-3 py-1.5 text-xs font-bold text-foreground shadow-brutal-xs transition-all"
                >
                  <CheckSquare className="size-3.5" />
                  <span>Pilih Semua</span>
                </button>
              )}
            </div>

            {/* Right: Search Bar & Bulk Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari item di sampah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border-2 border-ink bg-background py-1.5 pl-8 pr-3 text-xs sm:text-sm font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ink"
                />
              </div>

              {/* Bulk Restore Button */}
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleBulkRestore}
                  disabled={bulkLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-ink bg-lime hover:bg-lime/90 px-3.5 py-1.5 text-xs font-bold text-emerald-950 shadow-brutal-xs hover:-translate-y-0.5 transition-all disabled:opacity-60"
                >
                  {bulkLoading ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                  <span>Pulihkan ({selectedIds.size})</span>
                </button>
              )}

              {/* Empty Trash Button */}
              <button
                type="button"
                onClick={handleEmptyTrash}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-ink bg-coral hover:bg-coral/90 px-3.5 py-1.5 text-xs font-bold text-red-950 shadow-brutal-xs hover:-translate-y-0.5 transition-all disabled:opacity-60 ml-auto"
              >
                <Trash2 className="size-3.5" />
                <span>Kosongkan Sampah</span>
              </button>
            </div>
          </div>

          {/* Search Result Empty Notice */}
          {searchQuery.trim() && filteredItems.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-ink/30 bg-card p-8 text-center shadow-brutal-xs">
              <Search className="mx-auto mb-2 size-6 text-muted-foreground" />
              <p className="font-display text-base font-bold text-foreground">Tidak ditemukan</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tidak ada item sampah yang cocok dengan &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3 inline-flex items-center gap-1 rounded-xl border-2 border-ink bg-card px-3 py-1.5 text-xs font-bold shadow-brutal-xs hover:bg-muted"
              >
                Hapus pencarian
              </button>
            </div>
          )}

          {/* List of Trashed Items */}
          {filteredItems.length > 0 && (
            <div className="space-y-2.5">
              {filteredItems.map(item => {
                const key      = trashItemId(item);
                const selected = selectedIds.has(key);

                if (item.kind === "folder") {
                  return (
                    <TrashedFolderRow
                      key={key}
                      folder={item.data}
                      selected={selected}
                      onToggleSelect={() => toggleSelect(item)}
                      onRestore={handleRestoreFolder}
                      onDelete={handleDeleteFolder}
                    />
                  );
                }

                return (
                  <TrashedFileRow
                    key={key}
                    file={item.data}
                    selected={selected}
                    onToggleSelect={() => toggleSelect(item)}
                    onRestore={handleRestoreFile}
                    onDelete={handleDeleteFile}
                  />
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ─── Dialogs ─── */}
      {deletingFile && (
        <ConfirmDialog
          title="Hapus File Permanen"
          message={`"${deletingFile.name}" akan dihapus secara permanen dari server dan tidak bisa dipulihkan.`}
          confirmLabel="Ya, Hapus Permanen"
          variant="destructive"
          onConfirm={confirmDeleteFile}
          onCancel={() => setDeletingFile(null)}
        />
      )}

      {deletingFolder && (
        <ConfirmDialog
          title="Hapus Folder Permanen"
          message={`Folder "${deletingFolder.name}" beserta semua isinya akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan.`}
          confirmLabel="Ya, Hapus Folder"
          variant="destructive"
          onConfirm={confirmDeleteFolder}
          onCancel={() => setDeletingFolder(null)}
        />
      )}

      {confirmEmpty && (
        <ConfirmDialog
          title="Kosongkan Semua Sampah"
          message="Seluruh file dan folder yang ada di sampah akan dihapus secara permanen dari server dan membebaskan kuota storage. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Kosongkan Semua"
          variant="destructive"
          onConfirm={confirmEmptyTrash}
          onCancel={() => setConfirmEmpty(false)}
        />
      )}

    </section>
  );
}
