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
    <div className="app-shell min-h-screen bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/90 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/student/dashboard" className="shrink-0">
              <img src="/profor-logo.png" alt="Profor" className="h-7 w-auto dark:brightness-125" />
            </Link>
            <nav className="flex gap-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              <Link
                href="/student/dashboard"
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
              >
                I miei test
              </Link>
              <Link
                href="/student/history"
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
              >
                I miei progressi
              </Link>
            </nav>
          </div>
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
