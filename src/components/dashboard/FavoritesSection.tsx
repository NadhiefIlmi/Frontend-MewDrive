/**
 * FavoritesSection Component
 * Menampilkan berkas dan folder favorit (starred) dari API.
 * Desain Neo-Brutalisme MewDrive responsif di desktop & mobile,
 * dilengkapi Cockpit Hero Banner, Stats Counter, Toolbar Filter & Search,
 * Tampilan Grid/List, serta Empty State yang informatif & interaktif.
 */

import { useState, useMemo, useEffect } from "react";
import {
  Star, StarOff, Loader2, Download, Eye,
  FileText, FileImage, FileArchive, FileSpreadsheet, File, Trash2,
  Folder, ArrowRight, Search, Sparkles,
  Presentation, Video, Music, HardDrive, FolderOpen,
  Compass, CheckCircle2,
} from "lucide-react";
import { api, type FileItem, type Folder as ApiFolderT } from "@/lib/api";
import { getFolderIcon } from "@/components/dashboard/FolderSection";
import { FilePreviewDialog } from "@/components/dashboard/FilePreviewDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const FOLDERS_LIMIT = 12;
const FILES_LIMIT   = 10;

// ─── Color resolver ───────────────────────────────────────────────────────────
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
  if (mimeType.startsWith("video/") || ["mp4", "webm", "mkv", "avi"].includes(ext)) {
    return Video;
  }
  if (mimeType.startsWith("audio/") || ["mp3", "wav", "ogg", "flac"].includes(ext)) {
    return Music;
  }
  return File;
}

function getFileColorCls(mimeType: string, extension?: string): string {
  const ext = (extension || "").toLowerCase();
  if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "bg-lilac";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || ["xlsx", "xls", "csv"].includes(ext)) return "bg-lime";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint") || ["pptx", "ppt"].includes(ext)) return "bg-sun";
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

function formatBytes(bytes: number | string): string {
  const num = typeof bytes === "string" ? Number(bytes) : bytes;
  if (!num || isNaN(num) || num <= 0) return "0 B";
  if (num >= 1073741824) return `${(num / 1073741824).toFixed(1)} GB`;
  if (num >= 1048576)    return `${(num / 1048576).toFixed(1)} MB`;
  if (num >= 1024)       return `${(num / 1024).toFixed(0)} KB`;
  return `${Math.round(num)} B`;
}

// ─── Load More Button ─────────────────────────────────────────────────────────
function LoadMoreButton({
  shown,
  total,
  loading,
  label,
  onLoadMore,
}: {
  shown: number;
  total: number;
  loading: boolean;
  label: string;
  onLoadMore: () => void;
}) {
  if (shown >= total) return null;
  return (
    <div className="mt-4 flex flex-col items-center gap-1.5 pt-2">
      <button
        onClick={onLoadMore}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-card px-5 py-2.5 text-xs sm:text-sm font-bold shadow-brutal-xs hover:shadow-brutal-sm transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <span>Muat Lebih Banyak {label}</span>}
      </button>
      <p className="text-[11px] font-semibold text-muted-foreground">
        Menampilkan {shown} dari {total} {label}
      </p>
    </div>
  );
}

