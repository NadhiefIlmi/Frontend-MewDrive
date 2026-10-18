/**
 * NotesSection Component
 * Catatan tersimpan di database per user — Task 12
 * Load More: limit 20 per halaman
 */

import { useState, useCallback } from "react";
import { Plus, Check, X, Loader2, Trash2, StickyNote, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type NoteItem } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const NOTES_LIMIT = 20;

const NOTE_COLORS = [
  { value: "bg-sun",   label: "Kuning" },
  { value: "bg-lime",  label: "Hijau" },
  { value: "bg-lilac", label: "Ungu" },
  { value: "bg-sky",   label: "Biru" },
  { value: "bg-coral", label: "Merah" },
];

// Strip semua tag HTML → plain text untuk preview card
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")   // ganti tag dengan spasi
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")       // collapse multiple spaces
    .trim();
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
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

// ─── Color Picker ─────────────────────────────────────────────────────────────
function ColorPicker({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {NOTE_COLORS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          title={label}
          onClick={() => onChange(value)}
          className={`size-7 rounded-full border-2 transition-all ${value} ${
            selected === value
              ? "border-ink shadow-brutal-sm scale-110"
              : "border-transparent hover:border-ink"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Note Editor (inline) ─────────────────────────────────────────────────────
function NoteEditor({
  note,
  onSave,
  onCancel,
  saving,
}: {
  note: Partial<NoteItem>;
  onSave: (data: { title: string; body: string; color: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(note.title ?? "");
  const [body,  setBody]  = useState(note.body  ?? "");
  const [color, setColor] = useState(note.color ?? "bg-sun");

  return (
    <div className={`rounded-ui border-2 border-ink ${color} p-3 shadow-brutal sm:p-5`}>
      {/* Toolbar atas — stack di mobile, sejajar di sm+ */}
      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
        <ColorPicker selected={color} onChange={setColor} />
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => onSave({ title, body, color })}
            disabled={saving}
          >
            {saving
              ? <Loader2 className="size-4 animate-spin" />
              : <><Check className="size-4" /> Simpan</>
            }
          </Button>
          <Button size="sm" variant="ghost" className="flex-1 sm:flex-none" onClick={onCancel} disabled={saving}>
            <X className="size-4" /> Batal
          </Button>
        </div>
      </div>

      <input
        autoFocus
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Judul catatan..."
        className="mb-3 w-full bg-transparent font-display text-base font-bold outline-none placeholder:text-ink/50 sm:text-xl"
      />
      <RichTextEditor
        content={body}
        onChange={setBody}
        placeholder="Tulis catatan di sini..."
      />
    </div>
  );
}

// ─── Note Card ────────────────────────────────────────────────────────────────
function NoteCard({
  note,
  onEdit,
  onDelete,
  onPin,
}: {
  note: NoteItem;
  onEdit: (note: NoteItem) => void;
  onDelete: (note: NoteItem) => void;
  onPin: (note: NoteItem) => void;
}) {
  return (
    <div className="group relative rounded-ui border-2 border-ink bg-card shadow-brutal-sm transition-transform hover:-translate-y-1 overflow-hidden">

      {/* ── Area atas — berwarna, berisi judul + tombol aksi ── */}
      <div className={`relative px-4 py-3 ${note.color}`}>
        {/* Tombol pin */}
        <button
          type="button"
          title={note.is_pinned ? "Unpin catatan" : "Pin catatan"}
          onClick={e => { e.stopPropagation(); onPin(note); }}
          className={`absolute left-2 top-2 grid size-7 place-items-center rounded border-2 transition-all
            ${note.is_pinned
              ? "border-ink bg-ink text-card opacity-100"
              : "border-transparent bg-transparent hover:border-ink hover:bg-card/50 opacity-100"
            }`}
        >
          {note.is_pinned
            ? <PinOff className="size-3.5" />
            : <Pin className="size-3.5" />
          }
        </button>

        {/* Tombol hapus */}
        <button
          type="button"
          title="Hapus catatan"
          onClick={e => { e.stopPropagation(); onDelete(note); }}
          className="absolute right-2 top-2 grid size-7 place-items-center rounded border-2 border-transparent bg-transparent transition-opacity hover:border-ink hover:bg-card/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 className="size-3.5 text-red-600" />
        </button>

        <button
          type="button"
          onClick={() => onEdit(note)}
          className="block w-full px-8 text-left"
        >
          <div className="flex items-center gap-1.5">
            {note.is_pinned && <Pin className="size-3 shrink-0 text-ink/60" />}
            <p className="font-display text-base font-bold sm:text-lg">
              {note.title.trim() || "Tanpa judul"}
            </p>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-foreground/60">
            {formatRelative(note.updated_at)}
          </p>
        </button>
      </div>

      {/* ── Area bawah — putih, berisi konten HTML ── */}
      {note.body && (
        <button
          type="button"
          onClick={() => onEdit(note)}
          className="block w-full text-left"
        >
          <div className="relative max-h-40 overflow-hidden px-4 py-3">
            <div
              className="prose-editor pointer-events-none text-sm"
              dangerouslySetInnerHTML={{ __html: note.body }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent" />
          </div>
        </button>
      )}
    </div>
  );
}

// ─── Main NotesSection ────────────────────────────────────────────────────────
interface NotesSectionProps {
  onFlash: (msg: string, type?: "success" | "error" | "info") => void;
}

export function NotesSection({ onFlash }: NotesSectionProps) {
  const queryClient = useQueryClient();
  const [page,        setPage]        = useState(1);
  const [extraNotes,  setExtraNotes]  = useState<NoteItem[]>([]); // load more pages
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [deletingNote, setDeletingNote] = useState<NoteItem | null>(null);

  // editingNote: null = tidak edit, {} = baru, NoteItem = edit existing
  const [editingNote, setEditingNote] = useState<Partial<NoteItem> | null>(null);

  // ── React Query — cached, tidak re-fetch saat remount dalam 60 detik ───────
  const { data: queryData, isLoading: loading } = useQuery({
    queryKey: ["notes", 1],
    queryFn: async () => {
      const res = await api.getNotes({ page: 1, limit: NOTES_LIMIT });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message ?? "Gagal memuat catatan");
    },
    staleTime: 60_000, // data dianggap fresh selama 60 detik
  });

  const baseNotes: NoteItem[] = queryData?.notes ?? [];
  const total: number = queryData?.total ?? 0;
  // Gabung page 1 dari cache + page > 1 dari state
  const notes = [...baseNotes, ...extraNotes];

  // ── Load more ──────────────────────────────────────────────────────────────
  const loadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await api.getNotes({ page: nextPage, limit: NOTES_LIMIT });
    if (res.success && res.data) {
      setExtraNotes(prev => [...prev, ...res.data!.notes]);
      setPage(nextPage);
    }
    setLoadingMore(false);
  };

  // Helper: invalidate cache → UI otomatis re-fetch dari server
  const invalidateNotes = useCallback(() => {
    setExtraNotes([]);
    setPage(1);
    queryClient.invalidateQueries({ queryKey: ["notes"] });
  }, [queryClient]);

  // ── Save (create / update) ─────────────────────────────────────────────────
  const handleSave = async (data: { title: string; body: string; color: string }) => {
    setSaving(true);
    if (editingNote?.id) {
      // Update existing
      const res = await api.updateNote(editingNote.id, data);
      if (res.success && res.data) {
        // Update cache langsung tanpa re-fetch
        queryClient.setQueryData<typeof queryData>(["notes", 1], old => {
          if (!old) return old;
          return { ...old, notes: old.notes.map(n => n.id === res.data!.id ? res.data! : n) };
        });
        onFlash("Catatan disimpan");
      } else {
        onFlash(res.error?.message ?? "Gagal menyimpan", "error");
      }
    } else {
      // Create new
      const res = await api.createNote(data);
      if (res.success && res.data) {
        queryClient.setQueryData<typeof queryData>(["notes", 1], old => {
          if (!old) return old;
          return { ...old, notes: [res.data!, ...old.notes], total: old.total + 1 };
        });
        onFlash("Catatan dibuat");
      } else {
        onFlash(res.error?.message ?? "Gagal membuat catatan", "error");
      }
    }
    setSaving(false);
    setEditingNote(null);
  };

  // ── Pin / Unpin ────────────────────────────────────────────────────────────
  const handlePin = useCallback(async (note: NoteItem) => {
    const newPinned = !note.is_pinned;
    // Optimistic update langsung di cache
    queryClient.setQueryData<typeof queryData>(["notes", 1], old => {
      if (!old) return old;
      const updated = old.notes.map(n => n.id === note.id ? { ...n, is_pinned: newPinned } : n);
      return {
        ...old,
        notes: [...updated].sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }),
      };
    });
    const res = await api.updateNote(note.id, { is_pinned: newPinned });
    if (!res.success) {
      // Rollback
      queryClient.setQueryData<typeof queryData>(["notes", 1], old => {
        if (!old) return old;
        return { ...old, notes: old.notes.map(n => n.id === note.id ? { ...n, is_pinned: note.is_pinned } : n) };
      });
      onFlash("Gagal mengubah pin", "error");
    } else {
      onFlash(newPinned ? "Catatan di-pin" : "Pin dilepas");
    }
  }, [queryClient, onFlash]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (note: NoteItem) => {
    setDeletingNote(note);
  };

  const confirmDelete = async () => {
    if (!deletingNote) return;
    const res = await api.deleteNote(deletingNote.id);
    if (res.success) {
      queryClient.setQueryData<typeof queryData>(["notes", 1], old => {
        if (!old) return old;
        return {
          ...old,
          notes: old.notes.filter(n => n.id !== deletingNote!.id),
          total: Math.max(0, old.total - 1),
        };
      });
      setExtraNotes(prev => prev.filter(n => n.id !== deletingNote.id));
      onFlash("Catatan dihapus");
    } else {
      onFlash(res.error?.message ?? "Gagal menghapus", "error");
    }
    setDeletingNote(null);
  };

  // ── Render: loading ────────────────────────────────────────────────────────
  if (loading) return null;

  // ── Render: editor aktif ───────────────────────────────────────────────────
  if (editingNote !== null) {
    return (
      <div className="mt-4 w-full sm:mt-10 sm:max-w-2xl">
        <p className="mb-3 text-sm font-bold uppercase text-muted-foreground">
          {editingNote.id ? "Edit Catatan" : "Catatan Baru"}
        </p>
        <NoteEditor
          note={editingNote}
          onSave={handleSave}
          onCancel={() => setEditingNote(null)}
          saving={saving}
        />
      </div>
    );
  }

  // ── Render: list ───────────────────────────────────────────────────────────
  return (
    <div className="mt-6 sm:mt-10">
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
        <h2 className="font-display text-xl font-bold sm:text-2xl">
          Semua Catatan
          {total > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">({total})</span>
          )}
        </h2>
        <Button size="sm" onClick={() => setEditingNote({})}>
          <Plus className="size-4" />
          <span className="hidden xs:inline">Catatan Baru</span>
          <span className="xs:hidden">Baru</span>
        </Button>
      </div>

      {notes.length === 0 ? (
        <button
          type="button"
          onClick={() => setEditingNote({})}
          className="flex w-full flex-col items-center gap-3 rounded-ui border-2 border-dashed border-ink/30 bg-card p-8 text-center transition-colors hover:bg-muted sm:p-12"
        >
          <StickyNote className="size-8 text-muted-foreground sm:size-10" />
          <div>
            <p className="font-display text-base font-bold sm:text-lg">Belum ada catatan</p>
            <p className="mt-1 text-sm text-muted-foreground">Klik untuk membuat catatan pertama</p>
          </div>
        </button>
      ) : (
        <>
          {/* Pinned notes */}
          {notes.some(n => n.is_pinned) && (
            <>
              <div className="mb-3 flex items-center gap-2">
                <Pin className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Disematkan</span>
              </div>
              <div className="mb-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {notes.filter(n => n.is_pinned).map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={n => setEditingNote(n)}
                    onDelete={handleDelete}
                    onPin={handlePin}
                  />
                ))}
              </div>
              {notes.some(n => !n.is_pinned) && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lainnya</span>
                </div>
              )}
            </>
          )}

          {/* Other notes */}
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {notes.filter(n => !n.is_pinned).map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={n => setEditingNote(n)}
                onDelete={handleDelete}
                onPin={handlePin}
              />
            ))}
          </div>

          {/* Load More */}
          {notes.length < total && (
            <div className="mt-6 flex flex-col items-center gap-1">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-ui border-2 border-ink bg-card px-5 py-2.5 text-sm font-bold shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal disabled:pointer-events-none disabled:opacity-60"
              >
                {loadingMore
                  ? <Loader2 className="size-4 animate-spin" />
                  : <span>Muat lebih banyak</span>
                }
              </button>
              <p className="text-xs text-muted-foreground">
                Menampilkan {notes.length} dari {total} catatan
              </p>
            </div>
          )}
        </>
      )}

      {deletingNote && (
        <ConfirmDialog
          title="Hapus Catatan"
          message={`Catatan "${deletingNote.title.trim() || "Tanpa judul"}" akan dihapus permanen dan tidak bisa dipulihkan.`}
          confirmLabel="Ya, Hapus"
          variant="destructive"
          onConfirm={confirmDelete}
          onCancel={() => setDeletingNote(null)}
        />
      )}
    </div>
  );
}
