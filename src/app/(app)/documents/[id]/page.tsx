import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { documentId } from "@/lib/document-input";
import { prisma } from "@/lib/prisma";

export default async function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  const session = await requireSession();
  const { id } = await params;
  if (!documentId.safeParse(id).success) notFound();
  const document = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: { title: true, createdAt: true, updatedAt: true },
  });
  if (!document) notFound();

  return <main className="min-h-screen bg-zinc-50 text-zinc-900"><header className="border-b border-zinc-200 bg-white"><div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-4 sm:px-8"><Link href="/dashboard" className="rounded-lg px-2 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-50">← All documents</Link><span className="h-5 w-px bg-zinc-200" aria-hidden="true" /><span className="truncate text-sm font-medium text-zinc-600">{document.title}</span></div></header><div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14"><div className="mb-8"><p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-700">Private document</p><h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">{document.title}</h1><dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm text-zinc-600"><div className="flex gap-2"><dt>Created</dt><dd className="font-medium text-zinc-800">{document.createdAt.toISOString().slice(0, 10)}</dd></div><div className="flex gap-2"><dt>Last updated</dt><dd className="font-medium text-zinc-800">{document.updatedAt.toISOString().slice(0, 10)}</dd></div></dl></div><section className="rounded-2xl border border-zinc-200 bg-white shadow-sm" aria-labelledby="editor-heading"><div className="border-b border-zinc-100 px-6 py-4 text-sm font-medium text-zinc-500">Document workspace</div><div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center"><span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-3xl text-indigo-600" aria-hidden="true">▤</span><h2 id="editor-heading" className="text-xl font-semibold">Editor coming in Stage 2</h2><p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">This page currently shows document details. Rich-text editing will arrive in the next project stage.</p></div></section></div></main>;
}
