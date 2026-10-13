"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { deleteTest } from "./actions";

/*
 * Eliminare un test porta via anche i tentativi che gli studenti ci hanno già
 * svolto, e non si torna indietro. Prima era un link di testo accanto a
 * "Modifica": si chiede conferma, con lo stesso andamento della consegna a
 * sezioni (annulla a sinistra, conferma a destra).
 */
export function DeleteTestButton({ testId, title, attempts }: { testId: string; title: string; attempts: number }) {
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
      <p className="text-xs font-semibold">
        Elimino «{title}»
        {attempts > 0
          ? ` e i ${attempts} tentativi già svolti? Non si torna indietro.`
          : "? Non si torna indietro."}
      </p>
      <button type="button" onClick={() => setChiedoConferma(false)} className="btn btn-sm btn-soft">
        Annulla
      </button>
      <form action={deleteTest}>
        <input type="hidden" name="testId" value={testId} />
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
