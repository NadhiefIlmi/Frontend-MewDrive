/**
 * HomeSection Component
 * Modern Neo-Brutalist Dashboard Home View
 * Features: Interactive Hero with quick actions, organized Ringkasan with framed mascot,
 * quick access folders, and recent documents activity.
 */

import { useState, useEffect } from "react";
import {
  FileText,
  StickyNote,
  FolderPlus,
  Folder,
  Loader2,
  Sparkles,
  ArrowRight,
  CheckSquare,
  HardDrive,
  FileImage,
  FileArchive,
  FileSpreadsheet,
  File,
  Eye,
  Plus,
  Star,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
const kucingPagi = "/kucing_pagi.webp";
import catLoader from "@/assets/Loader_cat.gif";
import { type ApiFolderItem } from "@/types/dashboard";
import type { Section } from "@/types/dashboard";
import { FolderCard, EditFolderDialog, CreateFolderDialog } from "@/components/dashboard/FolderSection";
import { api, type FileItem } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilePreviewDialog } from "@/components/dashboard/FilePreviewDialog";

// ─── Format helper: bytes adaptif ─────────────────────────────────────────────
function formatStorage(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024)       return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes > 0)           return `${Math.round(bytes)} B`;
  return "0 B";
}

// ─── Format helper: tanggal relatif ───────────────────────────────────────────
function formatRelative(iso: string | null | undefined, fallback: string): string {
  const src = iso ?? fallback;
  const d = new Date(src);
  if (isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffH = Math.floor(diffMins / 60);
  if (diffH < 24) return `${diffH} jam lalu`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Helper: icon berdasarkan mime type ───────────────────────────────────────
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

// ─── Helper: warna latar file ─────────────────────────────────────────────────
function getFileColorCls(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "bg-lilac";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "bg-lime";
  if (mimeType.includes("pdf")) return "bg-coral";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "bg-sun";
  return "bg-sky";
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface HomeSectionProps {
  folders: ApiFolderItem[];
  foldersLoading: boolean;
  foldersTotal?: number;
  filesTotal?: number;
  isActive?: boolean;
  onSectionChange: (section: Section) => void;
  onFolderOpen: (folder: ApiFolderItem) => void;
  onFolderCreate?: () => void;
  onFolderCreated?: (folder: ApiFolderItem) => void;
  onFolderRenamed: (folder: ApiFolderItem) => void;
  onFolderTrashed: (folderId: number) => void;
  onFolderStarToggled: (folder: ApiFolderItem) => void;
  onFlash: (msg: string, type?: "success" | "error" | "info") => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function HomeSection({
  folders,
  foldersLoading,
  foldersTotal,
  filesTotal = 0,
  isActive = true,
  onSectionChange,
  onFolderOpen,
  onFolderCreate,
  onFolderCreated,
  onFolderRenamed,
  onFolderTrashed,
  onFolderStarToggled,
  onFlash,
}: HomeSectionProps) {
  const { authUser, can } = useAuth();
  const [menuOpenId, setMenuOpenId]         = useState<number | null>(null);
  const [editingFolder, setEditingFolder]   = useState<ApiFolderItem | null>(null);
  const [trashingFolder, setTrashingFolder] = useState<ApiFolderItem | null>(null);
  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);

  // Close menu folder saat klik di luar
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

  // Stats data
  const [notesTotal, setNotesTotal]           = useState<number | null>(null);
  const [tasksTotal, setTasksTotal]           = useState<number | null>(null);
  const [starredTotal, setStarredTotal]       = useState<number | null>(null);
  const [trashTotal, setTrashTotal]           = useState<number | null>(null);
  const [filesTotalLocal, setFilesTotalLocal] = useState<number | null>(null);
  const [storageUsedBytes, setStorageUsedBytes]   = useState<number>(0);
  const [storageQuotaBytes, setStorageQuotaBytes] = useState<number>(0);

  // Recent files data
  const DEMO_RECENT_FILES: FileItem[] = [
    { id: 1, user_id: 1, folder_id: null, name: "MewDrive_Design_System_v2.pdf", original_name: "MewDrive_Design_System_v2.pdf", mime_type: "application/pdf", extension: "pdf", size: 4850000, storage_path: "/uploads/1.pdf", is_starred: true, is_trashed: false, trashed_at: null, last_accessed_at: new Date(Date.now() - 15 * 60000).toISOString(), created_at: "2026-11-14T08:30:00Z", updated_at: "2026-11-15T09:15:00Z" },
    { id: 2, user_id: 1, folder_id: null, name: "Financial_Report_Q4_2026.xlsx", original_name: "Financial_Report_Q4_2026.xlsx", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx", size: 1950000, storage_path: "/uploads/2.xlsx", is_starred: true, is_trashed: false, trashed_at: null, last_accessed_at: new Date(Date.now() - 45 * 60000).toISOString(), created_at: "2026-11-12T14:10:00Z", updated_at: "2026-11-14T11:00:00Z" },
    { id: 3, user_id: 1, folder_id: null, name: "Microservices_Architecture_Diagram.png", original_name: "Microservices_Architecture_Diagram.png", mime_type: "image/png", extension: "png", size: 3240000, storage_path: "/uploads/3.png", is_starred: false, is_trashed: false, trashed_at: null, last_accessed_at: new Date(Date.now() - 120 * 60000).toISOString(), created_at: "2026-11-10T17:20:00Z", updated_at: "2026-11-13T15:40:00Z" },
    { id: 4, user_id: 1, folder_id: null, name: "PostgreSQL_Database_Backup.zip", original_name: "PostgreSQL_Database_Backup.zip", mime_type: "application/zip", extension: "zip", size: 18400000, storage_path: "/uploads/4.zip", is_starred: false, is_trashed: false, trashed_at: null, last_accessed_at: new Date(Date.now() - 360 * 60000).toISOString(), created_at: "2026-11-08T22:00:00Z", updated_at: "2026-11-09T01:30:00Z" },
    { id: 5, user_id: 1, folder_id: null, name: "Sprint_Planning_Review.docx", original_name: "Sprint_Planning_Review.docx", mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: "docx", size: 760000, storage_path: "/uploads/5.docx", is_starred: true, is_trashed: false, trashed_at: null, last_accessed_at: new Date(Date.now() - 720 * 60000).toISOString(), created_at: "2026-11-05T13:45:00Z", updated_at: "2026-11-12T10:20:00Z" }
  ];

  const [recentFiles, setRecentFiles]     = useState<FileItem[]>(DEMO_RECENT_FILES);
  const [recentLoading, setRecentLoading] = useState<boolean>(false);
  const [previewFile, setPreviewFile]     = useState<FileItem | null>(null);

  // Ambil data catatan
  useEffect(() => {
    api.getNotes({ page: 1, limit: 1 }).then((res) => {
      if (res.success && res.data) setNotesTotal(res.data.total);
    }).catch(() => {});
  }, []);

  // Ambil data task
  useEffect(() => {
    api.getTasks({ limit: 1 }).then((res) => {
      if (res.success && res.data) setTasksTotal(res.data.total);
    }).catch(() => {});
  }, []);

  // Ambil total file & folder favorit
  useEffect(() => {
    Promise.all([
      api.getFileStarred({ page: 1, limit: 1 }).catch(() => null),
      api.getFolderStarred({ page: 1, limit: 1 }).catch(() => null),
    ]).then(([fileRes, folderRes]) => {
      const fileCount = fileRes && fileRes.success && fileRes.data ? (fileRes.data.total ?? 0) : 0;
      const folderCount = folderRes && folderRes.success && folderRes.data ? (folderRes.data.total ?? 0) : 0;
      setStarredTotal(fileCount + folderCount);
    }).catch(() => {});
  }, []);

  // Ambil total sampah (file + folder di sampah)
  useEffect(() => {
    Promise.all([
      api.getFileTrash({ page: 1, limit: 1 }).catch(() => null),
      api.getFolderTrash({ page: 1, limit: 1 }).catch(() => null),
    ]).then(([fileRes, folderRes]) => {
      const fileCount = fileRes && fileRes.success && fileRes.data ? (fileRes.data.total ?? 0) : 0;
      const folderCount = folderRes && folderRes.success && folderRes.data ? (folderRes.data.total ?? 0) : 0;
      setTrashTotal(fileCount + folderCount);
    }).catch(() => {});
  }, []);

  // Ambil total file & storage breakdown
  useEffect(() => {
    api.getStorage().then((res) => {
      if (res.success && res.data) {
        const total = res.data.breakdown.reduce((sum, b) => sum + b.file_count, 0);
        setFilesTotalLocal(total);
        setStorageUsedBytes(res.data.storage_used);
        setStorageQuotaBytes(res.data.storage_quota);
      }
    }).catch(() => {});
  }, []);

  // Ambil file terbaru untuk preview aktivitas di Beranda
  const fetchRecent = () => {
    setRecentLoading(true);
    api.getFileRecent(6).then((res) => {
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any)?.files ?? [];
        setRecentFiles(list.length > 0 ? list : DEMO_RECENT_FILES);
      } else {
        setRecentFiles(DEMO_RECENT_FILES);
      }
    }).catch(() => {
      setRecentFiles(DEMO_RECENT_FILES);
    })
    .finally(() => setRecentLoading(false));
  };

  useEffect(() => {
    if (isActive) {
      fetchRecent();
    }
  }, [isActive]);

  const totalFolders = foldersTotal ?? folders.length;
  const canCreateFolder = can('create_files');
  const showCreateCard = canCreateFolder && folders.length < 6;
  const previewFolders = folders.slice(0, showCreateCard ? 5 : 6);
  const totalItems = previewFolders.length + (showCreateCard ? 1 : 0);

  const getGridColsClass = () => {
    if (totalItems <= 1) return "grid-cols-1 max-w-xs";
    if (totalItems === 2) return "grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 max-w-2xl";
    if (totalItems === 3) return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3";
    if (totalItems === 4) return "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4";
    if (totalItems === 5) return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";
  };

  const storagePct = storageQuotaBytes > 0
    ? Math.round((storageUsedBytes / storageQuotaBytes) * 100)
    : 0;

  const firstName = authUser?.name ? authUser.name.split(" ")[0] : null;

  const handleTrash = async (folder: ApiFolderItem) => {
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

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO BANNER & RINGKASAN AKTIVITAS
         ───────────────────────────────────────────────────────────── */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        {/* ── A. Modern Hero Banner ── */}
        <div className="grid overflow-hidden rounded-2xl border-2 border-ink bg-lilac shadow-brutal sm:grid-cols-[minmax(0,1.3fr)_minmax(200px,0.7fr)]">
          {/* Text Content */}
          <div className="flex flex-col justify-between p-5 sm:p-6 md:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-card px-3 py-1 text-xs font-bold uppercase shadow-brutal-xs">
                  <Sparkles className="size-3.5 fill-sun text-ink" />
                  Ruang kerja pribadi
                </span>
                {firstName && (
                  <span className="inline-flex items-center rounded-full border-2 border-ink bg-sun px-3 py-1 text-xs font-bold shadow-brutal-xs">
                    Halo, {firstName}! 👋
                  </span>
                )}
              </div>

              <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-foreground sm:text-4xl md:text-[42px]">
                Semua dokumenmu,
                <br />
                rapi dalam satu tempat.
              </h1>

              <p className="mt-2.5 max-w-md text-sm font-medium text-foreground/85 sm:mt-3.5 sm:text-base">
                Simpan, temukan, dan atur file penting tanpa bikin kepala penuh.
              </p>
            </div>

            {/* Quick Action CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5 pt-2">
              {can('create_files') && (
                <Button
                  size="sm"
                  onClick={() => (onFolderCreate ? onFolderCreate() : setCreatingFolder(true))}
                  className="border-2 border-ink bg-sun text-ink shadow-brutal hover:bg-sun/90 active:translate-x-0.5 active:translate-y-0.5 font-bold"
                >
                  <FolderPlus className="size-4" />
                  <span>Folder Baru</span>
                </Button>
              )}
            </div>
          </div>

          {/* Photo Frame (Office Cat) */}
          <div className="relative min-h-48 border-t-2 border-ink sm:min-h-full sm:border-l-2 sm:border-t-0">
            <img
              src={kucingPagi}
              alt="Kucing di pagi hari"
              width={600}
              height={600}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 size-full object-cover object-[center_68%] sm:object-[54%_46%]"
            />
            <span className="absolute bottom-3 right-3 rounded-xl border-2 border-ink bg-sun px-3 py-1 text-xs font-bold shadow-brutal-sm">
              OFFICE CAT
            </span>
          </div>
        </div>

        {/* ── B. Clean & Organized Ringkasan Card ── */}
        <div className="flex flex-col justify-between gap-4 sm:gap-5 rounded-2xl border-2 border-ink bg-lime p-5 sm:p-6 shadow-brutal">
          {/* Top Header: Big Counter & Enlarged Animated Cat Mascot */}
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="font-display text-4xl sm:text-5xl font-bold leading-none text-ink tracking-tight">
                    {foldersLoading ? <Loader2 className="size-8 animate-spin" /> : totalFolders}
                  </p>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-ink/90">Folder Aktif</span>
                    <span className="text-[10px] font-semibold text-ink/75">Direktori tersimpan</span>
                  </div>
                </div>
              </div>

              {/* Maskot Kucing Transparan — Ukuran Lebih Besar & Proporsional */}
              <div className="shrink-0 relative">
                <img
                  src={catLoader}
                  alt="MewDrive Cat Animation"
                  width={150}
                  height={107}
                  className="w-24 sm:w-28 h-auto object-contain select-none transition-transform duration-300 hover:scale-105 drop-shadow-sm"
                />
              </div>
            </div>

            {/* Quick Metrics Grid (Dokumen, Catatan, Tasks) */}
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => onSectionChange("files")}
                className="group flex flex-col justify-between rounded-xl border-2 border-ink bg-card p-2.5 sm:p-3 text-left shadow-brutal-xs hover:shadow-brutal-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                title="Buka Dokumen saya"
              >
                <div className="flex items-center justify-between">
                  <div className="grid size-7 place-items-center rounded-lg border-2 border-ink bg-muted text-ink shadow-[1px_1px_0px_#000] group-hover:scale-105 transition-transform">
                    <FileText className="size-3.5" />
                  </div>
                  <span className="font-display text-lg sm:text-xl font-bold text-foreground">
                    {filesTotalLocal === null ? "—" : filesTotalLocal}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-foreground leading-tight">Dokumen</p>
                  <p className="text-[10px] font-medium text-muted-foreground truncate">Berkas file</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSectionChange("notes")}
                className="group flex flex-col justify-between rounded-xl border-2 border-ink bg-sky/30 hover:bg-sky/50 p-2.5 sm:p-3 text-left shadow-brutal-xs hover:shadow-brutal-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                title="Buka Catatan"
              >
                <div className="flex items-center justify-between">
                  <div className="grid size-7 place-items-center rounded-lg border-2 border-ink bg-sky text-ink shadow-[1px_1px_0px_#000] group-hover:scale-105 transition-transform">
                    <StickyNote className="size-3.5" />
                  </div>
                  <span className="font-display text-lg sm:text-xl font-bold text-foreground">
                    {notesTotal === null ? "—" : notesTotal}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-foreground leading-tight">Catatan</p>
                  <p className="text-[10px] font-medium text-muted-foreground truncate">Ide & memo</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSectionChange("tasks")}
                className="group flex flex-col justify-between rounded-xl border-2 border-ink bg-sun/30 hover:bg-sun/50 p-2.5 sm:p-3 text-left shadow-brutal-xs hover:shadow-brutal-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                title="Buka Task Board"
              >
                <div className="flex items-center justify-between">
                  <div className="grid size-7 place-items-center rounded-lg border-2 border-ink bg-sun text-ink shadow-[1px_1px_0px_#000] group-hover:scale-105 transition-transform">
                    <CheckSquare className="size-3.5" />
                  </div>
                  <span className="font-display text-lg sm:text-xl font-bold text-foreground">
                    {tasksTotal === null ? "—" : tasksTotal}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-foreground leading-tight">Task</p>
                  <p className="text-[10px] font-medium text-muted-foreground truncate">To-do list</p>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Access Duo: Favorit & Sampah (2 Columns, Balanced) */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onSectionChange("favorites")}
              className="group flex items-center justify-between gap-2.5 rounded-xl border-2 border-ink bg-card hover:bg-sun/20 p-2.5 text-left shadow-brutal-xs hover:shadow-brutal-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              title="Buka File & Folder Favorit"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="grid size-7 sm:size-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-sun text-ink shadow-[1px_1px_0px_#000] group-hover:scale-105 group-hover:rotate-[-6deg] transition-transform">
                  <Star className="size-3.5 sm:size-4 fill-amber-400 text-ink" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground block truncate leading-tight">Favorit</span>
                  <p className="text-[10px] font-medium text-muted-foreground truncate hidden sm:block">Berbintang</p>
                </div>
              </div>
              <span className="shrink-0 inline-flex min-w-6 sm:min-w-7 items-center justify-center rounded-lg border-2 border-ink bg-sun px-1.5 sm:px-2 py-0.5 font-display text-xs font-bold text-ink shadow-[1px_1px_0px_#000]">
                {starredTotal === null ? "—" : starredTotal}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSectionChange("trash")}
              className="group flex items-center justify-between gap-2.5 rounded-xl border-2 border-ink bg-card hover:bg-coral/20 p-2.5 text-left shadow-brutal-xs hover:shadow-brutal-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              title="Buka Sampah (Trash)"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="grid size-7 sm:size-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-coral text-white shadow-[1px_1px_0px_#000] group-hover:scale-105 group-hover:rotate-[6deg] transition-transform">
                  <Trash2 className="size-3.5 sm:size-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground block truncate leading-tight">Sampah</span>
                  <p className="text-[10px] font-medium text-muted-foreground truncate hidden sm:block">Terhapus</p>
                </div>
              </div>
              <span className="shrink-0 inline-flex min-w-6 sm:min-w-7 items-center justify-center rounded-lg border-2 border-ink bg-coral/30 px-1.5 sm:px-2 py-0.5 font-display text-xs font-bold text-ink shadow-[1px_1px_0px_#000]">
                {trashTotal === null ? "—" : trashTotal}
              </span>
            </button>
          </div>

          {/* Storage Quota Inset Card (Clickable -> Breakdown Penyimpanan) */}
          <button
            type="button"
            onClick={() => onSectionChange("storage")}
            className="group w-full rounded-xl border-2 border-ink bg-card p-3 text-left shadow-brutal-xs hover:shadow-brutal-sm hover:bg-muted/70 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            title="Buka Breakdown Penyimpanan"
          >
            <div className="flex items-center justify-between text-xs font-bold text-ink">
              <span className="flex items-center gap-1.5 text-muted-foreground transition-colors group-hover:text-ink">
                <HardDrive className="size-3.5 text-ink" />
                <span>Penyimpanan</span>
                <ChevronRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
              <span>
                {formatStorage(storageUsedBytes)}
                <span className="font-normal text-muted-foreground"> / {formatStorage(storageQuotaBytes)}</span>
                <span
                  className={`ml-1.5 rounded-full border border-ink px-1.5 py-0.2 text-[10px] font-bold ${
                    storagePct > 85 ? "bg-coral text-ink" : storagePct > 60 ? "bg-sun text-ink" : "bg-lime text-ink"
                  }`}
                >
                  {storagePct}%
                </span>
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full border-2 border-ink bg-muted">
              <div
                className={`h-full transition-all duration-300 ${
                  storagePct > 85 ? "bg-coral" : storagePct > 60 ? "bg-sun" : "bg-lime"
                }`}
                style={{ width: `${Math.min(100, Math.max(storagePct, 0))}%` }}
              />
            </div>
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. AKSES CEPAT: FOLDER KAMU
         ───────────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 sm:flex-nowrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Akses cepat</p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">Folder kamu</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 border-2 border-ink font-bold shadow-brutal-xs hover:bg-card hover:-translate-y-0.5 transition-all"
              onClick={() => onSectionChange("files")}
            >
              <span>Lihat semua ({totalFolders})</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>

        {foldersLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-ink bg-card p-10 text-center shadow-brutal">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <span className="font-bold text-sm text-muted-foreground">Memuat folder...</span>
          </div>
        ) : previewFolders.length === 0 ? (
          can('create_files') ? (
            <button
              onClick={() => (onFolderCreate ? onFolderCreate() : setCreatingFolder(true))}
              className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-ink/40 bg-card p-10 text-center shadow-brutal-sm transition-all hover:border-ink hover:bg-muted"
            >
              <div className="grid size-14 place-items-center rounded-2xl border-2 border-ink bg-sun shadow-brutal-xs">
                <Folder className="size-7" />
              </div>
              <div>
                <p className="font-display text-lg font-bold">Belum ada folder</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  Klik di sini untuk membuat folder pertama dan mengatur dokumenmu
                </p>
              </div>
            </button>
          ) : (
            <div className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-ink/40 bg-card p-10 text-center shadow-brutal-sm">
              <Folder className="size-10 text-muted-foreground" />
              <p className="font-display text-lg font-bold">Belum ada folder</p>
            </div>
          )
        ) : (
          <div className={`grid gap-3 sm:gap-4 ${getGridColsClass()}`}>
            {previewFolders.map((folder, idx) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                index={idx}
                onOpen={onFolderOpen}
                onEdit={setEditingFolder}
                onTrash={handleTrash}
                onToggleStar={handleToggleStar}
                onMove={() => {}}
                menuOpenId={menuOpenId}
                onMenuToggle={setMenuOpenId}
              />
            ))}

            {showCreateCard && (
              <button
                type="button"
                onClick={() => (onFolderCreate ? onFolderCreate() : setCreatingFolder(true))}
                className="group relative flex flex-col justify-between rounded-2xl border-2 border-dashed border-ink/60 bg-card/60 p-3.5 sm:p-4 shadow-brutal-xs hover:shadow-brutal-sm hover:border-ink hover:bg-sun/20 transition-all duration-200 hover:-translate-y-0.5 text-left cursor-pointer min-h-[125px] sm:min-h-[145px]"
                title="Buat folder baru"
                aria-label="Buat folder baru"
              >
                {/* Top row: Icon badge + Plus indicator */}
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="grid size-10 sm:size-11 place-items-center rounded-xl border-2 border-dashed border-ink/70 bg-sun/40 text-ink shadow-[1px_1px_0px_0px_#000] group-hover:bg-sun group-hover:border-solid group-hover:scale-105 transition-all">
                    <FolderPlus className="size-5 sm:size-6 text-ink" />
                  </div>
                  <span className="grid size-7 place-items-center rounded-lg border-2 border-dashed border-ink/40 bg-card group-hover:border-ink group-hover:bg-sun text-ink shadow-brutal-xs transition-colors">
                    <Plus className="size-4" />
                  </span>
                </div>

                {/* Bottom row: Title & subtitle */}
                <div className="w-full pt-2">
                  <p className="truncate font-display text-sm sm:text-base font-bold text-foreground group-hover:text-ink leading-snug">
                    + Folder Baru
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-muted-foreground group-hover:text-ink/80 truncate">
                    Klik untuk menambah
                  </p>
                </div>
              </button>
            )}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. DOKUMEN TERBARU (RECENT FILES ACTIVITY)
         ───────────────────────────────────────────────────────────── */}
      <section className="pt-2">
        <div className="mb-4">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">Dokumen Terakhir Dibuka</h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            File yang baru saja Anda buka, lihat pratinjau, atau unggah
          </p>
        </div>

        {recentLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-card p-8 text-center text-muted-foreground shadow-brutal-sm">
            <Loader2 className="size-5 animate-spin" />
            <span className="font-semibold text-sm">Memuat aktivitas file terbaru...</span>
          </div>
        ) : (!recentFiles || recentFiles.length === 0) ? (
          <div className="rounded-2xl border-2 border-dashed border-ink/40 bg-card p-8 text-center shadow-brutal-sm">
            <p className="font-display text-base font-bold text-foreground">Belum ada file yang diunggah</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Unggah file ke Dokumen Saya untuk melihat riwayat aktivitas dokumen di sini.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSectionChange("files")}
              className="mt-3.5 border-2 border-ink font-bold shadow-brutal-xs hover:bg-sun"
            >
              <FileText className="size-4" />
              <span>Buka Dokumen Saya</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(recentFiles ?? []).map((file) => {
              const FileIcon = getFileIcon(file.mime_type);
              const colorCls = getFileColorCls(file.mime_type);

              return (
                <div
                  key={file.id}
                  onClick={() => setPreviewFile(file)}
                  className="group flex cursor-pointer items-center gap-3.5 rounded-2xl border-2 border-ink bg-card p-3.5 shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setPreviewFile(file);
                    }
                  }}
                >
                  {/* Icon Box */}
                  <span className={`grid size-12 shrink-0 place-items-center rounded-xl border-2 border-ink ${colorCls} shadow-brutal-xs`}>
                    <FileIcon className="size-6 text-ink" />
                  </span>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-bold text-foreground">
                      {file.name}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wider">{file.extension}</span>
                      <span>•</span>
                      <span>{formatStorage(file.size)}</span>
                      <span>•</span>
                      <span className="truncate">{formatRelative(file.last_accessed_at, file.updated_at)}</span>
                    </p>
                  </div>

                  {/* Preview quick button */}
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-xl border-2 border-transparent group-hover:border-ink group-hover:bg-sun transition-all text-muted-foreground group-hover:text-ink"
                    title="Pratinjau file"
                  >
                    <Eye className="size-4" />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. DIALOGS (Edit, Trash Confirm, File Preview)
         ───────────────────────────────────────────────────────────── */}
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

      {previewFile && (
        <FilePreviewDialog
          file={previewFile}
          onClose={() => {
            setPreviewFile(null);
            fetchRecent();
          }}
        />
      )}

      {creatingFolder && (
        <CreateFolderDialog
          parentId={null}
          onClose={() => setCreatingFolder(false)}
          onCreated={(newFolder) => {
            setCreatingFolder(false);
            onFolderCreated?.(newFolder);
            onFlash(`Folder "${newFolder.name}" berhasil dibuat`);
          }}
        />
      )}
    </div>
  );
}
