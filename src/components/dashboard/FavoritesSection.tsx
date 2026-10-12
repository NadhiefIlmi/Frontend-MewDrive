/**
 * FavoritesSection Component
 * Menampilkan file dan folder yang di-starred, data real dari API — Task 11
 * Load More: folder limit=12, file limit=10
 */

import { useState, useEffect, useCallback } from "react";
import {
  Star, StarOff, Loader2, Download,
  FileText, FileImage, FileArchive, FileSpreadsheet, File, Trash2,
} from "lucide-react";
import { api, type FileItem, type Folder as ApiFolderT } from "@/lib/api";
import { getFolderIcon } from "@/components/dashboard/FolderSection";
import { FilePreviewDialog } from "@/components/dashboard/FilePreviewDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const FOLDERS_LIMIT = 12;
const FILES_LIMIT   = 10;

// ─── Color resolver ───────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
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
    <div className="mt-4 flex flex-col items-center gap-1">
      <button
        onClick={onLoadMore}
        disabled={loading}
        className="flex items-center gap-2 rounded-ui border-2 border-ink bg-card px-5 py-2.5 text-sm font-bold shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal disabled:pointer-events-none disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <span>Muat lebih banyak</span>}
      </button>
      <p className="text-xs text-muted-foreground">
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
    <div className="flex items-center gap-3 rounded-ui border-2 border-ink bg-card p-4 shadow-brutal-sm">
      <button
        onClick={() => onOpen(folder)}
        className={`grid size-12 shrink-0 place-items-center rounded-ui border-2 border-ink ${colorCls}`}
        title="Buka folder"
      >
        <FolderIcon className="size-6" />
      </button>

      <div className="min-w-0 flex-1">
        <button
          onClick={() => onOpen(folder)}
          className="truncate font-bold hover:underline text-left w-full"
        >
          {folder.name}
        </button>
        <p className="text-xs font-medium text-muted-foreground">Folder</p>
      </div>

      <button
        onClick={() => onUnstar(folder)}
        title="Hapus dari favorit"
        className="grid size-8 shrink-0 place-items-center rounded hover:bg-muted"
      >
        <StarOff className="size-5 text-amber-400" />
      </button>
    </div>
  );
}

