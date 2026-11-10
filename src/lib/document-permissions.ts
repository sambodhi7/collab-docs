import type { Prisma } from "@/generated/prisma/client";

export function readableDocument(id: string, userId: string): Prisma.DocumentWhereInput {
  return { id, OR: [{ ownerId: userId }, { members: { some: { userId } } }] };
}

export function editableDocument(id: string, userId: string): Prisma.DocumentWhereInput {
  return { id, OR: [{ ownerId: userId }, { members: { some: { userId, role: "EDITOR" } } }] };
}
