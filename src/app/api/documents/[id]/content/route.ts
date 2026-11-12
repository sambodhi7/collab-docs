import { auth } from "@/lib/auth";
import { parseDocumentContent } from "@/lib/document-content";
import { documentId } from "@/lib/document-input";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { editableDocument, readableDocument } from "@/lib/document-permissions";
import { setTimeout as delay } from "node:timers/promises";

export const maxDuration = 30;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response(null, { status: 401 });
  const { id } = await params;
  if (!documentId.safeParse(id).success) return new Response(null, { status: 404 });

  const where = readableDocument(id, session.user.id);
  const read = () => prisma.document.findFirst({ where, select: { revision: true, content: true } });
  const initial = await read();
  if (!initial) return new Response(null, { status: 404 });

  const controller = new AbortController();
  const signal = AbortSignal.any([controller.signal, request.signal]);
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(output) {
      const send = (event: string) => output.enqueue(encoder.encode(event));
      const deadline = Date.now() + 20_000;
      let revision = initial.revision;
      try {
        if (signal.aborted) return;
        send(`retry: 1500\ndata: ${JSON.stringify(initial)}\n\n`);
        while (!signal.aborted && Date.now() < deadline) {
          await delay(1500, undefined, { signal });
          const document = await read();
          if (signal.aborted) return;
          if (!document) {
            send("event: access-ended\ndata: {}\n\n");
            break;
          }
          if (document.revision > revision) {
            revision = document.revision;
            send(`data: ${JSON.stringify(document)}\n\n`);
          }
        }
      } catch {
        // EventSource reconnects after a temporary interruption.
      } finally {
        if (!controller.signal.aborted) output.close();
      }
    },
    cancel() {
      controller.abort();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "private, no-store, no-transform" },
  });
}

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
