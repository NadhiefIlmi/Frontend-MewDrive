/**
 * FilesSection Component
 * Menampilkan file real dari API — dengan permission gating
 */

import {
  Star, Trash2, RotateCcw, Download, MoreHorizontal,
  FileText, FileImage, FileArchive, FileSpreadsheet,
  File, Loader2, Pencil, X, MoveRight, Share2, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type FileItem } from "@/lib/api";
import { useState } from "react";
import { FilePreviewDialog } from "@/components/dashboard/FilePreviewDialog";
import { MoveDialog } from "@/components/dashboard/MoveDialog";
import { ShareLinkDialog } from "@/components/dashboard/ShareLinkDialog";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
        className="w-full max-w-sm rounded-ui border-2 border-ink bg-card p-6 shadow-brutal"
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
            className="w-full rounded-ui border-2 border-ink bg-background px-4 py-2.5 font-semibold outline-none focus:ring-2 focus:ring-ink"
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

// ─── Helper: icon berdasarkan mime type ──────────────────────────────────────
function getFileIcon(mimeType: string): React.ElementType {
  if (mimeType.startsWith("image/"))  return FileImage;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv")
    return FileSpreadsheet;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar") ||
      mimeType.includes("gzip") || mimeType.includes("7z"))
    return FileArchive;
  if (mimeType.includes("pdf") || mimeType.includes("word") || mimeType.includes("text"))
    return FileText;
  return File;
}

// ─── Helper: warna card berdasarkan mime ─────────────────────────────────────
function getFileColor(mimeType: string): string {
  if (mimeType.startsWith("image/"))  return "bg-lilac";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "bg-lime";
  if (mimeType.includes("pdf"))       return "bg-coral";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "bg-sun";
  return "bg-sky";
}

// ─── Helper: format ukuran file ──────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024)       return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes > 0)           return `${Math.round(bytes)} B`;
  return `${bytes} B`;
}