// ─── Starred Folder Card ──────────────────────────────────────────────────────
function StarredFolderCard({
  folder,
  onUnstar,
  onOpen,
}: {
  folder: ApiFolderT;
  onUnstar: (folder: ApiFolderT) => void;
  onOpen: (folder: ApiFolderT) => void;
}) {
  const FolderIcon = getFolderIcon((folder as any).icon ?? "folder");
  const colorCls   = resolveFolderColor(folder.color);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(folder)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(folder); } }}
      className={`group relative flex flex-col justify-between rounded-2xl border-2 border-ink p-3.5 sm:p-4 shadow-brutal-xs hover:shadow-brutal hover:-translate-y-0.5 transition-all duration-200 cursor-pointer min-h-[130px] sm:min-h-[140px] text-left ${colorCls}`}
      aria-label={`Buka folder ${folder.name}`}
    >
      {/* Top Row: Folder Icon + Unstar Button */}
      <div className="flex w-full items-start justify-between gap-2">
        <div className="grid size-11 place-items-center rounded-xl border-2 border-ink bg-card text-ink shadow-[1px_1px_0px_#000] group-hover:scale-105 transition-transform">
          <FolderIcon className="size-5 sm:size-6 text-ink" />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnstar(folder);
          }}
          title="Hapus dari favorit"
          className="grid size-8 place-items-center rounded-xl border-2 border-ink bg-card/90 hover:bg-card shadow-brutal-xs transition-colors hover:scale-105"
        >
          <Star className="size-4 fill-amber-400 text-amber-500" />
        </button>
      </div>

      {/* Bottom Row: Name + Open Indicator */}
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm sm:text-base font-bold text-foreground">
            {folder.name}
          </p>
          <span className="inline-block mt-0.5 rounded border border-ink/20 bg-background/60 px-1.5 py-0.2 text-[10px] font-bold text-foreground/80">
            Folder Direktori
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 rounded-lg border border-ink/30 bg-background/80 px-2 py-1 text-[11px] font-bold text-foreground shadow-[1px_1px_0px_#000] group-hover:bg-sun transition-colors">
          <span>Buka</span>
          <ArrowRight className="size-3" />
        </div>
      </div>
    </div>
  );
}

