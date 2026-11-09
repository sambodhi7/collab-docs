import { z } from "zod";

export const documentInput = z.strictObject({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
});

export const documentId = z.cuid();
