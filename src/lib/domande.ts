import type { QuestionType } from "@/generated/prisma/client";
import { COMPLETION_MAX_LENGTH } from "@/lib/completion";

/*
 * Le regole di una domanda, in un posto solo.
 *
 * Stavano dentro l'editor dei test. Ora le domande si scrivono anche dalla
 * banca, e due copie delle stesse regole divergono sempre: basta correggere un
 * limite da una parte e scordarselo dall'altra perché la stessa domanda sia
 * valida in una pagina e rifiutata nell'altra.
 */

export type Risposta = { text: string; isCorrect: boolean };

export type Validazione =
  | { ok: true; tipo: QuestionType; risposte: Risposta[] }
  | { ok: false; errore: string };

/** Le opzioni arrivano dal browser come JSON: si legge con prudenza. */
export function leggiRisposte(raw: string): Risposta[] | null {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((o) => ({ text: String(o?.text ?? "").trim(), isCorrect: Boolean(o?.isCorrect) }))
      .filter((o) => o.text.length > 0);
  } catch {
    return null;
  }
}

export function validaRisposte(type: string, options: Risposta[] | null): Validazione {
  if (type !== "MULTIPLE_CHOICE" && type !== "TRUE_FALSE" && type !== "COMPLETAMENTO") {
    return { ok: false, errore: "Tipo di domanda non valido." };
  }

  if (type === "COMPLETAMENTO") {
    const ammesse = (options ?? [])
      .filter((o) => o.text.trim() !== "")
      .map((o) => ({ text: o.text.trim(), isCorrect: true }));
    if (ammesse.length === 0) return { ok: false, errore: "Serve almeno una risposta accettata." };
    if (ammesse.some((o) => o.text.length > COMPLETION_MAX_LENGTH)) {
      return {
        ok: false,
        errore: `All'esame si scrive in ${COMPLETION_MAX_LENGTH} caselle: nessuna risposta accettata può essere più lunga.`,
      };
    }
    return { ok: true, tipo: type, risposte: ammesse };
  }

  if (!options || options.length < 2) return { ok: false, errore: "Servono almeno due opzioni di risposta." };
  if (options.filter((o) => o.isCorrect).length !== 1) {
    return { ok: false, errore: "Seleziona esattamente una risposta corretta." };
  }
  return { ok: true, tipo: type, risposte: options };
}
