import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="app-shell min-h-screen bg-background">
      <AppHeader
        home="/student/dashboard"
        maxWidth="max-w-4xl"
        userName={session.user.name ?? "Studente"}
        signOutAction={signOutAction}
        links={[
          { href: "/student/dashboard", label: "I miei test" },
          { href: "/student/practice", label: "Esercitati" },
          { href: "/student/history", label: "I miei progressi" },
        ]}
      />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
