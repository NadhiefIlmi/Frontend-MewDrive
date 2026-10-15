/**
 * Route: /share/$token (Public Share Preview)
 * Halaman publik untuk preview & download file yang dibagikan via share link.
 * - Tidak butuh login
 * - Ambil info file dari API /share/public/:token
 * - Preview inline + tombol download
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Download, Link2Off, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type PublicShareInfo } from "@/lib/api";
import { FilePreview } from "../dialogs/-FilePreview";
import loadingCat from "@/assets/loading_cat.gif";

export const Route = createFileRoute("/share/$token")({
  component: PublicSharePage,
});

// ─── Error State ──────────────────────────────────────────────────────────────
type ShareError = "not_found" | "inactive" | "expired" | "network";

function getErrorInfo(code: ShareError) {
  switch (code) {
    case "inactive":
      return {
        icon: <Link2Off className="size-10 text-coral" />,
        bg: "bg-coral/20",
        title: "Link Tidak Aktif",
        desc: "Pemilik file telah menonaktifkan link ini.",
      };
    case "expired":
      return {
        icon: <Clock className="size-10 text-sun" />,
        bg: "bg-sun/40",
        title: "Link Sudah Kadaluarsa",
        desc: "Link berbagi ini telah melewati tanggal kadaluarsanya.",
      };
    case "network":
      return {
        icon: <AlertCircle className="size-10 text-coral" />,
        bg: "bg-coral/20",
        title: "Gagal Memuat",
        desc: "Tidak dapat terhubung ke server. Coba lagi beberapa saat.",
      };
    default:
      return {
        icon: <span className="text-4xl">🔍</span>,
        bg: "bg-muted",
        title: "File Tidak Ditemukan",
        desc: "Link yang kamu buka tidak valid atau file sudah dihapus.",
      };
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
function PublicSharePage() {
  const { token } = Route.useParams();
  const [file, setFile]       = useState<PublicShareInfo | null>(null);
  const [err, setErr]         = useState<ShareError | null>(null);
  const [loading, setLoading] = useState(true);

  // Paksa selalu light mode di halaman publik
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    return () => {
      // Restore theme saat user navigasi kembali
      try {
        const savedTheme = localStorage.getItem("MewDrive-theme") ?? "system";
        const isDark =
          savedTheme === "dark" ||
          (savedTheme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.classList.toggle("dark", isDark);
      } catch { /* ignore */ }
    };
  }, []);

  // Fetch file info dari API (tidak butuh token JWT)
  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await api.getPublicShareInfo(token);
      setLoading(false);
      if (res.success && res.data) {
        setFile(res.data);
      } else {
        const code = res.error?.code ?? "";
        if (code === "SHARE_LINK_INACTIVE")     setErr("inactive");
        else if (code === "SHARE_LINK_EXPIRED") setErr("expired");
        else if (code === "NETWORK_ERROR")      setErr("network");
        else                                    setErr("not_found");
      }
    })();
  }, [token]);

  const formatSize = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024)       return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const previewUrl  = api.getPublicSharePreviewUrl(token);
  const downloadUrl = api.getPublicShareDownloadUrl(token);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center p-4">
          <img
            src={loadingCat}
            alt="Memuat file..."
            className="h-44 w-auto object-contain max-w-[280px]"
          />
        </div>
      </div>
    );
  }

  // ── Error ──
  if (err || !file) {
    const info = getErrorInfo(err ?? "not_found");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm text-center">
          <div className={`mx-auto mb-6 grid size-20 place-items-center rounded-ui border-2 border-ink md:size-24 ${info.bg}`}>
            {info.icon}
          </div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">{info.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">{info.desc}</p>
          <p className="mt-8 text-sm font-semibold text-muted-foreground/60">MewDrive</p>
        </div>
      </div>
    );
  }

  // extension tanpa titik, lowercase → untuk FilePreview component
  const fileType = file.extension.replace(/^\./, "").toLowerCase();

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b-2 border-ink bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 md:h-16 md:px-8">
          <div className="flex items-center gap-2 font-display text-lg font-bold md:text-xl">
            <span className="grid size-8 place-items-center rounded-ui border-2 border-ink bg-primary shadow-brutal-sm md:size-9">
              M
            </span>
            <span>MewDrive</span>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-12">
        {/* File info */}
        <div className="mb-6 text-center md:mb-8">
          <h1 className="break-words font-display text-xl font-bold leading-tight md:text-4xl">
            {file.name}
          </h1>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            {file.mime_type} • {formatSize(file.size)}
          </p>
          {file.expires_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              Kadaluarsa:{" "}
              {new Date(file.expires_at).toLocaleDateString("id-ID", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Preview */}
        <div className="mb-6 md:mb-8">
          <FilePreview
            fileName={file.name}
            fileType={fileType}
            fileUrl={previewUrl}
          />
        </div>

        {/* Download button */}
        <div className="flex justify-center px-0 md:px-0">
          <a href={downloadUrl} download={file.original_name} className="w-full sm:w-auto">
            <Button size="lg" className="w-full gap-2 sm:min-w-64 sm:w-auto">
              <Download className="size-5" />
              Download File
            </Button>
          </a>
        </div>

        {/* Footer */}
        <div className="mt-10 rounded-ui border-2 border-ink bg-sun p-4 text-center md:mt-12 md:p-6">
          <p className="text-sm font-bold">Shared via MewDrive</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Personal Document Management System
          </p>
        </div>
      </main>
    </div>
  );
}
