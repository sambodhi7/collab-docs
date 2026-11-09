import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { GoogleSignIn } from "@/components/auth/google-sign-in";

export const instant = false;

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6"><h1 className="text-3xl font-semibold">Sign in</h1><p className="text-zinc-600">Use your Google account to access your private documents.</p><GoogleSignIn /></main>;
}
