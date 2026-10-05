import type { TrackId } from "@/lib/tracks";

/*
 * L'archivio delle prove d'esame già somministrate dal Ministero.
 *
 * I fascicoli originali stanno in content/semestre-filtro/prove-ufficiali/ (PDF e
 * testo estratto) e vengono serviti da public/prove-ufficiali/. Ogni prova esiste
 * anche come test svolgibile nel database, creato da scripts/import-prova-ufficiale.ts:
 * questo elenco è l'anagrafica (quale appello, quando, quale fascicolo) e il test nel
 * database è la prova vera e propria. Il collegamento fra i due è il titolo.
 *
 * I fascicoli NON contengono le risposte corrette: il Ministero non le pubblica. Le
 * chiavi sono state ricavate e vanno validate dal docente, perciò ogni prova lo dice
 * allo studente invece di far finta che siano ufficiali.
 */

export const KIND_UFFICIALE = "UFFICIALE";

export type ProvaUfficiale = {
  // Identificatore stabile: è anche il nome del file PDF sotto public/prove-ufficiali/.
  slug: string;
  // Quando il fascicolo pubblicato raccoglie più materie in un file solo, qui sta
  // il nome di quel file e le prove dello stesso appello lo condividono.
  fascicolo?: string;
  track: TrackId;
  subject: string;
  // Come si chiama il test corrispondente nel database.
  title: string;
  annoAccademico: string;
  appello: string;
  data: string;
  questions: number;
  minutes: number;
  // Avvertenze sulla trascrizione, mostrate insieme alla prova.
  nota?: string;
};

const APPELLO_2 = {
  track: "SEMESTRE_FILTRO" as TrackId,
  annoAccademico: "2025/2026",
  appello: "2º appello",
  data: "10 dicembre 2025",
  questions: 31,
  minutes: 45,
};

// Del primo appello circola un fascicolo unico con le tre prove di seguito, non
// uno per materia: tutte e tre puntano allo stesso PDF.
const APPELLO_1 = {
  track: "SEMESTRE_FILTRO" as TrackId,
  annoAccademico: "2025/2026",
  appello: "1º appello",
  data: "20 novembre 2025",
  questions: 31,
  minutes: 45,
  fascicolo: "2025-appello1",
};

export const PROVE_UFFICIALI: ProvaUfficiale[] = [
  {
    ...APPELLO_2,
    slug: "2025-appello2-biologia",
    subject: "Biologia",
    title: "Biologia — 2º appello 2025/2026",
  },
  {
    ...APPELLO_2,
    slug: "2025-appello2-chimica",
    subject: "Chimica e propedeutica biochimica",
    title: "Chimica e propedeutica biochimica — 2º appello 2025/2026",
  },
  {
    ...APPELLO_2,
    slug: "2025-appello2-fisica",
    subject: "Fisica",
    title: "Fisica — 2º appello 2025/2026",
    nota:
      "Nel fascicolo originale la domanda 10 presenta due opzioni identiche (B e D): qui compare una sola volta, " +
      "quindi quella domanda ha quattro alternative invece di cinque. Nella domanda 28 l'unità di misura della " +
      "densità, stampata come kg/cm³, è stata corretta in kg/m³.",
  },
  {
    ...APPELLO_1,
    slug: "2025-appello1-biologia",
    subject: "Biologia",
    title: "Biologia — 1º appello 2025/2026",
    nota: "Il fascicolo PDF raccoglie le tre prove del primo appello: Biologia, Chimica e Fisica di seguito.",
  },
  {
    ...APPELLO_1,
    slug: "2025-appello1-chimica",
    subject: "Chimica e propedeutica biochimica",
    title: "Chimica e propedeutica biochimica — 1º appello 2025/2026",
    nota: "Il fascicolo PDF raccoglie le tre prove del primo appello: Biologia, Chimica e Fisica di seguito.",
  },
  {
    ...APPELLO_1,
    slug: "2025-appello1-fisica",
    subject: "Fisica",
    title: "Fisica — 1º appello 2025/2026",
    nota:
      "Il fascicolo PDF raccoglie le tre prove del primo appello. Nelle domande 5 e 11 un'alternativa, " +
      "al posto del testo, riporta la dicitura «quesito senza soluzione univoca o corretta»: è così " +
      "nell'originale ed è riprodotta tale e quale, ma le due domande restano risolvibili.",
  },
];

/** Le prove di un percorso, dalla più recente alla più vecchia. */
export function proveUfficialiOf(trackId: TrackId): ProvaUfficiale[] {
  return PROVE_UFFICIALI.filter((p) => p.track === trackId);
}

/** L'etichetta con cui si raggruppano le prove dello stesso appello. */
export function etichettaAppello(prova: ProvaUfficiale): string {
  return `${prova.appello} ${prova.annoAccademico} · ${prova.data}`;
}

/** Dove sta il fascicolo originale, servito come file statico. */
export function pdfUrl(prova: ProvaUfficiale): string {
  return `/prove-ufficiali/${prova.fascicolo ?? prova.slug}.pdf`;
}
