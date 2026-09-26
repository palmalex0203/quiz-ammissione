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
      // Lo stacco dal fondo dello schermo è in .bottom-nav (globals.css): cambia fra
      // browser e app installata, e una regola CSS sa distinguerli, una proprietà
      // scritta qui no.
      className="bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-lg">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              // min-h e touch-action: il bersaglio deve restare abbondante anche
              // con l'etichetta corta, e il tocco non deve essere interpretato come
              // l'inizio di un doppio tocco per ingrandire.
              className={`flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-1 px-1 pt-2 [touch-action:manipulation] transition-colors ${
                active ? "text-brand-strong" : "text-muted hover:text-foreground"
              }`}
            >
              <NavIcon name={link.icon} className="h-6 w-6" />
              <span className="text-[0.6875rem] font-semibold leading-tight">{link.short ?? link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
