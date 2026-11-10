import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ userId: "user-a" as string | null }));
const database = vi.hoisted(() => ({ updateMany: vi.fn(), findFirst: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: async () => state.userId ? { user: { id: state.userId } } : null } } }));
vi.mock("@/lib/prisma", () => ({ prisma: { document: database } }));

import { PUT } from "./route";

const id = "cmg1234567890123456789012";
const context = { params: Promise.resolve({ id }) };
const content = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] };
const request = (body: unknown) => new Request(`http://localhost/api/documents/${id}/content`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => { vi.clearAllMocks(); state.userId = "user-a"; });

it("rejects anonymous saves before accessing the database", async () => {
  state.userId = null;
  expect((await PUT(request({ content, revision: 0 }), context)).status).toBe(401);
  expect(database.updateMany).not.toHaveBeenCalled();
});

it("rejects malformed content and unsafe links", async () => {
  expect((await PUT(request({ content: { type: "doc", content: [{ type: "image", attrs: { src: "x" } }] }, revision: 0 }), context)).status).toBe(400);
  const unsafe = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "X", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }] };
  expect((await PUT(request({ content: unsafe, revision: 0 }), context)).status).toBe(400);
  expect(database.updateMany).not.toHaveBeenCalled();
});

it("scopes a save to owner and revision", async () => {
  database.updateMany.mockResolvedValue({ count: 1 });
  expect((await PUT(request({ content, revision: 2 }), context)).status).toBe(200);
  expect(database.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id, OR: [{ ownerId: "user-a" }, { members: { some: { userId: "user-a", role: "EDITOR" } } }], revision: 2 }, data: expect.objectContaining({ revision: { increment: 1 } }) }));
});

it("distinguishes a stale edit from another user's document without revealing it", async () => {
  database.updateMany.mockResolvedValue({ count: 0 });
  database.findFirst.mockResolvedValueOnce({ id }).mockResolvedValueOnce({ id }).mockResolvedValueOnce(null);
  expect((await PUT(request({ content, revision: 0 }), context)).status).toBe(409);
  state.userId = "user-b";
  expect((await PUT(request({ content, revision: 0 }), context)).status).toBe(404);
  expect(database.findFirst).toHaveBeenLastCalledWith({ where: { id, OR: [{ ownerId: "user-b" }, { members: { some: { userId: "user-b" } } }] }, select: { id: true } });
});

it("rejects a viewer's save", async () => {
  database.updateMany.mockResolvedValue({ count: 0 });
  database.findFirst.mockResolvedValueOnce({ id }).mockResolvedValueOnce(null);
  expect((await PUT(request({ content, revision: 0 }), context)).status).toBe(403);
});
