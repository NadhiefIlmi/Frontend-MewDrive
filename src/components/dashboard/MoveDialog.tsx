/**
 * MoveDialog Component
 * Dialog untuk memindahkan file atau folder ke folder tujuan
 * Task 8 — Folder Management
 */

import { useState, useEffect } from "react";
import {
  Folder, FolderOpen, ChevronRight, ChevronDown,
  X, Loader2, Home, MoveRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type Folder as FolderType, type FileItem } from "@/lib/api";
import { type ApiFolderItem } from "@/types/dashboard";
import { getFolderIcon } from "@/components/dashboard/FolderSection";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MoveTarget =
  | { type: "file";   item: FileItem }
  | { type: "folder"; item: ApiFolderItem };

// ─── Folder tree node ─────────────────────────────────────────────────────────
interface FolderTreeNodeProps {
  folder: FolderType;
  /** ID folder yang sedang dipindah (tidak boleh jadi tujuan sendiri / descendant-nya) */
  disabledFolderId?: number | undefined;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  /** Level kedalaman untuk indent */
  depth?: number;
}

function FolderTreeNode({
  folder,
  disabledFolderId,
  selectedId,
  onSelect,
  depth = 0,
}: FolderTreeNodeProps) {
  const [expanded, setExpanded]     = useState(false);
  const [children, setChildren]     = useState<FolderType[]>([]);
  const [loadingKids, setLoadingKids] = useState(false);

  const isSelected = selectedId === folder.id;
  const isDisabled = folder.id === disabledFolderId;

  const FolderIcon = getFolderIcon((folder as ApiFolderItem).icon ?? "folder");

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return;
    if (!expanded) {
      setLoadingKids(true);
      const res = await api.getFolders(folder.id);
      setLoadingKids(false);
      if (res.success && res.data) {
        setChildren(res.data.folders);
      }
    }
    setExpanded(v => !v);
  };

  return (
    <div>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => !isDisabled && onSelect(folder.id)}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        className={`flex w-full items-center gap-2 rounded-ui py-2 pr-3 text-sm font-semibold transition-colors
          ${isDisabled ? "cursor-not-allowed opacity-40" : "hover:bg-muted"}
          ${isSelected && !isDisabled ? "border-2 border-ink bg-lime shadow-brutal-sm" : "border-2 border-transparent"}`}
      >
        {/* Expand toggle */}
        <button
          type="button"
          onClick={handleToggle}
          className={`shrink-0 rounded p-0.5 hover:bg-ink/10 ${isDisabled ? "pointer-events-none" : ""}`}
          tabIndex={-1}
        >
          {loadingKids
            ? <Loader2 className="size-3.5 animate-spin" />
            : expanded
              ? <ChevronDown className="size-3.5" />
              : <ChevronRight className="size-3.5" />
          }
        </button>

        <FolderIcon className="size-4 shrink-0" />
        <span className="truncate">{folder.name}</span>
      </button>

      {/* Children */}
      {expanded && children.map(child => (
        <FolderTreeNode
          key={child.id}
          folder={child}
          disabledFolderId={disabledFolderId}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

// ─── Main MoveDialog ──────────────────────────────────────────────────────────

interface MoveDialogProps {
  /** Item yang akan dipindah */
  target: MoveTarget;
  onClose: () => void;
  /** Callback setelah berhasil pindah */
  onMoved: () => void;
  onFlash: (msg: string, type?: "success" | "error" | "info") => void;
}

export function MoveDialog({ target, onClose, onMoved, onFlash }: MoveDialogProps) {
  // null = root / "File saya"
  const [selectedId, setSelectedId]     = useState<number | null>(null);
  const [rootFolders, setRootFolders]   = useState<FolderType[]>([]);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const itemName = target.item.name;
  // Untuk folder, disable diri sendiri
  const disabledFolderId = target.type === "folder" ? target.item.id : undefined;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await api.getFolders(null); // root folders
      setLoading(false);
      if (res.success && res.data) {
        const filtered = res.data.folders.filter((f: import('@/lib/api').Folder) =>
          disabledFolderId === undefined || f.id !== disabledFolderId
        );
        setRootFolders(filtered);
      }
    })();
  }, [disabledFolderId]);

  const handleMove = async () => {
    setSubmitting(true);
    setError(null);

    let res;
    if (target.type === "folder") {
      res = await api.moveFolder(target.item.id, selectedId);
    } else {
      res = await api.moveFile(target.item.id, selectedId);
    }

    setSubmitting(false);

    if (res.success) {
      const dest = selectedId === null ? "File saya (root)" : "folder tujuan";
      onFlash(`"${itemName}" berhasil dipindahkan ke ${dest}`);
      onMoved();
      onClose();
    } else {
      const msgMap: Record<string, string> = {
        CIRCULAR_REFERENCE:    "Tidak bisa memindahkan folder ke dalam subfolder-nya sendiri",
        FOLDER_NAME_EXISTS:    "Sudah ada folder dengan nama yang sama di tujuan",
        FILE_NAME_EXISTS:      "Sudah ada file dengan nama yang sama di tujuan",
        TARGET_FOLDER_TRASHED: "Folder tujuan ada di sampah",
        TARGET_FOLDER_NOT_FOUND: "Folder tujuan tidak ditemukan",
        CANNOT_MOVE_INTO_SELF: "Tidak bisa memindahkan folder ke dirinya sendiri",
      };
      const code = res.error?.code ?? "";
      setError(msgMap[code] ?? res.error?.message ?? "Gagal memindahkan");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-sm flex-col rounded-ui border-2 border-ink bg-card shadow-brutal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-ink px-5 py-4">
          <div className="flex items-center gap-2">
            <MoveRight className="size-5 shrink-0" />
            <div>
              <h2 className="font-display text-lg font-bold leading-tight">Pindahkan</h2>
              <p className="truncate text-xs text-muted-foreground max-w-[200px]" title={itemName}>
                {itemName}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Folder tree */}
        <div className="max-h-72 overflow-y-auto p-3 space-y-0.5">
          {/* Root option */}
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className={`flex w-full items-center gap-2 rounded-ui border-2 py-2 px-3 text-sm font-semibold transition-colors
              ${selectedId === null
                ? "border-ink bg-lime shadow-brutal-sm"
                : "border-transparent hover:bg-muted"}`}
          >
            <Home className="size-4 shrink-0" />
            <span>File saya (root)</span>
          </button>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm font-semibold">Memuat folder...</span>
            </div>
          ) : rootFolders.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground font-medium">
              Tidak ada folder lain
            </p>
          ) : (
            rootFolders.map(f => (
              <FolderTreeNode
                key={f.id}
                folder={f}
                disabledFolderId={disabledFolderId}
                selectedId={selectedId}
                onSelect={setSelectedId}
                depth={0}
              />
            ))
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="mx-5 mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600">
            {error}
          </p>
        )}

        {/* Footer */}
        <div className="flex gap-3 border-t-2 border-ink px-5 py-4">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={handleMove}
            disabled={submitting}
          >
            {submitting
              ? <Loader2 className="size-4 animate-spin" />
              : "Pindahkan"
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