// ─── Starred File Row (List Mode) ─────────────────────────────────────────────
function StarredFileRow({
  file,
  onUnstar,
  onPreview,
  onTrash,
}: {
  file: FileItem;
  onUnstar: (file: FileItem) => void;
  onPreview: (file: FileItem) => void;
  onTrash: (file: FileItem) => void;
}) {
  const Icon     = getFileIcon(file.mime_type, file.extension);
  const colorCls = getFileColorCls(file.mime_type, file.extension);
  const badgeCls = getFileBadgeCls(file.mime_type, file.extension);
  const { can }  = useAuth();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onPreview(file)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPreview(file); } }}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-card p-3 sm:p-3.5 shadow-brutal-xs hover:shadow-brutal-sm hover:-translate-y-0.5 transition-all text-left cursor-pointer"
    >
      {/* File Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`grid size-10 sm:size-11 shrink-0 place-items-center rounded-xl border-2 border-ink ${colorCls} shadow-[1px_1px_0px_#000] group-hover:scale-105 transition-transform`}>
          <Icon className="size-5 text-ink" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm sm:text-base font-bold text-foreground leading-snug">
            {file.name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className={`inline-block rounded border px-1.5 py-0.2 text-[10px] font-bold uppercase ${badgeCls}`}>
              {file.extension || "FILE"}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              • {formatBytes(file.size)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t border-ink/10 sm:border-t-0" onClick={e => e.stopPropagation()}>
        {/* Preview Button */}
        <button
          type="button"
          onClick={() => onPreview(file)}
          title="Pratinjau berkas"
          className="grid size-8 place-items-center rounded-xl border-2 border-ink bg-card hover:bg-sky shadow-brutal-xs transition-colors"
        >
          <Eye className="size-3.5 text-ink" />
        </button>

        {/* Download Button */}
        {(!can || can('download_files')) && (
          <a
            href={api.getFileDownloadUrl(file.id)}
            download={file.original_name}
            title="Unduh berkas"
            className="grid size-8 place-items-center rounded-xl border-2 border-ink bg-card hover:bg-lime shadow-brutal-xs transition-colors"
          >
            <Download className="size-3.5 text-ink" />
          </a>
        )}

        {/* Unstar Button */}
        <button
          type="button"
          onClick={() => onUnstar(file)}
          title="Hapus dari favorit"
          className="grid size-8 place-items-center rounded-xl border-2 border-ink bg-card hover:bg-sun shadow-brutal-xs transition-colors"
        >
          <Star className="size-3.5 fill-amber-400 text-amber-500" />
        </button>

        {/* Trash Button */}
        {(!can || can('delete_files')) && (
          <button
            type="button"
            onClick={() => onTrash(file)}
            title="Pindahkan ke sampah"
            className="grid size-8 place-items-center rounded-xl border-2 border-ink bg-card hover:bg-coral shadow-brutal-xs text-red-600 transition-colors"
          >
            <Trash2 className="size-3.5 text-red-600" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main FavoritesSection ────────────────────────────────────────────────────
interface FavoritesSectionProps {
  onFolderOpen: (folder: ApiFolderT) => void;
  onFlash: (msg: string, type?: "success" | "error" | "info") => void;
  onSectionChange?: (section: any) => void;
  isActive?: boolean;
}

export function FavoritesSection({ onFolderOpen, onFlash, onSectionChange, isActive }: FavoritesSectionProps) {
  const queryClient = useQueryClient();
  const [previewFile,    setPreviewFile]    = useState<FileItem | null>(null);
  const [trashingFile,   setTrashingFile]   = useState<FileItem | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab]     = useState<"all" | "folders" | "files">("all");

  // Extra pages (load more)
  const [extraFiles,         setExtraFiles]         = useState<FileItem[]>([]);
  const [extraFolders,       setExtraFolders]       = useState<ApiFolderT[]>([]);
  const [filesPage,          setFilesPage]          = useState(1);
  const [foldersPage,        setFoldersPage]        = useState(1);
  const [filesLoadingMore,   setFilesLoadingMore]   = useState(false);
  const [foldersLoadingMore, setFoldersLoadingMore] = useState(false);

  // React Query — real-time cache
  const { data: queryData, isLoading: loading, refetch } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const [filesRes, foldersRes] = await Promise.all([
        api.getFileStarred({ page: 1, limit: FILES_LIMIT }),
        api.getFolderStarred({ page: 1, limit: FOLDERS_LIMIT }),
      ]);
      return {
        files:        filesRes.data?.files        ?? [],
        filesTotal:   filesRes.data?.total        ?? 0,
        folders:      (foldersRes.data?.folders   ?? []) as ApiFolderT[],
        foldersTotal: foldersRes.data?.total      ?? 0,
      };
    },
    staleTime: 0,
  });

  // Auto-refetch saat tab Favorit aktif
  useEffect(() => {
    if (isActive) {
      refetch();
    }
  }, [isActive, refetch]);

  const rawStarredFiles   = useMemo(() => [...(queryData?.files   ?? []), ...extraFiles], [queryData?.files, extraFiles]);
  const rawStarredFolders = useMemo(() => [...(queryData?.folders ?? []), ...extraFolders], [queryData?.folders, extraFolders]);
  const filesTotal        = queryData?.filesTotal   ?? 0;
  const foldersTotal      = queryData?.foldersTotal ?? 0;
  const totalItems        = filesTotal + foldersTotal;

  // Filtered by search query
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return rawStarredFolders;
    const q = searchQuery.toLowerCase();
    return rawStarredFolders.filter(f => f.name.toLowerCase().includes(q));
  }, [rawStarredFolders, searchQuery]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return rawStarredFiles;
    const q = searchQuery.toLowerCase();
    return rawStarredFiles.filter(f => f.name.toLowerCase().includes(q) || (f.extension && f.extension.toLowerCase().includes(q)));
  }, [rawStarredFiles, searchQuery]);

  // Load more files
  const loadMoreFiles = async () => {
    setFilesLoadingMore(true);
    const nextPage = filesPage + 1;
    const res = await api.getFileStarred({ page: nextPage, limit: FILES_LIMIT });
    if (res.success && res.data) {
      setExtraFiles(prev => [...prev, ...res.data!.files]);
      setFilesPage(nextPage);
    }
    setFilesLoadingMore(false);
  };

  // Load more folders
  const loadMoreFolders = async () => {
    setFoldersLoadingMore(true);
    const nextPage = foldersPage + 1;
    const res = await api.getFolderStarred({ page: nextPage, limit: FOLDERS_LIMIT });
    if (res.success && res.data) {
      setExtraFolders(prev => [...prev, ...(res.data!.folders as ApiFolderT[])]);
      setFoldersPage(nextPage);
    }
    setFoldersLoadingMore(false);
  };

  // Unstar handlers
  const handleUnstarFile = async (file: FileItem) => {
    const res = await api.updateFile(file.id, { is_starred: false });
    if (res.success) {
      queryClient.setQueryData<typeof queryData>(["favorites"], old => {
        if (!old) return old;
        return {
          ...old,
          files: old.files.filter(f => f.id !== file.id),
          filesTotal: Math.max(0, old.filesTotal - 1),
        };
      });
      setExtraFiles(prev => prev.filter(f => f.id !== file.id));
      onFlash(`"${file.name}" dihapus dari favorit`);
    } else {
      onFlash(res.error?.message ?? "Gagal update file", "error");
    }
  };

  const handleUnstarFolder = async (folder: ApiFolderT) => {
    const res = await api.updateFolder(folder.id, { is_starred: false });
    if (res.success) {
      queryClient.setQueryData<typeof queryData>(["favorites"], old => {
        if (!old) return old;
        return {
          ...old,
          folders: old.folders.filter(f => f.id !== folder.id),
          foldersTotal: Math.max(0, old.foldersTotal - 1),
        };
      });
      setExtraFolders(prev => prev.filter(f => f.id !== folder.id));
      onFlash(`"${folder.name}" dihapus dari favorit`);
    } else {
      onFlash(res.error?.message ?? "Gagal update folder", "error");
    }
  };

  const handleTrashFile = (file: FileItem) => {
    setTrashingFile(file);
  };

  const confirmTrashFile = async () => {
    if (!trashingFile) return;
    const res = await api.trashFile(trashingFile.id);
    if (res.success) {
      queryClient.setQueryData<typeof queryData>(["favorites"], old => {
        if (!old) return old;
        return {
          ...old,
          files: old.files.filter(f => f.id !== trashingFile!.id),
          filesTotal: Math.max(0, old.filesTotal - 1),
        };
      });
      setExtraFiles(prev => prev.filter(f => f.id !== trashingFile.id));
      onFlash(`"${trashingFile.name}" dipindahkan ke sampah`);
    } else {
      onFlash(res.error?.message ?? "Gagal menghapus file", "error");
    }
    setTrashingFile(null);
  };

  const isGlobalEmpty = totalItems === 0 && rawStarredFiles.length === 0 && rawStarredFolders.length === 0;

  return (
    <section className="space-y-6 pt-2">

      {/* ─── 1. Cockpit Hero Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-sun/30 p-5 sm:p-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className="grid size-12 sm:size-14 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-sun text-ink shadow-brutal-xs">
            <Star className="size-6 sm:size-7 fill-ink text-ink" />
          </div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/30 bg-background/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink mb-1.5">
              Pilihan penting
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Favorit
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground max-w-xl leading-relaxed">
              Akses cepat ke seluruh berkas dan folder yang sudah kamu tandai dengan bintang (★).
            </p>
          </div>
        </div>

        {/* Counter Pill Badge */}
        <div className="shrink-0 self-start md:self-center">
          <div className="inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-card px-4 py-2 font-bold shadow-brutal-xs">
            <Sparkles className="size-4 text-amber-500" />
            <span className="text-xs sm:text-sm">
              {loading ? "Memuat..." : `${totalItems} Item Favorit`}
            </span>
          </div>
        </div>
      </div>
      {/* ─── 2. Loading State ─── */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-ink" />
          <p className="font-display text-base font-bold text-foreground">Memuat dokumen favorit...</p>
        </div>
      )}

      {/* ─── 4. Empty State (Ketika Belum Ada Favorit) ─── */}
      {!loading && isGlobalEmpty && (
        <div className="rounded-2xl border-2 border-dashed border-ink/40 bg-card p-6 sm:p-10 text-center shadow-brutal-sm space-y-6">
          <div className="relative mx-auto size-20 sm:size-24">
            <div className="grid size-full place-items-center rounded-2xl border-2 border-ink bg-sun shadow-brutal rotate-3 hover:rotate-0 transition-transform">
              <Star className="size-10 sm:size-12 fill-ink text-ink" />
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Belum ada favorit
            </h2>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
              Tandai file atau folder dengan ★ untuk menampilkannya di sini agar kamu bisa membukanya secara instan.
            </p>
          </div>

          {/* Quick Guide Step Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2 text-left">
            <div className="rounded-xl border-2 border-ink bg-muted/40 p-3 shadow-brutal-xs space-y-1">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-sun border border-ink text-[11px] font-extrabold text-ink">
                1
              </span>
              <p className="font-bold text-xs text-foreground">Buka Dokumen Saya</p>
              <p className="text-[11px] text-muted-foreground">Jelajahi folder atau berkas yang kamu miliki.</p>
            </div>

            <div className="rounded-xl border-2 border-ink bg-muted/40 p-3 shadow-brutal-xs space-y-1">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-sky border border-ink text-[11px] font-extrabold text-ink">
                2
              </span>
              <p className="font-bold text-xs text-foreground">Klik Ikon Bintang (★)</p>
              <p className="text-[11px] text-muted-foreground">Tandai folder atau berkas yang paling sering dipakai.</p>
            </div>

            <div className="rounded-xl border-2 border-ink bg-muted/40 p-3 shadow-brutal-xs space-y-1">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-lime border border-ink text-[11px] font-extrabold text-ink">
                3
              </span>
              <p className="font-bold text-xs text-foreground">Akses Instan</p>
              <p className="text-[11px] text-muted-foreground">Semua item penting terkumpul rapi di halaman ini.</p>
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
                <span>Jelajahi Dokumen Saya</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── 5. Content with Toolbar (Filter Tabs, Search & View Switcher) ─── */}
      {!loading && !isGlobalEmpty && (
        <div className="space-y-6">

          {/* Interactive Toolbar */}
          <div className="rounded-2xl border-2 border-ink bg-card p-3 sm:p-4 shadow-brutal-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
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
                  {totalItems}
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
                  {foldersTotal}
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
                  {filesTotal}
                </span>
              </button>
            </div>

            {/* Right Tools: Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari favorit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-2 border-ink bg-background py-1.5 pl-8 pr-3 text-xs sm:text-sm font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ink"
              />
            </div>
          </div>

          {/* Search Result Empty Notice */}
          {searchQuery.trim() && filteredFolders.length === 0 && filteredFiles.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-ink/30 bg-card p-8 text-center shadow-brutal-xs">
              <Search className="mx-auto mb-2 size-6 text-muted-foreground" />
              <p className="font-display text-base font-bold text-foreground">Tidak ditemukan</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tidak ada folder atau berkas favorit yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;.
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

          {/* ─── Starred Folders Section ─── */}
          {(activeTab === "all" || activeTab === "folders") && filteredFolders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-ink/15 pb-2">
                <div className="flex items-center gap-2">
                  <Folder className="size-4 text-sky-700" />
                  <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                    Folder Favorit
                  </h2>
                </div>
                <span className="rounded-full border border-ink/30 bg-sky/30 px-2 py-0.5 text-xs font-bold text-sky-950">
                  {filteredFolders.length} folder
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFolders.map(folder => (
                  <StarredFolderCard
                    key={folder.id}
                    folder={folder}
                    onUnstar={handleUnstarFolder}
                    onOpen={onFolderOpen}
                  />
                ))}
              </div>

              {!searchQuery && (
                <LoadMoreButton
                  shown={rawStarredFolders.length}
                  total={foldersTotal}
                  loading={foldersLoadingMore}
                  label="folder"
                  onLoadMore={loadMoreFolders}
                />
              )}
            </div>
          )}

          {/* ─── Starred Files Section ─── */}
          {(activeTab === "all" || activeTab === "files") && filteredFiles.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b-2 border-ink/15 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-purple-700" />
                  <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                    File Favorit
                  </h2>
                </div>
                <span className="rounded-full border border-ink/30 bg-lilac/40 px-2 py-0.5 text-xs font-bold text-purple-950">
                  {filteredFiles.length} berkas
                </span>
              </div>

              <div className="space-y-2.5">
                {filteredFiles.map(file => (
                  <StarredFileRow
                    key={file.id}
                    file={file}
                    onUnstar={handleUnstarFile}
                    onPreview={setPreviewFile}
                    onTrash={handleTrashFile}
                  />
                ))}
              </div>

              {!searchQuery && (
                <LoadMoreButton
                  shown={rawStarredFiles.length}
                  total={filesTotal}
                  loading={filesLoadingMore}
                  label="file"
                  onLoadMore={loadMoreFiles}
                />
              )}
            </div>
          )}

        </div>
      )}

      {/* ─── Dialogs ─── */}
      {previewFile && (
        <FilePreviewDialog
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {trashingFile && (
        <ConfirmDialog
          title="Pindah ke Sampah"
          message={`"${trashingFile.name}" akan dipindahkan ke sampah. Kamu bisa memulihkannya nanti.`}
          confirmLabel="Pindahkan"
          variant="destructive"
          onConfirm={confirmTrashFile}
          onCancel={() => setTrashingFile(null)}
        />
      )}

    </section>
  );
}
