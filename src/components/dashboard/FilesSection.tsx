/**
 * FilesSection Component
 * Menampilkan file real dari API — dengan Neo-Brutalisme styling,
 * switcher tampilan List & Grid, responsive desktop & mobile,
 * serta permission gating yang konsisten.
 */

import { useState, useRef, useEffect } from "react";
import {
  Star, Trash2, RotateCcw, Download, MoreHorizontal,
  FileText, FileImage, FileArchive, FileSpreadsheet,
  File, Loader2, Pencil, X, MoveRight, Share2, Upload,
  Presentation, LayoutGrid, List, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type FileItem } from "@/lib/api";
import { FilePreviewDialog } from "@/components/dashboard/FilePreviewDialog";
import { MoveDialog } from "@/components/dashboard/MoveDialog";
import { ShareLinkDialog } from "@/components/dashboard/ShareLinkDialog";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useQueryClient } from "@tanstack/react-query";

// ─── Rename Dialog ────────────────────────────────────────────────────────────
function RenameFileDialog({
  file,
  onClose,
  onRenamed,
}: {
  file: FileItem;
  onClose: () => void;
  onRenamed: (updated: FileItem) => void;
}) {
  const [name, setName]       = useState(file.name);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === file.name) { onClose(); return; }
    setLoading(true);
    setError(null);
    const res = await api.updateFile(file.id, { name: trimmed });
    setLoading(false);
    if (res.success && res.data) {
      onRenamed(res.data);
    } else {
      setError(res.error?.message ?? "Gagal mengubah nama");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border-2 border-ink bg-card p-6 shadow-brutal"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Ubah Nama File</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}><X className="size-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={255}
            className="w-full rounded-xl border-2 border-ink bg-background px-4 py-2.5 font-semibold outline-none focus:ring-2 focus:ring-ink"
          />
          {error && <p className="text-sm font-bold text-red-600">{error}</p>}
          <div className="flex gap-3">
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

// ─── Helpers: Icon & Color ────────────────────────────────────────────────────
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
  if (mimeType.includes("word") || ["docx", "doc", "txt", "rtf", "md"].includes(ext)) {
    return FileText;
  }
  return File;
}

function getFileColor(mimeType: string, extension?: string): string {
  const ext = (extension || "").toLowerCase();
  if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) return "bg-lilac";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint") || ["pptx", "ppt"].includes(ext)) return "bg-orange-200";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || ["xlsx", "xls", "csv"].includes(ext)) return "bg-lime";
  if (mimeType.includes("pdf") || ext === "pdf") return "bg-coral";
  if (mimeType.includes("zip") || mimeType.includes("rar") || ["zip", "rar", "7z"].includes(ext)) return "bg-sun";
  return "bg-sky";
}

