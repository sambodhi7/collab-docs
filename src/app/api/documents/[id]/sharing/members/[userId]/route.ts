import { auth } from "@/lib/auth";
import { documentId } from "@/lib/document-input";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Context = { params: Promise<{ id: string; userId: string }> };
const roleInput = z.object({ role: z.enum(["VIEWER", "EDITOR"]) });

async function memberTarget(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  const { id, userId } = await context.params;
  if (!documentId.safeParse(id).success || !userId || userId.length > 256) return { error: Response.json({ error: "Document not found" }, { status: 404 }) };
  const document = await prisma.document.findFirst({ where: { id, ownerId: session.user.id }, select: { id: true } });
  if (!document) return { error: Response.json({ error: "Document not found" }, { status: 404 }) };
  return { id, userId };
}

export async function PATCH(request: Request, context: Context) {
  const target = await memberTarget(request, context);
  if (target.error) return target.error;
  const parsed = roleInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid role" }, { status: 400 });
  const result = await prisma.documentMember.updateMany({ where: { documentId: target.id, userId: target.userId }, data: { role: parsed.data.role } });
  return result.count ? Response.json({ role: parsed.data.role }) : Response.json({ error: "Member not found" }, { status: 404 });
}

export async function DELETE(request: Request, context: Context) {
  const target = await memberTarget(request, context);
  if (target.error) return target.error;
  const result = await prisma.documentMember.deleteMany({ where: { documentId: target.id, userId: target.userId } });
  return result.count ? new Response(null, { status: 204 }) : Response.json({ error: "Member not found" }, { status: 404 });
}
