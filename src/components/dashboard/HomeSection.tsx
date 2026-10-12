/**
 * HomeSection Component
 * Dashboard home view with hero, stats, and folders
 */

import { useState } from "react";
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
        <div className="grid min-h-64 overflow-hidden rounded-ui border-2 border-ink bg-lilac shadow-brutal sm:grid-cols-[minmax(0,1.25fr)_minmax(210px,.75fr)]">
          <div className="relative z-10 p-6 md:p-8">
            <p className="mb-3 inline-block rounded-full border-2 border-ink bg-card px-3 py-1 text-xs font-bold uppercase">
              Ruang kerja pribadi
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
              Semua dokumenmu,
              <br />
              rapi dalam satu tempat.
            </h1>
            <p className="mt-4 max-w-md font-medium">
              Simpan, temukan, dan atur file penting tanpa bikin kepala penuh.
            </p>
          </div>
          <div className="relative min-h-64 border-t-2 border-ink sm:min-h-full sm:border-l-2 sm:border-t-0">
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
          <p className="mt-2 font-display text-5xl font-bold">{folders.length}</p>
          <p className="font-semibold">folder tersimpan</p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm font-semibold">
            <button
              onClick={() => onSectionChange("files")}
              className="rounded-ui border-2 border-ink bg-card p-3 text-left"
            >
              <FileText className="mb-2 size-5" />
              File saya
            </button>
            <button
              onClick={() => onSectionChange("notes")}
              className="rounded-ui border-2 border-ink bg-sky p-3 text-left"
            >
              <StickyNote className="mb-2 size-5" />
              Catatan
            </button>
          </div>
          <div className="absolute bottom-2 right-4 hidden h-48 w-48 sm:block">
            <img src={catLoader} alt="Cat Animation Desktop" className="size-full object-contain" />
          </div>
          <div className="absolute right-16 top-6 block h-32 w-32 -translate-x-1/2 transform sm:hidden">
            <img src={catLoader} alt="Cat Animation Mobile" className="size-full object-contain" />
          </div>
        </div>
      </section>

      {/* Folders Section */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-muted-foreground">Akses cepat</p>
            <h2 className="font-display text-2xl font-bold">Folder kamu</h2>
          </div>
          <div className="flex items-center gap-2">
            {can('create_files') && (
              <Button variant="ghost" size="sm" className="gap-1" onClick={onFolderCreate}>
                <FolderPlus className="size-4" /> Baru
              </Button>
            )}
            <Button variant="link" onClick={() => onSectionChange("files")}>
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
