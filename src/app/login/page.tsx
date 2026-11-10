import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { GoogleSignIn } from "@/components/auth/google-sign-in";

export const instant = false;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const destination = typeof next === "string" && /^\/share\/[A-Za-z0-9_-]{43}$/.test(next) ? next : "/dashboard";
  const session = await getSession();
  if (session) redirect(destination);
  return <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6"><h1 className="text-3xl font-semibold">Sign in</h1><p className="text-zinc-600">Use your Google account to access your private documents.</p><GoogleSignIn callbackURL={destination} /></main>;
}
