"use client";

import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Barra superiore su telefono e tablet: logo, percorso e uscita. Le sezioni non
 * stanno qui ma nella barra in basso (BottomNav), più comoda da raggiungere col
 * pollice; su schermo largo questa barra sparisce e resta la barra laterale.
 */
export function AppHeader({
  home,
  userName,
  signOutAction,
  maxWidth,
  aside,
  className = "",
}: {
  home: string;
  userName: string;
  signOutAction: () => Promise<void>;
  maxWidth: string;
  // Spazio accanto al logo: lo studente ci mette il selettore del percorso.
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`sticky top-0 z-20 border-b border-line bg-card/85 backdrop-blur ${className}`}>
      <div className={`mx-auto flex ${maxWidth} flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6`}>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href={home} className="shrink-0">
            <img src="/profor-logo.png" alt="Profor" className="h-7 w-auto dark:brightness-125" />
          </Link>
          {aside}
        </div>


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
