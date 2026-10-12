/**
 * SearchBar Component
 * Search file & folder dengan debounce 300ms + AbortController
 * Task 9 — Search
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Folder, File, X, Loader2 } from "lucide-react";
import { api, type Folder as FolderType, type FileItem } from "@/lib/api";
import { type ApiFolderItem } from "@/types/dashboard";
import { getFolderIcon } from "@/components/dashboard/FolderSection";

// ─── Helper: ikon & warna berdasarkan mime ────────────────────────────────────
function getMimeColor(mimeType: string): string {
  if (mimeType.startsWith("image/"))  return "bg-lilac";
  if (mimeType.includes("pdf"))       return "bg-coral";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "bg-lime";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "bg-sun";
  return "bg-sky";
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024)       return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes > 0)           return `${Math.round(bytes)} B`;
  return `${bytes} B`;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface SearchBarProps {
  placeholder?: string;
  onFolderSelect: (folder: ApiFolderItem) => void;
  onFileSelect: (file: FileItem) => void;
}

// ─── Main SearchBar ───────────────────────────────────────────────────────────
export function SearchBar({
  placeholder = "Cari file atau folder...",
  onFolderSelect,
  onFileSelect,
}: SearchBarProps) {
  const [query, setQuery]             = useState("");
  const [folders, setFolders]         = useState<FolderType[]>([]);
  const [files, setFiles]             = useState<FileItem[]>([]);
  const [loading, setLoading]         = useState(false);
  const [open, setOpen]               = useState(false);
  const [activeIdx, setActiveIdx]     = useState(-1);

  const abortRef    = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  const totalResults = folders.length + files.length;

  // ─── Debounced search ───────────────────────────────────────────────────────
  const doSearch = useCallback(async (q: string) => {
    // Batalkan request sebelumnya
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (q.length < 2) {
      setFolders([]);
      setFiles([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    setLoading(true);
    const res = await api.search(q, controller.signal);
    setLoading(false);

    // Abaikan kalau request di-abort
    if (!res.success && res.error?.code === 'ABORTED') return;

    if (res.success && res.data) {
      setFolders(res.data.folders);
      setFiles(res.data.files);
      setOpen(true);
      setActiveIdx(-1);
    } else {
      setFolders([]);
      setFiles([]);
    }
  }, []);

  // ─── Trigger debounce saat query berubah ────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setFolders([]);
      setFiles([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      doSearch(query.trim());
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  // ─── Tutup dropdown saat klik di luar ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Keyboard navigation ────────────────────────────────────────────────────
  const allItems = [
    ...folders.map(f => ({ type: "folder" as const, item: f })),
    ...files.map(f => ({ type: "file" as const, item: f })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      const selected = allItems[activeIdx];
      if (selected) handleSelect(selected.type, selected.item);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (type: "folder" | "file", item: FolderType | FileItem) => {
    setQuery("");
    setOpen(false);
    setFolders([]);
    setFiles([]);
    if (type === "folder") {
      onFolderSelect(item as ApiFolderItem);
    } else {
      onFileSelect(item as FileItem);
    }
  };

  const handleClear = () => {
    setQuery("");
    setOpen(false);
    setFolders([]);
    setFiles([]);
    abortRef.current?.abort();
    inputRef.current?.focus();
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      {/* Input */}
      <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-ui border-2 border-ink bg-card px-4 shadow-brutal-sm">
        {loading
          ? <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground" />
          : <Search className="size-5 shrink-0" />
        }
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.length >= 2 && totalResults > 0) setOpen(true); }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          autoComplete="off"
          spellCheck={false}
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded p-0.5 hover:bg-muted"
            tabIndex={-1}
            aria-label="Hapus pencarian"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        )}
      </label>

      {/* Dropdown hasil */}
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-80 overflow-y-auto rounded-ui border-2 border-ink bg-card shadow-brutal">
          {totalResults === 0 && !loading ? (
            <p className="px-4 py-6 text-center text-sm font-semibold text-muted-foreground">
              Tidak ada hasil untuk "<span className="font-bold text-foreground">{query}</span>"
            </p>
          ) : (
            <>
              {/* Folder results */}
              {folders.length > 0 && (
                <div>
                  <p className="border-b border-ink/10 px-4 py-2 text-xs font-bold uppercase text-muted-foreground">
                    Folder
                  </p>
                  {folders.map((folder, idx) => {
                    const FolderIcon = getFolderIcon((folder as ApiFolderItem).icon ?? "folder");
                    const globalIdx = idx;
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        onMouseEnter={() => setActiveIdx(globalIdx)}
                        onClick={() => handleSelect("folder", folder)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                          activeIdx === globalIdx ? "bg-lime" : "hover:bg-muted"
                        }`}
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-ui border-2 border-ink bg-muted">
                          <FolderIcon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">
                            <Highlight text={folder.name} query={query} />
                          </p>
                          <p className="text-xs text-muted-foreground">Folder</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* File results */}
              {files.length > 0 && (
                <div>
                  <p className={`px-4 py-2 text-xs font-bold uppercase text-muted-foreground ${folders.length > 0 ? "border-t-2 border-ink/10" : ""}`}>
                    File
                  </p>
                  {files.map((file, idx) => {
                    const globalIdx = folders.length + idx;
                    const colorCls  = getMimeColor(file.mime_type);
                    return (
                      <button
                        key={file.id}
                        type="button"
                        onMouseEnter={() => setActiveIdx(globalIdx)}
                        onClick={() => handleSelect("file", file)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                          activeIdx === globalIdx ? "bg-lime" : "hover:bg-muted"
                        }`}
                      >
                        <span className={`grid size-9 shrink-0 place-items-center rounded-ui border-2 border-ink ${colorCls}`}>
                          <File className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">
                            <Highlight text={file.name} query={query} />
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {file.extension.toUpperCase()} · {formatBytes(Number(file.size))}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Highlight matched text ───────────────────────────────────────────────────
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-sun/60 px-0.5 not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}
