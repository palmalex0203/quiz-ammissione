/**
 * La simulazione gratuita dell'open day.
 *
 * Le domande sono quelle vere dei due appelli 2025/2026 del semestre filtro, lette
 * dai file in content/ e non dal database. Due motivi, tutti e due pratici:
 *
 *  - la pagina è pubblica e sponsorizzata, quindi il traffico arriva a ondate.
 *    Neon fattura il tempo acceso, non le query: un file letto una volta sola
 *    all'avvio costa zero, mentre qualche migliaio di visite che interrogano il
 *    database per leggere sempre le stesse dodici domande costano sul serio.
 *  - le chiavi di queste domande sono state verificate il 2026-10-14 contro due
 *    correzioni commentate indipendenti. Sono le uniche di cui siamo sicuri.
 *
 * Si usano solo le domande a scelta multipla. Le altre sedici per prova sono a
 * completamento — si scrive la risposta in una griglia di caselle e un errore di
 * ortografia la annulla — e su un telefono, a chi arriva da un annuncio, sono
 * punitive: non è quello il primo assaggio che vogliamo dare.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type OpenDayOption = { id: string; text: string };

/** Una domanda così come arriva al browser: senza la risposta giusta. */
export type OpenDayQuestion = {
  id: string;
  subject: string;
  short: string;
  text: string;
  options: OpenDayOption[];
};

type FileOption = { text: string; isCorrect: boolean };
type FileQuestion = { subject: string; topic?: string | null; type?: string; text: string; options: FileOption[] };

const APPELLI = ["appello1", "appello2"] as const;
const MATERIE = [
  { slug: "chimica", subject: "Chimica e propedeutica biochimica", short: "Chimica" },
  { slug: "fisica", subject: "Fisica", short: "Fisica" },
  { slug: "biologia", subject: "Biologia", short: "Biologia" },
] as const;

/** Quante domande per materia nella simulazione breve. Quattro e quattro e quattro
 *  tiene la prova bilanciata come quella vera, dove le tre materie pesano uguale. */
export const PER_MATERIA = 4;
export const TOTALE = PER_MATERIA * MATERIE.length;

/** Minuti concessi. La prova vera dà 45 minuti per 31 domande: qui la stessa
 *  andatura su dodici farebbe 17,4 — arrotondati a 18. */
export const MINUTI = 18;

/** Punteggio della prova vera: +1 alla giusta, −0,1 alla sbagliata, 0 a chi lascia
 *  in bianco. Tenerlo identico è metà del senso di far provare la simulazione. */
export const PUNTI = { giusta: 1, sbagliata: -0.1, bianca: 0 };

type Banca = { domanda: OpenDayQuestion; corretta: string }[];

function caricaBanca(): Banca {
  const base = join(process.cwd(), "content", "semestre-filtro", "prove-ufficiali");
  const banca: Banca = [];

  for (const appello of APPELLI) {
    for (const materia of MATERIE) {
      const file = join(base, `prova-2025-${appello}-${materia.slug}.json`);
      const domande: FileQuestion[] = JSON.parse(readFileSync(file, "utf-8"));

      domande.forEach((q, i) => {
        if (q.type === "COMPLETAMENTO") return;
        const id = `${appello}-${materia.slug}-${i}`;
        const corretta = q.options.findIndex((o) => o.isCorrect);
        if (corretta === -1) return;

        banca.push({
          corretta: `${id}-${corretta}`,
          domanda: {
            id,
            subject: materia.subject,
            short: materia.short,
            text: q.text,
            options: q.options.map((o, j) => ({ id: `${id}-${j}`, text: o.text })),
          },
        });
      });
    }
  }
  return banca;
}

// Letta una volta sola per processo: i file non cambiano mentre il server gira.
let banca: Banca | null = null;
function getBanca(): Banca {
  if (!banca) banca = caricaBanca();
  return banca;
}

function mescola<T>(v: T[]): T[] {
  const a = [...v];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sorteggia la prova: quattro domande per materia, in ordine di materia come
 * all'esame. Le alternative restano nell'ordine del fascicolo — lì l'ordine è del
 * Ministero e non si tocca, a differenza della banca dati nostra.
 */
export function pescaProva(): OpenDayQuestion[] {
  const banca = getBanca();
  const prova: OpenDayQuestion[] = [];

  for (const materia of MATERIE) {
    const diMateria = banca.filter((b) => b.domanda.subject === materia.subject);
    prova.push(...mescola(diMateria).slice(0, PER_MATERIA).map((b) => b.domanda));
  }
  return prova;
}

export type RispostaData = { questionId: string; optionId: string | null };

export type EsitoMateria = {
  subject: string;
  short: string;
  domande: number;
  giuste: number;
  sbagliate: number;
  bianche: number;
};

export type Esito = {
  punti: number;
  massimo: number;
  giuste: number;
  sbagliate: number;
  bianche: number;
  perMateria: EsitoMateria[];
  dettaglio: { questionId: string; scelta: string | null; corretta: string; giusta: boolean }[];
};

/**
 * Corregge sul server. Le risposte giuste non vengono mai mandate al browser
 * prima della consegna: la prova è gratis, non per questo si regala la chiave a
 * chi apre gli strumenti per sviluppatori.
 */
export function correggi(risposte: RispostaData[]): Esito {
  const banca = getBanca();
  const perId = new Map(banca.map((b) => [b.domanda.id, b]));

  const esito: Esito = {
    punti: 0,
    massimo: 0,
    giuste: 0,
    sbagliate: 0,
    bianche: 0,
    perMateria: MATERIE.map((m) => ({
      subject: m.subject,
      short: m.short,
      domande: 0,
      giuste: 0,
      sbagliate: 0,
      bianche: 0,
    })),
    dettaglio: [],
  };

  for (const r of risposte) {
    const voce = perId.get(r.questionId);
    if (!voce) continue;

    const materia = esito.perMateria.find((m) => m.subject === voce.domanda.subject);
    esito.massimo += PUNTI.giusta;
    if (materia) materia.domande += 1;

    if (!r.optionId) {
      esito.bianche += 1;
      if (materia) materia.bianche += 1;
    } else if (r.optionId === voce.corretta) {
      esito.giuste += 1;
      esito.punti += PUNTI.giusta;
      if (materia) materia.giuste += 1;
    } else {
      esito.sbagliate += 1;
      esito.punti += PUNTI.sbagliata;
      if (materia) materia.sbagliate += 1;
    }

    esito.dettaglio.push({
      questionId: r.questionId,
      scelta: r.optionId,
      corretta: voce.corretta,
      giusta: r.optionId === voce.corretta,
    });
  }

  esito.punti = Math.round(esito.punti * 100) / 100;
  esito.perMateria = esito.perMateria.filter((m) => m.domande > 0);
  return esito;
}

/** Il testo della risposta giusta, per mostrarlo nella correzione. */
export function testoOpzione(optionId: string): string | null {
  for (const b of getBanca()) {
    const o = b.domanda.options.find((x) => x.id === optionId);
    if (o) return o.text;
  }
  return null;
}
