import { createHash, randomBytes } from "node:crypto";
import { auth } from "@/lib/auth";
import { documentId } from "@/lib/document-input";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Context = { params: Promise<{ id: string }> };
const roleInput = z.object({ role: z.enum(["VIEWER", "EDITOR"]) });

async function owner(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  const { id } = await context.params;
  if (!documentId.safeParse(id).success) return { error: Response.json({ error: "Document not found" }, { status: 404 }) };
  const document = await prisma.document.findFirst({ where: { id, ownerId: session.user.id }, select: { id: true } });
  if (!document) return { error: Response.json({ error: "Document not found" }, { status: 404 }) };
  return { id };
}

export async function GET(request: Request, context: Context) {
  const access = await owner(request, context);
  if (access.error) return access.error;
  const [links, members] = await Promise.all([
    prisma.shareLink.findMany({ where: { documentId: access.id }, select: { role: true, createdAt: true } }),
    prisma.documentMember.findMany({ where: { documentId: access.id }, select: { userId: true, role: true, user: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } }),
  ]);
  return Response.json({ links, members });
}

export async function POST(request: Request, context: Context) {
  const access = await owner(request, context);
  if (access.error) return access.error;
  const parsed = roleInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid role" }, { status: 400 });
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await prisma.shareLink.upsert({
    where: { documentId_role: { documentId: access.id!, role: parsed.data.role } },
    create: { documentId: access.id!, role: parsed.data.role, tokenHash },
    update: { tokenHash, createdAt: new Date() },
  });
  const url = new URL(`/share/${token}`, request.url).toString();
  return Response.json({ role: parsed.data.role, url }, { status: 201 });
}

export async function DELETE(request: Request, context: Context) {
  const access = await owner(request, context);
  if (access.error) return access.error;
  const parsed = roleInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid role" }, { status: 400 });
  await prisma.shareLink.deleteMany({ where: { documentId: access.id, role: parsed.data.role } });
  return new Response(null, { status: 204 });
}
