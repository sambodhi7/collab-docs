import { createHash } from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ token: string }> };
const validToken = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);

export async function POST(request: Request, { params }: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { token } = await params;
  if (!validToken(token)) return Response.json({ error: "Share link not found" }, { status: 404 });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const link = await prisma.shareLink.findUnique({ where: { tokenHash }, select: { id: true, documentId: true, role: true, document: { select: { ownerId: true } } } });
  if (!link) return Response.json({ error: "Share link not found" }, { status: 404 });
  if (link.document.ownerId === session.user.id) return Response.json({ documentId: link.documentId });

  // An editor membership cannot be downgraded by opening a viewer link.
  const joined = await prisma.$transaction(async (tx) => {
    const active = await tx.shareLink.findUnique({ where: { id: link.id }, select: { tokenHash: true } });
    if (active?.tokenHash !== tokenHash) return false;
    const current = await tx.documentMember.findUnique({ where: { documentId_userId: { documentId: link.documentId, userId: session.user.id } }, select: { role: true } });
    await tx.documentMember.upsert({
      where: { documentId_userId: { documentId: link.documentId, userId: session.user.id } },
      create: { documentId: link.documentId, userId: session.user.id, role: link.role },
      update: { role: current?.role === "EDITOR" ? "EDITOR" : link.role },
    });
    return true;
  });
  if (!joined) return Response.json({ error: "Share link not found" }, { status: 404 });
  return Response.json({ documentId: link.documentId });
}
