"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "@/components/NavIcon";
import type { NavLink } from "@/components/AppSidebar";

/**
 * Barra delle sezioni in basso, su telefono e tablet: il pollice ci arriva senza
 * spostare la mano, ed è dove le app mettono la navigazione. Da 1024px in su
 * sparisce, perché lì c'è la barra laterale.
 *
 * La barra è fissa sul fondo dello schermo: il contenuto della pagina lascia
 * spazio sotto di sé (vedi il padding di <main> nei layout), altrimenti l'ultima
 * riga finirebbe coperta.
 */
export function BottomNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sezioni"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur lg:hidden"
      // Sui telefoni senza tasto casa la barra di sistema mangia l'ultimo mezzo
      // centimetro: qui si aggiunge esattamente quello spazio, e nient'altro dove
      // non serve.
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-lg">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 px-1 py-2 transition-colors ${
                active ? "text-brand-strong" : "text-muted hover:text-foreground"
              }`}
            >
              <NavIcon name={link.icon} />
              <span className="text-[0.625rem] font-semibold leading-tight">{link.short ?? link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
