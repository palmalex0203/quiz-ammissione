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
// ciascuna in 50 minuti, con 30 minuti di intervallo fra una prova e l'altra.
// Punteggio: +1 corretta, −0,1 errata, 0 non data; 93 punti in tutto sui tre esami.
//
// Fonte: D.M. n. 941 del 10 luglio 2026, Allegato 2, punti 4 e 6 — «Ciascuna prova
// di esame si compone di trentuno (31) domande, articolate come segue: ventuno (21)
// domande a risposta multipla; dieci (10) domande a risposta con modalità a
// completamento», e «per lo svolgimento di ciascuna materia oggetto di prova di
// esame è assegnato un tempo pari a 50 minuti». Il punteggio è all'articolo 9 del
// decreto. Copia in content/semestre-filtro/.
//
// CAMBIATO il 2026-10-27, e non di poco: fino all'anno scorso erano 15 a risposta
// multipla e 16 a completamento in 45 minuti, come si vede nei sei fascicoli 2025
// in content/semestre-filtro/prove-ufficiali/. Ora il peso è rovesciato — si
// scrivono dieci risposte invece di sedici — quindi i fascicoli vecchi restano
// buoni come esercizio ma non sono più il formato della prova.
//
// Nelle domande a completamento lo studente scrive la risposta (una parola, un
// numero o un'espressione, al massimo 16 caratteri) e un errore di ortografia la
// rende sbagliata. È il `typeMix` qui sotto, e il generatore lo rispetta: una prova
// esce con quel conto esatto, non con quello che capita.
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
  typeMix: { MULTIPLE_CHOICE: 21, COMPLETAMENTO: 10 },
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

/*
 * "17,8", "22", "−3,1": un punteggio come si scrive in italiano.
 *
 * I punteggi non sono interi (+1,5 a risposta, −0,4 a errore), e scritti così
 * come escono da JavaScript diventano "0.7 / 22.5": col punto, come in inglese,
 * accanto a "+1,5" e "−0,4" che invece sono già scritti bene. Tutto quello che
 * mostra un punteggio passa di qui.
 */
export function formatScore(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("it-IT", { maximumFractionDigits: 2 }).replace("-", "−");
}

/*
 * "allo 0%", "all'8%", "all'11%", "al 20%": la preposizione giusta davanti a una
 * percentuale. Dipende da come il numero si legge, non da come si scrive: davanti
 * a zero vuole "allo", davanti a uno, otto, undici e agli ottanta vuole "all'".
 */
export function alPercento(pct: number): string {
  if (pct === 0) return "allo 0%";
  const conVocale = pct === 1 || pct === 8 || pct === 11 || (pct >= 80 && pct <= 89);
  return conVocale ? `all'${pct}%` : `al ${pct}%`;
}
