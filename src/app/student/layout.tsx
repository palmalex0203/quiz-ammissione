import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <nav className="flex gap-5 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <Link href="/student/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              I miei test
            </Link>
            <Link href="/student/history" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Storico
            </Link>
          </nav>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Esci ({session.user.name})
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
