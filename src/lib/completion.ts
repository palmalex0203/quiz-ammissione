/*
 * Le domande a completamento: quelle in cui lo studente scrive la risposta invece
 * di sceglierla fra cinque opzioni. Nelle prove del semestre filtro sono 16 su 31,
 * e la risposta è una parola, un numero o una breve espressione.
 *
 * Quanto si può essere pignoli. Le linee guida del MUR dicono che all'esame una
 * risposta con errori di ortografia è sbagliata, e all'esame si scrive in
 * stampatello su una griglia di caselle: maiuscole e accenti lì non esistono
 * nemmeno. Qui si corregge di conseguenza: si ignorano maiuscole, accenti, spazi
 * doppi e punteggiatura finale — differenze che sulla griglia non ci sarebbero —
 * ma non si perdona una lettera sbagliata. Chi scrive "topoisomerasi" o
 * "TOPOISOMERASI" ha risposto bene; chi scrive "topoisomerase" no.
 *
 * Le varianti davvero accettabili (sinonimi, forme abbreviate, un numero con o
 * senza unità) non si indovinano: si elencano. Ogni variante è una riga di
 * AnswerOption con isCorrect = true, e la prima è quella mostrata nella correzione.
 */

/** Quanti caratteri entrano nelle caselle del modulo risposte vero. */
export const COMPLETION_MAX_LENGTH = 16;

/**
 * La forma su cui si confronta: minuscole, senza accenti, senza spazi doppi,
 * senza punteggiatura ai bordi. La virgola decimale diventa un punto, così "0,5"
 * e "0.5" sono la stessa risposta.
 */
export function normalizeCompletion(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[\s ]+/g, " ")
    .trim()
    .replace(/^[.,;:!?'"«»()]+|[.,;:!?'"«»()]+$/g, "")
    .replace(/(\d),(\d)/g, "$1.$2")
    .trim();
}

/**
 * Se la risposta scritta vale come giusta. `accepted` sono i testi delle varianti
 * ammesse, così come li ha scritti chi ha preparato la domanda.
 */
export function isCompletionCorrect(typed: string | null | undefined, accepted: string[]): boolean {
  if (typed == null) return false;
  const risposta = normalizeCompletion(typed);
  if (risposta === "") return false;
  return accepted.some((a) => normalizeCompletion(a) === risposta);
}

/** Una risposta lasciata in bianco: non è sbagliata, è omessa. */
export function isCompletionBlank(typed: string | null | undefined): boolean {
  return typed == null || typed.trim() === "";
}

/** Come si chiama un tipo di domanda nelle schermate dell'insegnante. */
export function etichettaTipo(type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "COMPLETAMENTO"): string {
  if (type === "COMPLETAMENTO") return "A completamento";
  if (type === "TRUE_FALSE") return "Vero/Falso";
  return "Scelta multipla";
}

/**
 * Se a una domanda è stata data una risposta. Non basta guardare l'opzione
 * scelta: in una domanda a completamento non c'è mai, e contarla come omessa fa
 * sballare il riepilogo della correzione.
 */
export function rispostaData(answer: {
  selectedOptionId: string | null;
  typedAnswer: string | null;
  question: { type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "COMPLETAMENTO" };
}): boolean {
  return answer.question.type === "COMPLETAMENTO"
    ? !isCompletionBlank(answer.typedAnswer)
    : answer.selectedOptionId != null;
}