// ─── Helper: format tanggal ───────────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)  return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ─── File Card Row ────────────────────────────────────────────────────────────
function FileRow({
  file,
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
  onTrash: (id: number) => void;
  onRestore: (id: number) => void;
  onToggleStar: (id: number) => void;
  onDelete: (id: number) => void;
  onPreview: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onMove: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
}) {
  const Icon  = getFileIcon(file.mime_type);
  const color = getFileColor(file.mime_type);
  const [menuOpen, setMenuOpen] = useState(false);
  const { can } = useAuth();

  return (
    <div className="flex items-center gap-3 rounded-ui border-2 border-ink bg-card p-3 shadow-brutal-sm sm:gap-4 sm:p-4">
      {/* Icon */}
      <div className={`grid size-10 shrink-0 place-items-center rounded-ui border-2 border-ink sm:size-12 ${color}`}>
        <Icon className="size-5 sm:size-6" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <button
          onClick={() => onPreview(file)}
          className="w-full truncate text-left text-sm font-bold hover:underline sm:text-base"
        >
          {file.name}
        </button>
        <p className="truncate text-xs font-medium text-muted-foreground">
          <span className="hidden sm:inline">{file.extension.toUpperCase()} • </span>
          {formatBytes(file.size)} • {formatDate(file.created_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="relative flex shrink-0 items-center gap-0.5 sm:gap-1">

        {/* Bintang */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onToggleStar(file.id)}
          title={file.is_starred ? "Hapus bintang" : "Beri bintang"}
        >
          <Star className={`size-4 sm:size-5 ${file.is_starred ? "fill-current text-amber-400" : ""}`} />
        </Button>

        {/* Download — sembunyikan di mobile, tetap di sm+ */}
        {!file.is_trashed && can('download_files') && (
          <a
            href={api.getFileDownloadUrl(file.id)}
            download={file.original_name}
            title="Unduh"
            className="hidden sm:grid size-8 place-items-center rounded hover:bg-muted"
          >
            <Download className="size-5" />
          </a>
        )}

        {/* Trash actions */}
        {file.is_trashed ? (
          <>
            {can('delete_files') && (
              <Button variant="ghost" size="icon-sm" onClick={() => onRestore(file.id)} title="Pulihkan">
                <RotateCcw className="size-4 sm:size-5" />
              </Button>
            )}
            {can('delete_files') && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDelete(file.id)}
                title="Hapus permanen"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="size-4 sm:size-5" />
              </Button>
            )}
          </>
        ) : (
          (can('edit_files') || can('share_files') || can('delete_files')) && (
            <div className="relative">
              <Button variant="ghost" size="icon-sm" onClick={() => setMenuOpen(v => !v)}>
                <MoreHorizontal className="size-4 sm:size-5" />
              </Button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-8 z-20 min-w-[150px] rounded-ui border-2 border-ink bg-card p-1 shadow-brutal">
                    {/* Download di dalam menu untuk mobile */}
                    {can('download_files') && (
                      <a
                        href={api.getFileDownloadUrl(file.id)}
                        download={file.original_name}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-semibold hover:bg-muted sm:hidden"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Download className="size-4" /> Unduh
                      </a>
                    )}
                    {can('edit_files') && (
                      <button
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-semibold hover:bg-muted"
                        onClick={() => { onRename(file); setMenuOpen(false); }}
                      >
                        <Pencil className="size-4" /> Ubah Nama
                      </button>
                    )}
                    {can('edit_files') && (
                      <button
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-semibold hover:bg-muted"
                        onClick={() => { onMove(file); setMenuOpen(false); }}
                      >
                        <MoveRight className="size-4" /> Pindahkan
                      </button>
                    )}
                    {can('share_files') && (
                      <button
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-semibold hover:bg-muted"
                        onClick={() => { onShare(file); setMenuOpen(false); }}
                      >
                        <Share2 className="size-4" /> Bagikan
                      </button>
                    )}
                    {can('delete_files') && (
                      <button
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        onClick={() => { onTrash(file.id); setMenuOpen(false); }}
                      >
                        <Trash2 className="size-4" /> Hapus
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        )}
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
  const [previewingFile, setPreviewingFile] = useState<FileItem | null>(null);
  const [renamingFile, setRenamingFile]     = useState<FileItem | null>(null);
  const [movingFile, setMovingFile]         = useState<FileItem | null>(null);
  const [sharingFile, setSharingFile]       = useState<FileItem | null>(null);
  const [deletingFile, setDeletingFile]     = useState<FileItem | null>(null);
  const [isDragOver, setIsDragOver]         = useState(false);
  const { can } = useAuth();

  const handleTrash = async (id: number) => {
    const res = await api.trashFile(id);
    if (res.success) { onFlash("File dipindahkan ke sampah"); onFilesChanged(); }
    else onFlash(res.error?.message ?? "Gagal menghapus file", "error");
  };

  const handleRestore = async (id: number) => {
    const res = await api.restoreFile(id);
    if (res.success) { onFlash("File berhasil dipulihkan"); onFilesChanged(); }
    else onFlash(res.error?.message ?? "Gagal memulihkan file", "error");
  };

  const handleToggleStar = async (id: number) => {
    const file = files.find(f => f.id === id);
    if (!file) return;
    const res = await api.updateFile(id, { is_starred: !file.is_starred });
    if (res.success) onFilesChanged();
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
      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="font-semibold">Memuat file...</span>
      </div>
    );
  }

  if (files.length === 0) {
    // User punya akses upload → dropzone interaktif
    if (can('create_files') && (onUploadClick || onFileDrop)) {
      return (
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
          className={`mt-6 cursor-pointer rounded-ui border-2 border-dashed p-10 text-center transition-colors select-none ${
            isDragOver
              ? "border-ink bg-lime/30 scale-[1.01]"
              : "border-ink/30 bg-card hover:border-ink hover:bg-muted/50"
          }`}
        >
        <Upload className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="font-display text-lg font-bold">Belum ada file</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDragOver ? "Lepaskan untuk upload" : "Klik atau drag & drop file ke sini untuk upload"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground/60">Maks. 15 MB per file</p>
        </div>
      );
    }

    // User tidak punya akses upload → tampil biasa, tidak bisa diklik
    return (
      <div className="mt-6 rounded-ui border-2 border-dashed border-ink/30 bg-card p-10 text-center">
        <Download className="mx-auto mb-3 size-10 text-muted-foreground" />
        <p className="font-display text-lg font-bold">Belum ada file</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {files.map(file => (
        <FileRow
          key={file.id}
          file={file}
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

      {/* Load More */}
      {files.length < filesTotal && (
        <div className="flex flex-col items-center gap-1 pt-2">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 rounded-ui border-2 border-ink bg-card px-5 py-2.5 text-sm font-bold shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal disabled:pointer-events-none disabled:opacity-60"
          >
            {loadingMore ? <Loader2 className="size-4 animate-spin" /> : <span>Muat lebih banyak</span>}
          </button>
          <p className="text-xs text-muted-foreground">
            Menampilkan {files.length} dari {filesTotal} file
          </p>
        </div>
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
