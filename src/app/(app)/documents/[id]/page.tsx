import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { documentId } from "@/lib/document-input";
import { prisma } from "@/lib/prisma";
import { DocumentEditor } from "@/components/documents/document-editor";
import type { JSONContent } from "@tiptap/react";
import { readableDocument } from "@/lib/document-permissions";
import { ShareControls } from "@/components/documents/share-controls";

export default async function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  const session = await requireSession();
  const { id } = await params;
  if (!documentId.safeParse(id).success) notFound();
  const document = await prisma.document.findFirst({
    where: readableDocument(id, session.user.id),
    select: { title: true, content: true, revision: true, ownerId: true, members: { where: { userId: session.user.id }, select: { role: true } }, createdAt: true, updatedAt: true },
  });
  if (!document) notFound();

  const isOwner = document.ownerId === session.user.id;
  const canEdit = isOwner || document.members[0]?.role === "EDITOR";
  return <main className="min-h-screen bg-zinc-50 text-zinc-900"><header className="border-b border-zinc-200 bg-white"><div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-4 sm:px-8"><Link href="/dashboard" className="rounded-lg px-2 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-50">← All documents</Link><span className="h-5 w-px bg-zinc-200" aria-hidden="true" /><span className="truncate text-sm font-medium text-zinc-600">{document.title}</span></div></header><div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14"><div className="mb-8"><p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-700">{isOwner ? "Owned by you" : canEdit ? "Shared with you · Editor" : "Shared with you · Viewer"}</p><h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">{document.title}</h1><dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm text-zinc-600"><div className="flex gap-2"><dt>Created</dt><dd className="font-medium text-zinc-800">{document.createdAt.toISOString().slice(0, 10)}</dd></div><div className="flex gap-2"><dt>Last updated</dt><dd className="font-medium text-zinc-800">{document.updatedAt.toISOString().slice(0, 10)}</dd></div></dl></div>{isOwner && <ShareControls documentId={id} />}<DocumentEditor id={id} initialContent={(document.content ?? { type: "doc", content: [{ type: "paragraph" }] }) as JSONContent} initialRevision={document.revision} canEdit={canEdit} /></div></main>;
}
