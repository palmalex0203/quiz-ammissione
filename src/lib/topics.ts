import { DEFAULT_TRACK, type TrackId } from "@/lib/tracks";

// Macroargomenti di programma. Il codice (B3, C7, SF-BIO-01, ...) è ciò che viene
// salvato su Question.topic, l'etichetta resta modificabile senza toccare il
// database. I codici sono unici fra tutti i percorsi, così una domanda porta con sé
// anche il percorso a cui appartiene.
// cfu: il peso dell'argomento nel programma ufficiale, dove esiste. Serve a comporre
// una prova con la stessa distribuzione di quella vera invece che a caso.
export type Topic = { code: string; label: string; cfu?: number };

// Professioni Sanitarie: macroargomenti ripresi dalle esercitazioni già create
// dall'insegnante.
const PROFESSIONI_SANITARIE: Record<string, Topic[]> = {
  Biologia: [
    { code: "B7", label: "La cellula: organuli, membrana e trasporti" },
    { code: "B1", label: "Ciclo cellulare e mitosi" },
    { code: "B2", label: "Meiosi e gametogenesi" },
    { code: "B5", label: "DNA: struttura, duplicazione ed espressione genica" },
    { code: "B3", label: "Genetica mendeliana" },
    { code: "B4", label: "Ereditarietà legata al sesso e gruppi sanguigni" },
    { code: "B6", label: "Enzimi e metabolismo energetico" },
    { code: "B8", label: "Anatomia e fisiologia umana" },
    { code: "B9", label: "Virus, batteri e sistema immunitario" },
    { code: "B10", label: "Evoluzione, ecologia e classificazione" },
  ],
  Chimica: [
    { code: "C5", label: "Struttura dell'atomo e tavola periodica" },
    { code: "C6", label: "Legami chimici e geometria molecolare" },
    { code: "C1", label: "Mole, massa molare e calcoli stechiometrici" },
    { code: "C2", label: "Bilanciamento e tipi di reazione" },
    { code: "C3", label: "Soluzioni e concentrazione" },
    { code: "C4", label: "Acidi, basi e pH" },
    { code: "C7", label: "Ossidoriduzioni e numeri di ossidazione" },
    { code: "C9", label: "La materia: stati di aggregazione e leggi dei gas" },
    { code: "C10", label: "Nomenclatura e composti inorganici" },
    { code: "C8", label: "Chimica organica e biomolecole" },
  ],
  Logica: [
    { code: "L1", label: "Logica verbale e sillogismi" },
    { code: "L2", label: "Problemi aritmetici: percentuali, sconti e ripartizioni" },
    { code: "L3", label: "Serie, ordinamenti e problemi di organizzazione" },
  ],
  "Fisica e Matematica": [
    { code: "F1", label: "Cinematica" },
    { code: "F2", label: "Dinamica, forze e leve" },
    { code: "F3", label: "Lavoro, energia e potenza" },
    { code: "F4", label: "Termodinamica, fluidi ed elettricità" },
    { code: "F5", label: "Onde, oscillazioni, suono e ottica" },
    { code: "M1", label: "Equazioni e disequazioni" },
    { code: "M2", label: "Geometria piana" },
    { code: "M3", label: "Geometria solida e geometria analitica" },
    { code: "M4", label: "Percentuali, proporzioni, potenze e statistica" },
    { code: "M5", label: "Funzioni, esponenziali, logaritmi e trigonometria" },
  ],
};

