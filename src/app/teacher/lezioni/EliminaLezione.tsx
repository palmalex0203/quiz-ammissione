"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { eliminaLezione } from "./actions";

/*
 * Si chiede conferma, con lo stesso andamento dell'eliminazione di un test:
 * annulla a sinistra, conferma a destra. Qui non si perdono dati degli
 * studenti, ma il filmato o la riunione vanno ritrovati e reincollati.
 */
export function EliminaLezione({ id, titolo }: { id: string; titolo: string }) {
  const [chiedoConferma, setChiedoConferma] = useState(false);

  if (!chiedoConferma) {
    return (
      <button
        type="button"
        onClick={() => setChiedoConferma(true)}
        className="btn btn-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
      >
        Elimina
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <p className="text-xs font-semibold">Elimino «{titolo}»? Non si torna indietro.</p>
      <button type="button" onClick={() => setChiedoConferma(false)} className="btn btn-sm btn-soft">
        Annulla
      </button>
      <form action={eliminaLezione}>
        <input type="hidden" name="id" value={id} />
        <SubmitButton
          pendingText="Elimino…"
          className="btn btn-sm bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500"
        >
          Sì, elimina
        </SubmitButton>
      </form>
    </div>
  );
}
