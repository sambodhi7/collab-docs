import { auth } from "@/lib/auth";
import { documentInput } from "@/lib/document-input";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const documents = await prisma.document.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return Response.json(documents);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = documentInput.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid document title" }, { status: 400 });

  const document = await prisma.document.create({
    data: { title: parsed.data.title, ownerId: session.user.id },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return Response.json(document, { status: 201 });
}
