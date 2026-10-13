/**
 * ShareLinkDialog — Task 13
 * Membuat share link via API dan menampilkannya ke user.
 * User bisa toggle aktif/nonaktif, set expiry, dan hapus link.
 */

import { useState, useEffect, useCallback } from "react";
import {
  X, Link as LinkIcon, Copy, Check, Loader2,
  ToggleLeft, ToggleRight, Trash2, Plus, Calendar,
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

function buildShareUrl(token: string): string {
  return `${window.location.origin}/share/${token}`;
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
      // Tambah info file ke link (karena create response tidak punya name)
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

  // Copy link ke clipboard
  const handleCopy = async (link: ShareLink) => {
    const url = buildShareUrl(link.token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
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

  // ── Shared body content (dipakai mobile & desktop) ────────────────────────
  const bodyContent = (
    <>
      {/* Buat link baru */}
      <div className="mb-5 rounded-ui border-2 border-ink bg-background p-4">
        <p className="mb-4 text-sm font-bold">Buat Link Baru</p>
        <div className="flex flex-col gap-3">
          {/* Optional expiry */}
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
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="w-full"
          >
            {creating
              ? <Loader2 className="size-4 animate-spin" />
              : <Plus className="size-4" />
            }
            {creating ? "Membuat..." : "Buat Link"}
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-sm font-bold text-red-600">{error}</p>
        )}
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
              <div className="mb-3 flex items-center gap-2">
                <code className="flex-1 truncate rounded border border-ink/20 bg-background px-3 py-2 text-xs font-semibold">
                  {buildShareUrl(link.token)}
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

              {/* Meta + actions */}
              <div className="flex items-center justify-between gap-2">
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
