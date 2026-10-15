import { FileText, FileArchive, Image as ImageIcon, Video, Music, File, ExternalLink } from "lucide-react";

// Deteksi mobile browser — Chrome Android tidak bisa render PDF di iframe
function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

type FilePreviewProps = {
  fileName: string;
  fileType: string;
  fileUrl?: string;
};

export function FilePreview({ fileName, fileType, fileUrl }: FilePreviewProps) {
  const type = fileType.toLowerCase();

  // Image preview
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].some((ext) => type.includes(ext))) {
    return (
      <div className="overflow-hidden rounded-ui border-2 border-ink bg-card shadow-brutal">
        {fileUrl ? (
          <img
            src={fileUrl}
            alt={fileName}
            className="h-auto w-full object-contain"
          />
        ) : (
          <div className="flex min-h-96 items-center justify-center bg-lilac p-8">
            <div className="text-center">
              <ImageIcon className="mx-auto size-16 text-muted-foreground" />
              <p className="mt-4 font-bold">Image Preview</p>
              <p className="text-sm text-muted-foreground">
                {fileName}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PDF preview
  if (type.includes("pdf")) {
    return (
      <div className="overflow-hidden rounded-ui border-2 border-ink bg-card shadow-brutal">
        {fileUrl ? (
          isMobile() ? (
            // Mobile: Chrome Android tidak support PDF di iframe — tampilkan fallback
            <div className="flex min-h-64 flex-col items-center justify-center gap-4 bg-coral/10 p-8">
              <div className="grid size-16 place-items-center rounded-ui border-2 border-ink bg-coral/20">
                <FileText className="size-8" />
              </div>
              <div className="text-center">
                <p className="font-bold">Preview PDF</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Preview inline tidak didukung di browser mobile.
                </p>
              </div>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-ui border-2 border-ink bg-card px-4 py-2 text-sm font-bold shadow-brutal-sm transition-colors hover:bg-muted"
              >
                <ExternalLink className="size-4" />
                Buka PDF
              </a>
            </div>
          ) : (
            <iframe
              src={fileUrl}
              className="h-[600px] w-full"
              title={fileName}
            />
          )
        ) : (
          <div className="flex min-h-96 items-center justify-center bg-coral p-8">
            <div className="text-center">
              <FileText className="mx-auto size-16 text-muted-foreground" />
              <p className="mt-4 font-bold">PDF Preview</p>
              <p className="text-sm text-muted-foreground">
                {fileName}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Video preview
  if (["mp4", "webm", "mov", "avi"].some((ext) => type.includes(ext))) {
    return (
      <div className="overflow-hidden rounded-ui border-2 border-ink bg-card shadow-brutal">
        {fileUrl ? (
          <video controls className="w-full">
            <source src={fileUrl} type={`video/${type}`} />
            Your browser does not support video playback.
          </video>
        ) : (
          <div className="flex min-h-96 items-center justify-center bg-sky p-8">
            <div className="text-center">
              <Video className="mx-auto size-16 text-muted-foreground" />
              <p className="mt-4 font-bold">Video Preview</p>
              <p className="text-sm text-muted-foreground">
                {fileName}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Audio preview
  if (["mp3", "wav", "ogg", "m4a"].some((ext) => type.includes(ext))) {
    return (
      <div className="overflow-hidden rounded-ui border-2 border-ink bg-card p-8 shadow-brutal">
        <div className="text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-ui border-2 border-ink bg-lime">
            <Music className="size-10" />
          </div>
          <p className="mt-4 font-bold">{fileName}</p>
          {fileUrl && (
            <audio controls className="mt-4 w-full">
              <source src={fileUrl} type={`audio/${type}`} />
              Your browser does not support audio playback.
            </audio>
          )}
        </div>
      </div>
    );
  }

  // Text preview
  if (["txt", "md", "json", "csv", "log"].some((ext) => type.includes(ext))) {
    return (
      <div className="overflow-hidden rounded-ui border-2 border-ink bg-card shadow-brutal">
        <div className="flex min-h-96 items-center justify-center bg-sun p-8">
          <div className="text-center">
            <FileText className="mx-auto size-16 text-muted-foreground" />
            <p className="mt-4 font-bold">Text File</p>
            <p className="text-sm text-muted-foreground">
              {fileName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Archive/Zip
  if (["zip", "rar", "7z", "tar", "gz"].some((ext) => type.includes(ext))) {
    return (
      <div className="overflow-hidden rounded-ui border-2 border-ink bg-card p-12 shadow-brutal">
        <div className="text-center">
          <div className="mx-auto grid size-24 place-items-center rounded-ui border-2 border-ink bg-muted">
            <FileArchive className="size-12" />
          </div>
          <p className="mt-6 font-display text-2xl font-bold">Archive File</p>
          <p className="mt-2 text-muted-foreground">
            {fileName}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Preview tidak tersedia untuk file archive
          </p>
        </div>
      </div>
    );
  }

  // Default fallback for unknown types
  return (
    <div className="overflow-hidden rounded-ui border-2 border-ink bg-card p-12 shadow-brutal">
      <div className="text-center">
        <div className="mx-auto grid size-24 place-items-center rounded-ui border-2 border-ink bg-lilac">
          <File className="size-12" />
        </div>
        <p className="mt-6 font-display text-2xl font-bold">{fileName}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {fileType.toUpperCase()} File
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Preview tidak tersedia untuk tipe file ini
        </p>
      </div>
    </div>
  );
}
