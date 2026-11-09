"use client";

import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";

type SaveStatus = "saved" | "unsaved" | "saving" | "error" | "conflict";

export function DocumentEditor({ id, initialContent, initialRevision }: { id: string; initialContent: JSONContent; initialRevision: number }) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [message, setMessage] = useState("");
  const revision = useRef(initialRevision);
  const latest = useRef<JSONContent>(initialContent);
  const dirty = useRef(false);
  const saving = useRef(false);
  const blocked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save() {
    if (!dirty.current || saving.current || blocked.current) return;
    saving.current = true;
    dirty.current = false;
    const content = latest.current;
    let retryForNewEdits = false;
    setStatus("saving");
    try {
      const response = await fetch(`/api/documents/${id}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, revision: revision.current }),
      });
      if (response.status === 409) {
        blocked.current = true;
        dirty.current = true;
        setStatus("conflict");
        setMessage("This document changed in another tab. Copy your unsaved text before reloading.");
        return;
      }
      if (!response.ok) throw new Error(response.status === 400 ? "Document content is too large or invalid." : "Could not save. Check your connection and try again.");
      const result: { revision: number } = await response.json();
      revision.current = result.revision;
      retryForNewEdits = dirty.current;
      setMessage("");
      setStatus(dirty.current ? "unsaved" : "saved");
    } catch (error) {
      dirty.current = true;
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not save. Try again.");
    } finally {
      saving.current = false;
      if (retryForNewEdits && !blocked.current && timer.current === null) timer.current = setTimeout(() => { timer.current = null; void save(); }, 900);
    }
  }

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
    content: initialContent,
    immediatelyRender: false,
    editorProps: { attributes: { class: "document-content min-h-96 outline-none", "aria-label": "Document content" } },
    onUpdate: ({ editor }) => {
      latest.current = editor.getJSON();
      dirty.current = true;
      if (!blocked.current) {
        setStatus("unsaved");
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => { timer.current = null; void save(); }, 900);
      }
    },
  });

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current || saving.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function setLink() {
    if (!editor) return;
    const current = editor.getAttributes("link").href as string | undefined;
    const input = window.prompt("Link URL (https:// or mailto:)", current ?? "https://");
    if (input === null) return;
    if (!input.trim()) { editor.chain().focus().unsetLink().run(); return; }
    if (!/^(https?:\/\/|mailto:)/i.test(input)) { setMessage("Use an https://, http://, or mailto: link."); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: input }).run();
  }

  const tools = [
    { label: "Bold", text: "B", active: "bold", run: () => editor?.chain().focus().toggleBold().run() },
    { label: "Italic", text: "I", active: "italic", run: () => editor?.chain().focus().toggleItalic().run() },
    { label: "Heading 1", text: "H1", active: "heading", run: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: "Heading 2", text: "H2", active: "heading", run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Bulleted list", text: "• List", active: "bulletList", run: () => editor?.chain().focus().toggleBulletList().run() },
    { label: "Numbered list", text: "1. List", active: "orderedList", run: () => editor?.chain().focus().toggleOrderedList().run() },
  ];

  return <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm" aria-label="Document editor">
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
      {tools.map((tool) => <button key={tool.label} type="button" aria-label={tool.label} aria-pressed={!!editor?.isActive(tool.active)} onClick={tool.run} disabled={!editor} className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-indigo-50 aria-pressed:border-indigo-400 aria-pressed:bg-indigo-50 aria-pressed:text-indigo-800 disabled:opacity-50">{tool.text}</button>)}
      <button type="button" onClick={setLink} disabled={!editor} className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-indigo-50 disabled:opacity-50">Link</button>
      <span className="ml-auto text-xs font-medium text-zinc-500" role="status" aria-live="polite">{status === "saved" ? "All changes saved" : status === "saving" ? "Saving…" : status === "unsaved" ? "Unsaved changes" : status === "conflict" ? "Save conflict" : "Save failed"}</span>
      {(status === "error" || status === "unsaved") && <button type="button" onClick={() => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } void save(); }} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white">Save now</button>}
    </div>
    {message && <p role="alert" className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">{message}</p>}
    <div className="px-6 py-8 sm:px-10"><EditorContent editor={editor} /></div>
  </section>;
}
