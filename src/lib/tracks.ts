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

// Di che tipo sono le domande di una prova vera. I numeri sono quelli dell'esame
// (per il semestre filtro 15 e 16 su 31); quello che conta è la proporzione, perché
// un'esercitazione più corta la rispetta comunque.
export type TypeMix = Partial<Record<QuestionKind, number>>;

export type QuestionKind = "MULTIPLE_CHOICE" | "COMPLETAMENTO";

// Come l'esame vero traduce in voto il punteggio di una singola prova. Assente
// dove non c'è un voto: a Professioni Sanitarie la prova fa una graduatoria, non
// un trenta. Vedi src/lib/esame.ts.
export type Esame = { scala: number; sufficienza: number; lode: boolean };

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
  // Com'è ripartita una prova fra i tipi di domanda. Assente = nessun vincolo:
  // si pesca quello che c'è, com'è sempre stato per Professioni Sanitarie.
  typeMix?: TypeMix;
  // Ogni prova è un esame a sé e fa un voto a sé: qui come si calcola.
  esame?: Esame;
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
// ciascuna in 45 minuti, con 15 minuti di intervallo fra una prova e l'altra.
// Punteggio: +1 corretta, −0,1 errata, 0 non data.
//
// Fonte: "Linee guida per gli esami del semestre aperto" del MUR (ottobre 2025) e i
// fascicoli ufficiali degli esami, che stanno in content/semestre-filtro/.
//
// Da sapere: nelle prove vere 15 domande su 31 sono a risposta multipla con cinque
// opzioni e le altre 16 sono a completamento, cioè lo studente scrive la risposta
// (una parola, un numero o un'espressione, al massimo 16 caratteri) e un errore di
// ortografia la rende sbagliata. È il `typeMix` qui sotto, e il generatore lo
// rispetta: una prova esce con quel conto esatto, non con quello che capita.
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
    minutes: 135,
    description:
      "Le tre prove in fila come all'esame: 93 domande in tutto, 45 minuti a materia.",
  },
  papers: [
    { subject: "Chimica e propedeutica biochimica", questions: 31, minutes: 45 },
    { subject: "Fisica", questions: 31, minutes: 45 },
    { subject: "Biologia", questions: 31, minutes: 45 },
  ],
  practiceSizes: {
    "Chimica e propedeutica biochimica": 31,
    Fisica: 31,
    Biologia: 31,
  },
  typeMix: { MULTIPLE_CHOICE: 15, COMPLETAMENTO: 16 },
  // 31 domande, 31 punti al massimo: trenta più il punto della lode.
  esame: { scala: 30, sufficienza: 18, lode: true },
  scoring: { correct: 1, incorrect: -0.1, omitted: 0 },
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

/**
 * Quante domande di ciascun tipo deve avere una prova di `totale` domande.
 *
 * I pesi del percorso sono quelli dell'esame vero (15 e 16 su 31): qui vengono
 * riscalati sulla lunghezza richiesta, perché un'esercitazione può essere più
 * corta. I resti si assegnano al tipo che ne ha di più, così la somma torna
 * sempre esatta. Mappa vuota se il percorso non impone una ripartizione.
 */
export function typeQuotas(trackId: TrackId, totale: number): Map<QuestionKind, number> {
  const mix = TRACKS[trackId].typeMix;
  if (!mix || totale <= 0) return new Map();

  const pesi = Object.entries(mix).filter(([, peso]) => typeof peso === "number" && peso > 0) as [
    QuestionKind,
    number,
  ][];
  const somma = pesi.reduce((s, [, peso]) => s + peso, 0);
  if (somma === 0) return new Map();

  const parti = pesi.map(([tipo, peso]) => {
    const esatto = (totale * peso) / somma;
    const intero = Math.floor(esatto);
    return { tipo, intero, resto: esatto - intero };
  });

  let avanzo = totale - parti.reduce((s, p) => s + p.intero, 0);
  for (const p of [...parti].sort((a, b) => b.resto - a.resto)) {
    if (avanzo <= 0) break;
    p.intero += 1;
    avanzo -= 1;
  }

  return new Map(parti.map((p) => [p.tipo, p.intero]));
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
