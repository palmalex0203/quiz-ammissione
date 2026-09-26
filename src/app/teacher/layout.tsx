import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar, type NavLink } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";

const LINKS: NavLink[] = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: "home" },
  { href: "/teacher/students", label: "Studenti", icon: "users" },
  { href: "/teacher/tests", label: "Test", icon: "docs" },
  { href: "/teacher/appunti", label: "Appunti", icon: "book" },
  { href: "/teacher/results", label: "Risultati", icon: "chart" },
];

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const userName = session.user.name ?? "Docente";

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        home="/teacher/dashboard"
        links={LINKS}
        userName={userName}
        userRole="Insegnante"
        signOutAction={signOutAction}
      />
      <div className="app-shell flex min-w-0 flex-1 flex-col">
        <AppHeader
          className="lg:hidden"
          home="/teacher/dashboard"
          maxWidth="max-w-5xl"
          userName={userName}
          signOutAction={signOutAction}
        />
        {/* pb-24: spazio per la barra delle sezioni, che su telefono è fissa in basso */}
        <main className="mx-auto w-full max-w-5xl px-4 py-8 pb-28 sm:px-6 lg:py-10 lg:pb-10">{children}</main>
        <BottomNav links={LINKS} />
      </div>
    </div>
  );
}
