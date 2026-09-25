"use client";

import { useSyncExternalStore } from "react";

/*
 * Invito a mettere il simulatore sulla schermata iniziale del telefono.
 * L'iPhone non lo propone da solo: se non glielo si dice, nessuno lo installa.
 *
 * Quando e dove sparisce:
 * - a app già installata e su schermo grande ci pensa il CSS (.install-hint),
 *   così non serve indovinare niente in JavaScript;
 * - alla chiusura manuale ci pensa questo componente, ricordandolo nel browser.
 */
const KEY = "profor:install-hint";
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function isDismissed() {
  // In navigazione privata l'accesso può essere negato: in quel caso l'invito
  // resta visibile, che è il male minore.
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    // Niente memoria: sparisce comunque fino al prossimo caricamento.
  }
  for (const listener of listeners) listener();
}

export function InstallHint() {
  // Sul server si fa finta che sia già chiuso: l'invito compare solo nel browser,
  // dove si può sapere se è stato chiuso davvero.
  const dismissed = useSyncExternalStore(subscribe, isDismissed, () => true);
  if (dismissed) return null;

  return (
    <aside className="install-hint card flex items-start gap-3 p-5">
      <span aria-hidden="true" className="text-xl">
        📲
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Tienilo a portata di mano</p>
        <p className="mt-1 text-xs text-muted">
          Puoi mettere il simulatore tra le app del telefono e aprirlo a tutto schermo, senza passare dal browser.
        </p>
        <p className="mt-2 text-xs text-muted">
          <span className="font-semibold text-foreground">iPhone:</span> tocca Condividi in basso, poi &ldquo;Aggiungi
          a Home&rdquo;.
          <br />
          <span className="font-semibold text-foreground">Android:</span> menu del browser, poi &ldquo;Installa
          app&rdquo;.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-muted hover:text-brand-strong"
      >
        Chiudi
      </button>
    </aside>
  );
}
