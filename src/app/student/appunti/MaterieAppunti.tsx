"use client";

import { useState } from "react";
import Link from "next/link";

export type VoceAppunto = { topic: string; titolo: string };
export type MateriaAppunti = {
  nome: string;
  icona: string;
  /** Gli argomenti che hanno un appunto pubblicato. */
  voci: VoceAppunto[];
  /** Quanti argomenti ha in tutto la materia nel programma. */
  totale: number;
};

/**
 * I riquadri delle materie. Chiusi mostrano solo il nome e quanti argomenti
 * sono pronti; aprendoli compare l'elenco.
 *
 * Perché chiusi: con il programma completo le tre materie fanno 21 argomenti, e
 * un elenco unico di 21 righe costringe a scorrere per trovare la propria
 * materia. Così invece la prima schermata sta tutta sotto gli occhi e si apre
 * solo quello che serve.
 *
 * Sotto il nome dell'argomento non si scrive niente: numero di parole e data
 * non aiutano a scegliere cosa ripassare, e aggiungono rumore a una lista che
 * deve essere letta a colpo d'occhio.
 */
export function MaterieAppunti({ materie }: { materie: MateriaAppunti[] }) {
  // Se c'è una materia sola, aprirla subito: un riquadro da aprire per forza è
  // un clic sprecato.
  const [aperta, setAperta] = useState<string | null>(materie.length === 1 ? materie[0].nome : null);

  return (
    <div className="flex flex-col gap-3">
      {materie.map((m) => {
        const apertaOra = aperta === m.nome;
        const vuota = m.voci.length === 0;

        return (
          <section key={m.nome} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => setAperta(apertaOra ? null : m.nome)}
              disabled={vuota}
              aria-expanded={apertaOra}
              className="flex w-full items-center gap-4 p-5 text-left transition-colors enabled:hover:bg-brand-tint disabled:cursor-default"
            >
              <span
                aria-hidden
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-2xl"
              >
                {m.icona}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-bold tracking-tight">{m.nome}</span>
                <span className="block text-sm text-muted">
                  {vuota
                    ? "Nessun argomento ancora pronto"
                    : `${m.voci.length} ${m.voci.length === 1 ? "argomento" : "argomenti"} su ${m.totale}`}
                </span>
              </span>

              {!vuota && (
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  className={`h-5 w-5 shrink-0 text-muted transition-transform ${apertaOra ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 7.5 10 12.5 15 7.5" />
                </svg>
              )}
            </button>

            {apertaOra && !vuota && (
              <ul className="border-t border-line">
                {m.voci.map((v) => (
                  <li key={v.topic} className="border-b border-line last:border-b-0">
                    <Link
                      href={`/student/appunti/${v.topic}`}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm font-medium transition-colors hover:bg-brand-tint hover:text-brand-strong"
                    >
                      {v.titolo}
                      <svg
                        aria-hidden
                        viewBox="0 0 20 20"
                        className="h-4 w-4 shrink-0 text-muted"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M7.5 5 12.5 10 7.5 15" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
