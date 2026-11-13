"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { importaDalCalendario, type StatoLezione } from "./actions";

export type VoceCalendario = {
  chiave: string;
  /** Il titolo come sta su Teams: si mostra, perché è così che il docente la riconosce. */
  titoloTeams: string;
  /** Il titolo riscritto per gli studenti, già nel campo e modificabile. */
  titolo: string;
  materia: string | null;
  /** Data e ora già scritte all'italiana: il fuso lo risolve il server. */
  quando: string;
  durata: string | null;
};

/*
 * Le riunioni del team non ancora caricate.
 *
 * Perché non si carica tutto da solo: su quel calendario finiscono anche
 * riunioni che non sono lezioni, il titolo che va bene fra colleghi non è
 * quello che leggono gli studenti, e la materia nessuno la scrive nel
 * calendario. Però le tre cose che si sbagliano — la data, l'ora e il link —
 * arrivano da Teams e non si digitano più.
 *
 * Una riga sparisce da qui appena la lezione è caricata: quello che resta è
 * quello che manca.
 */
export function DalCalendario({
  riunioni,
  materie,
}: {
  riunioni: VoceCalendario[];
  materie: { name: string; short: string }[];
}) {
  const [stato, azione] = useActionState<StatoLezione, FormData>(importaDalCalendario, {});

  if (riunioni.length === 0) return null;

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line px-5 py-4 sm:px-7">
        <h2 className="font-display text-base font-bold tracking-tight">Dal calendario del team</h2>
        <p className="mt-1 text-sm text-muted">
          {riunioni.length === 1
            ? "Una riunione su Teams non è ancora una lezione qui."
            : `${riunioni.length} riunioni su Teams non sono ancora lezioni qui.`}{" "}
          Data, ora e link arrivano da Teams: scegli la materia e carica.
        </p>
      </div>

      {stato.errore && (
        <p className="border-b border-line bg-red-50 px-5 py-3 text-sm text-red-800 sm:px-7 dark:bg-red-500/10 dark:text-red-300">
          {stato.errore}
        </p>
      )}
      {stato.creata && (
        <p className="border-b border-line bg-brand-tint px-5 py-3 text-sm sm:px-7">
          «{stato.creata}» aggiunta come bozza, qui sotto. La vedono gli studenti solo quando premi{" "}
          <strong>Pubblica</strong>.
        </p>
      )}

      <ul className="divide-y divide-line">
        {riunioni.map((r) => (
          <li key={r.chiave}>
            <form action={azione} className="flex flex-col gap-3 p-5 sm:px-7">
              <input type="hidden" name="chiave" value={r.chiave} />

              <div>
                <p className="text-sm font-semibold">
                  <span aria-hidden>📅</span> {r.titoloTeams}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {r.quando}
                  {r.durata && <> · {r.durata}</>}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-xs font-semibold">Titolo per gli studenti</span>
                  <input
                    name="titolo"
                    className="field"
                    defaultValue={r.titolo}
                    required
                    maxLength={160}
                  />
                </label>

                <label className="flex flex-col gap-1.5 sm:w-56">
                  <span className="text-xs font-semibold">Materia</span>
                  <select name="materia" className="field" defaultValue={r.materia ?? ""}>
                    <option value="">Nessuna</option>
                    {materie.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.short}
                      </option>
                    ))}
                  </select>
                </label>

                <SubmitButton pendingText="Carico…" className="btn btn-brand shrink-0 py-3">
                  Aggiungi come bozza
                </SubmitButton>
              </div>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
