/**
 * RichTextEditor — Editor rich text berbasis Tiptap
 * Fitur: Bold, Italic, Underline, Heading, List, Table, Highlight, Text align
 */

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare,
  AlignLeft, AlignCenter, AlignRight,
  Highlighter, Table as TableIcon,
  Minus, Undo2, Redo2,
  ArrowLeftToLine, ArrowRightToLine,
  ArrowUpToLine, ArrowDownToLine,
  Trash2, Columns2, Rows2,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
}

// ─── Toolbar Button ────────────────────────────────────────────────────────
function ToolbarBtn({
  onClick,
  active,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`grid h-7 w-7 place-items-center rounded border transition-colors sm:h-8 sm:w-8 ${
        active
          ? "border-ink bg-ink text-card"
          : "border-transparent hover:border-ink hover:bg-muted"
      } ${disabled ? "pointer-events-none opacity-40" : ""}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-ink/20 sm:mx-1" />;
}

// ─── Main Component ────────────────────────────────────────────────────────
export function RichTextEditor({
  content,
  onChange,
  placeholder = "Tulis catatan di sini...",
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      TextStyle,
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    // Jika content adalah plain text (bukan HTML), wrap dalam <p>
    content: content
      ? (/<[a-z][\s\S]*>/i.test(content) ? content : `<p>${content}</p>`)
      : "",
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose-editor min-h-[200px] outline-none px-1",
      },
    },
  });

  if (!editor) return null;

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="rounded-ui border-2 border-ink bg-background overflow-hidden">
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b-2 border-ink bg-muted/40 p-1.5 sm:gap-1 sm:p-2">
          {/* Undo / Redo */}
          <ToolbarBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo2 className="size-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo2 className="size-3.5" />
          </ToolbarBtn>

          <Divider />

          {/* Heading */}
          <ToolbarBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="size-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="size-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="size-3.5" />
          </ToolbarBtn>

          <Divider />

          {/* Format */}
          <ToolbarBtn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="size-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="size-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="size-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className="size-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}>
            <Highlighter className="size-3.5" />
          </ToolbarBtn>

          <Divider />

          {/* List */}
          <ToolbarBtn title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="size-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Ordered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="size-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Task List" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
            <CheckSquare className="size-3.5" />
          </ToolbarBtn>

          <Divider />

          {/* Align */}
          <ToolbarBtn title="Align Left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            <AlignLeft className="size-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Align Center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            <AlignCenter className="size-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Align Right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            <AlignRight className="size-3.5" />
          </ToolbarBtn>

          <Divider />

          {/* Block */}
          <ToolbarBtn title="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus className="size-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Insert Table" active={editor.isActive("table")} onClick={addTable}>
            <TableIcon className="size-3.5" />
          </ToolbarBtn>

          {/* Table controls — hanya muncul saat kursor berada di dalam tabel */}
          {editor.isActive("table") && (
            <>
              <Divider />

              {/* Kolom */}
              <ToolbarBtn title="Tambah Kolom Sebelum" onClick={() => editor.chain().focus().addColumnBefore().run()}>
                <ArrowLeftToLine className="size-3.5" />
              </ToolbarBtn>
              <ToolbarBtn title="Tambah Kolom Sesudah" onClick={() => editor.chain().focus().addColumnAfter().run()}>
                <ArrowRightToLine className="size-3.5" />
              </ToolbarBtn>
              <ToolbarBtn title="Hapus Kolom" onClick={() => editor.chain().focus().deleteColumn().run()}>
                <Columns2 className="size-3.5" />
              </ToolbarBtn>

              <Divider />

              {/* Baris */}
              <ToolbarBtn title="Tambah Baris Sebelum" onClick={() => editor.chain().focus().addRowBefore().run()}>
                <ArrowUpToLine className="size-3.5" />
              </ToolbarBtn>
              <ToolbarBtn title="Tambah Baris Sesudah" onClick={() => editor.chain().focus().addRowAfter().run()}>
                <ArrowDownToLine className="size-3.5" />
              </ToolbarBtn>
              <ToolbarBtn title="Hapus Baris" onClick={() => editor.chain().focus().deleteRow().run()}>
                <Rows2 className="size-3.5" />
              </ToolbarBtn>

              <Divider />

              {/* Hapus tabel */}
              <ToolbarBtn title="Hapus Tabel" onClick={() => editor.chain().focus().deleteTable().run()}>
                <Trash2 className="size-3.5" />
              </ToolbarBtn>
            </>
          )}
        </div>
      )}

      {/* Editor area */}
      <EditorContent editor={editor} className="p-3 sm:p-4" />
    </div>
  );
}
