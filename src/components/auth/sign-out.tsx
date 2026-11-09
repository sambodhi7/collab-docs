"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOut() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) setError(result.error.message ?? "Sign-out failed.");
      else {
        router.push("/login");
        router.refresh();
      }
    } catch {
      setError("Sign-out failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return <div><button type="button" onClick={signOut} disabled={pending} className="underline disabled:opacity-50">Sign out</button>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</div>;
}
