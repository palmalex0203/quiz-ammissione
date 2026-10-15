/**
 * Icone delle materie, usate dalla sezione Appunti.
 *
 * Il nome deve combaciare esattamente con quello in src/lib/tracks.ts, perché è
 * lo stesso valore salvato su TopicNote.subject.
 */
const ICONE: Record<string, string> = {
  Biologia: "🧬",
  "Chimica e propedeutica biochimica": "⚗️",
  Chimica: "⚗️",
  Fisica: "🔭",
  "Fisica e Matematica": "📐",
  Logica: "🧩",
  "Comprensione del testo": "📖",
};

export function iconaMateria(nome: string): string {
  return ICONE[nome] ?? "📘";
}

/**
 * Il nome della materia dentro un indirizzo. I nomi contengono spazi, quindi si
 * codificano: "Chimica e propedeutica biochimica" diventa
 * "Chimica%20e%20propedeutica%20biochimica". Si usa una funzione invece di
 * scriverlo a mano nei due punti del codice che ne hanno bisogno, così andata e
 * ritorno restano per forza simmetrici.
 */
export function percorsoMateria(nome: string): string {
  return `/student/appunti/materia/${encodeURIComponent(nome)}`;
}
