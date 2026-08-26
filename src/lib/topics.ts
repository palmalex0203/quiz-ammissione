// Macroargomenti di programma, ripresi dalle esercitazioni già create
// dall'insegnante: il codice (B1, C3, ...) è ciò che viene salvato su
// Question.topic, l'etichetta resta modificabile senza toccare il database.
export type Topic = { code: string; label: string };

export const TOPICS_BY_SUBJECT: Record<string, Topic[]> = {
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

const ALL_TOPICS = new Map<string, { topic: Topic; subject: string }>();
for (const [subject, topics] of Object.entries(TOPICS_BY_SUBJECT)) {
  for (const topic of topics) ALL_TOPICS.set(topic.code, { topic, subject });
}

export function topicLabel(code: string): string | undefined {
  return ALL_TOPICS.get(code)?.topic.label;
}

export function topicSubject(code: string): string | undefined {
  return ALL_TOPICS.get(code)?.subject;
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
