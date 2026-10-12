/**
 * RecentSection Component
 * Menampilkan file yang baru diakses/diupload, data real dari API — Task 11
 */

import { useState, useEffect, useCallback } from "react";
import {
  Clock, Loader2, Star, Download, Trash2,
  FileText, FileImage, FileArchive, FileSpreadsheet, File,
} from "lucide-react";
import { api, type FileItem } from "@/lib/api";
import { FilePreviewDialog } from "@/components/dashboard/FilePreviewDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getFileIcon(mimeType: string): React.ElementType {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv")
    return FileSpreadsheet;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar") ||
      mimeType.includes("gzip") || mimeType.includes("7z"))
    return FileArchive;
  if (mimeType.includes("pdf") || mimeType.includes("word") || mimeType.includes("text"))
    return FileText;
  return File;
}

function getFileColorCls(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "bg-lilac";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "bg-lime";
  if (mimeType.includes("pdf")) return "bg-coral";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "bg-sun";
  return "bg-sky";
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024)       return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatRelative(iso: string | null | undefined, fallback: string): string {
  const src = iso ?? fallback;
  const d = new Date(src);
  if (isNaN(d.getTime())) return "—";
  const diffMs   = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)   return "Baru saja";
  if (diffMins < 60)  return `${diffMins} menit lalu`;
  const diffH = Math.floor(diffMins / 60);
  if (diffH < 24)     return `${diffH} jam lalu`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)      return `${diffD} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Recent File Row ──────────────────────────────────────────────────────────
function RecentFileRow({
  file,
  onPreview,
  onToggleStar,
  onTrash,
}: {
  file: FileItem;
  onPreview: (file: FileItem) => void;
  onToggleStar: (file: FileItem) => void;
  onTrash: (file: FileItem) => void;
}) {
  const Icon     = getFileIcon(file.mime_type);
  const colorCls = getFileColorCls(file.mime_type);

  // Tampilkan waktu terakhir diakses, fallback ke created_at
  const timeLabel = file.last_accessed_at
    ? `Dibuka ${formatRelative(file.last_accessed_at, file.created_at)}`
    : `Diupload ${formatRelative(null, file.created_at)}`;

  return (
    <div className="flex items-center gap-4 rounded-ui border-2 border-ink bg-card p-4 shadow-brutal-sm">
      {/* Icon */}
      <div className={`grid size-12 shrink-0 place-items-center rounded-ui border-2 border-ink ${colorCls}`}>
        <Icon className="size-6" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <button
          onClick={() => onPreview(file)}
          className="truncate font-bold hover:underline text-left w-full"
        >
          {file.name}
        </button>
        <p className="text-sm font-medium text-muted-foreground">
          {file.extension.toUpperCase()} • {formatBytes(file.size)} • {timeLabel}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Download */}
        <a
          href={api.getFileDownloadUrl(file.id)}
          download={file.original_name}
          title="Download"
          className="grid size-8 place-items-center rounded hover:bg-muted"
        >
          <Download className="size-5" />
        </a>

        {/* Star toggle */}
        <button
          onClick={() => onToggleStar(file)}
          title={file.is_starred ? "Hapus bintang" : "Beri bintang"}
          className="grid size-8 place-items-center rounded hover:bg-muted"
        >
          <Star className={`size-5 ${file.is_starred ? "fill-current text-amber-400" : ""}`} />
        </button>

        {/* Trash */}
        <button
          onClick={() => onTrash(file)}
          title="Pindahkan ke sampah"
          className="grid size-8 place-items-center rounded hover:bg-muted text-red-500 hover:text-red-700"
        >
          <Trash2 className="size-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main RecentSection ───────────────────────────────────────────────────────
interface RecentSectionProps {
  onFlash: (msg: string, type?: "success" | "error" | "info") => void;
}

export function RecentSection({ onFlash }: RecentSectionProps) {
  const [files,        setFiles]        = useState<FileItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [previewFile,  setPreviewFile]  = useState<FileItem | null>(null);
  const [trashingFile, setTrashingFile] = useState<FileItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getFileRecent(20);
    if (res.success && res.data) setFiles(res.data.files);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleStar = async (file: FileItem) => {
    const res = await api.updateFile(file.id, { is_starred: !file.is_starred });
    if (res.success && res.data) {
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, is_starred: !f.is_starred } : f));
      onFlash(file.is_starred ? "Tanda bintang dihapus" : `"${file.name}" ditandai ★`);
    } else {
      onFlash(res.error?.message ?? "Gagal update file", "error");
    }
  };

  const handleTrash = (file: FileItem) => {
    setTrashingFile(file);
  };

  const confirmTrash = async () => {
    if (!trashingFile) return;
    const res = await api.trashFile(trashingFile.id);
    if (res.success) {
      setFiles(prev => prev.filter(f => f.id !== trashingFile.id));
      onFlash(`"${trashingFile.name}" dipindahkan ke sampah`);
    } else {
      onFlash(res.error?.message ?? "Gagal menghapus file", "error");
    }
    setTrashingFile(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="font-semibold">Memuat file terbaru...</span>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="mt-6 rounded-ui border-2 border-dashed border-ink/30 bg-card p-12 text-center">
        <Clock className="mx-auto mb-3 size-10 text-muted-foreground" />
        <p className="font-display text-lg font-bold">Belum ada file terbaru</p>
        <p className="mt-1 text-sm text-muted-foreground">
          File yang baru diupload atau dibuka akan muncul di sini
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {files.map(file => (
        <RecentFileRow
          key={file.id}
          file={file}
          onPreview={setPreviewFile}
          onToggleStar={handleToggleStar}
          onTrash={handleTrash}
        />
      ))}

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
          onConfirm={confirmTrash}
          onCancel={() => setTrashingFile(null)}
        />
      )}
    </div>
  );
}
