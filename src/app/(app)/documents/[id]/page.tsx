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

  return <main className="mx-auto max-w-3xl space-y-6 px-6 py-12"><Link href="/dashboard" className="underline">Back to documents</Link><h1 className="text-3xl font-semibold">{document.title}</h1><p className="text-sm text-zinc-600">Created {document.createdAt.toLocaleDateString()} · Updated {document.updatedAt.toLocaleDateString()}</p><p className="rounded border p-6 text-zinc-600">Editor coming in Stage 2.</p></main>;
}
