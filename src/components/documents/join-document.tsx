"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinDocument({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function join() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/share/${token}`, { method: "POST" });
      if (!response.ok) throw new Error(response.status === 404 ? "This link is no longer active." : "Could not join this document. Try again.");
      const result: { documentId: string } = await response.json();
      router.push(`/documents/${result.documentId}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not join this document.");
      setBusy(false);
    }
  }
  return <div><button type="button" disabled={busy} onClick={() => void join()} className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Joining…" : "Join document"}</button>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</div>;
}
