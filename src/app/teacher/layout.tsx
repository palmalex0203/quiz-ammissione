import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="app-shell min-h-screen bg-background">
      <AppHeader
        home="/teacher/dashboard"
        maxWidth="max-w-5xl"
        userName={session.user.name ?? "Docente"}
        signOutAction={signOutAction}
        links={[
          { href: "/teacher/dashboard", label: "Dashboard" },
          { href: "/teacher/students", label: "Studenti" },
          { href: "/teacher/tests", label: "Test" },
          { href: "/teacher/results", label: "Risultati" },
        ]}
      />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
