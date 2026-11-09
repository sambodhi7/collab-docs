"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type DocumentItem = { id: string; title: string; createdAt: string; updatedAt: string };

function date(value: string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function DocumentList({ initialDocuments }: { initialDocuments: DocumentItem[] }) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy("create");
    try {
      const response = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
      if (!response.ok) throw new Error(response.status === 400 ? "Enter a title between 1 and 200 characters." : "Could not create the document. Try again.");
      const document: DocumentItem = await response.json();
      setDocuments((current) => [document, ...current]);
      setTitle("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the document.");
    } finally { setBusy(null); }
  }

  async function rename(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setError("");
    setBusy(id);
    try {
      const response = await fetch(`/api/documents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: editTitle }) });
      if (!response.ok) throw new Error(response.status === 400 ? "Enter a title between 1 and 200 characters." : "Could not rename the document. Try again.");
      const updated: DocumentItem = await response.json();
      setDocuments((current) => current.map((item) => item.id === id ? updated : item).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      setEditing(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not rename the document.");
    } finally { setBusy(null); }
  }

  async function remove(id: string) {
    setError("");
    setBusy(id);
    try {
      const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete the document. Try again.");
      setDocuments((current) => current.filter((item) => item.id !== id));
      setDeleting(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete the document.");
    } finally { setBusy(null); }
  }

  return <section className="space-y-8" aria-label="Documents">
    <form onSubmit={create} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <label htmlFor="new-document-title" className="mb-3 block text-sm font-semibold text-zinc-900">Create a document</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id="new-document-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} placeholder="Give your document a title" className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" required />
        <button disabled={busy !== null} className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{busy === "create" ? "Creating…" : "Create document"}</button>
      </div>
    </form>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4"><h2 className="text-xl font-semibold text-zinc-900">Your documents</h2><span className="text-sm text-zinc-500">{documents.length} {documents.length === 1 ? "document" : "documents"}</span></div>
      {documents.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center"><div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl text-indigo-600" aria-hidden="true">▤</div><h3 className="font-semibold text-zinc-900">No documents yet</h3><p className="mt-2 text-sm text-zinc-600">Create your first private document using the form above.</p></div> :
        <ul className="grid gap-4 sm:grid-cols-2">{documents.map((document) => <li key={document.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
          <div className="mb-5 flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600" aria-hidden="true">▤</span><div className="min-w-0 flex-1">
            {editing === document.id ? <form onSubmit={(event) => rename(event, document.id)} className="space-y-2"><label htmlFor={`title-${document.id}`} className="sr-only">New document title</label><input id={`title-${document.id}`} autoFocus value={editTitle} onChange={(event) => setEditTitle(event.target.value)} maxLength={200} required className="w-full rounded border border-indigo-400 px-2 py-1 text-zinc-900" /><div className="flex gap-3 text-sm"><button disabled={busy !== null} className="font-semibold text-indigo-700 disabled:opacity-50">Save</button><button type="button" onClick={() => setEditing(null)} className="text-zinc-600">Cancel</button></div></form> : <Link href={`/documents/${document.id}`} className="block truncate font-semibold text-zinc-900 hover:text-indigo-700 hover:underline" title={document.title}>{document.title}</Link>}
            <p className="mt-1 text-xs text-zinc-500">Updated {date(document.updatedAt)}</p>
          </div></div>
          {deleting === document.id ? <div className="rounded-lg bg-red-50 p-3 text-sm"><p className="mb-2 text-red-900">Delete this document permanently?</p><div className="flex gap-3"><button type="button" disabled={busy !== null} onClick={() => remove(document.id)} className="font-semibold text-red-700 disabled:opacity-50">{busy === document.id ? "Deleting…" : "Delete"}</button><button type="button" onClick={() => setDeleting(null)} className="text-zinc-600">Cancel</button></div></div> : <div className="flex items-center gap-4 border-t border-zinc-100 pt-3 text-sm"><Link href={`/documents/${document.id}`} className="font-medium text-indigo-700 hover:underline">Open</Link><button type="button" disabled={busy !== null} onClick={() => { setEditing(document.id); setEditTitle(document.title); setDeleting(null); }} className="text-zinc-600 hover:text-zinc-900 disabled:opacity-50">Rename</button><button type="button" disabled={busy !== null} onClick={() => { setDeleting(document.id); setEditing(null); }} className="ml-auto text-red-700 hover:underline disabled:opacity-50">Delete</button></div>}
        </li>)}</ul>}
    </div>
  </section>;
}
