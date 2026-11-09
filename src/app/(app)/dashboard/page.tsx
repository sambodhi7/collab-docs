import { requireSession } from "@/lib/session";
import { SignOut } from "@/components/auth/sign-out";
import { DocumentList } from "@/components/documents/document-list";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await requireSession();
  const documents = await prisma.document.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return <main className="mx-auto max-w-3xl space-y-8 px-6 py-12"><header className="flex items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">My documents</h1><p className="mt-2 text-zinc-600">Signed in as {session.user.name} ({session.user.email})</p></div><SignOut /></header><DocumentList initialDocuments={documents.map((document) => ({ ...document, createdAt: document.createdAt.toISOString(), updatedAt: document.updatedAt.toISOString() }))} /></main>;
}
