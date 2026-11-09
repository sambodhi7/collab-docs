"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type DocumentItem = { id: string; title: string; createdAt: string; updatedAt: string };

export function DocumentList({ initialDocuments }: { initialDocuments: DocumentItem[] }) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("create");
    setError("");
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error(response.status === 400 ? "Enter a title of 1–200 characters." : "Could not create the document.");
      const document: DocumentItem = await response.json();
      setDocuments((current) => [document, ...current]);
      setTitle("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the document.");
    } finally {
      setBusy(null);
    }
  }

  async function rename(document: DocumentItem) {
    const nextTitle = window.prompt("New document title", document.title);
    if (nextTitle === null) return;
    setBusy(document.id);
    setError("");
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle }),
      });
      if (!response.ok) throw new Error(response.status === 400 ? "Enter a title of 1–200 characters." : "Could not rename the document.");
      const updated: DocumentItem = await response.json();
      setDocuments((current) => current.map((item) => item.id === updated.id ? updated : item).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not rename the document.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(document: DocumentItem) {
    if (!window.confirm(`Delete “${document.title}”? This cannot be undone.`)) return;
    setBusy(document.id);
    setError("");
    try {
      const response = await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete the document.");
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete the document.");
    } finally {
      setBusy(null);
    }
  }

  return <section className="space-y-6">
    <form onSubmit={create} className="flex flex-wrap gap-3">
      <input aria-label="Document title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} placeholder="New document title" className="min-w-0 flex-1 rounded border px-3 py-2" required />
      <button disabled={busy !== null} className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50">{busy === "create" ? "Creating…" : "Create document"}</button>
    </form>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {documents.length === 0 ? <p className="text-zinc-600">No documents yet. Create one to get started.</p> :
      <ul className="divide-y rounded border">{documents.map((document) => <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div><Link href={`/documents/${document.id}`} className="font-medium underline">{document.title}</Link><p className="text-sm text-zinc-600">Created {document.createdAt.slice(0, 10)} · Updated {document.updatedAt.slice(0, 10)}</p></div>
        <div className="flex gap-3"><button type="button" disabled={busy !== null} onClick={() => rename(document)} className="underline disabled:opacity-50">Rename</button><button type="button" disabled={busy !== null} onClick={() => remove(document)} className="text-red-700 underline disabled:opacity-50">Delete</button></div>
      </li>)}</ul>}
  </section>;
}
