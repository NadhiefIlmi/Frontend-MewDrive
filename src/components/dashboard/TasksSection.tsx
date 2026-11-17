/**
 * TasksSection Component
 * Kanban board dengan sequential drag-and-drop.
 *
 * Aturan DnD:
 *  - Task hanya bisa dipindah satu langkah maju atau mundur
 *  - Todo → InProgress → InReview → Done (boleh +1 atau -1)
 *  - Loncat kolom (misal Todo → Done) ditolak + toast error
 *
 * Visual feedback:
 *  - Card dragging: opacity turun + rotate sedikit
 *  - Kolom valid  : highlight hijau + border tebal
 *  - Kolom invalid: highlight merah + tanda ⛔
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus, CheckSquare, LayoutGrid, List, Calendar, Paperclip,
  Pencil, Trash2, ChevronDown, ChevronRight, X,
  AlertTriangle, ArrowUp, ArrowRight, ArrowDown,
  MoreHorizontal, Circle, Timer, Eye, CheckCircle2,
  HardDrive, Upload, FileText, Image, FileArchive, Search,
  Ban, Loader2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { FileItem, TaskItem, TaskStatus, TaskPriority } from "@/lib/api";
import { FilePreviewDialog } from "@/components/dashboard/FilePreviewDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Types (re-use from api.ts, define local alias) ──────────────────────────
// TaskStatus and TaskPriority are imported from api.ts

export type { TaskStatus, TaskPriority } from "@/lib/api";

export interface AttachedFile {
  id: string;
  name: string;
  source: "drive" | "upload";
  size: number | undefined;
  // Field tambahan untuk preview — hanya ada jika dari MewDrive
  mime_type?: string;
  extension?: string;
  original_name?: string;
}

// Local Task type matches TaskItem from API
export type Task = {
  id: number;
  title: string;
  description: string | undefined;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | undefined;
  attachedFiles: AttachedFile[];
  created_at: string;
  updated_at: string;
};

// Convert API TaskItem → local Task
function apiTaskToTask(t: TaskItem): Task {
  return {
    id:            t.id,
    title:         t.title,
    description:   t.description || undefined,
    priority:      t.priority,
    status:        t.status,
    due_date:      t.due_date ?? undefined,
    attachedFiles: (t.files ?? []).map(f => ({
      id:            String(f.id),
      name:          f.original_name || f.name,
      source:        "drive" as const,
      size:          f.size,
      mime_type:     f.mime_type,
      extension:     f.extension,
      original_name: f.original_name,
    })),
    created_at:  t.created_at,
    updated_at:  t.updated_at,
  };
}

// Convert local AttachedFile → FileItem for FilePreviewDialog
function attachedToFileItem(f: AttachedFile): FileItem {
  return {
    id:              Number(f.id),
    name:            f.name,
    original_name:   f.original_name ?? f.name,
    mime_type:       f.mime_type ?? "application/octet-stream",
    extension:       f.extension ?? f.name.split(".").pop() ?? "",
    size:            f.size ?? 0,
    user_id:         0,
    folder_id:       null,
    storage_path:    "",
    is_starred:      false,
    is_trashed:      false,
    trashed_at:      null,
    last_accessed_at: null,
    created_at:      "",
    updated_at:      "",
  };
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUSES: {
  id: TaskStatus;
  label: string;
  Icon: typeof Circle;
  color: string;
  headerBg: string;
  iconColor: string;
  order: number;          // used for sequential validation
}[] = [
  { id: "todo",        label: "To Do",       Icon: Circle,       color: "bg-sun",   headerBg: "bg-sun",   iconColor: "text-yellow-600", order: 0 },
  { id: "in_progress", label: "In Progress", Icon: Timer,        color: "bg-sky",   headerBg: "bg-sky",   iconColor: "text-blue-600",   order: 1 },
  { id: "in_review",   label: "In Review",   Icon: Eye,          color: "bg-lilac", headerBg: "bg-lilac", iconColor: "text-purple-600", order: 2 },
  { id: "done",        label: "Done",        Icon: CheckCircle2, color: "bg-green-300",  headerBg: "bg-green-300",  iconColor: "text-green-700",  order: 3 },
];

const PRIORITIES: {
  id: TaskPriority;
  label: string;
  color: string;
  badgeBg: string;
  accentBar: string;
  Icon: typeof ArrowUp;
}[] = [
  { id: "critical", label: "Critical", color: "text-red-800",    badgeBg: "bg-red-100",    accentBar: "bg-red-500",    Icon: AlertTriangle },
  { id: "high",     label: "High",     color: "text-orange-800", badgeBg: "bg-orange-100", accentBar: "bg-orange-400", Icon: ArrowUp       },
  { id: "medium",   label: "Medium",   color: "text-yellow-800", badgeBg: "bg-yellow-100", accentBar: "bg-yellow-400", Icon: ArrowRight    },
  { id: "low",      label: "Low",      color: "text-green-800",  badgeBg: "bg-green-100",  accentBar: "bg-green-400",  Icon: ArrowDown     },
];

// ─── Sequential DnD validation ────────────────────────────────────────────────

/** Returns true if moving from `from` to `to` is allowed (±1 step only). */
function canMoveTo(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return false;
  const fromOrder = STATUSES.find(s => s.id === from)!.order;
  const toOrder   = STATUSES.find(s => s.id === to)!.order;
  return Math.abs(toOrder - fromOrder) === 1;
}

/** Human-readable rejection reason. */
function rejectReason(from: TaskStatus, to: TaskStatus): string {
  const fromLabel = STATUSES.find(s => s.id === from)!.label;
  const toLabel   = STATUSES.find(s => s.id === to)!.label;
  const fromOrder = STATUSES.find(s => s.id === from)!.order;
  const toOrder   = STATUSES.find(s => s.id === to)!.order;
  const gap       = toOrder - fromOrder;

  if (gap > 1) {
    // forward skip — name the missing steps
    const missing = STATUSES
      .filter(s => s.order > fromOrder && s.order < toOrder)
      .map(s => s.label)
      .join(" → ");
    return `Harus lewat ${missing} dulu sebelum ke ${toLabel}`;
  }
  if (gap < -1) {
    // backward skip
    return `Tidak bisa mundur langsung dari ${fromLabel} ke ${toLabel}`;
  }
  return `Tidak bisa memindahkan task dari ${fromLabel} ke ${toLabel}`;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDueDate(iso?: string): { label: string; overdue: boolean } {
  if (!iso) return { label: "", overdue: false };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(iso); due.setHours(0, 0, 0, 0);
  const diff  = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0)   return { label: `${Math.abs(diff)}h lalu`, overdue: true };
  if (diff === 0) return { label: "Hari ini", overdue: false };
  if (diff === 1) return { label: "Besok",    overdue: false };
  return { label: due.toLocaleDateString("id-ID", { day: "numeric", month: "short" }), overdue: false };
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return Image;
  if (["zip","rar","7z","tar","gz"].includes(ext))           return FileArchive;
  return FileText;
}

