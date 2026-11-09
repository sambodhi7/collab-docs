"use client";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 text-center"><h1 className="text-2xl font-semibold">Could not load your documents</h1><p className="mt-3 text-zinc-600">Check your connection and try again.</p><button onClick={reset} className="mx-auto mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white">Try again</button></main>;
}
