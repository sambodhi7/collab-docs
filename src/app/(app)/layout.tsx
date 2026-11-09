import { requireSession } from "@/lib/session";
import type { ReactNode } from "react";

export const instant = false;

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return children;
}
