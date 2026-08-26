// Materie per cui è disponibile un'esercitazione mirata, con il numero di domande
// che ne compone una. La comprensione del testo ne ha meno perché ogni domanda si
// porta dietro un brano intero da leggere.
export const PRACTICE_SIZES: Record<string, number> = {
  "Comprensione del testo": 10,
  Logica: 20,
  Biologia: 20,
  Chimica: 20,
  "Fisica e Matematica": 20,
};

export function isPracticeable(subject: string): boolean {
  return Object.prototype.hasOwnProperty.call(PRACTICE_SIZES, subject);
}