function getStatus(id: TaskStatus)     { return STATUSES.find(s => s.id === id)!; }
function getPriority(id: TaskPriority) { return PRIORITIES.find(p => p.id === id)!; }

// ─── PriorityBadge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const p = getPriority(priority);
  return (
    <span className={`inline-flex items-center gap-1 rounded border-[1.5px] border-ink px-1.5 py-0.5 text-[10px] font-bold ${p.badgeBg} ${p.color}`}>
      <p.Icon className="size-2.5" />
      {p.label}
    </span>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TaskStatus }) {
  const s = getStatus(status);
  return (
    <span className={`inline-flex items-center gap-1 rounded border-[1.5px] border-ink px-1.5 py-0.5 text-[10px] font-bold ${s.color}`}>
      <s.Icon className={`size-2.5 ${s.iconColor}`} />
      {s.label}
    </span>
  );
}

// ─── DriveFilePicker ──────────────────────────────────────────────────────────

interface DrivePickerProps {
  onPick: (file: AttachedFile) => void;
  onClose: () => void;
  alreadyAttached: string[];
}

function DriveFilePicker({ onPick, onClose, alreadyAttached }: DrivePickerProps) {
  type FolderItem = import("@/lib/api").Folder;
  const [folders,    setFolders]    = useState<FolderItem[]>([]);
  const [files,      setFiles]      = useState<FileItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [query,      setQuery]      = useState("");
  const [breadcrumb, setBreadcrumb] = useState<{ id: number | null; name: string }[]>([
    { id: null, name: "MewDrive" },
  ]);
  const currentFolderId = breadcrumb[breadcrumb.length - 1]?.id ?? null;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getFolders(currentFolderId ?? undefined, { page: 1, limit: 100 }),
      api.getFiles(currentFolderId, { page: 1, limit: 100 }),
    ]).then(([fRes, fileRes]) => {
      if (fRes.success    && fRes.data)    setFolders(fRes.data.folders);
      if (fileRes.success && fileRes.data) setFiles(fileRes.data.files);
      setLoading(false);
    });
  }, [currentFolderId]);

  const openFolder = (folder: FolderItem) => {
    setQuery("");
    setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }]);
  };

  const goTo = (idx: number) => {
    setQuery("");
    setBreadcrumb(prev => prev.slice(0, idx + 1));
  };

  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
  const filteredFiles   = files.filter(f => (f.original_name || f.name).toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-md flex-col rounded-t-[20px] border-2 border-ink bg-card shadow-brutal sm:rounded-ui" style={{ maxHeight: "80vh" }}>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b-2 border-ink px-4 py-3">
          <div className="flex items-center gap-2">
            <HardDrive className="size-4" />
            <span className="font-display text-sm font-bold">Pilih dari MewDrive</span>
          </div>
          <button onClick={onClose} className="grid size-7 place-items-center rounded-ui border-2 border-ink bg-coral shadow-brutal-sm hover:bg-coral/80" aria-label="Tutup picker">
            <X className="size-3.5" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-ink/15 px-4 py-2">
          {breadcrumb.map((crumb, idx) => (
            <div key={idx} className="flex shrink-0 items-center gap-1">
              {idx > 0 && <ChevronRight className="size-3 text-muted-foreground" />}
              <button
                onClick={() => goTo(idx)}
                className={`text-xs font-semibold transition-colors ${idx === breadcrumb.length - 1 ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="shrink-0 border-b border-ink/15 px-4 py-2.5">
          <div className="flex items-center gap-2 rounded-ui border-2 border-ink bg-background px-3 py-1.5">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Cari file atau folder..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" /> Memuat...
            </div>
          ) : (filteredFolders.length === 0 && filteredFiles.length === 0) ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <FileText className="size-8" />
              <p>{query ? "Tidak ditemukan" : "Folder ini kosong"}</p>
            </div>
          ) : (
            <>
              {/* Folders */}
              {filteredFolders.map(folder => (
                <button key={`folder-${folder.id}`} onClick={() => openFolder(folder)} className="flex w-full items-center gap-3 rounded-ui px-3 py-2.5 text-left transition-colors hover:bg-muted">
                  <span className="grid size-8 shrink-0 place-items-center rounded-ui border-2 border-ink bg-sun shadow-brutal-sm">
                    <CheckSquare className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{folder.name}</p>
                    <p className="text-[10px] text-muted-foreground">Folder</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}

              {/* Files */}
              {filteredFiles.map(f => {
                const Icon    = fileIcon(f.name);
                const already = alreadyAttached.includes(String(f.id));
                return (
                  <button
                    key={`file-${f.id}`}
                    disabled={already}
                    onClick={() => {
                      onPick({
                        id:            String(f.id),
                        name:          f.original_name || f.name,
                        source:        "drive",
                        size:          f.size,
                        mime_type:     f.mime_type,
                        extension:     f.extension,
                        original_name: f.original_name,
                      });
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-ui px-3 py-2.5 text-left transition-colors ${already ? "cursor-not-allowed opacity-40" : "hover:bg-lime/30"}`}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-ui border-2 border-ink bg-muted shadow-brutal-sm">
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{f.original_name || f.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatFileSize(f.size)}</p>
                    </div>
                    {already && <span className="shrink-0 text-[10px] font-bold text-muted-foreground">Terlampir</span>}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
// ─── AttachSection ────────────────────────────────────────────────────────────

interface AttachSectionProps {
  attached: AttachedFile[];
  onAdd: (file: AttachedFile) => void;
  onRemove: (id: string) => void;
}

function AttachSection({ attached, onAdd, onRemove }: AttachSectionProps) {
  const [drivePicker, setDrivePicker] = useState(false);

  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Lampiran <span className="text-xs font-normal normal-case text-muted-foreground/60">(opsional)</span>
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={() => setDrivePicker(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-ui border-2 border-ink bg-lime py-2 text-xs font-bold shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0 active:shadow-none">
          <HardDrive className="size-3.5" /> Dari MewDrive
        </button>
      </div>
      {attached.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5">
          {attached.map(f => {
            const Icon = fileIcon(f.name);
            return (
              <div key={f.id} className="flex items-center gap-2 rounded-ui border-2 border-ink bg-muted px-3 py-1.5 shadow-brutal-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded border-[1.5px] border-ink bg-lime shadow-brutal-sm"><Icon className="size-3" /></span>
                <span className="min-w-0 flex-1 truncate text-xs font-semibold">{f.name}</span>
                {f.size && <span className="shrink-0 text-[10px] text-muted-foreground">{formatFileSize(f.size)}</span>}
                <button type="button" onClick={() => onRemove(f.id)} className="ml-1 grid size-4 shrink-0 place-items-center rounded text-muted-foreground hover:text-red-600" aria-label="Hapus lampiran"><X className="size-3" /></button>
              </div>
            );
          })}
        </div>
      )}
      {drivePicker && (
        <DriveFilePicker
          alreadyAttached={attached.filter(a => a.source === "drive").map(a => a.id)}
          onPick={onAdd}
          onClose={() => setDrivePicker(false)}
        />
      )}
    </div>
  );
}

// ─── Task Card — drag source ──────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: TaskStatus) => void;
  // Bulk select
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  // Preview file
  onPreviewFile: (file: FileItem) => void;
  // DnD
  isDragging: boolean;
  onDragStart: (taskId: number) => void;
  onDragEnd: () => void;
}

function TaskCard({ task, onEdit, onDelete, onStatusChange, isSelected, onToggleSelect, onPreviewFile, isDragging, onDragStart, onDragEnd }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const due = formatDueDate(task.due_date);

  // Disable drag di layar kecil (mobile) — sm breakpoint = 640px
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    const btn = e.currentTarget as HTMLButtonElement;
    const r = btn.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    setMenuOpen(true);
  };

  return (
    <div
      draggable={!isMobile}
      data-task-id={task.id}
      onDragStart={e => { if (isMobile) return; e.dataTransfer.effectAllowed = "move"; onDragStart(task.id); }}
      onDragEnd={() => { if (!isMobile) onDragEnd(); }}
      style={{ touchAction: isMobile ? "auto" : "none" }}
      className={`group relative rounded-ui border-2 border-ink p-3 shadow-brutal-sm
        ${isMobile ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}
        ${task.priority === "critical" ? "bg-red-50"    :
          task.priority === "high"     ? "bg-orange-50" :
          task.priority === "medium"   ? "bg-yellow-50" :
                                         "bg-green-50"  }
        ${isSelected ? "ring-2 ring-offset-1 ring-ink" : ""}
        ${isDragging
          ? "rotate-2 opacity-40 shadow-brutal scale-[0.97]"
          : isMobile
            ? "transition-all duration-150"
            : "transition-all duration-150 hover:-translate-y-0.5 hover:shadow-brutal"
        }`}
    >
      {/* Header row: checkbox + task id */}
      <div className="mb-1 flex items-center gap-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(task.id)}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          draggable={false}
          className="size-3.5 cursor-pointer accent-ink"
          aria-label={`Pilih task ${task.id}`}
        />
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          TASK-{String(task.id).padStart(3, "0")}
        </p>
      </div>
      <p className={`mb-2 text-sm font-semibold leading-snug ${task.status === "done" ? "text-muted-foreground line-through" : ""}`}>
        {task.title}
      </p>
      {task.description && (
        <p className="mb-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {task.description}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {due.label && (
          <span className={`flex items-center gap-1 text-[10px] font-semibold ${due.overdue ? "text-red-700" : "text-muted-foreground"}`}>
            <Calendar className="size-3" />{due.label}
          </span>
        )}
      </div>
      {task.attachedFiles.length > 0 && (
        <div className="mt-2 border-t border-dashed border-ink/20 pt-1.5">
          <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Paperclip className="size-3" />{task.attachedFiles.length} lampiran
          </div>
          <div className="flex flex-col gap-0.5">
            {task.attachedFiles.slice(0, 3).map(f => (
              <button
                key={f.id}
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onPreviewFile(attachedToFileItem(f));
                }}
                onMouseDown={e => e.stopPropagation()}
                draggable={false}
                className="flex items-center gap-1.5 rounded px-1.5 py-1 bg-ink/5 hover:bg-lime/40 transition-colors cursor-pointer text-left w-full"
              >
                <HardDrive className="size-2.5 shrink-0 text-green-600" />
                <span className="truncate text-[10px] font-medium text-foreground/70">{f.name}</span>
                <ExternalLink className="size-2.5 shrink-0 text-muted-foreground ml-auto" />
              </button>
            ))}
            {task.attachedFiles.length > 3 && (
              <p className="px-1.5 text-[10px] text-muted-foreground">+{task.attachedFiles.length - 3} lainnya</p>
            )}
          </div>
        </div>
      )}

      {/* Context menu — selalu visible di mobile, hover-only di desktop */}
      <div className="absolute right-2 top-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        <button
          onClick={openMenu}
          onMouseDown={e => e.stopPropagation()}
          draggable={false}
          aria-label={`Opsi untuk task ${task.title}`}
          className="grid size-6 place-items-center rounded border border-ink/20 bg-card text-muted-foreground hover:border-ink hover:bg-muted"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
        {menuOpen && menuPos && createPortal(
          <>
            <div className="fixed inset-0 z-40" onMouseDown={() => setMenuOpen(false)} />
            <div
              className="fixed z-50 w-44 rounded-ui border-2 border-ink bg-card shadow-brutal"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pindah ke</p>
              {STATUSES.filter(s => s.id !== task.status).map(s => {
                const allowed = canMoveTo(task.status, s.id);
                return (
                  <button key={s.id}
                    disabled={!allowed}
                    onClick={() => { if (allowed) { onStatusChange(task.id, s.id); setMenuOpen(false); } }}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold ${allowed ? `hover:${s.color}` : "cursor-not-allowed opacity-40"}`}
                  >
                    <s.Icon className={`size-3 ${s.iconColor}`} />
                    {s.label}
                    {!allowed && <Ban className="ml-auto size-3 text-red-400" />}
                  </button>
                );
              })}
              <div className="border-t border-ink/20" />
              <button onClick={() => { onEdit(task); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold hover:bg-sun">
                <Pencil className="size-3" /> Edit
              </button>
              <button onClick={() => { onDelete(task.id); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                <Trash2 className="size-3" /> Hapus
              </button>
            </div>
          </>,
          document.body
        )}
      </div>
    </div>
  );
}

// ─── Board Column — drop target ───────────────────────────────────────────────

type DragOverState = "valid" | "invalid" | null;

interface BoardColumnProps {
  status: (typeof STATUSES)[number];
  tasks: Task[];
  onAddCard: (status: TaskStatus) => void;
  onEdit: (t: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, s: TaskStatus) => void;
  // Bulk select
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  // Preview file
  onPreviewFile: (file: FileItem) => void;
  // DnD
  draggingTaskId: number | null;
  draggingFromStatus: TaskStatus | null;
  dragOverColumn: TaskStatus | null;
  onDragOver: (targetStatus: TaskStatus) => void;
  onDragLeave: () => void;
  onDrop: (targetStatus: TaskStatus) => void;
  draggingTaskIds: Set<number>;
}

function BoardColumn({
  status, tasks, onAddCard, onEdit, onDelete, onStatusChange,
  selectedIds, onToggleSelect, onPreviewFile,
  draggingTaskId, draggingFromStatus, dragOverColumn,
  onDragOver, onDragLeave, onDrop, draggingTaskIds,
}: BoardColumnProps) {

  // Determine visual state of this column during a drag
  let overState: DragOverState = null;
  if (draggingTaskId !== null && draggingFromStatus !== null) {
    if (dragOverColumn === status.id) {
      // Kolom asal = netral (bukan valid bukan invalid), jangan highlight merah
      if (draggingFromStatus === status.id) {
        overState = null;
      } else {
        overState = canMoveTo(draggingFromStatus, status.id) ? "valid" : "invalid";
      }
    }
  }

  const borderClass =
    overState === "valid"   ? "border-green-500 ring-2 ring-green-400/50" :
    overState === "invalid" ? "border-red-400   ring-2 ring-red-400/40"   :
    "border-ink";

  const bgClass =
    overState === "valid"   ? "bg-green-50 dark:bg-green-950/20" :
    overState === "invalid" ? "bg-red-50   dark:bg-red-950/20"   :
    "bg-card";

  return (
    <div
      className={`flex min-w-[240px] flex-1 flex-col overflow-hidden rounded-ui border-2 shadow-brutal transition-all duration-150 sm:min-w-[220px] ${borderClass} ${bgClass}`}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver(status.id); }}
      onDragLeave={onDragLeave}
      onDrop={e => { e.preventDefault(); onDrop(status.id); }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between border-b-2 border-ink px-3 py-2.5 ${status.headerBg}`}>
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
          <status.Icon className={`size-3.5 ${status.iconColor}`} />
          {status.label}
        </span>
        <div className="flex items-center gap-1.5">
          {overState === "invalid" && <Ban className="size-3.5 text-red-500" />}
          <span className="grid size-5 place-items-center rounded-full bg-ink text-[10px] font-bold text-card">{tasks.length}</span>
        </div>
      </div>

      {/* Drop zone hint */}
      {overState === "valid" && (
        <div className="mx-2 mt-2 rounded-ui border-2 border-dashed border-green-400 bg-green-100/60 py-2 text-center text-[11px] font-bold text-green-700">
          Lepaskan di sini
        </div>
      )}
      {overState === "invalid" && (
        <div className="mx-2 mt-2 rounded-ui border-2 border-dashed border-red-400 bg-red-100/60 px-2 py-2 text-center text-[11px] font-bold text-red-600">
          <Ban className="mx-auto mb-0.5 size-3.5" />
          Tidak bisa dipindahkan ke sini
        </div>
      )}

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2" style={{ minHeight: 160, maxHeight: 480 }}>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            isSelected={selectedIds.has(task.id)}
            onToggleSelect={onToggleSelect}
            onPreviewFile={onPreviewFile}
            isDragging={draggingTaskIds.has(task.id)}
            onDragStart={() => {}}   // handled at parent level
            onDragEnd={() => {}}
          />
        ))}
        <button
          onClick={() => onAddCard(status.id)}
          className="w-full rounded-ui border-2 border-dashed border-ink/25 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-ink hover:bg-muted hover:text-foreground"
        >
          + Tambah card
        </button>
      </div>
    </div>
  );
}

// ─── Task Form Dialog ─────────────────────────────────────────────────────────

interface TaskFormProps {
  initial?: Partial<Task>;
  onSave: (data: Omit<Task, "id" | "created_at" | "updated_at">) => void;
  onClose: () => void;
}

function TaskFormDialog({ initial, onSave, onClose }: TaskFormProps) {
  const [title, setTitle]       = useState(initial?.title ?? "");
  const [desc, setDesc]         = useState(initial?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? "medium");
  const [status, setStatus]     = useState<TaskStatus>(initial?.status ?? "todo");
  const [dueDate, setDueDate]   = useState(initial?.due_date ?? "");
  const [attached, setAttached] = useState<AttachedFile[]>(initial?.attachedFiles ?? []);
  const [error, setError]       = useState("");

  const handleSave = () => {
    if (!title.trim()) { setError("Judul tidak boleh kosong."); return; }
    onSave({ title: title.trim(), description: desc.trim() || undefined, priority, status, due_date: dueDate || undefined, attachedFiles: attached });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-y-auto rounded-t-[20px] border-2 border-ink bg-card p-5 shadow-brutal sm:rounded-ui sm:p-6" style={{ maxHeight: "90vh" }}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{initial?.id ? "Edit Task" : "New Task"}</h2>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-ui border-2 border-ink bg-coral shadow-brutal-sm hover:bg-coral/80" aria-label="Tutup"><X className="size-4" /></button>
        </div>
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Judul <span className="text-red-500">*</span></label>
          <input className="w-full rounded-ui border-2 border-ink bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-ink/20" placeholder="Nama pekerjaan..." value={title} onChange={e => { setTitle(e.target.value); setError(""); }} autoFocus />
          {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
        </div>
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Deskripsi <span className="text-xs font-normal normal-case text-muted-foreground/60">(opsional)</span></label>
          <textarea className="min-h-[80px] w-full resize-none rounded-ui border-2 border-ink bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-ink/20" placeholder="Detail pekerjaan..." value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Prioritas</label>
            <div className="relative">
              <select className="w-full appearance-none rounded-ui border-2 border-ink bg-background py-2 pl-3 pr-8 text-sm font-medium outline-none" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
                {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</label>
            <div className="relative">
              <select className="w-full appearance-none rounded-ui border-2 border-ink bg-background py-2 pl-3 pr-8 text-sm font-medium outline-none" value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Due Date <span className="text-xs font-normal normal-case text-muted-foreground/60">(opsional)</span></label>
          <input type="date" className="w-full rounded-ui border-2 border-ink bg-background px-3 py-2 text-sm font-medium outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <div className="mb-5">
          <AttachSection attached={attached} onAdd={f => setAttached(prev => [...prev, f])} onRemove={id => setAttached(prev => prev.filter(f => f.id !== id))} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} className="bg-ink text-background hover:bg-ink/90">Simpan Task</Button>
        </div>
      </div>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function AttachmentCell({ files, onPreviewFile }: { files: AttachedFile[]; onPreviewFile: (f: FileItem) => void }) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!files || files.length === 0) {
    return <span className="text-xs text-muted-foreground/40 font-mono">—</span>;
  }

  if (files.length === 1) {
    const f = files[0];
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPreviewFile(attachedToFileItem(f));
        }}
        className="flex max-w-[130px] items-center gap-1.5 rounded-md border border-ink/20 bg-background px-2 py-1 text-xs font-semibold text-foreground transition-all hover:bg-lime/40 hover:border-ink shadow-brutal-sm group/btn text-left"
        title={`Lihat ${f.name}`}
      >
        <Paperclip className="size-3 shrink-0 text-muted-foreground group-hover/btn:text-ink" />
        <span className="truncate text-[11px]">{f.name}</span>
      </button>
    );
  }

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(p => !p);
        }}
        className={`flex items-center gap-1.5 rounded-md border border-ink/20 px-2 py-1 text-xs font-bold transition-all shadow-brutal-sm ${
          open ? "bg-lime border-ink text-ink" : "bg-background hover:bg-muted/80 text-foreground"
        }`}
        title={`${files.length} file terlampir`}
      >
        <Paperclip className="size-3 shrink-0 text-ink" />
        <span className="text-[11px]">{files.length} file</span>
        <ChevronDown className={`size-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-ui border-2 border-ink bg-card p-1.5 shadow-brutal">
          <div className="mb-1 border-b border-ink/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>{files.length} Lampiran</span>
          </div>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {files.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onPreviewFile(attachedToFileItem(f));
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium transition-colors hover:bg-lime/40"
              >
                <HardDrive className="size-3 shrink-0 text-green-600" />
                <span className="truncate flex-1 text-[11px] font-semibold">{f.name}</span>
                <ExternalLink className="size-2.5 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ListView({ tasks, onEdit, onDelete, onStatusChange, onPreviewFile }: {
  tasks: Task[];
  onEdit: (t: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, s: TaskStatus) => void;
  onPreviewFile: (f: FileItem) => void;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-ui border-2 border-dashed border-ink/25 py-16 text-center">
        <CheckSquare className="size-10 text-muted-foreground" />
        <p className="font-display text-lg font-bold">Belum ada task</p>
        <p className="text-sm text-muted-foreground">Buat task baru dengan klik tombol di atas.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-ui border-2 border-ink shadow-brutal">
      <div className="hidden grid-cols-[55px_1fr_120px_105px_95px_140px_56px] gap-2 border-b-2 border-ink bg-ink px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-card sm:grid min-w-[700px]">
        <span>ID</span><span>Judul</span><span>Status</span><span>Prioritas</span><span>Due Date</span><span>Lampiran</span><span />
      </div>
      {tasks.map((task, idx) => {
        const due = formatDueDate(task.due_date);
        const isExpanded = expandedId === task.id;
        return (
          <div key={task.id} className={`border-b border-ink/15 last:border-0 ${idx % 2 === 1 ? "bg-muted/40" : "bg-card"}`}>
            <div className="hidden grid-cols-[55px_1fr_120px_105px_95px_140px_56px] items-center gap-2 px-4 py-3 text-sm sm:grid min-w-[700px]">
              <span className="font-mono text-[10px] font-bold text-muted-foreground">#{String(task.id).padStart(3, "0")}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`font-semibold leading-snug truncate ${task.status === "done" ? "text-muted-foreground line-through" : ""}`}>{task.title}</p>
                  {task.attachedFiles.length > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-muted/80 px-1 py-0.2 text-[9px] font-bold text-muted-foreground border border-ink/10" title={`${task.attachedFiles.length} file terlampir`}>
                      <Paperclip className="size-2.5" />{task.attachedFiles.length}
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{task.description}</p>
                )}
              </div>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              <span className={`text-xs font-semibold ${due.overdue ? "text-red-600" : "text-muted-foreground"}`}>{due.label || "—"}</span>
              <AttachmentCell files={task.attachedFiles} onPreviewFile={onPreviewFile} />
              <div className="flex gap-1">
                <button onClick={() => onEdit(task)} className="grid size-7 place-items-center rounded border-[1.5px] border-ink/30 text-muted-foreground hover:border-ink hover:bg-sun" aria-label="Edit"><Pencil className="size-3" /></button>
                <button onClick={() => onDelete(task.id)} className="grid size-7 place-items-center rounded border-[1.5px] border-ink/30 text-muted-foreground hover:border-ink hover:bg-coral" aria-label="Hapus"><Trash2 className="size-3" /></button>
              </div>
            </div>
            {/* Mobile card — rapi */}
            <div className="sm:hidden">
              <button
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-muted/60"
                onClick={() => setExpandedId(isExpanded ? null : task.id)}
              >
                {/* Status color strip */}
                <span className={`h-10 w-1 shrink-0 rounded-full border border-ink/20 ${getStatus(task.status).color}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold leading-snug ${task.status === "done" ? "text-muted-foreground line-through" : ""}`}>
                    {task.title}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    {due.label && (
                      <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${due.overdue ? "text-red-600" : "text-muted-foreground"}`}>
                        <Calendar className="size-3" />{due.label}
                      </span>
                    )}
                    {task.attachedFiles.length > 0 && (
                      <span className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground border border-ink/20">
                        <Paperclip className="size-3 text-ink" />
                        {task.attachedFiles.length} file
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded
                  ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                }
              </button>
              {isExpanded && (
                <div className="border-t-2 border-ink/10 bg-muted/40 px-4 pb-4 pt-3 space-y-3">
                  {/* Deskripsi */}
                  {task.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>
                  )}
                  {/* Lampiran File */}
                  {task.attachedFiles.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-dashed border-ink/20">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Paperclip className="size-3" /> Lampiran ({task.attachedFiles.length})
                      </p>
                      <div className="flex flex-col gap-1">
                        {task.attachedFiles.map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => onPreviewFile(attachedToFileItem(f))}
                            className="flex items-center gap-2 rounded-ui border-2 border-ink/20 bg-background px-2.5 py-2 text-left text-xs font-semibold hover:bg-lime/30 transition-colors shadow-brutal-sm"
                          >
                            <HardDrive className="size-3.5 text-green-600 shrink-0" />
                            <span className="truncate flex-1 min-w-0 text-[11px]">{f.name}</span>
                            <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-9 gap-1 text-xs font-semibold" onClick={() => { onEdit(task); setExpandedId(null); }}>
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-9 gap-1 text-xs font-semibold text-red-600 border-red-300 hover:bg-red-50" onClick={() => { onDelete(task.id); setExpandedId(null); }}>
                      <Trash2 className="size-3.5" /> Hapus
                    </Button>
                  </div>
                  {/* Move to buttons */}
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pindah ke</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {STATUSES.filter(s => s.id !== task.status).map(s => {
                        const allowed = canMoveTo(task.status, s.id);
                        return (
                          <button
                            key={s.id}
                            disabled={!allowed}
                            onClick={() => { if (allowed) { onStatusChange(task.id, s.id); setExpandedId(null); } }}
                            className={`flex flex-col items-center gap-1 rounded-ui border-2 border-ink py-2 text-[10px] font-bold transition-opacity ${allowed ? s.color + " active:scale-95" : "opacity-30 cursor-not-allowed bg-muted"}`}
                          >
                            <s.Icon className={`size-3.5 ${s.iconColor}`} />
                            {s.label}
                            {!allowed && <Ban className="size-3 text-red-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-ui border-2 border-ink bg-card p-6 shadow-brutal">
        <div className="mb-4 flex size-12 items-center justify-center rounded-ui border-2 border-ink bg-coral"><Trash2 className="size-6" /></div>
        <h3 className="font-display text-lg font-bold">Hapus task?</h3>
        <p className="mt-1 text-sm text-muted-foreground">Task ini akan dihapus permanen dan tidak bisa dikembalikan.</p>
        <div className="mt-5 flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>Batal</Button>
          <Button onClick={onConfirm} className="bg-red-600 text-white hover:bg-red-700">Hapus</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ tasks }: { tasks: Task[] }) {
  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
    tasks.forEach(t => c[t.status]++);
    return c;
  }, [tasks]);
  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map(s => (
        <span
          key={s.id}
          className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 text-xs font-bold shadow-brutal-sm ${s.color}`}
        >
          <s.Icon className={`size-3 ${s.iconColor}`} />
          {s.label}: {counts[s.id]}
        </span>
      ))}
    </div>
  );
}

// ─── Main TasksSection ────────────────────────────────────────────────────────

interface TasksSectionProps {
  onFlash: (msg: string, type?: "success" | "error" | "info") => void;
  onRegisterNewTask?: (fn: () => void) => void;
  externalNewFormOpen?: boolean;
  onExternalNewFormHandled?: () => void;
}

export function TasksSection({ onFlash, onRegisterNewTask, externalNewFormOpen, onExternalNewFormHandled }: TasksSectionProps) {
  const queryClient = useQueryClient();
  const [view, setView]                     = useState<"board" | "list">("board");
  const [filterStatus, setFilterStatus]     = useState<TaskStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [formOpen, setFormOpen]             = useState(false);
  const [editTask, setEditTask]             = useState<Task | null>(null);
  const [deleteId, setDeleteId]             = useState<number | null>(null);
  const [defaultStatus, setDefaultStatus]   = useState<TaskStatus>("todo");
  const [selectedIds, setSelectedIds]       = useState<Set<number>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [previewFile, setPreviewFile]       = useState<FileItem | null>(null);

  // ── React Query — cache tasks, tidak re-fetch saat remount dalam 60 detik ─
  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await api.getTasks({ limit: 200 });
      if (res.success && res.data) return res.data.tasks.map(apiTaskToTask);
      throw new Error(res.error?.message ?? "Gagal memuat tasks");
    },
    staleTime: 60_000,
  });

  // Helper untuk update cache lokal (optimistic/rollback)
  const setTasks = useCallback((updater: Task[] | ((prev: Task[]) => Task[])) => {
    queryClient.setQueryData<Task[]>(["tasks"], prev => {
      const current = prev ?? [];
      return typeof updater === "function" ? updater(current) : updater;
    });
  }, [queryClient]);

  // fetchTasks dipakai untuk rollback saat API gagal
  const fetchTasks = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }, [queryClient]);

  // ── DnD state ──────────────────────────────────────────────────────────────
  const [draggingTaskId, setDraggingTaskId]         = useState<number | null>(null);
  const [draggingFromStatus, setDraggingFromStatus] = useState<TaskStatus | null>(null);
  const [dragOverColumn, setDragOverColumn]         = useState<TaskStatus | null>(null);

  // Set of currently dragging task ids (for styling)
  const draggingTaskIds = useMemo(() =>
    draggingTaskId !== null ? new Set([draggingTaskId]) : new Set<number>(),
    [draggingTaskId]
  );

  const handleDragStart = useCallback((taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setDraggingTaskId(taskId);
    setDraggingFromStatus(task.status);
    setDragOverColumn(null);
  }, [tasks]);

  const handleDragEnd = useCallback(() => {
    setDraggingTaskId(null);
    setDraggingFromStatus(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((targetStatus: TaskStatus) => {
    setDragOverColumn(targetStatus);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(async (targetStatus: TaskStatus) => {
    if (draggingTaskId === null || draggingFromStatus === null) return;

    if (draggingFromStatus === targetStatus) {
      handleDragEnd();
      return;
    }

    if (!canMoveTo(draggingFromStatus, targetStatus)) {
      onFlash(rejectReason(draggingFromStatus, targetStatus), "error");
      handleDragEnd();
      return;
    }

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === draggingTaskId
        ? { ...t, status: targetStatus, updated_at: new Date().toISOString() }
        : t
    ));
    const toLabel = STATUSES.find(s => s.id === targetStatus)!.label;
    onFlash(`Task dipindahkan ke ${toLabel}`);
    handleDragEnd();

    // Persist ke backend
    const res = await api.moveTaskStatus(draggingTaskId, targetStatus);
    if (!res.success) {
      onFlash("Gagal menyimpan perubahan status", "error");
      fetchTasks(); // rollback dari server
    }
  }, [draggingTaskId, draggingFromStatus, handleDragEnd, onFlash, fetchTasks]);

  // ── Filtered tasks (dipakai di bulk select + render) ───────────────────────
  const filteredTasks = useMemo(() =>
    tasks.filter(t => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      return true;
    }),
    [tasks, filterStatus, filterPriority]
  );

  // ── Other handlers ─────────────────────────────────────────────────────────

  const handleCreate = useCallback(async (data: Omit<Task, "id" | "created_at" | "updated_at">) => {
    const res = await api.createTask({
      title:                 data.title,
      ...(data.description !== undefined && { description: data.description }),
      priority:              data.priority,
      status:                data.status,
      due_date:              data.due_date ?? null,
    });
    if (res.success && res.data) {
      const taskId = res.data.id;
      // Attach semua file yang dipilih
      for (const f of data.attachedFiles) {
        await api.attachFileToTask(taskId, Number(f.id));
      }
      // Re-fetch task ini supaya files ikut ke state
      const detail = await api.getTask(taskId);
      if (detail.success && detail.data) {
        setTasks(prev => [apiTaskToTask(detail.data!), ...prev]);
      } else {
        setTasks(prev => [apiTaskToTask(res.data!), ...prev]);
      }
      onFlash("Task berhasil dibuat");
    } else {
      onFlash(res.error?.message ?? "Gagal membuat task", "error");
    }
  }, [onFlash]);

  const handleUpdate = useCallback(async (data: Omit<Task, "id" | "created_at" | "updated_at">) => {
    if (!editTask) return;
    const res = await api.updateTask(editTask.id, {
      title:                 data.title,
      ...(data.description !== undefined && { description: data.description }),
      priority:              data.priority,
      status:                data.status,
      due_date:              data.due_date ?? null,
    });
    if (res.success && res.data) {
      const taskId = editTask.id;
      // Sync lampiran: detach yang dihapus, attach yang baru
      const prevIds = new Set(editTask.attachedFiles.map(f => f.id));
      const nextIds = new Set(data.attachedFiles.map(f => f.id));
      // Detach yang tidak ada lagi
      for (const f of editTask.attachedFiles) {
        if (!nextIds.has(f.id)) await api.detachFileFromTask(taskId, Number(f.id));
      }
      // Attach yang baru
      for (const f of data.attachedFiles) {
        if (!prevIds.has(f.id)) await api.attachFileToTask(taskId, Number(f.id));
      }
      // Re-fetch untuk dapat files terbaru
      const detail = await api.getTask(taskId);
      if (detail.success && detail.data) {
        setTasks(prev => prev.map(t => t.id === taskId ? apiTaskToTask(detail.data!) : t));
      } else {
        setTasks(prev => prev.map(t => t.id === taskId ? apiTaskToTask(res.data!) : t));
      }
      onFlash("Task berhasil diupdate");
    } else {
      onFlash(res.error?.message ?? "Gagal update task", "error");
    }
    setEditTask(null);
  }, [editTask, onFlash]);

  const handleStatusChange = useCallback(async (id: number, status: TaskStatus) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, updated_at: new Date().toISOString() } : t));
    const toLabel = STATUSES.find(s => s.id === status)!.label;
    onFlash(`Task dipindahkan ke ${toLabel}`);
    const res = await api.moveTaskStatus(id, status);
    if (!res.success) {
      onFlash("Gagal menyimpan perubahan status", "error");
      fetchTasks();
    }
  }, [onFlash, fetchTasks]);

  const handleDelete  = useCallback((id: number) => setDeleteId(id), []);
  const confirmDelete = useCallback(async () => {
    if (deleteId === null) return;
    const res = await api.deleteTask(deleteId);
    if (res.success) {
      setTasks(prev => prev.filter(t => t.id !== deleteId));
      onFlash("Task dihapus");
    } else {
      onFlash(res.error?.message ?? "Gagal menghapus task", "error");
    }
    setDeleteId(null);
  }, [deleteId, onFlash]);

  // ── Bulk select handlers ───────────────────────────────────────────────────
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredTasks.map(t => t.id)));
  }, [filteredTasks]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const confirmBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    let successCount = 0;
    for (const id of ids) {
      const res = await api.deleteTask(id);
      if (res.success) successCount++;
    }
    setTasks(prev => prev.filter(t => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
    onFlash(`${successCount} task dihapus`);
  }, [selectedIds, onFlash]);

  const openNewForm = useCallback((status: TaskStatus = "todo") => {
    setDefaultStatus(status);
    setEditTask(null);
    setFormOpen(true);
  }, []);

  // Register openNewForm so parent (index.tsx) can call it from the header button
  useEffect(() => { onRegisterNewTask?.(openNewForm); }, [onRegisterNewTask, openNewForm]);

  // Handle external trigger from header button
  useEffect(() => {
    if (externalNewFormOpen) {
      openNewForm("todo");
      onExternalNewFormHandled?.();
    }
  }, [externalNewFormOpen, onExternalNewFormHandled, openNewForm]);

  const activeCount = tasks.filter(t => t.status !== "done").length;
  const doneCount   = tasks.filter(t => t.status === "done").length;

  if (loading) return null;

  return (
    <>
      {/* Stats + Toolbar — desktop: satu baris, mobile: compact */}
      <div className="mb-4 mt-6 sm:mt-4">
        {/* Desktop: satu baris — chips kiri, pills+toggle kanan */}
        <div className="hidden items-center gap-2 sm:flex">
          <StatsBar tasks={tasks} />

          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-ui border-2 border-ink bg-sun px-2.5 py-1 text-xs font-bold shadow-brutal-sm">
              <Timer className="size-3 text-orange-500" />{activeCount} aktif
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-ui border-2 border-ink bg-mint px-2.5 py-1 text-xs font-bold shadow-brutal-sm">
              <CheckCircle2 className="size-3 text-green-600" />{doneCount} selesai
            </span>
            <div className="flex overflow-hidden rounded-ui border-2 border-ink shadow-brutal-sm">
              <button onClick={() => setView("board")} className={`flex h-9 items-center gap-1.5 px-3 text-xs font-semibold transition-colors ${view === "board" ? "bg-ink text-card" : "bg-card hover:bg-muted"}`} aria-label="Board view">
                <LayoutGrid className="size-3.5" /> Board
              </button>
              <button onClick={() => setView("list")} className={`flex h-9 items-center gap-1.5 border-l-2 border-ink px-3 text-xs font-semibold transition-colors ${view === "list" ? "bg-ink text-card" : "bg-card hover:bg-muted"}`} aria-label="List view">
                <List className="size-3.5" /> List
              </button>
            </div>
          </div>
        </div>
        {/* Mobile: filter + toggle satu baris */}
        <div className="flex items-center gap-2 sm:hidden">
          <div className="relative flex flex-1 items-center rounded-ui border-2 border-ink bg-card shadow-brutal-sm">
            <select className="h-9 w-full appearance-none bg-transparent pl-3 pr-8 text-xs font-semibold outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value as TaskStatus | "all")} aria-label="Filter status">
              <option value="all">Semua Status</option>
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="relative flex flex-1 items-center rounded-ui border-2 border-ink bg-card shadow-brutal-sm">
            <select className="h-9 w-full appearance-none bg-transparent pl-3 pr-8 text-xs font-semibold outline-none" value={filterPriority} onChange={e => setFilterPriority(e.target.value as TaskPriority | "all")} aria-label="Filter prioritas">
              <option value="all">Semua Prioritas</option>
              {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="flex overflow-hidden rounded-ui border-2 border-ink shadow-brutal-sm">
            <button onClick={() => setView("board")} className={`flex h-9 items-center px-3 text-xs font-semibold transition-colors ${view === "board" ? "bg-ink text-card" : "bg-card hover:bg-muted"}`} aria-label="Board view">
              <LayoutGrid className="size-3.5" />
            </button>
            <button onClick={() => setView("list")} className={`flex h-9 items-center border-l-2 border-ink px-3 text-xs font-semibold transition-colors ${view === "list" ? "bg-ink text-card" : "bg-card hover:bg-muted"}`} aria-label="List view">
              <List className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* DnD hint — desktop only */}
      {view === "board" && (
        <>
          {/* Desktop hint */}
          <p className="mb-3 hidden items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:flex">
            Drag card ke kolom sebelah hanya bisa maju atau mundur satu langkah
          </p>
          {/* Mobile hint */}
          <p className="mb-3 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:hidden">
            Tap ··· di card untuk pindah status
          </p>
        </>
      )}
      {/* Board */}
      {view === "board" && (
        <>
          {/* Bulk action toolbar — muncul saat ada task yang dipilih */}
          {selectedIds.size > 0 && (
            <div className="mb-3 flex items-center gap-3 rounded-ui border-2 border-ink bg-sun px-4 py-2.5 shadow-brutal">
              <span className="flex-1 text-sm font-bold">
                {selectedIds.size} task dipilih
              </span>
              <button
                onClick={selectAll}
                className="rounded-ui border-2 border-ink bg-card px-3 py-1.5 text-xs font-bold shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal"
              >
                Pilih Semua ({filteredTasks.length})
              </button>
              <button
                onClick={clearSelection}
                className="rounded-ui border-2 border-ink bg-card px-3 py-1.5 text-xs font-bold shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal"
              >
                Batal
              </button>
              <button
                onClick={() => setBulkDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-ui border-2 border-ink bg-coral px-3 py-1.5 text-xs font-bold shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal"
              >
                <Trash2 className="size-3.5" /> Hapus {selectedIds.size} Task
              </button>
            </div>
          )}
        <div
          className="flex gap-3 overflow-x-auto pb-4"
          onDragStartCapture={e => {
            const target = (e.target as HTMLElement).closest("[data-task-id]");
            if (target) {
              const taskId = Number((target as HTMLElement).dataset["taskId"]);
              handleDragStart(taskId);
            }
          }}
          onDragEndCapture={handleDragEnd}
          onTouchEnd={handleDragEnd}
        >
          {STATUSES.map(s => (
            <BoardColumn
              key={s.id}
              status={s}
              tasks={filteredTasks.filter(t => t.status === s.id)}
              onAddCard={openNewForm}
              onEdit={t => { setEditTask(t); setFormOpen(true); }}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onPreviewFile={f => setPreviewFile(f)}
              draggingTaskId={draggingTaskId}
              draggingFromStatus={draggingFromStatus}
              dragOverColumn={dragOverColumn}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              draggingTaskIds={draggingTaskIds}
            />
          ))}
        </div>
        </>
      )}
      {/* List */}
      {view === "list" && (
        <ListView
          tasks={filteredTasks}
          onEdit={t => { setEditTask(t); setFormOpen(true); }}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onPreviewFile={f => setPreviewFile(f)}
        />
      )}

      {/* Form */}
      {formOpen && (
        <TaskFormDialog
          initial={editTask ?? { status: defaultStatus }}
          onSave={editTask ? handleUpdate : handleCreate}
          onClose={() => { setFormOpen(false); setEditTask(null); }}
        />
      )}

      {/* Delete confirm */}
      {deleteId !== null && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />}

      {/* File preview dialog */}
      {previewFile && (
        <FilePreviewDialog
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* Bulk delete confirm */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setBulkDeleteConfirm(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-ui border-2 border-ink bg-card p-6 shadow-brutal">
            <div className="mb-4 flex size-12 items-center justify-center rounded-ui border-2 border-ink bg-coral">
              <Trash2 className="size-6" />
            </div>
            <h3 className="mb-1 font-display text-lg font-bold">Hapus {selectedIds.size} Task?</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Semua task yang dipilih akan dihapus permanen. Aksi ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                className="flex-1 rounded-ui border-2 border-ink bg-card py-2 text-sm font-bold shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal"
              >
                Batal
              </button>
              <button
                onClick={confirmBulkDelete}
                className="flex-1 rounded-ui border-2 border-ink bg-coral py-2 text-sm font-bold shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal"
              >
                Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
