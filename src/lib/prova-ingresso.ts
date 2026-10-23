/**
 * Il test di valutazione iniziale: 45 domande, 15 per materia, da fare il primo
 * giorno di corso.
 *
 * Misura i prerequisiti, non il programma: il syllabus MUR dà per acquisite le
 * conoscenze di scuola superiore, e sono quelle che qui si verificano. Serve a
 * sapere da dove parte la classe — un test sul programma darebbe zero a tutti e
 * non direbbe niente.
 *
 * Le domande stanno in content/ e non nel database, come quelle dell'open day e
 * per gli stessi due motivi: la pagina è pubblica (chi la fa non ha un account,
 * è il primo giorno) e un file letto una volta per processo non accende Neon,
 * che fattura il tempo acceso e non le query.
 *
 * Le risposte giuste non escono mai da qui: al browser arriva il testo delle
 * domande e delle alternative, la correzione si fa sul server.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { topicLabel } from "@/lib/topics";

/** Una domanda così come arriva al browser: senza la risposta giusta. */
export type DomandaIngresso = {
  id: string;
  /** Quale delle tre parti: 0 chimica, 1 fisica, 2 biologia. */
  sezione: number;
  /** Il numero stampato sul fascicolo: C1, F7, B15. */
  numero: string;
  text: string;
  options: { id: string; text: string }[];
};

type FileOption = { text: string; isCorrect: boolean };
type FileQuestion = { subject: string; topic: string; text: string; options: FileOption[] };

const MATERIE = [
  { subject: "Chimica e propedeutica biochimica", short: "Chimica", sigla: "C" },
  { subject: "Fisica", short: "Fisica", sigla: "F" },
  { subject: "Biologia", short: "Biologia", sigla: "B" },
] as const;

/** Un'ora in tutto, divisa equamente: come scritto sul fascicolo stampato. */
export const MINUTI_PER_MATERIA = 20;
export const DOMANDE_PER_MATERIA = 15;
export const TOTALE = DOMANDE_PER_MATERIA * MATERIE.length;

/** Lo stesso punteggio dell'esame vero, così il formato si impara dal primo giorno. */
export const PUNTI = { giusta: 1, sbagliata: -0.1, bianca: 0 };

type Voce = { domanda: DomandaIngresso; subject: string; topic: string; corretta: string };

function carica(): Voce[] {
  const file = join(process.cwd(), "content", "semestre-filtro", "test-ingresso", "valutazione-iniziale.json");
  const domande: FileQuestion[] = JSON.parse(readFileSync(file, "utf-8"));
  const contatore = new Map<string, number>();

  return domande.map((q, i) => {
    const sezione = MATERIE.findIndex((m) => m.subject === q.subject);
    if (sezione < 0) throw new Error(`Materia sconosciuta nel test d'ingresso: ${q.subject}`);

    const sigla = MATERIE[sezione].sigla;
    const n = (contatore.get(sigla) ?? 0) + 1;
    contatore.set(sigla, n);

    const id = `d${i}`;
    const giusta = q.options.findIndex((o) => o.isCorrect);
    if (giusta < 0) throw new Error(`Domanda senza risposta corretta: ${q.text.slice(0, 50)}`);

    return {
      subject: q.subject,
      topic: q.topic,
      corretta: `${id}-${giusta}`,
      domanda: {
        id,
        sezione,
        numero: `${sigla}${n}`,
        text: q.text,
        // L'ordine è quello del file, già mescolato una volta per tutte: così il
        // fascicolo stampato e quello sullo schermo hanno le stesse lettere.
        options: q.options.map((o, j) => ({ id: `${id}-${j}`, text: o.text })),
      },
    };
  });
}

// Letto una volta per processo: il file non cambia mentre il server gira.
let memoria: Voce[] | null = null;
function voci(): Voce[] {
  if (!memoria) memoria = carica();
  return memoria;
}

export type Sezione = { indice: number; subject: string; short: string; domande: number; minuti: number };
export type Prova = { domande: DomandaIngresso[]; sezioni: Sezione[] };

/** La prova come la riceve il browser. */
export function provaIngresso(): Prova {
  const domande = voci().map((v) => v.domanda);
  return {
    domande,
    sezioni: MATERIE.map((m, i) => ({
      indice: i,
      subject: m.subject,
      short: m.short,
      domande: domande.filter((d) => d.sezione === i).length,
      minuti: MINUTI_PER_MATERIA,
    })),
  };
}

export type RispostaData = { questionId: string; optionId?: string | null };

export type EsitoMateria = {
  subject: string;
  short: string;
  domande: number;
  giuste: number;
  sbagliate: number;
  bianche: number;
  punti: number;
};

/** Come è andata un'unità del syllabus: è il dato che dice da dove ripartire. */
export type EsitoArgomento = { topic: string; etichetta: string; domande: number; giuste: number };

export type Esito = {
  punti: number;
  giuste: number;
  sbagliate: number;
  bianche: number;
  materie: EsitoMateria[];
  argomenti: EsitoArgomento[];
};

/**
 * Corregge quello che è arrivato, non quello che ci si aspettava: una prova
 * lasciata a metà produce comunque un esito, col resto in bianco.
 */
export function correggi(risposte: RispostaData[]): Esito {
  const date = new Map(risposte.map((r) => [r.questionId, r]));

  const materie: EsitoMateria[] = MATERIE.map((m) => ({
    subject: m.subject,
    short: m.short,
    domande: 0,
    giuste: 0,
    sbagliate: 0,
    bianche: 0,
    punti: 0,
  }));
  const perArgomento = new Map<string, EsitoArgomento>();

  for (const voce of voci()) {
    const materia = materie[voce.domanda.sezione];
    materia.domande += 1;

    const arg = perArgomento.get(voce.topic) ?? {
      topic: voce.topic,
      etichetta: topicLabel(voce.topic) ?? voce.topic,
      domande: 0,
      giuste: 0,
    };
    arg.domande += 1;

    const scelta = date.get(voce.domanda.id)?.optionId ?? null;
    if (!scelta) {
      materia.bianche += 1;
    } else if (scelta === voce.corretta) {
      materia.giuste += 1;
      materia.punti += PUNTI.giusta;
      arg.giuste += 1;
    } else {
      materia.sbagliate += 1;
      materia.punti += PUNTI.sbagliata;
    }

    perArgomento.set(voce.topic, arg);
  }

  for (const m of materie) m.punti = Math.round(m.punti * 100) / 100;

  return {
    punti: Math.round(materie.reduce((n, m) => n + m.punti, 0) * 100) / 100,
    giuste: materie.reduce((n, m) => n + m.giuste, 0),
    sbagliate: materie.reduce((n, m) => n + m.sbagliate, 0),
    bianche: materie.reduce((n, m) => n + m.bianche, 0),
    materie,
    argomenti: [...perArgomento.values()].sort((a, b) => a.topic.localeCompare(b.topic)),
  };
}

/** Le soglie scritte sul fascicolo, per dare una lettura al punteggio di materia. */
export function fascia(giuste: number): { testo: string; tono: "verde" | "ambra" | "rosso" } {
  if (giuste >= 12) return { testo: "prerequisiti solidi", tono: "verde" };
  if (giuste >= 8) return { testo: "lacune circoscritte", tono: "ambra" };
  return { testo: "basi da riprendere", tono: "rosso" };
}
