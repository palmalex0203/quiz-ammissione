import { DEFAULT_TRACK, type TrackId } from "@/lib/tracks";

// Macroargomenti di programma. Il codice (B3, C7, SF-BIO-01, ...) è ciò che viene
// salvato su Question.topic, l'etichetta resta modificabile senza toccare il
// database. I codici sono unici fra tutti i percorsi, così una domanda porta con sé
// anche il percorso a cui appartiene.
export type Topic = { code: string; label: string };

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

// Semestre filtro: aree del syllabus MUR delle tre prove nazionali. Sono i titoli
// delle macroaree, non l'elenco puntuale del programma: vanno riviste sul syllabus
// ufficiale dell'anno prima di classificare le domande.
const SEMESTRE_FILTRO: Record<string, Topic[]> = {
  "Chimica e propedeutica biochimica": [
    { code: "SF-CHI-01", label: "Struttura della materia e proprietà periodiche" },
    { code: "SF-CHI-02", label: "Legami chimici e forze intermolecolari" },
    { code: "SF-CHI-03", label: "Reazioni chimiche e calcoli stechiometrici" },
    { code: "SF-CHI-04", label: "Soluzioni e proprietà colligative" },
    { code: "SF-CHI-05", label: "Termodinamica, cinetica ed equilibrio chimico" },
    { code: "SF-CHI-06", label: "Acidi, basi, pH e sistemi tampone" },
    { code: "SF-CHI-07", label: "Ossidoriduzioni ed elettrochimica" },
    { code: "SF-CHI-08", label: "Il carbonio: idrocarburi e gruppi funzionali" },
    { code: "SF-CHI-09", label: "Biomolecole e reazioni negli organismi viventi" },
  ],
  Fisica: [
    { code: "SF-FIS-01", label: "Grandezze fisiche, unità di misura e misure" },
    { code: "SF-FIS-02", label: "Cinematica" },
    { code: "SF-FIS-03", label: "Dinamica e statica" },
    { code: "SF-FIS-04", label: "Lavoro, energia e quantità di moto" },
    { code: "SF-FIS-05", label: "Fluidi" },
    { code: "SF-FIS-06", label: "Termodinamica" },
    { code: "SF-FIS-07", label: "Onde, suono e ottica" },
    { code: "SF-FIS-08", label: "Elettricità e magnetismo" },
    { code: "SF-FIS-09", label: "Radiazioni e applicazioni biomediche" },
  ],
  Biologia: [
    { code: "SF-BIO-01", label: "Le basi dell'organizzazione biologica e molecolare della vita" },
    { code: "SF-BIO-02", label: "La cellula: membrane, organuli e trasporti" },
    { code: "SF-BIO-03", label: "Bioenergetica e metabolismo cellulare" },
    { code: "SF-BIO-04", label: "Il flusso dell'informazione: DNA, RNA e sintesi proteica" },
    { code: "SF-BIO-05", label: "Divisione cellulare, riproduzione e sviluppo" },
    { code: "SF-BIO-06", label: "Trasmissione e controllo dei caratteri: genetica ed epigenetica" },
    { code: "SF-BIO-07", label: "Dai tessuti all'organismo: omeostasi e regolazione" },
    { code: "SF-BIO-08", label: "Microrganismi, difese dell'organismo e ambiente" },
    { code: "SF-BIO-09", label: "Evoluzione e biodiversità" },
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