function getFileBadgeColor(extension?: string): string {
  const ext = (extension || "").toLowerCase();
  if (["pdf"].includes(ext)) return "bg-coral/30 text-red-950 border-red-400";
  if (["pptx", "ppt"].includes(ext)) return "bg-orange-200/60 text-orange-950 border-orange-400";
  if (["jpg", "jpeg", "png", "webp", "svg"].includes(ext)) return "bg-lilac/50 text-purple-950 border-purple-400";
  if (["xlsx", "xls", "csv"].includes(ext)) return "bg-lime/50 text-emerald-950 border-emerald-500";
  if (["zip", "rar", "7z"].includes(ext)) return "bg-sun/50 text-amber-950 border-amber-500";
  return "bg-sky/40 text-sky-950 border-sky-400";
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024)       return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes > 0)           return `${Math.round(bytes)} B`;
  return `${bytes} B`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)  return "Baru saja";
  if (diffMins < 60) return `${diffMins} mnt lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ─── File Card Row (List Mode) ────────────────────────────────────────────────
function FileRow({
  file,
  openMenuId,
  onMenuToggle,
  onTrash,
  onRestore,
  onToggleStar,
  onDelete,
  onPreview,
  onRename,
  onMove,
  onShare,
}: {
  file: FileItem;
  openMenuId: number | null;
  onMenuToggle: (id: number | null) => void;
  onTrash: (id: number) => void;
  onRestore: (id: number) => void;
  onToggleStar: (id: number) => void;
  onDelete: (id: number) => void;
  onPreview: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onMove: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
}) {
  const Icon  = getFileIcon(file.mime_type, file.extension);
  const color = getFileColor(file.mime_type, file.extension);
  const badgeCls = getFileBadgeColor(file.extension);
  const isMenuOpen = openMenuId === file.id;
  const [menuUp, setMenuUp]     = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const { can } = useAuth();

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMenuOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setMenuUp(spaceBelow < 270);
    }
    onMenuToggle(isMenuOpen ? null : file.id);
  };

  return (
    <div className={`group relative flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-card p-3 sm:p-3.5 shadow-brutal-xs hover:shadow-brutal-sm transition-all duration-150 hover:-translate-y-0.5 ${isMenuOpen ? 'z-30' : 'z-0'}`}>
      {/* Left: Icon & File Meta */}
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5">
        <div
          onClick={() => onPreview(file)}
          className={`grid size-11 sm:size-12 shrink-0 cursor-pointer place-items-center rounded-xl border-2 border-ink ${color} shadow-[1px_1px_0px_#000] group-hover:scale-105 transition-transform`}
          title="Klik untuk melihat preview"
        >
          <Icon className="size-5 sm:size-6 text-ink" />
        </div>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onPreview(file)}
            className="w-full truncate text-left font-display text-sm sm:text-base font-bold text-foreground block"
            title={file.name}
          >
            {file.name}
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span className={`inline-flex items-center rounded border px-1.5 py-0.2 text-[10px] font-bold uppercase ${badgeCls}`}>
              {file.extension || "FILE"}
            </span>
            <span>•</span>
            <span className="font-bold text-foreground/80">{formatBytes(file.size)}</span>
            <span>•</span>
            <span className="truncate">{formatDate(file.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div className="relative flex shrink-0 items-center gap-1">
        {/* Quick Preview Eye */}
        <button
          type="button"
          onClick={() => onPreview(file)}
          className="grid size-8 place-items-center rounded-lg border border-ink/30 bg-background hover:bg-muted shadow-brutal-xs text-foreground transition-colors"
          title="Preview file"
        >
          <Eye className="size-4" />
        </button>

        {/* Bintang */}
        <button
          type="button"
          onClick={() => onToggleStar(file.id)}
          className="grid size-8 place-items-center rounded-lg border border-ink/30 bg-background hover:bg-card shadow-brutal-xs transition-colors"
          title={file.is_starred ? "Hapus bintang" : "Beri bintang"}
        >
          <Star className={`size-4 ${file.is_starred ? "fill-amber-400 text-amber-500" : "text-muted-foreground"}`} />
        </button>

        {/* Download direct button — visible sm+ */}
        {!file.is_trashed && can('download_files') && (
          <a
            href={api.getFileDownloadUrl(file.id)}
            download={file.original_name}
            title="Unduh file"
            className="hidden sm:grid size-8 place-items-center rounded-lg border border-ink/30 bg-background hover:bg-muted shadow-brutal-xs transition-colors"
          >
            <Download className="size-4 text-ink" />
          </a>
        )}

        {/* Trash actions / More options */}
        {file.is_trashed ? (
          <>
            {can('delete_files') && (
              <button
                type="button"
                onClick={() => onRestore(file.id)}
                title="Pulihkan"
                className="grid size-8 place-items-center rounded-lg border border-ink/30 bg-background hover:bg-muted shadow-brutal-xs transition-colors"
              >
                <RotateCcw className="size-4" />
              </button>
            )}
            {can('delete_files') && (
              <button
                type="button"
                onClick={() => onDelete(file.id)}
                title="Hapus permanen"
                className="grid size-8 place-items-center rounded-lg border border-ink/30 bg-background hover:bg-red-50 text-red-600 shadow-brutal-xs transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </>
        ) : (
          (can('edit_files') || can('share_files') || can('delete_files')) && (
            <div className="relative">
              <button
                ref={btnRef}
                type="button"
                data-file-menu
                onClick={handleMenuToggle}
                className="grid size-8 place-items-center rounded-lg border border-ink/30 bg-background hover:bg-sun shadow-brutal-xs transition-colors"
                title="Opsi file"
              >
                <MoreHorizontal className="size-4" />
              </button>

              {isMenuOpen && (
                <div
                  data-file-menu
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute right-0 z-50 min-w-[160px] rounded-2xl border-2 border-ink bg-card p-1.5 shadow-brutal ${menuUp ? 'bottom-9' : 'top-9'}`}
                >
                  {can('download_files') && (
                    <a
                      href={api.getFileDownloadUrl(file.id)}
                      download={file.original_name}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-muted sm:hidden"
                      onClick={() => onMenuToggle(null)}
                    >
                      <Download className="size-4" /> Unduh
                    </a>
                  )}
                  {can('edit_files') && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-sun"
                      onClick={() => { onRename(file); onMenuToggle(null); }}
                    >
                      <Pencil className="size-4" /> Ubah Nama
                    </button>
                  )}
                  {can('edit_files') && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-sun"
                      onClick={() => { onMove(file); onMenuToggle(null); }}
                    >
                      <MoveRight className="size-4" /> Pindahkan
                    </button>
                  )}
                  {can('share_files') && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-sun"
                      onClick={() => { onShare(file); onMenuToggle(null); }}
                    >
                      <Share2 className="size-4" /> Bagikan
                    </button>
                  )}
                  {can('delete_files') && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
                      onClick={() => { onTrash(file.id); onMenuToggle(null); }}
                    >
                      <Trash2 className="size-4" /> Hapus
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── File Grid Card (Grid Mode) ───────────────────────────────────────────────
function FileGridCard({
  file,
  openMenuId,
  onMenuToggle,
  onTrash,
  onRestore,
  onToggleStar,
  onDelete,
  onPreview,
  onRename,
  onMove,
  onShare,
}: {
  file: FileItem;
  openMenuId: number | null;
  onMenuToggle: (id: number | null) => void;
  onTrash: (id: number) => void;
  onRestore: (id: number) => void;
  onToggleStar: (id: number) => void;
  onDelete: (id: number) => void;
  onPreview: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onMove: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
}) {
  const Icon  = getFileIcon(file.mime_type, file.extension);
  const color = getFileColor(file.mime_type, file.extension);
  const badgeCls = getFileBadgeColor(file.extension);
  const isMenuOpen = openMenuId === file.id;
  const [menuUp, setMenuUp]     = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const { can } = useAuth();

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMenuOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setMenuUp(spaceBelow < 270);
    }
    onMenuToggle(isMenuOpen ? null : file.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onPreview(file)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPreview(file); } }}
      className={`group relative flex flex-col justify-between rounded-2xl border-2 border-ink bg-card p-3.5 sm:p-4 shadow-brutal-xs hover:shadow-brutal transition-all duration-200 hover:-translate-y-0.5 text-left cursor-pointer min-h-[160px] sm:min-h-[175px] ${isMenuOpen ? 'z-30' : 'z-0'}`}
    >
      {/* Top row: Icon badge + Action buttons */}
      <div className="flex w-full items-start justify-between gap-2">
        <div className={`grid size-11 place-items-center rounded-xl border-2 border-ink ${color} shadow-[1px_1px_0px_#000] group-hover:scale-105 transition-transform`}>
          <Icon className="size-5 sm:size-6 text-ink" />
        </div>

        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(file.id);
            }}
            className="grid size-7 place-items-center rounded-lg border-2 border-ink bg-card/80 hover:bg-card shadow-brutal-xs transition-colors"
            title={file.is_starred ? "Hapus bintang" : "Beri bintang"}
          >
            <Star className={`size-3.5 ${file.is_starred ? "fill-amber-400 text-amber-500" : "text-muted-foreground"}`} />
          </button>

          {(can('edit_files') || can('share_files') || can('delete_files') || can('download_files')) && (
            <div className="relative">
              <button
                ref={btnRef}
                type="button"
                data-file-menu
                onClick={handleMenuToggle}
                className="grid size-7 place-items-center rounded-lg border-2 border-ink bg-card/80 hover:bg-sun shadow-brutal-xs transition-colors"
                title="Opsi file"
              >
                <MoreHorizontal className="size-3.5 text-ink" />
              </button>

              {isMenuOpen && (
                <div
                  data-file-menu
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute right-0 z-50 min-w-[150px] rounded-2xl border-2 border-ink bg-card p-1.5 shadow-brutal ${menuUp ? 'bottom-8' : 'top-8'}`}
                >
                  {can('download_files') && (
                    <a
                      href={api.getFileDownloadUrl(file.id)}
                      download={file.original_name}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-muted"
                      onClick={() => onMenuToggle(null)}
                    >
                      <Download className="size-4" /> Unduh
                    </a>
                  )}
                  {can('edit_files') && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-sun"
                      onClick={(e) => { e.stopPropagation(); onRename(file); onMenuToggle(null); }}
                    >
                      <Pencil className="size-4" /> Ubah Nama
                    </button>
                  )}
                  {can('edit_files') && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-sun"
                      onClick={(e) => { e.stopPropagation(); onMove(file); onMenuToggle(null); }}
                    >
                      <MoveRight className="size-4" /> Pindahkan
                    </button>
                  )}
                  {can('share_files') && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors hover:bg-sun"
                      onClick={(e) => { e.stopPropagation(); onShare(file); onMenuToggle(null); }}
                    >
                      <Share2 className="size-4" /> Bagikan
                    </button>
                  )}
                  {can('delete_files') && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
                      onClick={(e) => { e.stopPropagation(); onTrash(file.id); onMenuToggle(null); }}
                    >
                      <Trash2 className="size-4" /> Hapus
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center: File name */}
      <div className="w-full pt-3">
        <p className="line-clamp-2 font-display text-sm sm:text-base font-bold text-foreground leading-snug">
          {file.name}
        </p>
      </div>

      {/* Bottom: Extension & Size */}
      <div className="mt-3 flex items-center justify-between border-t border-ink/15 pt-2 text-xs font-semibold text-muted-foreground">
        <span className={`inline-flex items-center rounded border px-1.5 py-0.2 text-[10px] font-bold uppercase ${badgeCls}`}>
          {file.extension || "FILE"}
        </span>
        <span className="text-[11px] font-bold text-foreground/80">
          {formatBytes(file.size)}
        </span>
      </div>
    </div>
  );
}

// ─── Main FilesSection ────────────────────────────────────────────────────────
interface FilesSectionProps {
  files: FileItem[];
  loading?: boolean;
  filesTotal?: number;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  onFilesChanged: () => void;
  onFlash: (msg: string, type?: "success" | "error" | "info") => void;
  onUploadClick?: () => void;
  onFileDrop?: (files: FileList) => void;
}

export function FilesSection({
  files,
  loading = false,
  filesTotal = 0,
  loadingMore = false,
  onLoadMore,
  onFilesChanged,
  onFlash,
  onUploadClick,
  onFileDrop,
}: FilesSectionProps) {
  const [viewMode, setViewMode]             = useState<"list" | "grid">("list");
  const [openMenuId, setOpenMenuId]         = useState<number | null>(null);
  const [previewingFile, setPreviewingFile] = useState<FileItem | null>(null);
  const [renamingFile, setRenamingFile]     = useState<FileItem | null>(null);
  const [movingFile, setMovingFile]         = useState<FileItem | null>(null);
  const [sharingFile, setSharingFile]       = useState<FileItem | null>(null);
  const [deletingFile, setDeletingFile]     = useState<FileItem | null>(null);
  const [isDragOver, setIsDragOver]         = useState(false);
  const { can } = useAuth();
  const queryClient = useQueryClient();

  // Close menu saat klik di luar — tanpa fixed overlay yang menahan stacking context
  useEffect(() => {
    if (openMenuId === null) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-file-menu]')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  const handleTrash = async (id: number) => {
    const res = await api.trashFile(id);
    if (res.success) {
      onFlash("File dipindahkan ke sampah");
      onFilesChanged();
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    }
    else onFlash(res.error?.message ?? "Gagal menghapus file", "error");
  };

  const handleRestore = async (id: number) => {
    const res = await api.restoreFile(id);
    if (res.success) {
      onFlash("File berhasil dipulihkan");
      onFilesChanged();
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    }
    else onFlash(res.error?.message ?? "Gagal memulihkan file", "error");
  };

  const handleToggleStar = async (id: number) => {
    const file = files.find(f => f.id === id);
    if (!file) return;
    const res = await api.updateFile(id, { is_starred: !file.is_starred });
    if (res.success) {
      onFilesChanged();
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    }
    else onFlash(res.error?.message ?? "Gagal update file", "error");
  };

  const handleDelete = async (id: number) => {
    const file = files.find(f => f.id === id);
    if (file) setDeletingFile(file);
  };

  const confirmDelete = async () => {
    if (!deletingFile) return;
    const res = await api.deleteFilePermanent(deletingFile.id);
    if (res.success) { onFlash("File dihapus permanen"); onFilesChanged(); }
    else onFlash(res.error?.message ?? "Gagal menghapus file", "error");
    setDeletingFile(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="font-semibold">Memuat file...</span>
      </div>
    );
  }

  return (
    <div>
      {/* ─── Files Header Bar ─── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg sm:text-xl font-bold flex items-center gap-2">
            Berkas & Dokumen
          </h2>
          <span className="rounded-full border-2 border-ink bg-lilac/40 px-2.5 py-0.5 text-xs font-bold text-ink">
            {filesTotal || files.length}
          </span>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2">
          {/* List & Grid toggle */}
          <div className="flex items-center rounded-xl border-2 border-ink bg-card p-0.5 shadow-brutal-xs">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`grid size-7 sm:size-8 place-items-center rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-sun border border-ink text-ink font-bold shadow-brutal-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Tampilan Daftar (List)"
              aria-label="Tampilan Daftar"
            >
              <List className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`grid size-7 sm:size-8 place-items-center rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-sun border border-ink text-ink font-bold shadow-brutal-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Tampilan Kotak (Grid)"
              aria-label="Tampilan Grid"
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>

          {can('create_files') && onUploadClick && (
            <button
              type="button"
              onClick={onUploadClick}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-ink bg-card hover:bg-muted px-3 py-1.5 text-xs font-bold text-foreground shadow-brutal-xs hover:-translate-y-0.5 transition-all"
            >
              <Upload className="size-3.5" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Files Content ─── */}
      {files.length === 0 ? (
        can('create_files') && (onUploadClick || onFileDrop) ? (
          <div
            onClick={onUploadClick}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files.length && onFileDrop) {
                onFileDrop(e.dataTransfer.files);
              }
            }}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all select-none shadow-brutal-xs ${
              isDragOver
                ? "border-ink bg-lime/30 scale-[1.01]"
                : "border-ink/40 bg-card hover:border-ink hover:bg-muted/40"
            }`}
          >
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl border-2 border-ink bg-lilac/30 shadow-brutal-xs">
              <Upload className="size-6 text-foreground" />
            </div>
            <p className="font-display text-base sm:text-lg font-bold">
              {isDragOver ? "Lepaskan untuk mengunggah berkas" : "Belum ada berkas di direktori ini"}
            </p>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Klik atau drag & drop berkas PDF, dokumen, atau foto ke sini untuk upload.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/30 bg-background/80 px-3 py-1 text-xs font-bold text-muted-foreground">
              <span>Maksimal 15 MB per berkas</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-ink/40 bg-card p-10 text-center">
            <Download className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="font-display text-lg font-bold">Belum ada file</p>
          </div>
        )
      ) : (
        <>
          {viewMode === "list" ? (
            <div className="space-y-2.5">
              {files.map(file => (
                <FileRow
                  key={file.id}
                  file={file}
                  openMenuId={openMenuId}
                  onMenuToggle={setOpenMenuId}
                  onTrash={handleTrash}
                  onRestore={handleRestore}
                  onToggleStar={handleToggleStar}
                  onDelete={handleDelete}
                  onPreview={setPreviewingFile}
                  onRename={setRenamingFile}
                  onMove={setMovingFile}
                  onShare={setSharingFile}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {files.map(file => (
                <FileGridCard
                  key={file.id}
                  file={file}
                  openMenuId={openMenuId}
                  onMenuToggle={setOpenMenuId}
                  onTrash={handleTrash}
                  onRestore={handleRestore}
                  onToggleStar={handleToggleStar}
                  onDelete={handleDelete}
                  onPreview={setPreviewingFile}
                  onRename={setRenamingFile}
                  onMove={setMovingFile}
                  onShare={setSharingFile}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {files.length < filesTotal && (
            <div className="flex flex-col items-center gap-1 pt-4">
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-xl border-2 border-ink bg-card px-5 py-2.5 text-sm font-bold shadow-brutal-xs transition-all hover:-translate-y-0.5 hover:shadow-brutal-sm disabled:pointer-events-none disabled:opacity-60"
              >
                {loadingMore ? <Loader2 className="size-4 animate-spin" /> : <span>Muat lebih banyak file</span>}
              </button>
              <p className="text-xs text-muted-foreground">
                Menampilkan {files.length} dari {filesTotal} file
              </p>
            </div>
          )}

          {/* Drag & drop upload bar indicator if user has permission */}
          {can('create_files') && onFileDrop && (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files.length) {
                  onFileDrop(e.dataTransfer.files);
                }
              }}
              onClick={onUploadClick}
              className={`mt-6 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 border-dashed p-4 transition-all ${
                isDragOver
                  ? "border-ink bg-lime/30 scale-[1.01]"
                  : "border-ink/30 bg-card/60 hover:border-ink hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl border border-ink bg-lime shadow-brutal-xs">
                  <Upload className="size-4 text-ink" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-foreground">
                    Tarik file ke sini untuk upload langsung
                  </p>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Atau klik di sini untuk memilih berkas dari perangkat
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex rounded-xl border border-ink/40 bg-background px-3 py-1 text-xs font-bold text-muted-foreground">
                Maks. 15 MB
              </span>
            </div>
          )}
        </>
      )}

      {/* Preview dialog */}
      {previewingFile && (
        <FilePreviewDialog
          file={previewingFile}
          onClose={() => setPreviewingFile(null)}
        />
      )}

      {/* Rename dialog */}
      {renamingFile && (
        <RenameFileDialog
          file={renamingFile}
          onClose={() => setRenamingFile(null)}
          onRenamed={(updated) => {
            setRenamingFile(null);
            onFilesChanged();
            onFlash(`File berhasil diubah nama menjadi "${updated.name}"`);
          }}
        />
      )}

      {/* Move dialog */}
      {movingFile && (
        <MoveDialog
          target={{ type: "file", item: movingFile }}
          onClose={() => setMovingFile(null)}
          onMoved={() => { setMovingFile(null); onFilesChanged(); }}
          onFlash={onFlash}
        />
      )}

      {/* Share Link dialog */}
      {sharingFile && (
        <ShareLinkDialog
          file={sharingFile}
          onClose={() => setSharingFile(null)}
        />
      )}

      {/* Konfirmasi hapus permanen */}
      {deletingFile && (
        <ConfirmDialog
          title="Hapus Permanen"
          message={`"${deletingFile.name}" akan dihapus secara permanen dan tidak bisa dipulihkan.`}
          confirmLabel="Ya, Hapus"
          variant="destructive"
          onConfirm={confirmDelete}
          onCancel={() => setDeletingFile(null)}
        />
      )}
    </div>
  );
}
