import { beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ userId: "user-a" as string | null }));
const database = vi.hoisted(() => ({
  findMany: vi.fn(), create: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: async () => session.userId ? { user: { id: session.userId } } : null } } }));
vi.mock("@/lib/prisma", () => ({ prisma: { document: database } }));

import { GET, POST } from "./route";
import { GET as getOne, PATCH, DELETE } from "./[id]/route";

const id = "cmg1234567890123456789012";
const context = { params: Promise.resolve({ id }) };
const request = (method: string, url = "http://localhost/api/documents", body?: unknown) => new Request(url, {
  method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body),
});

beforeEach(() => {
  vi.clearAllMocks();
  session.userId = "user-a";
});

describe("document ownership", () => {
  it("rejects anonymous requests before querying", async () => {
    session.userId = null;
    expect((await GET(request("GET"))).status).toBe(401);
    expect((await POST(request("POST", undefined, { title: "A" }))).status).toBe(401);
    expect((await getOne(request("GET"), context)).status).toBe(401);
    expect((await PATCH(request("PATCH", undefined, { title: "B" }), context)).status).toBe(401);
    expect((await DELETE(request("DELETE"), context)).status).toBe(401);
    expect(database.findMany).not.toHaveBeenCalled();
  });

  it("derives the owner from the session and refuses client ownerId", async () => {
    expect((await POST(request("POST", undefined, { title: "A", ownerId: "user-b" }))).status).toBe(400);
    database.create.mockResolvedValue({ id, title: "A" });
    expect((await POST(request("POST", undefined, { title: " A " }))).status).toBe(201);
    expect(database.create).toHaveBeenCalledWith(expect.objectContaining({ data: { title: "A", ownerId: "user-a" } }));
  });

  it("filters listing and individual reads by owner", async () => {
    database.findMany.mockResolvedValue([]);
    database.findFirst.mockResolvedValue(null);
    expect((await GET(request("GET"))).status).toBe(200);
    expect(database.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: "user-a" } }));
    session.userId = "user-b";
    expect((await getOne(request("GET"), context)).status).toBe(404);
    expect(database.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id, ownerId: "user-b" } }));
  });

  it("returns 404 for another owner's rename and delete", async () => {
    session.userId = "user-b";
    database.updateMany.mockResolvedValue({ count: 0 });
    database.deleteMany.mockResolvedValue({ count: 0 });
    expect((await PATCH(request("PATCH", undefined, { title: "Stolen" }), context)).status).toBe(404);
    expect((await DELETE(request("DELETE"), context)).status).toBe(404);
    expect(database.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id, ownerId: "user-b" } }));
    expect(database.deleteMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id, ownerId: "user-b" } }));
  });
});
