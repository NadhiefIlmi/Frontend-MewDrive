/**
 * HomeSection Component
 * Dashboard home view with hero, stats, and folders
 */

import { useState, useEffect } from "react";
import { FileText, StickyNote, FolderPlus, Folder, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import kucingPagi from "@/assets/kucing_pagi.png";
import kucingMalam from "@/assets/kucing_malam.png";
import catLoader from "@/assets/Loader_cat.gif";
import { useTheme } from "@/hooks/useTheme";
import { type ApiFolderItem } from "@/types/dashboard";
import type { Section } from "@/types/dashboard";
import { FolderCard, EditFolderDialog } from "@/components/dashboard/FolderSection";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface HomeSectionProps {
  folders: ApiFolderItem[];
  foldersLoading: boolean;
  foldersTotal?: number;
  filesTotal?: number;
  onSectionChange: (section: Section) => void;
  onFolderOpen: (folder: ApiFolderItem) => void;
  onFolderCreate: () => void;
  onFolderRenamed: (folder: ApiFolderItem) => void;
  onFolderTrashed: (folderId: number) => void;
  onFolderStarToggled: (folder: ApiFolderItem) => void;
  onFlash: (msg: string, type?: "success" | "error" | "info") => void;
}

export function HomeSection({
  folders,
  foldersLoading,
  foldersTotal,
  filesTotal = 0,
  onSectionChange,
  onFolderOpen,
  onFolderCreate,
  onFolderRenamed,
  onFolderTrashed,
  onFolderStarToggled,
  onFlash,
}: HomeSectionProps) {
  const { theme } = useTheme();
  const { can } = useAuth();
  const [menuOpenId, setMenuOpenId]           = useState<number | null>(null);
  const [editingFolder, setEditingFolder]     = useState<ApiFolderItem | null>(null);
  const [trashingFolder, setTrashingFolder]   = useState<ApiFolderItem | null>(null);
  const [notesTotal, setNotesTotal]           = useState<number | null>(null);

  // Ambil total catatan saat mount
  useEffect(() => {
    api.getNotes({ page: 1, limit: 1 }).then(res => {
      if (res.success && res.data) setNotesTotal(res.data.total);
    });
  }, []);

  // Ambil total file saat mount — pakai storage breakdown karena
  // getFiles() hanya return file di folder tertentu, bukan semua file user
  const [filesTotalLocal, setFilesTotalLocal] = useState<number | null>(null);
  useEffect(() => {
    api.getStorage().then(res => {
      if (res.success && res.data) {
        const total = res.data.breakdown.reduce((sum, b) => sum + b.file_count, 0);
        setFilesTotalLocal(total);
      }
    });
  }, []);

  // Gunakan foldersTotal dari prop jika ada, fallback ke panjang array
  const totalFolders = foldersTotal ?? folders.length;

  const previewFolders = folders.slice(0, 6);

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
    <>
      {/* Hero & Stats */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Hero Banner */}
        <div className="grid min-h-56 overflow-hidden rounded-ui border-2 border-ink bg-lilac shadow-brutal sm:min-h-64 sm:grid-cols-[minmax(0,1.25fr)_minmax(210px,.75fr)]">
          <div className="relative z-10 p-5 sm:p-6 md:p-8">
            <p className="mb-2 inline-block rounded-full border-2 border-ink bg-card px-3 py-1 text-xs font-bold uppercase">
              Ruang kerja pribadi
            </p>
            <h1 className="font-display text-2xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Semua dokumenmu,
              <br />
              rapi dalam satu tempat.
            </h1>
            <p className="mt-3 max-w-md text-sm font-medium sm:mt-4 sm:text-base">
              Simpan, temukan, dan atur file penting tanpa bikin kepala penuh.
            </p>
          </div>
          <div className="relative min-h-48 border-t-2 border-ink sm:min-h-full sm:border-l-2 sm:border-t-0">
            <img
              src={theme === "dark" ? kucingMalam : kucingPagi}
              alt={theme === "dark" ? "Kucing di malam hari" : "Kucing di pagi hari"}
              className="absolute inset-0 size-full object-cover object-[center_68%] sm:object-[54%_46%]"
            />
            <span className="absolute bottom-3 right-3 rounded-ui border-2 border-ink bg-sun px-3 py-1 text-xs font-bold shadow-brutal-sm">
              OFFICE CAT
            </span>
          </div>
        </div>

        {/* Stats Card */}
        <div className="relative overflow-hidden rounded-ui border-2 border-ink bg-lime p-5 shadow-brutal">
          <p className="text-sm font-bold uppercase">Ringkasan</p>

          {/* Angka utama — total folder */}
          <div className="mt-2">
            <p className="font-display text-5xl font-bold leading-none">
              {foldersLoading ? <Loader2 className="size-7 animate-spin" /> : totalFolders}
            </p>
            <p className="mt-1 font-semibold text-foreground/70">folder tersimpan</p>
          </div>

          {/* Tombol navigasi + angka */}
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm font-semibold">
            <button
              onClick={() => onSectionChange("files")}
              className="flex flex-col gap-1.5 rounded-ui border-2 border-ink bg-card p-3 text-left hover:bg-muted transition-colors"
            >
              <FileText className="size-5" />
              <span className="font-display text-2xl font-bold leading-none">
                {filesTotalLocal === null ? "—" : filesTotalLocal}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">Dokumen saya</span>
            </button>
            <button
              onClick={() => onSectionChange("notes")}
              className="flex flex-col gap-1.5 rounded-ui border-2 border-ink bg-sky p-3 text-left hover:bg-sky/70 transition-colors"
            >
              <StickyNote className="size-5" />
              <span className="font-display text-2xl font-bold leading-none">
                {notesTotal === null ? "—" : notesTotal}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">Catatan</span>
            </button>
          </div>

          {/* Cat animation */}
          <div className="absolute bottom-2 right-4 hidden h-48 w-48 sm:block">
            <img src={catLoader} alt="Cat Animation Desktop" className="size-full object-contain" />
          </div>
        </div>
      </section>

      {/* Folders Section */}
      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 sm:flex-nowrap">
          <div>
            <p className="text-sm font-bold uppercase text-muted-foreground">Akses cepat</p>
            <h2 className="font-display text-2xl font-bold">Folder kamu</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {can('create_files') && (
              <Button variant="ghost" size="sm" className="gap-1 py-1" onClick={onFolderCreate}>
                <FolderPlus className="size-4" /> Baru
              </Button>
            )}
            <Button variant="link" size="sm" className="py-1" onClick={() => onSectionChange("files")}>
              Lihat semua
            </Button>
          </div>
        </div>

        {foldersLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="font-semibold">Memuat folder...</span>
          </div>
        ) : previewFolders.length === 0 ? (
          can('create_files') ? (
            <button
              onClick={onFolderCreate}
              className="flex w-full flex-col items-center gap-3 rounded-ui border-2 border-dashed border-ink/30 bg-card p-10 text-center transition-colors hover:bg-muted"
            >
              <Folder className="size-10 text-muted-foreground" />
              <div>
                <p className="font-display text-lg font-bold">Belum ada folder</p>
                <p className="mt-1 text-sm text-muted-foreground">Klik untuk membuat folder pertama</p>
              </div>
            </button>
          ) : (
            <div className="flex w-full flex-col items-center gap-3 rounded-ui border-2 border-dashed border-ink/30 bg-card p-10 text-center">
              <Folder className="size-10 text-muted-foreground" />
              <div>
                <p className="font-display text-lg font-bold">Belum ada folder</p>
              </div>
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
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
          </div>
        )}
      </section>

      {/* Edit dialog */}
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
    </>
  );
}
