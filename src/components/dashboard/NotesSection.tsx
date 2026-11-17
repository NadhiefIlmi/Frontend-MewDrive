/**
 * NotesSection Component
 * Catatan tersimpan di database per user — Task 12
 * Tampilan baru yang modern, rapi di desktop & mobile, dengan Neo-Brutalist design language MewDrive
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  X,
  Loader2,
  Trash2,
  StickyNote,
  Pin,
  Clock,
  Pencil,
  LayoutGrid,
  List,
  Check,
  CheckSquare,
  Sparkles,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type NoteItem } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const NOTES_LIMIT = 20;

export const NOTE_COLORS = [
  { value: "bg-sun",   label: "Kuning", dotColor: "bg-sun",   headerBg: "bg-sun text-ink",   border: "border-sun" },
  { value: "bg-lime",  label: "Hijau",  dotColor: "bg-lime",  headerBg: "bg-lime text-ink",  border: "border-lime" },
  { value: "bg-lilac", label: "Ungu",   dotColor: "bg-lilac", headerBg: "bg-lilac text-ink", border: "border-lilac" },
  { value: "bg-sky",   label: "Biru",   dotColor: "bg-sky",   headerBg: "bg-sky text-ink",   border: "border-sky" },
  { value: "bg-coral", label: "Merah",  dotColor: "bg-coral", headerBg: "bg-coral text-ink", border: "border-coral" },
];

function getNoteColor(color?: string) {
  const match = NOTE_COLORS.find((c) => c.value === color);
  return match ?? NOTE_COLORS[0]!;
}

// Strip tag HTML menjadi teks polos untuk ringkasan kartu
function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(html: string): number {
  const plain = stripHtml(html);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

function hasChecklistItems(html?: string): boolean {
  if (!html) return false;
  return (
    html.includes('data-type="taskItem"') ||
    html.includes('type="checkbox"') ||
    /\[[ xX]\]/.test(html)
  );
}

function formatRelative(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} mnt lalu`;
  const diffH = Math.floor(diffMins / 60);
  if (diffH < 24) return `${diffH} jam lalu`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Note Editor Modal Dialog ────────────────────────────────────────────────
function NoteEditorDialog({
  note,
  onSave,
  onClose,
  saving,
}: {
  note: Partial<NoteItem>;
  onSave: (data: { title: string; body: string; color: string; is_pinned?: boolean }) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(note.title ?? "");
  const [body, setBody] = useState(note.body ?? "");
  const [color, setColor] = useState(note.color ?? "bg-sun");
  const [isPinned, setIsPinned] = useState(note.is_pinned ?? false);

  const activeColorObj = getNoteColor(color);

  // Close saat tekan ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saving, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim(),
      body,
      color,
      is_pinned: isPinned,
    });
  };

  const words = countWords(body);
  const chars = stripHtml(body).length;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-3 sm:p-6 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-2xl border-2 border-ink bg-card shadow-brutal overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className={`p-4 border-b-2 border-ink flex items-center justify-between gap-3 ${activeColorObj.headerBg}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-card text-ink shadow-[1px_1px_0px_0px_#000]">
              <StickyNote className="size-4" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold leading-tight truncate">
                {note.id ? "Edit Catatan" : "Catatan Baru"}
              </h2>
              <p className="text-[11px] font-semibold text-ink/75">
                {note.id ? `Terakhir diedit: ${formatRelative(note.updated_at ?? "")}` : "Ide, draf, & daftar tugas"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Pin Toggle Button */}
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? "Lepas pin catatan" : "Sematkan catatan ini"}
              className={`inline-flex items-center gap-1.5 rounded-lg border-2 border-ink px-2.5 py-1 text-xs font-bold transition-all shadow-[1px_1px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 ${
                isPinned ? "bg-ink text-card" : "bg-card text-ink hover:bg-sun"
              }`}
            >
              <Pin className={`size-3.5 ${isPinned ? "fill-card" : ""}`} />
              <span className="hidden xs:inline">{isPinned ? "Disematkan" : "Sematkan"}</span>
            </button>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              disabled={saving}
              className="border-2 border-ink bg-card text-ink hover:bg-coral hover:text-white shadow-[1px_1px_0px_0px_#000]"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Color Selector Row */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                Pilih Warna Catatan
              </label>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {NOTE_COLORS.map(({ value, label, dotColor }) => {
                  const isSelected = color === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      title={label}
                      onClick={() => setColor(value)}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all ${value} ${
                        isSelected
                          ? "border-ink shadow-brutal-xs scale-105"
                          : "border-ink/30 opacity-75 hover:opacity-100 hover:border-ink hover:shadow-[1px_1px_0px_0px_#000]"
                      }`}
                    >
                      <span className={`size-2.5 rounded-full border border-ink ${dotColor}`} />
                      <span className="text-ink">{label}</span>
                      {isSelected && <Check className="size-3 text-ink" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Judul Catatan
              </label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul catatan (misal: Rencana Mingguan, Ide Proyek)..."
                maxLength={255}
                className="w-full rounded-xl border-2 border-ink bg-background px-3.5 py-2.5 font-display text-base sm:text-lg font-bold outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ink"
              />
            </div>

            {/* Body Editor */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Isi Catatan
              </label>
              <div className="rounded-xl border-2 border-ink bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ink">
                <RichTextEditor
                  content={body}
                  onChange={setBody}
                  placeholder="Ketik ide, daftar tugas, coretan penting, atau catatanmu di sini..."
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t-2 border-ink bg-muted/40 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
              <span>{words} kata</span>
              <span>•</span>
              <span>{chars} karakter</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={saving}
                className="border-2 border-ink font-bold shadow-brutal-xs hover:bg-card"
              >
                <X className="size-4" /> Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="border-2 border-ink bg-sun text-ink font-bold shadow-brutal hover:bg-sun/90 active:translate-x-0.5 active:translate-y-0.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="size-4" /> Simpan Catatan
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Single Note Card (Grid or List View) ────────────────────────────────────
function NoteCard({
  note,
  onEdit,
  onDelete,
  onPin,
  viewMode,
}: {
  note: NoteItem;
  onEdit: (note: NoteItem) => void;
  onDelete: (note: NoteItem) => void;
  onPin: (note: NoteItem) => void;
  viewMode: "grid" | "list";
}) {
  const plainBody = useMemo(() => stripHtml(note.body), [note.body]);
  const words = useMemo(() => countWords(note.body), [note.body]);
  const hasChecklist = useMemo(() => hasChecklistItems(note.body), [note.body]);

  // List View Mode
  if (viewMode === "list") {
    return (
      <div
        onClick={() => onEdit(note)}
        className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-card p-3.5 sm:p-4 shadow-brutal-xs hover:shadow-brutal hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all duration-150 cursor-pointer overflow-hidden text-left"
      >
        {/* Left Side: Color badge & info */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div
            className={`grid size-9 sm:size-10 shrink-0 place-items-center rounded-xl border-2 border-ink ${note.color} text-ink shadow-[1px_1px_0px_0px_#000]`}
          >
            {note.is_pinned ? (
              <Pin className="size-4.5 fill-ink" />
            ) : (
              <StickyNote className="size-4.5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-base font-bold text-foreground leading-snug truncate">
                {note.title.trim() || <span className="italic text-muted-foreground font-normal">Tanpa judul</span>}
              </h3>
              {note.is_pinned && (
                <span className="rounded border border-ink bg-ink px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-card">
                  PINNED
                </span>
              )}
              {hasChecklist && (
                <span className="inline-flex items-center gap-1 rounded border border-ink/30 bg-muted px-1.5 py-0.2 text-[9px] font-bold text-muted-foreground">
                  <CheckSquare className="size-2.5" /> Checklist
                </span>
              )}
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground font-medium">
              {plainBody || "Catatan kosong..."}
            </p>
          </div>
        </div>

        {/* Right Side: Meta & Actions */}
        <div
          className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-ink/10 sm:border-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
            <Clock className="size-3" />
            <span>{formatRelative(note.updated_at)}</span>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title={note.is_pinned ? "Lepas sematan" : "Sematkan catatan"}
              onClick={() => onPin(note)}
              className={`grid size-8 place-items-center rounded-lg border-2 border-ink transition-all shadow-[1px_1px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 ${
                note.is_pinned ? "bg-ink text-card" : "bg-card text-ink hover:bg-sun"
              }`}
            >
              <Pin className={`size-3.5 ${note.is_pinned ? "fill-card" : ""}`} />
            </button>
            <button
              type="button"
              title="Edit catatan"
              onClick={() => onEdit(note)}
              className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-card text-ink hover:bg-lime transition-all shadow-[1px_1px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              title="Hapus catatan"
              onClick={() => onDelete(note)}
              className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-card text-coral hover:bg-coral hover:text-white transition-all shadow-[1px_1px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid View Mode (Sticky Note Card)
  return (
    <div
      onClick={() => onEdit(note)}
      className="group relative flex flex-col justify-between rounded-2xl border-2 border-ink bg-card shadow-brutal-xs hover:shadow-brutal hover:-translate-y-1 active:translate-x-0.5 active:translate-y-0.5 transition-all duration-150 cursor-pointer overflow-hidden text-left"
    >
      {/* Top Colored Header Strip */}
      <div className={`flex items-center justify-between border-b-2 border-ink px-4 py-2.5 ${note.color}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          {note.is_pinned && (
            <span className="inline-flex items-center gap-1 rounded border border-ink bg-ink px-1.5 py-0.2 text-[10px] font-extrabold uppercase text-card shadow-[1px_1px_0px_0px_#000]">
              <Pin className="size-2.5 fill-card" />
              <span>PIN</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink/80 truncate">
            <Clock className="size-3 shrink-0" />
            <span>{formatRelative(note.updated_at)}</span>
          </span>
        </div>

        {/* Quick Actions (Pin & Delete) */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            title={note.is_pinned ? "Lepas sematan" : "Sematkan catatan"}
            onClick={() => onPin(note)}
            className={`grid size-7 place-items-center rounded-lg border-2 border-ink transition-all shadow-[1px_1px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 ${
              note.is_pinned
                ? "bg-ink text-card hover:bg-ink/80"
                : "bg-card text-ink hover:bg-sun"
            }`}
          >
            <Pin className={`size-3.5 ${note.is_pinned ? "fill-card" : ""}`} />
          </button>
          <button
            type="button"
            title="Hapus catatan"
            onClick={() => onDelete(note)}
            className="grid size-7 place-items-center rounded-lg border-2 border-ink bg-card text-coral hover:bg-coral hover:text-white transition-all shadow-[1px_1px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div className="space-y-2">
          <h3 className="font-display text-base sm:text-lg font-bold text-foreground leading-snug line-clamp-2">
            {note.title.trim() || <span className="italic text-muted-foreground font-normal">Tanpa judul</span>}
          </h3>

          {plainBody ? (
            <p className="line-clamp-4 text-xs sm:text-sm text-foreground/80 leading-relaxed font-medium break-words whitespace-pre-line">
              {plainBody}
            </p>
          ) : (
            <p className="text-xs italic text-muted-foreground">Catatan kosong...</p>
          )}
        </div>

        {/* Checklist pill */}
        {hasChecklist && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded border border-ink/30 bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              <CheckSquare className="size-3 text-ink" /> Checklist
            </span>
          </div>
        )}
      </div>

      {/* Card Bottom Footer */}
      <div className="flex items-center justify-between border-t border-ink/15 bg-muted/20 px-4 py-2 text-[11px] font-bold text-muted-foreground">
        <span>{words} kata</span>
        <span className="flex items-center gap-1 group-hover:text-ink transition-colors font-bold">
          <Pencil className="size-3" /> Edit
        </span>
      </div>
    </div>
  );
}

// ─── Main NotesSection Component ─────────────────────────────────────────────
interface NotesSectionProps {
  onFlash: (msg: string, type?: "success" | "error" | "info") => void;
  triggerCreate?: boolean;
  onTriggerCreateHandled?: () => void;
}

export function NotesSection({
  onFlash,
  triggerCreate,
  onTriggerCreateHandled,
}: NotesSectionProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [extraNotes, setExtraNotes] = useState<NoteItem[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingNote, setDeletingNote] = useState<NoteItem | null>(null);

  // Modal create/edit note state
  const [editingNote, setEditingNote] = useState<Partial<NoteItem> | null>(null);

  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedOnly, setPinnedOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title-asc">("newest");

  // React Query cached notes fetch
  const { data: queryData, isLoading: loading } = useQuery({
    queryKey: ["notes", 1],
    queryFn: async () => {
      const res = await api.getNotes({ page: 1, limit: NOTES_LIMIT });
      if (res.success && res.data) return res.data;
      throw new Error(res.error?.message ?? "Gagal memuat catatan");
    },
    staleTime: 60_000,
  });

  const baseNotes: NoteItem[] = queryData?.notes ?? [];
  const total: number = queryData?.total ?? 0;
  const allNotes = useMemo(() => [...baseNotes, ...extraNotes], [baseNotes, extraNotes]);

  // Handle external trigger (e.g. from sidebar "Tambah baru" -> "Catatan baru")
  useEffect(() => {
    if (triggerCreate) {
      setEditingNote({});
      onTriggerCreateHandled?.();
    }
  }, [triggerCreate, onTriggerCreateHandled]);

  // Load more pages
  const loadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await api.getNotes({ page: nextPage, limit: NOTES_LIMIT });
    if (res.success && res.data) {
      setExtraNotes((prev) => [...prev, ...res.data!.notes]);
      setPage(nextPage);
    }
    setLoadingMore(false);
  };

  // Save (Create or Update)
  const handleSave = async (data: { title: string; body: string; color: string; is_pinned?: boolean }) => {
    setSaving(true);
    if (editingNote?.id) {
      // Update
      const res = await api.updateNote(editingNote.id, data);
      if (res.success && res.data) {
        queryClient.setQueryData<typeof queryData>(["notes", 1], (old) => {
          if (!old) return old;
          return { ...old, notes: old.notes.map((n) => (n.id === res.data!.id ? res.data! : n)) };
        });
        setExtraNotes((prev) => prev.map((n) => (n.id === res.data!.id ? res.data! : n)));
        onFlash("Catatan berhasil disimpan");
      } else {
        onFlash(res.error?.message ?? "Gagal menyimpan catatan", "error");
      }
    } else {
      // Create
      const res = await api.createNote(data);
      if (res.success && res.data) {
        queryClient.setQueryData<typeof queryData>(["notes", 1], (old) => {
          if (!old) return old;
          return { ...old, notes: [res.data!, ...old.notes], total: old.total + 1 };
        });
        onFlash("Catatan baru berhasil dibuat");
      } else {
        onFlash(res.error?.message ?? "Gagal membuat catatan", "error");
      }
    }
    setSaving(false);
    setEditingNote(null);
  };

  // Toggle Pin
  const handlePin = useCallback(
    async (note: NoteItem) => {
      const newPinned = !note.is_pinned;
      // Optimistic update
      queryClient.setQueryData<typeof queryData>(["notes", 1], (old) => {
        if (!old) return old;
        const updated = old.notes.map((n) => (n.id === note.id ? { ...n, is_pinned: newPinned } : n));
        return {
          ...old,
          notes: [...updated].sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          }),
        };
      });
      setExtraNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, is_pinned: newPinned } : n))
      );

      const res = await api.updateNote(note.id, { is_pinned: newPinned });
      if (!res.success) {
        // Rollback
        queryClient.setQueryData<typeof queryData>(["notes", 1], (old) => {
          if (!old) return old;
          return {
            ...old,
            notes: old.notes.map((n) => (n.id === note.id ? { ...n, is_pinned: note.is_pinned } : n)),
          };
        });
        onFlash("Gagal mengubah status pin", "error");
      } else {
        onFlash(newPinned ? "Catatan disematkan di atas" : "Pin catatan dilepas");
      }
    },
    [queryClient, onFlash]
  );

  // Confirm Delete
  const confirmDelete = async () => {
    if (!deletingNote) return;
    const res = await api.deleteNote(deletingNote.id);
    if (res.success) {
      queryClient.setQueryData<typeof queryData>(["notes", 1], (old) => {
        if (!old) return old;
        return {
          ...old,
          notes: old.notes.filter((n) => n.id !== deletingNote!.id),
          total: Math.max(0, old.total - 1),
        };
      });
      setExtraNotes((prev) => prev.filter((n) => n.id !== deletingNote.id));
      onFlash(`Catatan "${deletingNote.title.trim() || "Tanpa judul"}" dihapus`);
    } else {
      onFlash(res.error?.message ?? "Gagal menghapus catatan", "error");
    }
    setDeletingNote(null);
  };

  // Filtered & Sorted Notes
  const filteredNotes = useMemo(() => {
    return allNotes
      .filter((n) => {
        // Pinned only
        if (pinnedOnly && !n.is_pinned) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = n.title.toLowerCase().includes(q);
          const matchesBody = stripHtml(n.body).toLowerCase().includes(q);
          if (!matchesTitle && !matchesBody) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
        if (sortBy === "oldest") {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        }
        if (sortBy === "title-asc") {
          return (a.title || "").localeCompare(b.title || "");
        }
        return 0;
      });
  }, [allNotes, pinnedOnly, searchQuery, sortBy]);

  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.is_pinned), [filteredNotes]);
  const regularNotes = useMemo(() => filteredNotes.filter((n) => !n.is_pinned), [filteredNotes]);
  const latestUpdatedNote = useMemo(() => {
    if (allNotes.length === 0) return null;
    return [...allNotes].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0];
  }, [allNotes]);

  if (loading) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
        <span className="font-bold text-sm text-muted-foreground">Memuat catatanmu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* ── 1. STATS METRIC BANNER ── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {/* Total Catatan */}
        <div className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-card p-3.5 sm:p-4 shadow-brutal-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-lilac text-ink shadow-[1px_1px_0px_0px_#000]">
            <StickyNote className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Total Catatan
            </p>
            <p className="font-display text-xl sm:text-2xl font-bold leading-tight text-foreground">
              {total}
            </p>
          </div>
        </div>

        {/* Catatan Disematkan */}
        <div className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-card p-3.5 sm:p-4 shadow-brutal-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-sun text-ink shadow-[1px_1px_0px_0px_#000]">
            <Pin className="size-5 fill-ink" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Disematkan
            </p>
            <p className="font-display text-xl sm:text-2xl font-bold leading-tight text-foreground">
              {allNotes.filter((n) => n.is_pinned).length}
            </p>
          </div>
        </div>

        {/* Pembaruan Terakhir */}
        <div className="col-span-2 sm:col-span-1 flex items-center gap-3 rounded-2xl border-2 border-ink bg-card p-3.5 sm:p-4 shadow-brutal-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-lime text-ink shadow-[1px_1px_0px_0px_#000]">
            <Clock className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Aktivitas Terakhir
            </p>
            <p className="font-display text-base sm:text-lg font-bold leading-tight text-foreground truncate">
              {latestUpdatedNote ? formatRelative(latestUpdatedNote.updated_at) : "Belum ada"}
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. TOOLBAR (SEARCH, FILTERS, VIEW & ACTION) ── */}
      <section className="flex flex-col gap-3 rounded-2xl border-2 border-ink bg-card p-3.5 sm:p-5 shadow-brutal-sm">
        {/* Mobile Toolbar (< sm): Row 1 Search & Add, Row 2 Dropdowns & View Switch */}
        <div className="space-y-2.5 sm:hidden">
          {/* Row 1: Search Bar & Primary Action CTA */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari catatan..."
                className="w-full rounded-xl border-2 border-ink bg-background py-2 pl-9 pr-8 text-xs font-semibold outline-none transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-ink"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <Button
              size="sm"
              onClick={() => setEditingNote({})}
              className="h-9 shrink-0 border-2 border-ink bg-sun text-ink shadow-brutal hover:bg-sun/90 active:translate-x-0.5 active:translate-y-0.5 font-bold px-3 text-xs"
            >
              <Plus className="size-3.5" />
              <span>Catatan</span>
            </Button>
          </div>

          {/* Row 2: Filter Dropdown, Sort Dropdown & View Mode Switcher */}
          <div className="flex items-center gap-2">
            {/* Filter Dropdown (Semua vs Disematkan) */}
            <div className={`relative flex-1 min-w-0 flex items-center rounded-xl border-2 border-ink shadow-brutal-xs transition-colors ${
              pinnedOnly ? "bg-sun/30" : "bg-background"
            }`}>
              <select
                value={pinnedOnly ? "pinned" : "all"}
                onChange={(e) => setPinnedOnly(e.target.value === "pinned")}
                className="h-9 w-full appearance-none bg-transparent pl-3 pr-7 text-xs font-bold text-ink outline-none cursor-pointer"
                aria-label="Filter Catatan"
              >
                <option value="all">Semua ({allNotes.length})</option>
                <option value="pinned">📌 Disematkan ({allNotes.filter((n) => n.is_pinned).length})</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex-1 min-w-0 flex items-center rounded-xl border-2 border-ink bg-background shadow-brutal-xs">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 w-full appearance-none bg-transparent pl-3 pr-7 text-xs font-bold text-ink outline-none cursor-pointer"
                aria-label="Urutkan Catatan"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="title-asc">Judul A-Z</option>
              </select>
              <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-xl border-2 border-ink bg-background p-0.5 shadow-brutal-xs shrink-0">
              <button
                type="button"
                title="Tampilan Grid"
                onClick={() => setViewMode("grid")}
                className={`grid size-7 place-items-center rounded-lg transition-all ${
                  viewMode === "grid" ? "bg-ink text-card" : "text-muted-foreground hover:text-ink"
                }`}
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                type="button"
                title="Tampilan List"
                onClick={() => setViewMode("list")}
                className={`grid size-7 place-items-center rounded-lg transition-all ${
                  viewMode === "list" ? "bg-ink text-card" : "text-muted-foreground hover:text-ink"
                }`}
              >
                <List className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Toolbar (sm+) — original layout, 100% untouched */}
        <div className="hidden sm:flex sm:flex-col gap-3">
          {/* Row 1: Search Bar & Primary Action CTA */}
          <div className="flex sm:flex-row sm:items-center sm:justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari catatan (judul atau isi)..."
                className="w-full rounded-xl border-2 border-ink bg-background py-2 pl-10 pr-9 text-sm font-semibold outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ink"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Action Button: + Catatan Baru */}
            <Button
              size="sm"
              onClick={() => setEditingNote({})}
              className="shrink-0 border-2 border-ink bg-sun text-ink shadow-brutal hover:bg-sun/90 active:translate-x-0.5 active:translate-y-0.5 font-bold h-10 px-4"
            >
              <Plus className="size-4" />
              <span>Catatan Baru</span>
            </Button>
          </div>

          {/* Row 2: Filter Pills & View Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-ink/10">
            {/* Filter Tabs: Semua & Disematkan */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPinnedOnly(false)}
                className={`rounded-lg border-2 px-3 py-1 text-xs font-bold transition-all ${
                  !pinnedOnly
                    ? "border-ink bg-ink text-card shadow-[1px_1px_0px_0px_#000]"
                    : "border-ink/30 bg-background text-foreground hover:border-ink"
                }`}
              >
                Semua ({allNotes.length})
              </button>

              <button
                type="button"
                onClick={() => setPinnedOnly(true)}
                className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-1 text-xs font-bold transition-all ${
                  pinnedOnly
                    ? "border-ink bg-sun text-ink shadow-[1px_1px_0px_0px_#000]"
                    : "border-ink/30 bg-background text-foreground hover:border-ink"
                }`}
              >
                <Pin className={`size-3 ${pinnedOnly ? "fill-ink" : ""}`} />
                <span>Disematkan ({allNotes.filter((n) => n.is_pinned).length})</span>
              </button>
            </div>

            {/* Right: Sort & View Mode Switcher */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none rounded-lg border-2 border-ink bg-background px-3 py-1 pr-7 text-xs font-bold outline-none cursor-pointer focus:ring-1 focus:ring-ink"
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="title-asc">Judul A-Z</option>
                </select>
                <ArrowUpDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
              </div>

              {/* View Mode Switcher (Grid vs List) */}
              <div className="flex items-center rounded-lg border-2 border-ink bg-background p-0.5 shadow-brutal-xs">
                <button
                  type="button"
                  title="Tampilan Grid"
                  onClick={() => setViewMode("grid")}
                  className={`grid size-7 place-items-center rounded transition-all ${
                    viewMode === "grid" ? "bg-ink text-card" : "text-muted-foreground hover:text-ink"
                  }`}
                >
                  <LayoutGrid className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Tampilan List"
                  onClick={() => setViewMode("list")}
                  className={`grid size-7 place-items-center rounded transition-all ${
                    viewMode === "list" ? "bg-ink text-card" : "text-muted-foreground hover:text-ink"
                  }`}
                >
                  <List className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. NOTES LIST / GRID DISPLAY ── */}
      {filteredNotes.length === 0 ? (
        // Empty State
        allNotes.length === 0 ? (
          // Belum ada catatan sama sekali
          <button
            type="button"
            onClick={() => setEditingNote({})}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-ink/40 bg-card p-10 sm:p-14 text-center shadow-brutal-sm transition-all hover:border-ink hover:bg-muted group"
          >
            <div className="grid size-16 place-items-center rounded-2xl border-2 border-ink bg-sun shadow-brutal-xs transition-transform group-hover:scale-110 group-hover:rotate-6">
              <StickyNote className="size-8 text-ink" />
            </div>
            <div>
              <p className="font-display text-xl font-bold">Belum ada catatan</p>
              <p className="mt-1 text-sm font-semibold text-muted-foreground max-w-md">
                Simpan draf ide, daftar tugas harian, cuplikan teks, atau catatan penting dengan cepat di sini.
              </p>
            </div>
            <div className="mt-2 inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-sun px-4 py-2 font-display text-sm font-bold text-ink shadow-brutal-xs transition-transform group-hover:-translate-y-0.5">
              <Plus className="size-4" />
              <span>Buat Catatan Pertama</span>
            </div>
          </button>
        ) : (
          // Tidak ada hasil filter / search
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/40 bg-card p-10 text-center shadow-brutal-sm">
            <div className="grid size-14 place-items-center rounded-2xl border-2 border-ink bg-sun shadow-brutal-xs mb-3">
              <Search className="size-6 text-ink" />
            </div>
            <p className="font-display text-lg font-bold">Catatan tidak ditemukan</p>
            <p className="mt-1 max-w-sm text-xs font-semibold text-muted-foreground">
              Tidak ada catatan yang cocok dengan "{searchQuery}" atau filter yang sedang dipilih.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setPinnedOnly(false);
              }}
              className="mt-4 border-2 border-ink font-bold shadow-brutal-xs"
            >
              Reset Pencarian
            </Button>
          </div>
        )
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* Pinned Notes Section */}
          {pinnedNotes.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="grid size-6 place-items-center rounded-md border-2 border-ink bg-sun shadow-[1px_1px_0px_0px_#000]">
                  <Pin className="size-3.5 fill-ink" />
                </div>
                <h3 className="font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-ink">
                  Catatan Disematkan ({pinnedNotes.length})
                </h3>
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      viewMode="grid"
                      onEdit={(n) => setEditingNote(n)}
                      onDelete={(n) => setDeletingNote(n)}
                      onPin={handlePin}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      viewMode="list"
                      onEdit={(n) => setEditingNote(n)}
                      onDelete={(n) => setDeletingNote(n)}
                      onPin={handlePin}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Regular Notes Section */}
          {regularNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <div className="mb-3 flex items-center gap-2">
                  <div className="grid size-6 place-items-center rounded-md border-2 border-ink bg-lilac shadow-[1px_1px_0px_0px_#000]">
                    <StickyNote className="size-3.5 text-ink" />
                  </div>
                  <h3 className="font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-ink">
                    Catatan Lainnya ({regularNotes.length})
                  </h3>
                </div>
              )}

              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                  {regularNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      viewMode="grid"
                      onEdit={(n) => setEditingNote(n)}
                      onDelete={(n) => setDeletingNote(n)}
                      onPin={handlePin}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {regularNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      viewMode="list"
                      onEdit={(n) => setEditingNote(n)}
                      onDelete={(n) => setDeletingNote(n)}
                      onPin={handlePin}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Load More Button */}
          {allNotes.length < total && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={loadMore}
                disabled={loadingMore}
                className="border-2 border-ink font-bold shadow-brutal-sm hover:bg-card active:translate-x-0.5 active:translate-y-0.5"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Memuat...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 text-sun" /> Muat Lebih Banyak Catatan
                  </>
                )}
              </Button>
              <p className="text-xs font-semibold text-muted-foreground">
                Menampilkan {allNotes.length} dari {total} catatan
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 4. CREATE / EDIT MODAL DIALOG ── */}
      {editingNote !== null && (
        <NoteEditorDialog
          note={editingNote}
          saving={saving}
          onSave={handleSave}
          onClose={() => setEditingNote(null)}
        />
      )}

      {/* ── 5. DELETE CONFIRMATION DIALOG ── */}
      {deletingNote && (
        <ConfirmDialog
          title="Hapus Catatan"
          message={`Catatan "${deletingNote.title.trim() || "Tanpa judul"}" akan dihapus permanen dari sistem dan tidak bisa dikembalikan.`}
          confirmLabel="Ya, Hapus"
          variant="destructive"
          onConfirm={confirmDelete}
          onCancel={() => setDeletingNote(null)}
        />
      )}
    </div>
  );
}
