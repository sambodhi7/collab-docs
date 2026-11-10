"use client";

import { useEffect, useState } from "react";

type Role = "VIEWER" | "EDITOR";
type Sharing = { links: { role: Role; createdAt: string }[]; members: { userId: string; role: Role; user: { name: string; email: string } }[] };

export function ShareControls({ documentId }: { documentId: string }) {
  const [sharing, setSharing] = useState<Sharing | null>(null);
  const [newLink, setNewLink] = useState<{ role: Role; url: string } | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const base = `/api/documents/${documentId}/sharing`;

  async function refresh() {
    const response = await fetch(base);
    if (!response.ok) throw new Error("Could not load sharing settings.");
    setSharing(await response.json());
  }
  useEffect(() => { void refresh().catch((cause) => setError(cause.message)); }, [base]);

  async function linkAction(role: Role, method: "POST" | "DELETE") {
    setBusy(`${method}-${role}`); setError(""); setNewLink(null);
    try {
      const response = await fetch(base, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
      if (!response.ok) throw new Error("Could not update the share link.");
      if (method === "POST") setNewLink(await response.json());
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update the share link."); }
    finally { setBusy(""); }
  }

  async function memberAction(userId: string, method: "PATCH" | "DELETE", role?: Role) {
    setBusy(userId); setError("");
    try {
      const response = await fetch(`${base}/members/${encodeURIComponent(userId)}`, { method, headers: { "Content-Type": "application/json" }, ...(role ? { body: JSON.stringify({ role }) } : {}) });
      if (!response.ok) throw new Error("Could not update this member.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update this member."); }
    finally { setBusy(""); }
  }

  async function copy() {
    if (!newLink) return;
    try { await navigator.clipboard.writeText(newLink.url); }
    catch { setError("Copy failed. Select and copy the link below."); }
  }

  return <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6" aria-label="Sharing settings">
    <h2 className="text-lg font-semibold">Share this document</h2>
    <p className="mt-1 text-sm text-zinc-600">People sign in with Google to join. Viewer links allow reading; editor links allow reading and editing.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2">{(["VIEWER", "EDITOR"] as const).map((role) => {
      const active = sharing?.links.some((link) => link.role === role);
      return <div key={role} className="rounded-xl border border-zinc-200 p-4"><div className="flex items-center justify-between"><h3 className="font-medium capitalize">{role.toLowerCase()} link</h3><span className="text-xs text-zinc-500">{active ? "Active" : "Off"}</span></div><div className="mt-4 flex flex-wrap gap-3 text-sm"><button type="button" disabled={!!busy} onClick={() => void linkAction(role, "POST")} className="rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white disabled:opacity-50">{active ? "Replace link" : "Create link"}</button>{active && <button type="button" disabled={!!busy} onClick={() => void linkAction(role, "DELETE")} className="font-medium text-red-700 disabled:opacity-50">Revoke</button>}</div></div>;
    })}</div>
    {newLink && <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4"><p className="text-sm font-medium text-indigo-900">Copy this {newLink.role.toLowerCase()} link now. It will not be shown again.</p><div className="mt-2 flex flex-wrap gap-2"><input aria-label="New share link" readOnly value={newLink.url} onFocus={(event) => event.target.select()} className="min-w-0 flex-1 rounded border border-indigo-200 bg-white px-2 py-2 text-sm" /><button type="button" onClick={() => void copy()} className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white">Copy</button></div></div>}
    <div className="mt-6 border-t border-zinc-200 pt-5"><h3 className="font-semibold">People with access</h3><p className="mt-1 text-sm text-zinc-600">Revoking a link stops new people joining. Remove a member below to end their access.</p>{sharing?.members.length ? <ul className="mt-4 divide-y divide-zinc-100">{sharing.members.map((member) => <li key={member.userId} className="flex flex-wrap items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{member.user.name}</p><p className="truncate text-xs text-zinc-500">{member.user.email}</p></div><select aria-label={`Role for ${member.user.email}`} value={member.role} disabled={!!busy} onChange={(event) => void memberAction(member.userId, "PATCH", event.target.value as Role)} className="rounded border border-zinc-300 px-2 py-1 text-sm"><option value="VIEWER">Viewer</option><option value="EDITOR">Editor</option></select><button type="button" disabled={!!busy} onClick={() => void memberAction(member.userId, "DELETE")} className="text-sm text-red-700 disabled:opacity-50">Remove</button></li>)}</ul> : <p className="mt-3 text-sm text-zinc-500">No one has joined yet.</p>}</div>
  </section>;
}
