import { auth } from "@/lib/auth";
import { documentId, documentInput } from "@/lib/document-input";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };
const missing = () => Response.json({ error: "Document not found" }, { status: 404 });

export async function GET(request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!documentId.safeParse(id).success) return missing();

  const document = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true, title: true, content: true, revision: true, createdAt: true, updatedAt: true },
  });
  return document ? Response.json(document) : missing();
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!documentId.safeParse(id).success) return missing();
  const body = await request.json().catch(() => null);
  const parsed = documentInput.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid document title" }, { status: 400 });

  const result = await prisma.document.updateMany({
    where: { id, ownerId: session.user.id },
    data: { title: parsed.data.title },
  });
  if (!result.count) return missing();
  const document = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return document ? Response.json(document) : missing();
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!documentId.safeParse(id).success) return missing();

  const result = await prisma.document.deleteMany({
    where: { id, ownerId: session.user.id },
  });
  return result.count ? new Response(null, { status: 204 }) : missing();
}
