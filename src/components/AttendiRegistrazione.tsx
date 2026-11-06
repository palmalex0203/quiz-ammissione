"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Su una pagina con dirette finite e ancora senza registrazione: chiede al
 * server se qualcuna è pronta, subito e poi ogni tre minuti finché la pagina
 * resta aperta. Quando una di quelle che si aspettavano arriva, ricarica i dati
 * e il pulsante compare da solo.
 */
export function AttendiRegistrazione({ lezioni }: { lezioni: string[] }) {
  const router = useRouter();
  const chiave = lezioni.join(",");

  useEffect(() => {
    const attese = new Set(chiave.split(","));
    let attivo = true;

    async function chiedi() {
      try {
        const r = await fetch("/api/lezioni/registrazioni", { method: "POST" });
        if (!r.ok) return;
        const { pronte } = (await r.json()) as { pronte: string[] };
        if (attivo && pronte.some((id) => attese.has(id))) router.refresh();
      } catch {
        // Rete assente: si riprova al giro dopo.
      }
    }

    void chiedi();
    const giro = setInterval(chiedi, 3 * 60_000);
    return () => {
      attivo = false;
      clearInterval(giro);
    };
  }, [chiave, router]);

  return null;
}
