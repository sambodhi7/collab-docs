import Link from "next/link";

export default function DocumentNotFound() {
  return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 text-center"><h1 className="text-2xl font-semibold">Document not found</h1><p className="mt-3 text-zinc-600">It may have been deleted, or it may not be available to your account.</p><Link href="/dashboard" className="mx-auto mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white">Back to documents</Link></main>;
}