// Semestre filtro: le unità didattiche del syllabus MUR 2026/2027, pubblicato il
// 19 giugno 2026. Sono sette per materia, non una tassonomia nostra: titoli e pesi
// vengono dai documenti ufficiali, che stanno in content/semestre-filtro/syllabus/.
// I CFU di ogni materia sommano a 6, ed è con quelli che si decide quante domande
// di ciascun argomento entrano in una prova da 31.
const SEMESTRE_FILTRO: Record<string, Topic[]> = {
  "Chimica e propedeutica biochimica": [
    { code: "SF-CHI-01", label: "Struttura dell'atomo, legami chimici, stati della materia e termodinamica", cfu: 1 },
    { code: "SF-CHI-02", label: "Miscele, soluzioni e proprietà colligative", cfu: 1 },
    { code: "SF-CHI-03", label: "Reazioni negli organismi viventi: cinetica ed equilibrio chimico", cfu: 0.5 },
    { code: "SF-CHI-04", label: "Acidi, basi, sali, pH e tamponi; ossidoriduzioni ed elettrochimica", cfu: 1 },
    { code: "SF-CHI-05", label: "Il carbonio: idrocarburi, alogenuri alchilici e composti aromatici", cfu: 0.5 },
    { code: "SF-CHI-06", label: "Gruppi funzionali e isomerie", cfu: 1 },
    { code: "SF-CHI-07", label: "Amminoacidi, proteine, carboidrati, lipidi e acidi nucleici", cfu: 1 },
  ],
  Fisica: [
    { code: "SF-FIS-01", label: "Introduzione ai metodi della fisica", cfu: 0.2 },
    { code: "SF-FIS-02", label: "Meccanica", cfu: 1.4 },
    { code: "SF-FIS-03", label: "Meccanica dei fluidi", cfu: 1.2 },
    { code: "SF-FIS-04", label: "Onde meccaniche", cfu: 0.4 },
    { code: "SF-FIS-05", label: "Termodinamica", cfu: 1 },
    { code: "SF-FIS-06", label: "Elettricità e magnetismo", cfu: 1.2 },
    { code: "SF-FIS-07", label: "Fisica delle radiazioni", cfu: 0.6 },
  ],
  Biologia: [
    { code: "SF-BIO-01", label: "Le basi dell'organizzazione biologica e molecolare della vita", cfu: 0.5 },
    { code: "SF-BIO-02", label: "Trasmissione e controllo dell'informazione genetica ed epigenetica", cfu: 0.5 },
    { code: "SF-BIO-03", label: "Il flusso dell'informazione", cfu: 1 },
    { code: "SF-BIO-04", label: "Trasmissione e controllo dei caratteri selvatici e mutati", cfu: 0.75 },
    { code: "SF-BIO-05", label: "Le strutture cellulari: biogenesi, morfologia e funzioni", cfu: 1.75 },
    { code: "SF-BIO-06", label: "La cellula e l'ambiente: segnalazione e trasduzione del segnale", cfu: 0.75 },
    { code: "SF-BIO-07", label: "Il controllo della proliferazione e della sopravvivenza cellulare", cfu: 0.75 },
  ],
};

export const TOPICS_BY_TRACK: Record<TrackId, Record<string, Topic[]>> = {
  PROFESSIONI_SANITARIE,
  SEMESTRE_FILTRO,
};

export function topicsOf(trackId: TrackId, subject: string): Topic[] {
  return TOPICS_BY_TRACK[trackId]?.[subject] ?? [];
}

const ALL_TOPICS = new Map<string, { topic: Topic; subject: string; trackId: TrackId }>();
for (const [trackId, bySubject] of Object.entries(TOPICS_BY_TRACK) as [TrackId, Record<string, Topic[]>][]) {
  for (const [subject, topics] of Object.entries(bySubject)) {
    for (const topic of topics) ALL_TOPICS.set(topic.code, { topic, subject, trackId });
  }
}

export function topicLabel(code: string): string | undefined {
  return ALL_TOPICS.get(code)?.topic.label;
}

export function topicSubject(code: string): string | undefined {
  return ALL_TOPICS.get(code)?.subject;
}

export function topicTrack(code: string): TrackId {
  return ALL_TOPICS.get(code)?.trackId ?? DEFAULT_TRACK;
}

export function isKnownTopic(code: string): boolean {
  return ALL_TOPICS.has(code);
}

// Quante domande contiene un'esercitazione mirata su un singolo argomento. Se
// l'argomento ne ha meno, l'esercitazione si accorcia invece di fallire.
export const TOPIC_PRACTICE_SIZE = 15;

// Sotto questa soglia un argomento non viene proposto: troppo poche domande per
// un'esercitazione sensata (e si ripeterebbero sempre le stesse).
export const MIN_TOPIC_QUESTIONS = 5;

/**
 * Come si spartiscono `totale` domande fra gli argomenti di una materia, in
 * proporzione al peso che hanno nel programma ufficiale.
 *
 * Serve perché una prova di Fisica da 31 domande non è un sorteggio uniforme: la
 * meccanica dei fluidi vale 1,2 CFU su 6, cioè un quinto dell'esame, e in una prova
 * vera ci sono circa sei domande di fluidi. Senza pesi uscirebbero quattro domande
 * di "introduzione ai metodi", che nel programma vale 0,2 CFU.
 *
 * I resti si assegnano col metodo del resto più alto, così la somma torna esatta.
 * Se la materia non ha pesi (è il caso di Professioni Sanitarie) torna una mappa
 * vuota e chi chiama pesca come prima.
 */
export function topicQuotas(trackId: TrackId, subject: string, totale: number): Map<string, number> {
  const pesati = topicsOf(trackId, subject).filter((t) => typeof t.cfu === "number" && t.cfu > 0);
  if (pesati.length === 0 || totale <= 0) return new Map();

  const sommaCfu = pesati.reduce((s, t) => s + (t.cfu as number), 0);
  const parti = pesati.map((t) => {
    const esatto = (totale * (t.cfu as number)) / sommaCfu;
    const intero = Math.floor(esatto);
    return { code: t.code, intero, resto: esatto - intero };
  });

  let avanzo = totale - parti.reduce((s, p) => s + p.intero, 0);
  for (const p of [...parti].sort((a, b) => b.resto - a.resto)) {
    if (avanzo <= 0) break;
    p.intero += 1;
    avanzo -= 1;
  }

  return new Map(parti.map((p) => [p.code, p.intero]));
}
