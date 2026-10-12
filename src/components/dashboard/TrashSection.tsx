/**
 * TrashSection Component
 * Menampilkan file dan folder yang di-trash, dengan bulk restore dan empty trash — Task 11
 */

import { useState, useEffect, useCallback } from "react";
import {
  Trash2, RotateCcw, Loader2, Folder,
  FileText, FileImage, FileArchive, FileSpreadsheet, File,
  CheckSquare, Square, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type FileItem, type Folder as ApiFolderT } from "@/lib/api";
import { getFolderIcon } from "@/components/dashboard/FolderSection";
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

const COLOR_MAP: Record<string, string> = {
  default: "bg-muted",
  lilac: "bg-lilac",
  sky: "bg-sky",
  lime: "bg-lime",
  sun: "bg-sun",
  coral: "bg-coral",
};
function resolveFolderColor(color: string): string {
  return COLOR_MAP[color] ?? "bg-muted";
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const diffD  = Math.floor(diffMs / 86400000);
  if (diffD < 1)  return "Hari ini";
  if (diffD < 7)  return `${diffD} hari lalu`;
  if (diffD < 30) return `${Math.floor(diffD / 7)} minggu lalu`;
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
      className={`flex items-center gap-4 rounded-ui border-2 border-ink p-4 shadow-brutal-sm transition-colors ${
        selected ? "bg-sun/30" : "bg-card"
      }`}
    >
      {/* Checkbox */}
      <button onClick={onToggleSelect} className="shrink-0">
        {selected
          ? <CheckSquare className="size-5 text-ink" />
          : <Square className="size-5 text-muted-foreground" />
        }
      </button>

      {/* Icon */}
      <div className={`grid size-12 shrink-0 place-items-center rounded-ui border-2 border-ink ${colorCls}`}>
        <FolderIcon className="size-6" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{folder.name}</p>
        <p className="text-sm font-medium text-muted-foreground">
          Folder • Dihapus {formatRelative(folder.trashed_at ?? folder.updated_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => onRestore(folder)}
          title="Pulihkan"
          className="grid size-8 place-items-center rounded hover:bg-muted"
        >
          <RotateCcw className="size-5 text-lime-600" />
        </button>
        <button
          onClick={() => onDelete(folder)}
          title="Hapus permanen"
          className="grid size-8 place-items-center rounded hover:bg-muted text-red-500 hover:text-red-700"
        >
          <Trash2 className="size-5" />
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
  const Icon     = getFileIcon(file.mime_type);
  const colorCls = getFileColorCls(file.mime_type);

  return (
    <div
      className={`flex items-center gap-4 rounded-ui border-2 border-ink p-4 shadow-brutal-sm transition-colors ${
        selected ? "bg-sun/30" : "bg-card"
      }`}
    >
      {/* Checkbox */}
      <button onClick={onToggleSelect} className="shrink-0">
        {selected
          ? <CheckSquare className="size-5 text-ink" />
          : <Square className="size-5 text-muted-foreground" />
        }
      </button>

      {/* Icon */}
      <div className={`grid size-12 shrink-0 place-items-center rounded-ui border-2 border-ink ${colorCls}`}>
        <Icon className="size-6" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{file.name}</p>
        <p className="text-sm font-medium text-muted-foreground">
          {file.extension.toUpperCase()} • {formatBytes(file.size)} • Dihapus {formatRelative(file.trashed_at ?? file.updated_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => onRestore(file)}
          title="Pulihkan"
          className="grid size-8 place-items-center rounded hover:bg-muted"
        >
          <RotateCcw className="size-5 text-lime-600" />
        </button>
        <button
          onClick={() => onDelete(file)}
          title="Hapus permanen"
          className="grid size-8 place-items-center rounded hover:bg-muted text-red-500 hover:text-red-700"
        >
          <Trash2 className="size-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main TrashSection ────────────────────────────────────────────────────────
interface TrashSectionProps {
  onFlash: (msg: string, type?: "success" | "error" | "info") => void;
  onStorageChanged?: () => void;
}

export function TrashSection({ onFlash, onStorageChanged }: TrashSectionProps) {
  const [trashedFiles,   setTrashedFiles]   = useState<FileItem[]>([]);
  const [trashedFolders, setTrashedFolders] = useState<ApiFolderT[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [bulkLoading,    setBulkLoading]    = useState(false);

  // Dialog states
  const [deletingFile,    setDeletingFile]    = useState<FileItem | null>(null);
  const [deletingFolder,  setDeletingFolder]  = useState<ApiFolderT | null>(null);
  const [confirmEmpty,    setConfirmEmpty]    = useState(false);

  // Sampah fetch langsung dengan limit besar — tidak pakai load more
  // supaya "Pilih semua" dan bulk restore tetap konsisten
  const TRASH_LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    const [filesRes, foldersRes] = await Promise.all([
      api.getFileTrash({ page: 1, limit: TRASH_LIMIT }),
      api.getFolderTrash({ page: 1, limit: TRASH_LIMIT }),
    ]);
    if (filesRes.success && filesRes.data)     setTrashedFiles(filesRes.data.files);
    if (foldersRes.success && foldersRes.data) setTrashedFolders(foldersRes.data.folders as ApiFolderT[]);
    setLoading(false);
    setSelectedIds(new Set());
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build combined list sorted by trashed_at desc
  const allItems: TrashItem[] = [
    ...trashedFolders.map(f => ({ kind: "folder" as const, data: f })),
    ...trashedFiles.map(f => ({ kind: "file" as const, data: f })),
  ].sort((a, b) => {
    const ta = new Date(a.data.trashed_at ?? a.data.updated_at).getTime();
    const tb = new Date(b.data.trashed_at ?? b.data.updated_at).getTime();
    return tb - ta;
  });

  const total = allItems.length;

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
    setSelectedIds(new Set(allItems.map(trashItemId)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ── Single restore ────────────────────────────────────────────────────────────
  const handleRestoreFile = async (file: FileItem) => {
    const res = await api.restoreFile(file.id);
    if (res.success) {
      setTrashedFiles(prev => prev.filter(f => f.id !== file.id));
      onFlash(`"${file.name}" berhasil dipulihkan`);
    } else {
      onFlash(res.error?.message ?? "Gagal memulihkan file", "error");
    }
  };

  const handleRestoreFolder = async (folder: ApiFolderT) => {
    const res = await api.restoreFolder(folder.id);
    if (res.success) {
      setTrashedFolders(prev => prev.filter(f => f.id !== folder.id));
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
      setTrashedFiles(prev => prev.filter(f => f.id !== deletingFile.id));
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
      setTrashedFolders(prev => prev.filter(f => f.id !== deletingFolder.id));
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
    onFlash(`${restoredCount} item berhasil dipulihkan`);
    await load();
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
      await load();
    } else {
      onFlash(res.error?.message ?? "Gagal mengosongkan sampah", "error");
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="font-semibold">Memuat sampah...</span>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {total > 0 && (
          <>
            {/* Select all / clear */}
            {selectedIds.size === total ? (
              <Button variant="secondary" size="sm" onClick={clearSelection}>
                <Square className="mr-1 size-4" /> Batalkan semua
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={selectAll}>
                <CheckSquare className="mr-1 size-4" /> Pilih semua
              </Button>
            )}

            {/* Bulk restore */}
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                onClick={handleBulkRestore}
                disabled={bulkLoading}
                className="gap-1"
              >
                {bulkLoading
                  ? <Loader2 className="size-4 animate-spin" />
                  : <RotateCcw className="size-4" />
                }
                Pulihkan ({selectedIds.size})
              </Button>
            )}
          </>
        )}

        {/* Empty trash */}
        {total > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEmptyTrash}
            disabled={bulkLoading}
            className="ml-auto gap-1"
          >
            <Trash2 className="size-4" />
            Kosongkan Sampah
          </Button>
        )}
      </div>

      {/* Warning hint */}
      {total > 0 && (
        <div className="flex items-start gap-2 rounded-ui border-2 border-ink bg-sun/30 px-4 py-3 text-sm font-medium">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Item di sampah akan dihapus permanen secara otomatis setelah 30 hari.
            Pulihkan sekarang jika masih diperlukan.
          </span>
        </div>
      )}

      {/* Empty state */}
      {total === 0 ? (
        <div className="rounded-ui border-2 border-dashed border-ink/30 bg-card p-12 text-center">
          <Trash2 className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="font-display text-lg font-bold">Sampah kosong</p>
          <p className="mt-1 text-sm text-muted-foreground">
            File dan folder yang dihapus akan muncul di sini
          </p>
        </div>
      ) : (
        /* Item list */
        <div className="space-y-3">
          {allItems.map(item => {
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

      {/* Dialog hapus file permanen */}
      {deletingFile && (
        <ConfirmDialog
          title="Hapus File Permanen"
          message={`"${deletingFile.name}" akan dihapus secara permanen dan tidak bisa dipulihkan.`}
          confirmLabel="Hapus Permanen"
          variant="destructive"
          onConfirm={confirmDeleteFile}
          onCancel={() => setDeletingFile(null)}
        />
      )}

      {/* Dialog hapus folder permanen */}
      {deletingFolder && (
        <ConfirmDialog
          title="Hapus Folder Permanen"
          message={`Folder "${deletingFolder.name}" beserta semua isinya akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan.`}
          confirmLabel="Hapus Permanen"
          variant="destructive"
          onConfirm={confirmDeleteFolder}
          onCancel={() => setDeletingFolder(null)}
        />
      )}

      {/* Dialog kosongkan sampah */}
      {confirmEmpty && (
        <ConfirmDialog
          title="Kosongkan Sampah"
          message="Semua file dan folder di sampah akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."
          confirmLabel="Kosongkan Semua"
          variant="destructive"
          onConfirm={confirmEmptyTrash}
          onCancel={() => setConfirmEmpty(false)}
        />
      )}
    </div>
  );
}