// ─── Starred File Row ─────────────────────────────────────────────────────────
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
  const Icon     = getFileIcon(file.mime_type);
  const colorCls = getFileColorCls(file.mime_type);

  return (
    <div className="flex items-center gap-4 rounded-ui border-2 border-ink bg-card p-4 shadow-brutal-sm">
      <div className={`grid size-12 shrink-0 place-items-center rounded-ui border-2 border-ink ${colorCls}`}>
        <Icon className="size-6" />
      </div>

      <div className="min-w-0 flex-1">
        <button
          onClick={() => onPreview(file)}
          className="truncate font-bold hover:underline text-left w-full"
        >
          {file.name}
        </button>
        <p className="text-sm font-medium text-muted-foreground">
          {file.extension.toUpperCase()} • {formatBytes(file.size)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <a
          href={api.getFileDownloadUrl(file.id)}
          download={file.original_name}
          title="Download"
          className="grid size-8 place-items-center rounded hover:bg-muted"
        >
          <Download className="size-5" />
        </a>
        <button
          onClick={() => onUnstar(file)}
          title="Hapus dari favorit"
          className="grid size-8 place-items-center rounded hover:bg-muted"
        >
          <StarOff className="size-5 text-amber-400" />
        </button>
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

// ─── Main FavoritesSection ────────────────────────────────────────────────────
interface FavoritesSectionProps {
  onFolderOpen: (folder: ApiFolderT) => void;
  onFlash: (msg: string, type?: "success" | "error" | "info") => void;
}

export function FavoritesSection({ onFolderOpen, onFlash }: FavoritesSectionProps) {
  const [starredFiles,   setStarredFiles]   = useState<FileItem[]>([]);
  const [starredFolders, setStarredFolders] = useState<ApiFolderT[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [previewFile,    setPreviewFile]    = useState<FileItem | null>(null);
  const [trashingFile,   setTrashingFile]   = useState<FileItem | null>(null);

  // ── Pagination state ──────────────────────────────────────────────────────
  const [filesPage,          setFilesPage]          = useState(1);
  const [filesTotal,         setFilesTotal]          = useState(0);
  const [filesLoadingMore,   setFilesLoadingMore]    = useState(false);
  const [foldersPage,        setFoldersPage]         = useState(1);
  const [foldersTotal,       setFoldersTotal]        = useState(0);
  const [foldersLoadingMore, setFoldersLoadingMore]  = useState(false);

  // ── Initial load (page 1) ─────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setFilesPage(1);
    setFoldersPage(1);
    const [filesRes, foldersRes] = await Promise.all([
      api.getFileStarred({ page: 1, limit: FILES_LIMIT }),
      api.getFolderStarred({ page: 1, limit: FOLDERS_LIMIT }),
    ]);
    if (filesRes.success && filesRes.data) {
      setStarredFiles(filesRes.data.files);
      setFilesTotal(filesRes.data.total);
    }
    if (foldersRes.success && foldersRes.data) {
      setStarredFolders(foldersRes.data.folders as ApiFolderT[]);
      setFoldersTotal(foldersRes.data.total);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Load more files ───────────────────────────────────────────────────────
  const loadMoreFiles = async () => {
    setFilesLoadingMore(true);
    const nextPage = filesPage + 1;
    const res = await api.getFileStarred({ page: nextPage, limit: FILES_LIMIT });
    if (res.success && res.data) {
      setStarredFiles(prev => [...prev, ...res.data!.files]);
      setFilesPage(nextPage);
      setFilesTotal(res.data.total);
    }
    setFilesLoadingMore(false);
  };

  // ── Load more folders ─────────────────────────────────────────────────────
  const loadMoreFolders = async () => {
    setFoldersLoadingMore(true);
    const nextPage = foldersPage + 1;
    const res = await api.getFolderStarred({ page: nextPage, limit: FOLDERS_LIMIT });
    if (res.success && res.data) {
      setStarredFolders(prev => [...prev, ...(res.data!.folders as ApiFolderT[])]);
      setFoldersPage(nextPage);
      setFoldersTotal(res.data.total);
    }
    setFoldersLoadingMore(false);
  };

  // ── Unstar handlers ───────────────────────────────────────────────────────
  const handleUnstarFile = async (file: FileItem) => {
    const res = await api.updateFile(file.id, { is_starred: false });
    if (res.success) {
      setStarredFiles(prev => prev.filter(f => f.id !== file.id));
      setFilesTotal(prev => Math.max(0, prev - 1));
      onFlash(`"${file.name}" dihapus dari favorit`);
    } else {
      onFlash(res.error?.message ?? "Gagal update file", "error");
    }
  };

  const handleUnstarFolder = async (folder: ApiFolderT) => {
    const res = await api.updateFolder(folder.id, { is_starred: false });
    if (res.success) {
      setStarredFolders(prev => prev.filter(f => f.id !== folder.id));
      setFoldersTotal(prev => Math.max(0, prev - 1));
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
      setStarredFiles(prev => prev.filter(f => f.id !== trashingFile.id));
      setFilesTotal(prev => Math.max(0, prev - 1));
      onFlash(`"${trashingFile.name}" dipindahkan ke sampah`);
    } else {
      onFlash(res.error?.message ?? "Gagal menghapus file", "error");
    }
    setTrashingFile(null);
  };

  const total = starredFiles.length + starredFolders.length;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="font-semibold">Memuat favorit...</span>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (total === 0 && filesTotal === 0 && foldersTotal === 0) {
    return (
      <div className="mt-6 rounded-ui border-2 border-dashed border-ink/30 bg-card p-12 text-center">
        <Star className="mx-auto mb-3 size-10 text-muted-foreground" />
        <p className="font-display text-lg font-bold">Belum ada favorit</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tandai file atau folder dengan ★ untuk menampilkannya di sini
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-8">
      {/* Starred Folders */}
      {(starredFolders.length > 0 || foldersTotal > 0) && (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">
            Folder
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({foldersTotal})
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {starredFolders.map(folder => (
              <StarredFolderCard
                key={folder.id}
                folder={folder}
                onUnstar={handleUnstarFolder}
                onOpen={onFolderOpen}
              />
            ))}
          </div>
          <LoadMoreButton
            shown={starredFolders.length}
            total={foldersTotal}
            loading={foldersLoadingMore}
            label="folder"
            onLoadMore={loadMoreFolders}
          />
        </section>
      )}

      {/* Starred Files */}
      {(starredFiles.length > 0 || filesTotal > 0) && (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">
            File
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filesTotal})
            </span>
          </h2>
          <div className="space-y-3">
            {starredFiles.map(file => (
              <StarredFileRow
                key={file.id}
                file={file}
                onUnstar={handleUnstarFile}
                onPreview={setPreviewFile}
                onTrash={handleTrashFile}
              />
            ))}
          </div>
          <LoadMoreButton
            shown={starredFiles.length}
            total={filesTotal}
            loading={filesLoadingMore}
            label="file"
            onLoadMore={loadMoreFiles}
          />
        </section>
      )}

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
    </div>
  );
}
