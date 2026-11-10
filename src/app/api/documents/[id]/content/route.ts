import { auth } from "@/lib/auth";
import { parseDocumentContent } from "@/lib/document-content";
import { documentId } from "@/lib/document-input";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { editableDocument, readableDocument } from "@/lib/document-permissions";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!documentId.safeParse(id).success) return Response.json({ error: "Document not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = parseDocumentContent(body);
  if (!parsed) return Response.json({ error: "Invalid document content" }, { status: 400 });

  const result = await prisma.document.updateMany({
    where: { ...editableDocument(id, session.user.id), revision: parsed.revision },
    data: { content: parsed.content as Prisma.InputJsonValue, revision: { increment: 1 } },
  });
  if (!result.count) {
    const readable = await prisma.document.findFirst({ where: readableDocument(id, session.user.id), select: { id: true } });
    const editable = readable && await prisma.document.findFirst({ where: editableDocument(id, session.user.id), select: { id: true } });
    if (!readable) return Response.json({ error: "Document not found" }, { status: 404 });
    if (!editable) return Response.json({ error: "Read-only access" }, { status: 403 });
    return Response.json({ error: "Document changed in another tab" }, { status: 409 });
  }
  return Response.json({ revision: parsed.revision + 1 });
}
