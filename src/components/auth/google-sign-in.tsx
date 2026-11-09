"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function GoogleSignIn() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function signIn() {
    setError("");
    setPending(true);
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
      if (result.error) setError(result.error.message ?? "Google sign-in failed.");
    } catch {
      setError("Google sign-in is unavailable. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return <div className="space-y-3"><button type="button" onClick={signIn} disabled={pending} className="rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white disabled:opacity-50">{pending ? "Connecting to Google…" : "Continue with Google"}</button>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</div>;
}
