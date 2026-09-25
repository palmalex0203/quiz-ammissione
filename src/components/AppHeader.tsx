"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Barra superiore comune a studente e insegnante: logo, sezioni (quella aperta è
 * evidenziata) e uscita. Su telefono le sezioni vanno su una seconda riga
 * scorrevole, così non si accavallano al logo.
 */
export function AppHeader({
  home,
  links,
  userName,
  signOutAction,
  maxWidth,
  aside,
  className = "",
}: {
  home: string;
  links: { href: string; label: string }[];
  userName: string;
  signOutAction: () => Promise<void>;
  maxWidth: string;
  // Spazio accanto al logo: lo studente ci mette il selettore del percorso.
  aside?: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <header className={`sticky top-0 z-20 border-b border-line bg-card/85 backdrop-blur ${className}`}>
      <div className={`mx-auto flex ${maxWidth} flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6`}>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href={home} className="shrink-0">
            <img src="/profor-logo.png" alt="Profor" className="h-7 w-auto dark:brightness-125" />
          </Link>
          {aside}
        </div>

        <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto text-sm font-medium sm:order-none sm:mx-0 sm:w-auto sm:flex-1">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-full px-3.5 py-1.5 transition-colors ${
                  active ? "bg-brand text-white" : "text-muted hover:bg-brand-tint hover:text-brand-strong"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <form action={signOutAction}>
          <button type="submit" className="flex items-center gap-2 text-sm text-muted hover:text-foreground">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong"
            >
              {userName.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:inline">Esci</span>
            <span className="sr-only sm:hidden">Esci ({userName})</span>
          </button>
        </form>
      </div>
    </header>
  );
}
