/**
 * NotesSection Component
 * Catatan tersimpan di database per user — Task 12
 * Load More: limit 20 per halaman
 */

import { useState, useEffect, useCallback } from "react";
import { Plus, Check, X, Loader2, Trash2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type NoteItem } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

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
}: {
  note: NoteItem;
  onEdit: (note: NoteItem) => void;
  onDelete: (note: NoteItem) => void;
}) {
  return (
    <div className="group relative rounded-ui border-2 border-ink bg-card shadow-brutal-sm transition-transform hover:-translate-y-1 overflow-hidden">

      {/* ── Area atas — berwarna, berisi judul + tombol hapus ── */}
      <div className={`relative px-4 py-3 ${note.color}`}>
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
          className="block w-full pr-8 text-left"
        >
          <p className="font-display text-base font-bold sm:text-lg">
            {note.title.trim() || "Tanpa judul"}
          </p>
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
  const [notes,       setNotes]       = useState<NoteItem[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [deletingNote, setDeletingNote] = useState<NoteItem | null>(null);

  // editingNote: null = tidak edit, {} = baru, NoteItem = edit existing
  const [editingNote, setEditingNote] = useState<Partial<NoteItem> | null>(null);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setPage(1);
    const res = await api.getNotes({ page: 1, limit: NOTES_LIMIT });
    if (res.success && res.data) {
      setNotes(res.data.notes);
      setTotal(res.data.total);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Load more ──────────────────────────────────────────────────────────────
  const loadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await api.getNotes({ page: nextPage, limit: NOTES_LIMIT });
    if (res.success && res.data) {
      setNotes(prev => [...prev, ...res.data!.notes]);
      setPage(nextPage);
      setTotal(res.data.total);
    }
    setLoadingMore(false);
  };

  // ── Save (create / update) ─────────────────────────────────────────────────
  const handleSave = async (data: { title: string; body: string; color: string }) => {
    setSaving(true);
    if (editingNote?.id) {
      // Update existing
      const res = await api.updateNote(editingNote.id, data);
      if (res.success && res.data) {
        setNotes(prev => prev.map(n => n.id === res.data!.id ? res.data! : n));
        onFlash("Catatan disimpan");
      } else {
        onFlash(res.error?.message ?? "Gagal menyimpan", "error");
      }
    } else {
      // Create new
      const res = await api.createNote(data);
      if (res.success && res.data) {
        setNotes(prev => [res.data!, ...prev]);
        setTotal(prev => prev + 1);
        onFlash("Catatan dibuat");
      } else {
        onFlash(res.error?.message ?? "Gagal membuat catatan", "error");
      }
    }
    setSaving(false);
    setEditingNote(null);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (note: NoteItem) => {
    setDeletingNote(note);
  };

  const confirmDelete = async () => {
    if (!deletingNote) return;
    const res = await api.deleteNote(deletingNote.id);
    if (res.success) {
      setNotes(prev => prev.filter(n => n.id !== deletingNote.id));
      setTotal(prev => Math.max(0, prev - 1));
      onFlash("Catatan dihapus");
    } else {
      onFlash(res.error?.message ?? "Gagal menghapus", "error");
    }
    setDeletingNote(null);
  };

  // ── Render: loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mt-10 flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="font-semibold">Memuat catatan...</span>
      </div>
    );
  }

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
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {notes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={n => setEditingNote(n)}
                onDelete={handleDelete}
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
