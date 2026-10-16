"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { creaLezione, type StatoLezione } from "./actions";

type VoceArgomento = { code: string; label: string };
type GruppoMateria = { materia: string; argomenti: VoceArgomento[] };

/*
 * Il modulo per aggiungere una lezione.
 *
 * Chiuso di default: la cosa che si fa più spesso aprendo questa pagina è
 * guardare l'elenco, non caricare. Un modulo con otto campi sempre aperto in
 * cima spinge l'elenco sotto il bordo dello schermo.
 */
export function NuovaLezione({ gruppi }: { gruppi: GruppoMateria[] }) {
  const [stato, azione] = useActionState<StatoLezione, FormData>(creaLezione, {});
  const [tipo, setTipo] = useState<"registrata" | "diretta">("diretta");

  const diretta = tipo === "diretta";

  return (
    <details className="card overflow-hidden" open={Boolean(stato.errore)}>
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold sm:px-7">
        + Aggiungi una lezione
      </summary>

      <form action={azione} className="flex flex-col gap-4 border-t border-line p-5 sm:p-7">
        {stato.creata && (
          <p className="rounded-2xl bg-brand-tint px-4 py-3 text-sm">
            «{stato.creata}» aggiunta come bozza. Rileggila e premi <strong>Pubblica</strong> quando
            è pronta: finché è bozza non la vede nessuno.
          </p>
        )}
        {stato.errore && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300">
            {stato.errore}
          </p>
        )}

        {/* Prima di tutto: registrata o in diretta. Decide cosa si chiede dopo,
            e sono due cose che in pagina si comportano in modo diverso. */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold">Che lezione è</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { v: "diretta", etichetta: "🔴 In diretta", nota: "Teams, Meet o Zoom" },
                { v: "registrata", etichetta: "🎥 Registrata", nota: "YouTube o Vimeo" },
              ] as const
            ).map((o) => (
              <label
                key={o.v}
                className={`flex cursor-pointer flex-col gap-0.5 rounded-2xl border px-4 py-2.5 transition-colors ${
                  tipo === o.v
                    ? "border-brand bg-brand-tint"
                    : "border-control-line hover:border-brand/40"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="radio"
                    name="tipo"
                    value={o.v}
                    checked={tipo === o.v}
                    onChange={() => setTipo(o.v)}
                    className="sr-only"
                  />
                  {o.etichetta}
                </span>
                <span className="text-xs text-muted">{o.nota}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Campo id="lez-titolo" etichetta="Titolo">
          <input id="lez-titolo" name="titolo" className="field" required maxLength={160} />
        </Campo>

        <Campo
          id="lez-indirizzo"
          etichetta={diretta ? "Indirizzo della riunione" : "Indirizzo del video"}
          aiuto={
            diretta
              ? "Si incolla com'è. In pagina diventa un pulsante: Teams non si lascia incorporare."
              : "Si incolla com'è: il video compare dentro la pagina."
          }
        >
          <input
            id="lez-indirizzo"
            name="indirizzo"
            type="url"
            className="field"
            required
            placeholder={
              diretta ? "https://teams.microsoft.com/meet/…" : "https://www.youtube.com/watch?v=…"
            }
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="lez-quando" etichetta="Quando si tiene">
            <input id="lez-quando" name="quando" type="datetime-local" className="field" required />
          </Campo>
          <Campo id="lez-durata" etichetta="Durata in minuti" aiuto="Facoltativa.">
            <input
              id="lez-durata"
              name="durataMinuti"
              type="number"
              min={1}
              max={600}
              className="field"
              placeholder="120"
            />
          </Campo>
        </div>

        <Campo
          id="lez-argomento"
          etichetta="Argomento del programma"
          aiuto="Facoltativo. Se lo indichi, la lezione compare anche sotto l'appunto di quell'argomento."
        >
          <select id="lez-argomento" name="argomento" className="field" defaultValue="">
            <option value="">Nessuno — lezione introduttiva</option>
            {gruppi.map((g) => (
              <optgroup key={g.materia} label={g.materia}>
                {g.argomenti.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Campo>

        <Campo id="lez-descrizione" etichetta="Descrizione" aiuto="Facoltativa.">
          <textarea id="lez-descrizione" name="descrizione" rows={3} className="field" maxLength={1000} />
        </Campo>

        <SubmitButton pendingText="Aggiungo…" className="btn btn-brand self-start py-3">
          Aggiungi come bozza
        </SubmitButton>
      </form>
    </details>
  );
}

function Campo({
  id,
  etichetta,
  aiuto,
  children,
}: {
  id: string;
  etichetta: string;
  aiuto?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {etichetta}
      </label>
      {children}
      {aiuto && <p className="text-xs text-muted">{aiuto}</p>}
    </div>
  );
}
