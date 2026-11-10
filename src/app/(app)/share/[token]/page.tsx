import { createHash } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JoinDocument } from "@/components/documents/join-document";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const session = await requireSession();
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) notFound();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const link = await prisma.shareLink.findUnique({ where: { tokenHash }, select: { documentId: true, role: true, document: { select: { title: true, ownerId: true } } } });
  if (!link) notFound();
  const own = link.document.ownerId === session.user.id;
  return <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-5 text-zinc-900"><div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"><p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-700">Document invitation</p><h1 className="break-words text-2xl font-semibold">{link.document.title}</h1><p className="mt-3 text-zinc-600">{own ? "This is your document." : `Join as ${link.role.toLowerCase()} with ${session.user.email}.`}</p><div className="mt-7 flex items-center gap-4">{own ? <Link href={`/documents/${link.documentId}`} className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white">Open document</Link> : <JoinDocument token={token} />}<Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:underline">Dashboard</Link></div></div></main>;
}
