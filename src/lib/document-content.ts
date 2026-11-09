import { z } from "zod";

const requestSchema = z.strictObject({
  content: z.unknown(),
  revision: z.number().int().nonnegative(),
});

const nodeTypes = new Set(["doc", "paragraph", "heading", "text", "bulletList", "orderedList", "listItem", "blockquote", "codeBlock", "hardBreak", "horizontalRule"]);
const markTypes = new Set(["bold", "italic", "strike", "code", "link"]);
type JsonNode = { type: string; text?: string; attrs?: Record<string, unknown>; marks?: Array<{ type: string; attrs?: Record<string, unknown> }>; content?: JsonNode[] };

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function validNode(value: unknown, depth: number, count: { value: number }): value is JsonNode {
  if (!isObject(value) || depth > 30 || ++count.value > 5000 || typeof value.type !== "string" || !nodeTypes.has(value.type)) return false;
  if (Object.keys(value).some((key) => !["type", "text", "attrs", "marks", "content"].includes(key))) return false;
  if (value.type === "text") {
    if (typeof value.text !== "string" || value.text.length > 100_000 || value.content !== undefined) return false;
  } else if (value.text !== undefined || value.marks !== undefined) return false;
  if (value.attrs !== undefined) {
    if (!isObject(value.attrs)) return false;
    if (value.type === "heading") {
      if (Object.keys(value.attrs).some((key) => key !== "level") || ![1, 2, 3].includes(value.attrs.level as number)) return false;
    } else if (value.type === "orderedList") {
      if (Object.keys(value.attrs).some((key) => key !== "start") || !Number.isInteger(value.attrs.start) || (value.attrs.start as number) < 1) return false;
    } else if (Object.keys(value.attrs).length) return false;
  }
  if (value.marks !== undefined) {
    if (!Array.isArray(value.marks) || value.marks.length > 10) return false;
    for (const mark of value.marks) {
      if (!isObject(mark) || typeof mark.type !== "string" || !markTypes.has(mark.type) || Object.keys(mark).some((key) => !["type", "attrs"].includes(key))) return false;
      if (mark.type === "link") {
        if (!isObject(mark.attrs) || typeof mark.attrs.href !== "string" || !/^(https?:\/\/|mailto:)/i.test(mark.attrs.href) || mark.attrs.href.length > 2048 || Object.keys(mark.attrs).some((key) => !["href", "target", "rel", "class"].includes(key))) return false;
      } else if (mark.attrs !== undefined && (!isObject(mark.attrs) || Object.keys(mark.attrs).length)) return false;
    }
  }
  return value.content === undefined || (Array.isArray(value.content) && value.content.every((child) => validNode(child, depth + 1, count)));
}

export function parseDocumentContent(input: unknown) {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return null;
  const content = parsed.data.content;
  if (!isObject(content) || content.type !== "doc" || !Array.isArray(content.content)) return null;
  if (JSON.stringify(content).length > 200_000 || !validNode(content, 0, { value: 0 })) return null;
  return { content: content as JsonNode, revision: parsed.data.revision };
}
