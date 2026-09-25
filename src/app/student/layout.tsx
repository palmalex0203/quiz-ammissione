import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar, type NavLink } from "@/components/AppSidebar";
import { TrackSwitcher } from "@/components/TrackSwitcher";
import { currentTrackId } from "@/lib/track-session";

const LINKS: NavLink[] = [
  { href: "/student/dashboard", label: "Pratica", icon: "target" },
  { href: "/student/practice", label: "Esercitati", icon: "grid" },
  { href: "/student/history", label: "I miei progressi", icon: "chart" },
];

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const trackId = await currentTrackId(session.user.id);
  const userName = session.user.name ?? "Studente";

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        home="/student/dashboard"
        links={LINKS}
        userName={userName}
        userRole="Studente"
        signOutAction={signOutAction}
        aside={<TrackSwitcher current={trackId} tone="dark" />}
      />
      <div className="app-shell flex min-w-0 flex-1 flex-col">
        <AppHeader
          className="lg:hidden"
          home="/student/dashboard"
          maxWidth="max-w-4xl"
          userName={userName}
          signOutAction={signOutAction}
          aside={<TrackSwitcher current={trackId} />}
          links={LINKS.map(({ href, label }) => ({ href, label }))}
        />
        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
