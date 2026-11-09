import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOut } from "@/components/auth/sign-out";

export const instant = false;

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return <main className="mx-auto max-w-3xl space-y-6 px-6 py-12"><h1 className="text-3xl font-semibold">Dashboard</h1><p>Signed in as {session.user.name} ({session.user.email})</p><SignOut /></main>;
}
