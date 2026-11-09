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
  return <main className="min-h-screen bg-zinc-50 text-zinc-900"><header className="border-b border-zinc-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white" aria-hidden="true">▤</span><span className="font-semibold tracking-tight">Documents</span></div><div className="flex items-center gap-4 text-sm"><span className="hidden text-zinc-600 sm:inline">{session.user.email}</span><SignOut /></div></div></header><div className="mx-auto max-w-6xl space-y-8 px-5 py-10 sm:px-8 sm:py-14"><div><p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-700">Workspace</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your documents</h1><p className="mt-3 text-zinc-600">Welcome, {session.user.name}. Your documents are private to your account.</p></div><DocumentList initialDocuments={documents.map((document) => ({ ...document, createdAt: document.createdAt.toISOString(), updatedAt: document.updatedAt.toISOString() }))} /></div></main>;
}
