import { FileText, FileArchive, Image as ImageIcon, Video, Music, File } from "lucide-react";

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
          <iframe
            src={fileUrl}
            className="h-[600px] w-full"
            title={fileName}
          />
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
