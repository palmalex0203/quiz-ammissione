/*
 * I due percorsi della piattaforma. Ogni percorso ha la sua banca dati, le sue
 * materie, la sua struttura di prova e il suo punteggio: cambiare qui il numero di
 * domande, i minuti o i punti cambia l'intera applicazione, senza toccare le pagine.
 *
 * Il valore di `id` è quello salvato su Test.track e su User.track.
 */
export const TRACK_IDS = ["PROFESSIONI_SANITARIE", "SEMESTRE_FILTRO"] as const;
export type TrackId = (typeof TRACK_IDS)[number];

export const DEFAULT_TRACK: TrackId = "PROFESSIONI_SANITARIE";

export type Scoring = { correct: number; incorrect: number; omitted: number };

// Una materia del percorso: `name` è il valore salvato su Question.subject,
// `short` serve dove lo spazio è poco (anelli, pillole, grafici).
export type TrackSubject = { name: string; short: string };

// Una prova singola così come si svolge all'esame vero.
export type Paper = { subject: string; questions: number; minutes: number };

export type Track = {
  id: TrackId;
  label: string;
  short: string;
  tagline: string;
  subjects: TrackSubject[];
  // La simulazione completa: quante domande per materia e quanto tempo in tutto.
  simulation: { blocks: { subject: string; count: number }[]; minutes: number; description: string };
  // Le prove che compongono l'esame. Per Professioni Sanitarie la prova è una sola
  // ed è la simulazione completa, quindi resta vuoto.
  papers: Paper[];
  // Quante domande ha un'esercitazione su una singola materia.
  practiceSizes: Record<string, number>;
  scoring: Scoring;
};

const PROFESSIONI_SANITARIE: Track = {
  id: "PROFESSIONI_SANITARIE",
  label: "Professioni Sanitarie",
  short: "Prof. Sanitarie",
  tagline: "60 domande, 100 minuti, cinque materie.",
  subjects: [
    { name: "Comprensione del testo", short: "Comprensione" },
    { name: "Logica", short: "Logica" },
    { name: "Biologia", short: "Biologia" },
    { name: "Chimica", short: "Chimica" },
    { name: "Fisica e Matematica", short: "Fisica e Mat." },
  ],
  // Struttura ricavata dalle simulazioni ufficiali CINECA già presenti sulla
  // piattaforma: stesso ordine di materie, stesso numero di domande per materia.
  simulation: {
    blocks: [
      { subject: "Comprensione del testo", count: 4 },
      { subject: "Logica", count: 5 },
      { subject: "Biologia", count: 23 },
      { subject: "Chimica", count: 15 },
      { subject: "Fisica e Matematica", count: 13 },
    ],
    minutes: 100,
    description:
      "60 domande pescate a caso dalla banca dati, con la struttura del test ufficiale e 100 minuti di tempo.",
  },
  papers: [],
  // La comprensione del testo ne ha meno perché ogni domanda si porta dietro un
  // brano intero da leggere.
  practiceSizes: {
    "Comprensione del testo": 10,
    Logica: 20,
    Biologia: 20,
    Chimica: 20,
    "Fisica e Matematica": 20,
  },
  scoring: { correct: 1.5, incorrect: -0.4, omitted: 0 },
};

// Semestre filtro: tre prove in sequenza (Chimica, Fisica, Biologia), 31 domande
// ciascuna — 21 a risposta multipla e 10 a completamento — in 50 minuti. Il
// punteggio è quello delle prove nazionali: +1 corretta, -0,25 errata, 0 non data.
// Fonte: syllabus MUR del semestre filtro, aggiornato per l'anno 2026/27.
const SEMESTRE_FILTRO: Track = {
  id: "SEMESTRE_FILTRO",
  label: "Semestre filtro",
  short: "Sem. filtro",
  tagline: "Tre prove da 31 domande: Chimica, Fisica, Biologia.",
  subjects: [
    { name: "Chimica e propedeutica biochimica", short: "Chimica" },
    { name: "Fisica", short: "Fisica" },
    { name: "Biologia", short: "Biologia" },
  ],
  simulation: {
    blocks: [
      { subject: "Chimica e propedeutica biochimica", count: 31 },
      { subject: "Fisica", count: 31 },
      { subject: "Biologia", count: 31 },
    ],
    minutes: 150,
    description:
      "Le tre prove in fila come all'esame: 93 domande in tutto, 50 minuti a materia.",
  },
  papers: [
    { subject: "Chimica e propedeutica biochimica", questions: 31, minutes: 50 },
    { subject: "Fisica", questions: 31, minutes: 50 },
    { subject: "Biologia", questions: 31, minutes: 50 },
  ],
  practiceSizes: {
    "Chimica e propedeutica biochimica": 31,
    Fisica: 31,
    Biologia: 31,
  },
  scoring: { correct: 1, incorrect: -0.25, omitted: 0 },
};

export const TRACKS: Record<TrackId, Track> = {
  PROFESSIONI_SANITARIE,
  SEMESTRE_FILTRO,
};

export const ALL_TRACKS: Track[] = TRACK_IDS.map((id) => TRACKS[id]);

export function isTrackId(value: unknown): value is TrackId {
  return typeof value === "string" && (TRACK_IDS as readonly string[]).includes(value);
}

// Un percorso a partire da un valore qualsiasi (cookie, form, colonna del database):
// se il valore non è riconosciuto si torna al percorso predefinito invece di rompersi.
export function trackOf(value: unknown): Track {
  return isTrackId(value) ? TRACKS[value] : TRACKS[DEFAULT_TRACK];
}

export function subjectShort(track: Track, subject: string): string {
  return track.subjects.find((s) => s.name === subject)?.short ?? subject;
}

export function isPracticeable(track: Track, subject: string): boolean {
  return Object.prototype.hasOwnProperty.call(track.practiceSizes, subject);
}

export function paperOf(track: Track, subject: string): Paper | undefined {
  return track.papers.find((p) => p.subject === subject);
}

// Quante domande ha la simulazione completa del percorso.
export function simulationSize(track: Track): number {
  return track.simulation.blocks.reduce((sum, b) => sum + b.count, 0);
}

// Punteggio pieno di una prova: serve per calcolare le percentuali.
export function maxScoreFor(track: Track, questions: number): number {
  return Math.round(questions * track.scoring.correct * 100) / 100;
}

// "+1,5" / "−0,4": i punti come vanno mostrati allo studente.
export function formatPoints(points: number): string {
  const text = points.toLocaleString("it-IT", { maximumFractionDigits: 2 });
  return points > 0 ? `+${text}` : text.replace("-", "−");
}
