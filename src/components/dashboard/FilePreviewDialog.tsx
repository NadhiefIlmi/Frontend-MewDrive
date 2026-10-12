/**
 * FilePreviewDialog Component
 * Preview file berdasarkan tipe — Task 7
 */

import { useState, useEffect } from "react";
import {
  X, Download, FileText, FileImage,
  File, Loader2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type FileItem } from "@/lib/api";

// ─── Helper: format bytes ─────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024)       return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes > 0)           return `${Math.round(bytes)} B`;
  return `${bytes} B`;
}

// ─── Tipe preview ─────────────────────────────────────────────────────────────
type PreviewKind = "image" | "pdf" | "text" | "unsupported";

function getPreviewKind(mimeType: string): PreviewKind {
  if (mimeType.startsWith("image/"))  return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml"
  )                                   return "text";
  return "unsupported";
}

// ─── Preview renderers ────────────────────────────────────────────────────────

function ImagePreview({ url }: { url: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
      .then(blob => { setBlobUrl(URL.createObjectURL(blob)); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [url]);

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      <span className="font-semibold">Memuat gambar...</span>
    </div>
  );

  if (error || !blobUrl) return (
    <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
      <AlertCircle className="size-5" />
      <span className="font-semibold">Gagal memuat gambar</span>
    </div>
  );

  return (
    <div className="flex max-h-[70vh] items-center justify-center overflow-auto rounded-ui border-2 border-ink bg-background p-2">
      <img
        src={blobUrl}
        alt="Preview"
        className="max-h-[66vh] max-w-full rounded object-contain"
      />
    </div>
  );
}

function PdfPreview({ url }: { url: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error("fetch failed");
        return r.blob();
      })
      .then(blob => {
        const objUrl = URL.createObjectURL(blob);
        setBlobUrl(objUrl);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });

    // Revoke blob URL saat component unmount
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [url]);

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      <span className="font-semibold">Memuat PDF...</span>
    </div>
  );

  if (error || !blobUrl) return (
    <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
      <AlertCircle className="size-5" />
      <span className="font-semibold">Gagal memuat PDF</span>
    </div>
  );

  return (
    <div className="h-[70vh] rounded-ui border-2 border-ink overflow-hidden">
      <iframe
        src={blobUrl}
        title="PDF Preview"
        className="h-full w-full"
      />
    </div>
  );
}

function TextPreview({ url }: { url: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error("fetch failed");
        return r.text();
      })
      .then(text => { setContent(text); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [url]);

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      <span className="font-semibold">Memuat konten...</span>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
      <AlertCircle className="size-5" />
      <span className="font-semibold">Gagal memuat konten file</span>
    </div>
  );

  return (
    <div className="max-h-[70vh] overflow-auto rounded-ui border-2 border-ink bg-background">
      <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words leading-relaxed">
        {content}
      </pre>
    </div>
  );
}

function UnsupportedPreview({ file, downloadUrl }: { file: FileItem; downloadUrl: string }) {
  const Icon = file.mime_type.startsWith("image/") ? FileImage : FileText;

  return (
    <div className="flex flex-col items-center gap-5 rounded-ui border-2 border-ink bg-background p-10 text-center">
      <div className="grid size-20 place-items-center rounded-ui border-2 border-ink bg-sun">
        <File className="size-10" />
      </div>
      <div>
        <p className="font-display text-xl font-bold">{file.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {file.extension.toUpperCase()} • {formatBytes(file.size)}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Tipe file ini tidak bisa di-preview di browser.
          <br />
          Download file untuk membukanya.
        </p>
      </div>
      <a
        href={downloadUrl}
        download={file.original_name}
        className="flex items-center gap-2 rounded-ui border-2 border-ink bg-lime px-6 py-2.5 font-bold shadow-brutal-sm hover:-translate-y-0.5 transition-transform"
      >
        <Download className="size-4" /> Download File
      </a>
    </div>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────
interface FilePreviewDialogProps {
  file: FileItem;
  onClose: () => void;
}

export function FilePreviewDialog({ file, onClose }: FilePreviewDialogProps) {
  const previewUrl  = api.getFilePreviewUrl(file.id);
  const downloadUrl = api.getFileDownloadUrl(file.id);
  const kind        = getPreviewKind(file.mime_type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[95vh] w-full max-w-4xl flex-col rounded-ui border-2 border-ink bg-card shadow-brutal overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-ink bg-card px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="rounded border border-ink bg-muted px-2 py-0.5 text-xs font-bold uppercase shrink-0">
              {file.extension}
            </span>
            <p className="truncate font-bold">{file.name}</p>
            <span className="shrink-0 text-sm text-muted-foreground">
              {formatBytes(file.size)}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2 pl-4">
            <a
              href={downloadUrl}
              download={file.original_name}
              className="grid size-8 place-items-center rounded hover:bg-muted"
              title="Download"
              onClick={e => e.stopPropagation()}
            >
              <Download className="size-4" />
            </a>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {kind === "image"       && <ImagePreview url={previewUrl} />}
          {kind === "pdf"         && <PdfPreview url={previewUrl} />}
          {kind === "text"        && <TextPreview url={previewUrl} />}
          {kind === "unsupported" && <UnsupportedPreview file={file} downloadUrl={downloadUrl} />}
        </div>
      </div>
    </div>
  );
}
