"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveAnswers, type AnswerChange } from "./actions";

/*
 * La coda dei salvataggi durante un test.
 *
 * Perché esiste. Prima ogni tocco su una risposta era una chiamata al server per
 * conto suo: tante chiamate quante risposte, e ognuna sveglia il database, che il
 * piano fattura a tempo di accensione. E se una di quelle chiamate falliva —
 * galleria, ascensore, wifi di casa che sparisce un attimo — la risposta era persa
 * senza che nessuno se ne accorgesse, perché nessuno la ritentava.
 *
 * Come funziona. Le risposte si accumulano qui e partono insieme: dopo una breve
 * pausa dall'ultimo tocco, o subito se se ne sono accumulate abbastanza. Se l'invio
 * fallisce le risposte tornano in coda e si riprova, con attese via via più lunghe,
 * e appena la rete torna. Lo stato è visibile allo studente, e la consegna aspetta
 * che la coda sia vuota.
 *
 * Quello che ancora manca: se il telefono si spegne o la pagina viene chiusa con la
 * coda piena, quelle risposte non ci sono più. Per resistere anche a quello servono
 * una copia nella memoria del browser e il recupero al ricaricamento.
 */

/** Pausa dall'ultimo tocco prima di mandare il gruppo. */
const ATTESA_MS = 2_000;
/** Con questo numero di risposte in coda si parte subito, senza aspettare la pausa. */
const GRUPPO_PIENO = 5;
/** Attese fra un tentativo fallito e il successivo. L'ultima si ripete. */
const RITENTATIVI_MS = [1_000, 3_000, 8_000, 20_000];

export type SaveState = "salvato" | "invio" | "attesa";

export function useAnswerQueue(attemptId: string) {
  // La coda è un ref e non uno stato: viene letta e riscritta dentro timer e
  // callback, dove uno stato arriverebbe vecchio.
  const codaRef = useRef(new Map<string, string | null>());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inCorsoRef = useRef(false);
  const falliteRef = useRef(0);
  // Il ritentativo deve richiamare la versione corrente di flush, che a quel punto
  // è già stata creata: passare per un ref evita di riferirsi a sé stessa.
  const flushRef = useRef<(() => Promise<boolean>) | null>(null);

  const [state, setState] = useState<SaveState>("salvato");

  const aggiornaStato = useCallback(() => {
    if (inCorsoRef.current) setState("invio");
    else if (codaRef.current.size > 0) setState("attesa");
    else setState("salvato");
  }, []);

  const flush = useCallback(async (): Promise<boolean> => {
    if (inCorsoRef.current) return false;
    if (codaRef.current.size === 0) return true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    inCorsoRef.current = true;
    setState("invio");

    // Il gruppo in volo resta qui fuori: se l'invio fallisce va rimesso in coda.
    let gruppo: AnswerChange[] = [];
    try {
      // Quello che lo studente tocca mentre un gruppo è in volo riempie di nuovo
      // la coda: il ciclo continua finché non è vuota.
      while (codaRef.current.size > 0) {
        gruppo = [...codaRef.current].map(([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        }));
        codaRef.current.clear();
        await saveAnswers(attemptId, gruppo);
        gruppo = [];
      }
      falliteRef.current = 0;
      inCorsoRef.current = false;
      aggiornaStato();
      return true;
    } catch {
      // Le risposte tornano in coda, ma senza coprire quelle date nel frattempo:
      // la più recente è sempre quella giusta.
      for (const c of gruppo) {
        if (!codaRef.current.has(c.questionId)) codaRef.current.set(c.questionId, c.selectedOptionId);
      }
      inCorsoRef.current = false;
      const attesa = RITENTATIVI_MS[Math.min(falliteRef.current, RITENTATIVI_MS.length - 1)];
      falliteRef.current += 1;
      aggiornaStato();
      timerRef.current = setTimeout(() => void flushRef.current?.(), attesa);
      return false;
    }
  }, [attemptId, aggiornaStato]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  /** Mette in coda una risposta (o la sua rimozione) e programma l'invio. */
  const enqueue = useCallback(
    (questionId: string, selectedOptionId: string | null) => {
      codaRef.current.set(questionId, selectedOptionId);
      aggiornaStato();

      if (codaRef.current.size >= GRUPPO_PIENO) {
        void flush();
        return;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void flush(), ATTESA_MS);
    },
    [flush, aggiornaStato]
  );

  /** Aspetta che la coda si svuoti, riprovando. Usato dalla consegna. */
  const drain = useCallback(async (): Promise<boolean> => {
    for (let tentativo = 0; tentativo < 5; tentativo++) {
      if (codaRef.current.size === 0 && !inCorsoRef.current) return true;
      await flush();
      if (codaRef.current.size === 0 && !inCorsoRef.current) return true;
      await new Promise((r) => setTimeout(r, 700));
    }
    return codaRef.current.size === 0;
  }, [flush]);

  useEffect(() => {
    // Appena la rete torna si riprova senza aspettare il timer.
    const onOnline = () => void flush();
    // Uscendo dalla pagina (cambio scheda, telefono bloccato) si tenta l'invio:
    // è un ultimo appiglio, non una garanzia.
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("pagehide", onOnline);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("pagehide", onOnline);
      document.removeEventListener("visibilitychange", onHide);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [flush]);

  return { enqueue, drain, state };
}
