"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon, type IconName } from "@/components/NavIcon";
import { LinkSpinner } from "@/components/LinkSpinner";

export type NavLink = {
  href: string;
  label: string;
  icon: IconName;
  // Versione corta per la barra in basso su telefono.
  short?: string;
};

/**
 * Barra laterale su schermo largo: logo, percorso, sezioni e uscita. Sotto i 1024px
 * sparisce e al suo posto resta la barra in alto (AppHeader), che su telefono è più
 * comoda.
 */
export function AppSidebar({
  home,
  links,
  userName,
  userRole,
  signOutAction,
  aside,
}: {
  home: string;
  links: NavLink[];
  userName: string;
  userRole: string;
  signOutAction: () => Promise<void>;
  aside?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 bg-sidebar px-4 py-5 text-sidebar-fg lg:flex">
      <Link href={home} className="self-start rounded-2xl bg-white px-3 py-2">
        <img src="/profor-logo.png" alt="Profor" className="h-6 w-auto" />
      </Link>

      {aside}

      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand text-white"
                  : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-fg"
              }`}
            >
              <NavIcon name={link.icon} />
              {link.label}
              <LinkSpinner />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2 border-t border-sidebar-line pt-4">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
        >
          {userName.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{userName}</p>
          <p className="truncate text-xs text-sidebar-muted">{userRole}</p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            title="Esci"
            className="rounded-full p-2 text-sidebar-muted transition-colors hover:bg-white/5 hover:text-sidebar-fg"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[1.15rem] w-[1.15rem]"
            >
              <path d="M14 4.5H6.5v15H14" />
              <path d="M17.5 12H11M15 8.5l3.5 3.5L15 15.5" />
            </svg>
            <span className="sr-only">Esci</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
