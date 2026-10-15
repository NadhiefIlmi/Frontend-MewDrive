/**
 * ShareLinkDialog — Task 13
 * Membuat share link via API dan menampilkannya ke user.
 * User bisa toggle aktif/nonaktif, set expiry, set custom slug, dan hapus link.
 */

import { useState, useEffect, useCallback } from "react";
import {
  X, Link as LinkIcon, Copy, Check, Loader2,
  ToggleLeft, ToggleRight, Trash2, Plus, Calendar,
  Pencil, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type ShareLink, type FileItem } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024)       return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function buildShareUrl(link: ShareLink): string {
  // Kalau ada slug, pakai slug — kalau tidak pakai token
  const identifier = link.slug ?? link.token;
  return `${window.location.origin}/share/${identifier}`;
}

// ─── Slug Editor per link ─────────────────────────────────────────────────────
function SlugEditor({ link, onSaved }: { link: ShareLink; onSaved: (updated: ShareLink) => void }) {
  const [editing, setEditing]   = useState(false);
  const [value, setValue]       = useState(link.slug ?? "");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const slug = value.trim() || null;
    const res = await api.updateShareLinkSlug(link.id, slug);
    setSaving(false);
    if (res.success && res.data) {
      onSaved({ ...link, ...res.data });
      setEditing(false);
    } else {
      const code = res.error?.code;
      if (code === "SLUG_TAKEN") setError("Slug sudah dipakai, coba yang lain");
      else if (code === "INVALID_SLUG") setError("Hanya huruf, angka, - dan _");
      else setError(res.error?.message ?? "Gagal menyimpan");
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    setError(null);
    const res = await api.updateShareLinkSlug(link.id, null);
    setSaving(false);
    if (res.success && res.data) {
      onSaved({ ...link, slug: null });
      setValue("");
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <Tag className="size-3.5 shrink-0 text-muted-foreground" />
        {link.slug ? (
          <span className="text-xs font-semibold text-primary">/share/{link.slug}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Belum ada custom link</span>
        )}
        <button
          type="button"
          onClick={() => { setValue(link.slug ?? ""); setEditing(true); setError(null); }}
          className="ml-auto text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <span className="shrink-0 text-xs text-muted-foreground">/share/</span>
        <input
          type="text"
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
          placeholder="nama-custom"
          maxLength={100}
          className="min-w-0 flex-1 rounded border border-ink bg-background px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-ink"
        />
        <Button size="icon-sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
          <X className="size-3" />
        </Button>
      </div>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      {link.slug && (
        <button type="button" onClick={handleRemove} disabled={saving}
          className="text-left text-xs text-muted-foreground hover:text-red-600">
          Hapus custom link
        </button>
      )}
      <p className="text-xs text-muted-foreground">Hanya huruf, angka, tanda - dan _</p>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Props = {
  file: FileItem;
  onClose: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────
export function ShareLinkDialog({ file, onClose }: Props) {
  const [links, setLinks]         = useState<ShareLink[]>([]);
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [copiedId, setCopiedId]   = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>("");

  // Ambil share links yang sudah ada untuk file ini
  const loadLinks = useCallback(async () => {
    setLoading(true);
    const res = await api.getShareLinks();
    if (res.success && res.data) {
      const filtered = res.data.filter(l => l.file_id === file.id);
      setLinks(filtered);
    }
    setLoading(false);
  }, [file.id]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  // Buat share link baru
  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    const res = await api.createShareLink({
      file_id: file.id,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
    setCreating(false);
    if (res.success && res.data) {
      const newLink: ShareLink = {
        ...res.data,
        name: file.name,
        extension: file.extension,
        size: file.size,
        mime_type: file.mime_type,
      };
      setLinks(prev => [newLink, ...prev]);
      setExpiresAt("");
    } else {
      setError(res.error?.message ?? "Gagal membuat link");
    }
  };

  // Toggle aktif/nonaktif
  const handleToggle = async (link: ShareLink) => {
    const res = await api.toggleShareLink(link.id, !link.is_active);
    if (res.success && res.data) {
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, ...res.data } : l));
    }
  };

  // Hapus share link
  const handleDelete = async (linkId: number) => {
    const res = await api.deleteShareLink(linkId);
    if (res.success) {
      setLinks(prev => prev.filter(l => l.id !== linkId));
    }
  };

  // Update slug
  const handleSlugSaved = (updated: ShareLink) => {
    setLinks(prev => prev.map(l => l.id === updated.id ? { ...l, ...updated } : l));
  };

  // Copy link ke clipboard
  const handleCopy = async (link: ShareLink) => {
    const url = buildShareUrl(link);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Min date = hari ini + 1
  const minDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  // ── Shared body content ───────────────────────────────────────────────────
  const bodyContent = (
    <>
      {/* Buat link baru */}
      <div className="mb-5 rounded-ui border-2 border-ink bg-background p-4">
        <p className="mb-4 text-sm font-bold">Buat Link Baru</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Calendar className="size-3.5" />
              Kadaluarsa (opsional)
            </label>
            <input
              type="date"
              min={minDate}
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full rounded-ui border-2 border-ink bg-background px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-ink"
            />
          </div>
          <Button onClick={handleCreate} disabled={creating} className="w-full">
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {creating ? "Membuat..." : "Buat Link"}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm font-bold text-red-600">{error}</p>}
      </div>

      {/* Daftar link */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : links.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Belum ada share link untuk file ini.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Link Aktif ({links.length})
          </p>
          {links.map(link => (
            <div
              key={link.id}
              className={`rounded-ui border-2 border-ink p-4 transition-colors ${
                link.is_active ? "bg-card" : "bg-muted opacity-60"
              }`}
            >
              {/* URL + copy */}
              <div className="mb-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded border border-ink/20 bg-background px-3 py-2 text-xs font-semibold">
                  {buildShareUrl(link)}
                </code>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  onClick={() => handleCopy(link)}
                  title="Copy link"
                >
                  {copiedId === link.id
                    ? <Check className="size-3.5 text-green-600" />
                    : <Copy className="size-3.5" />
                  }
                </Button>
              </div>

              {/* Custom slug editor */}
              <SlugEditor link={link} onSaved={handleSlugSaved} />

              {/* Meta + actions */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  {link.expires_at
                    ? `Kadaluarsa: ${new Date(link.expires_at).toLocaleDateString("id-ID")}`
                    : "Tidak ada kadaluarsa"
                  }
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleToggle(link)}
                    title={link.is_active ? "Nonaktifkan link" : "Aktifkan link"}
                  >
                    {link.is_active
                      ? <ToggleRight className="size-5 text-green-600" />
                      : <ToggleLeft className="size-5 text-muted-foreground" />
                    }
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(link.id)}
                    title="Hapus link"
                  >
                    <Trash2 className="size-4 text-coral" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ── Mobile: bottom sheet (< sm) ── */}
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden"
        onClick={onClose}
      >
        <div
          className="max-h-[92dvh] overflow-y-auto rounded-t-2xl border-t-2 border-ink bg-card"
          onClick={e => e.stopPropagation()}
        >
          {/* drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-ink/20" />
          </div>

          {/* Header mobile */}
          <div className="flex items-center justify-between border-b-2 border-ink px-4 pb-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-ui border-2 border-ink bg-lime">
                <LinkIcon className="size-4" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold">Share Link</h2>
                <p className="max-w-[200px] truncate text-xs text-muted-foreground">{file.name}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>

          {/* Body mobile */}
          <div className="px-4 pt-4 pb-2">
            {bodyContent}
          </div>

          {/* Footer mobile */}
          <div className="sticky bottom-0 border-t-2 border-ink bg-card px-4 py-4">
            <p className="mb-3 text-xs text-muted-foreground">
              Siapapun dengan link ini dapat melihat & mengunduh file
            </p>
            <Button variant="secondary" size="sm" className="w-full" onClick={onClose}>Tutup</Button>
          </div>
        </div>
      </div>

      {/* ── Desktop: centered modal (sm+) ── */}
      <div
        className="fixed inset-0 z-50 hidden place-items-center bg-ink/40 p-4 sm:grid"
        onClick={onClose}
      >
        <div
          className="flex w-full max-w-lg flex-col gap-0 rounded-ui border-2 border-ink bg-card shadow-brutal"
          onClick={e => e.stopPropagation()}
        >
          {/* Header desktop */}
          <div className="flex items-center justify-between border-b-2 border-ink p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-ui border-2 border-ink bg-lime">
                <LinkIcon className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold">Share Link</h2>
                <p className="max-w-[220px] truncate text-sm text-muted-foreground">{file.name}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>

          {/* Body desktop */}
          <div className="max-h-[60vh] overflow-y-auto p-5">
            {bodyContent}
          </div>

          {/* Footer desktop */}
          <div className="flex items-center justify-between border-t-2 border-ink bg-muted/30 px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Siapapun dengan link ini dapat melihat & mengunduh file
            </p>
            <Button variant="secondary" size="sm" onClick={onClose}>Tutup</Button>
          </div>
        </div>
      </div>
    </>
  );
}
