"use client";

import { useActionState, useRef, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { TastieraSimboli } from "@/components/TastieraSimboli";
import { COMPLETION_MAX_LENGTH } from "@/lib/completion";
import { aggiungiDomandaBanca, type StatoDomanda } from "./actions";

type Tipo = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "COMPLETAMENTO";
type Risposta = { text: string; isCorrect: boolean };

const SCELTA_MULTIPLA: Risposta[] = [
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
];
const VERO_FALSO: Risposta[] = [
  { text: "Vero", isCorrect: false },
  { text: "Falso", isCorrect: false },
];
const COMPLETAMENTO: Risposta[] = [{ text: "", isCorrect: true }];

function partenza(tipo: Tipo): Risposta[] {
  if (tipo === "TRUE_FALSE") return VERO_FALSO.map((o) => ({ ...o }));
  if (tipo === "COMPLETAMENTO") return COMPLETAMENTO.map((o) => ({ ...o }));
  return SCELTA_MULTIPLA.map((o) => ({ ...o }));
}

/** Dove sta il cursore: nel testo, o in quale riga di risposta. */
type Campo = { dove: "testo" } | { dove: "risposta"; indice: number };

/*
 * Scrivere una domanda nuova direttamente nella banca.
 *
 * Chiusa di default: aprendo la pagina di un argomento di solito si leggono le
 * domande che ci sono, non se ne aggiunge una.
 *
 * La materia e l'argomento non si chiedono — li sa già la pagina — e cinque
 * opzioni sono la partenza perché a scelta multipla all'esame sono cinque.
 */
export function NuovaDomanda({ topic, argomento }: { topic: string; argomento: string }) {
  const [stato, azione] = useActionState<StatoDomanda, FormData>(aggiungiDomandaBanca, {});
  const [tipo, setTipo] = useState<Tipo>("MULTIPLE_CHOICE");
  const [testo, setTesto] = useState("");
  const [risposte, setRisposte] = useState<Risposta[]>(partenza("MULTIPLE_CHOICE"));

  // Qual era l'ultimo campo toccato, e dov'era il cursore: servono per far
  // entrare il simbolo nel punto giusto invece che in fondo.
  const campo = useRef<Campo>({ dove: "testo" });
  const cursore = useRef<[number, number]>([0, 0]);
  const elementi = useRef(new Map<string, HTMLInputElement | HTMLTextAreaElement>());

  const chiave = (c: Campo) => (c.dove === "testo" ? "testo" : `risposta-${c.indice}`);

  function ricorda(c: Campo, el: HTMLInputElement | HTMLTextAreaElement) {
    campo.current = c;
    cursore.current = [el.selectionStart ?? el.value.length, el.selectionEnd ?? el.value.length];
  }

  function inserisci(simbolo: string) {
    const c = campo.current;
    const [da, a] = cursore.current;
    const valore = c.dove === "testo" ? testo : (risposte[c.indice]?.text ?? "");
    const nuovo = valore.slice(0, da) + simbolo + valore.slice(a);
    const posizione = da + simbolo.length;

    if (c.dove === "testo") setTesto(nuovo);
    else cambiaRisposta(c.indice, nuovo);

    cursore.current = [posizione, posizione];

    // Dopo il nuovo disegno: rimettere fuoco e cursore dove ci si aspetta di
    // continuare a scrivere, se no ogni simbolo costa un clic per tornare.
    // setTimeout e non requestAnimationFrame: il secondo non scatta quando la
    // finestra non sta disegnando, e il cursore resterebbe dov era.
    setTimeout(() => {
      const el = elementi.current.get(chiave(c));
      el?.focus();
      el?.setSelectionRange(posizione, posizione);
    }, 0);
  }

  function cambiaTipo(nuovo: Tipo) {
    setTipo(nuovo);
    setRisposte(partenza(nuovo));
  }

  function cambiaRisposta(i: number, valore: string) {
    setRisposte((prec) => prec.map((o, j) => (j === i ? { ...o, text: valore } : o)));
  }

  function segnaGiusta(i: number) {
    setRisposte((prec) => prec.map((o, j) => ({ ...o, isCorrect: j === i })));
  }

  const minime = tipo === "COMPLETAMENTO" ? 1 : 2;
  const massime = tipo === "COMPLETAMENTO" ? 8 : 6;

  return (
    <details className="card overflow-hidden" open={Boolean(stato.errore)}>
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold sm:px-7">
        + Scrivi una domanda nuova su «{argomento}»
      </summary>

      <form action={azione} className="flex flex-col gap-4 border-t border-line p-5 sm:p-7">
        <input type="hidden" name="topic" value={topic} />
        <input type="hidden" name="optionsJson" value={JSON.stringify(risposte)} />

        {stato.aggiunta && (
          <p className="rounded-2xl bg-brand-tint px-4 py-3 text-sm">
            Domanda aggiunta alla banca. È già pescabile dalle esercitazioni degli studenti.
          </p>
        )}
        {stato.errore && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300">
            {stato.errore}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="dom-tipo" className="text-sm font-semibold">
            Tipo di domanda
          </label>
          <select
            id="dom-tipo"
            name="type"
            value={tipo}
            onChange={(e) => cambiaTipo(e.target.value as Tipo)}
            className="field"
          >
            <option value="MULTIPLE_CHOICE">Scelta multipla</option>
            <option value="COMPLETAMENTO">A completamento</option>
            <option value="TRUE_FALSE">Vero/Falso</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="dom-testo" className="text-sm font-semibold">
            Testo della domanda
          </label>
          <textarea
            id="dom-testo"
            name="text"
            rows={3}
            required
            className="field"
            value={testo}
            ref={(el) => {
              if (el) elementi.current.set("testo", el);
            }}
            onChange={(e) => {
              setTesto(e.target.value);
              ricorda({ dove: "testo" }, e.target);
            }}
            onSelect={(e) => ricorda({ dove: "testo" }, e.currentTarget)}
            onFocus={(e) => ricorda({ dove: "testo" }, e.currentTarget)}
          />
        </div>

        <TastieraSimboli onInserisci={inserisci} />

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">
            {tipo === "COMPLETAMENTO" ? "Risposte accettate" : "Risposte — segna quella giusta"}
          </p>

          {tipo === "COMPLETAMENTO" && (
            <p className="text-xs leading-relaxed text-muted">
              Lo studente la scrive. Vale giusta se corrisponde a una di queste righe: maiuscole,
              accenti e spazi non contano, l&apos;ortografia sì. Una riga per ogni variante che
              accetti. Massimo {COMPLETION_MAX_LENGTH}{" "}
              caratteri l&apos;una, come le caselle dell&apos;esame.
            </p>
          )}

          {risposte.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              {tipo !== "COMPLETAMENTO" && (
                <input
                  type="radio"
                  name="correctOption"
                  aria-label={`Risposta ${i + 1} è quella giusta`}
                  checked={r.isCorrect}
                  onChange={() => segnaGiusta(i)}
                  className="h-4 w-4 shrink-0"
                />
              )}
              <input
                type="text"
                aria-label={tipo === "COMPLETAMENTO" ? `Risposta accettata ${i + 1}` : `Risposta ${i + 1}`}
                value={r.text}
                disabled={tipo === "TRUE_FALSE"}
                maxLength={tipo === "COMPLETAMENTO" ? COMPLETION_MAX_LENGTH : undefined}
                placeholder={tipo === "COMPLETAMENTO" ? `Variante ${i + 1}` : `Risposta ${i + 1}`}
                required
                className="field field-sm min-w-0 flex-1 disabled:opacity-60"
                ref={(el) => {
                  if (el) elementi.current.set(`risposta-${i}`, el);
                }}
                onChange={(e) => {
                  cambiaRisposta(i, e.target.value);
                  ricorda({ dove: "risposta", indice: i }, e.target);
                }}
                onSelect={(e) => ricorda({ dove: "risposta", indice: i }, e.currentTarget)}
                onFocus={(e) => ricorda({ dove: "risposta", indice: i }, e.currentTarget)}
              />
              {tipo !== "TRUE_FALSE" && risposte.length > minime && (
                <button
                  type="button"
                  onClick={() => setRisposte((prec) => prec.filter((_, j) => j !== i))}
                  className="shrink-0 text-xs font-semibold text-red-700 hover:underline dark:text-red-400"
                >
                  Togli
                </button>
              )}
            </div>
          ))}

          {tipo !== "TRUE_FALSE" && risposte.length < massime && (
            <button
              type="button"
              onClick={() =>
                setRisposte((prec) => [...prec, { text: "", isCorrect: tipo === "COMPLETAMENTO" }])
              }
              className="self-start text-xs font-semibold text-muted hover:text-brand-strong"
            >
              {tipo === "COMPLETAMENTO" ? "+ Aggiungi variante" : "+ Aggiungi risposta"}
            </button>
          )}
        </div>

        <SubmitButton pendingText="Salvo…" className="btn btn-brand self-start py-3">
          Aggiungi alla banca
        </SubmitButton>
      </form>
    </details>
  );
}
