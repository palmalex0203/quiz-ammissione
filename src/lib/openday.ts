/**
 * La simulazione gratuita dell'open day: una prova ufficiale intera.
 *
 * Non è un assaggio: sono le 93 domande di un appello vero del 2025/2026, le
 * tre materie in fila come all'esame, 45 minuti ciascuna. Comprese le 16
 * domande a completamento per prova, dove la risposta si scrive invece di
 * sceglierla — che sono metà dell'esame e la metà che sorprende chi non si è
 * preparato.
 *
 * Le domande si leggono dai file in content/ e non dal database. Due motivi:
 *
 *  - la pagina è pubblica e sponsorizzata, quindi il traffico arriva a ondate.
 *    Neon fattura il tempo acceso, non le query: un file letto una volta sola
 *    all'avvio costa zero, mentre qualche migliaio di visite che interrogano il
 *    database per leggere sempre le stesse domande costano sul serio;
 *  - le chiavi di queste domande sono state verificate il 2026-10-14 contro due
 *    correzioni commentate indipendenti. Sono le uniche di cui siamo sicuri.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isCompletionCorrect } from "@/lib/completion";

export type OpenDayOption = { id: string; text: string };

/** Una domanda così come arriva al browser: senza la risposta giusta. */
export type OpenDayQuestion = {
  id: string;
  subject: string;
  short: string;
  /** Quale delle tre prove: 0, 1, 2. Decide anche il cronometro. */
  sezione: number;
  completamento: boolean;
  text: string;
  /** Vuoto per le domande a completamento: lì la risposta si scrive. */
  options: OpenDayOption[];
};

type FileOption = { text: string; isCorrect: boolean };
type FileQuestion = { subject: string; type?: string; text: string; options: FileOption[] };

/** Gli appelli disponibili: se ne sorteggia uno a ogni simulazione. */
const APPELLI = ["appello1", "appello2"] as const;

/** Le tre prove nell'ordine dell'esame. */
const MATERIE = [
  { slug: "chimica", subject: "Chimica e propedeutica biochimica", short: "Chimica" },
  { slug: "fisica", subject: "Fisica", short: "Fisica" },
  { slug: "biologia", subject: "Biologia", short: "Biologia" },
] as const;

/** Minuti per ciascuna prova, come all'esame vero. */
export const MINUTI_PER_PROVA = 45;
export const DOMANDE_PER_PROVA = 31;
export const TOTALE = DOMANDE_PER_PROVA * MATERIE.length;

/** Punteggio dell'esame vero: +1, −0,1, 0 a chi lascia in bianco. */
export const PUNTI = { giusta: 1, sbagliata: -0.1, bianca: 0 };

type Voce = {
  domanda: OpenDayQuestion;
  /** Per le scelte multiple: l'id dell'opzione giusta. */
  corretta: string | null;
  /** Per i completamenti: tutte le forme accettate. */
  accettate: string[];
};

function caricaAppello(appello: string): Voce[] {
  const base = join(process.cwd(), "content", "semestre-filtro", "prove-ufficiali");
  const voci: Voce[] = [];

  MATERIE.forEach((materia, sezione) => {
    const file = join(base, `prova-2025-${appello}-${materia.slug}.json`);
    const domande: FileQuestion[] = JSON.parse(readFileSync(file, "utf-8"));

    domande.forEach((q, i) => {
      const id = `${appello}-${materia.slug}-${i}`;
      const completamento = q.type === "COMPLETAMENTO";

      voci.push({
        corretta: completamento ? null : `${id}-${q.options.findIndex((o) => o.isCorrect)}`,
        accettate: completamento ? q.options.filter((o) => o.isCorrect).map((o) => o.text) : [],
        domanda: {
          id,
          subject: materia.subject,
          short: materia.short,
          sezione,
          completamento,
          text: q.text,
          // Le alternative restano nell'ordine del fascicolo: lì l'ordine è del
          // Ministero e non si tocca, a differenza della banca dati nostra.
          options: completamento ? [] : q.options.map((o, j) => ({ id: `${id}-${j}`, text: o.text })),
        },
      });
    });
  });

  return voci;
}

// Letti una volta sola per processo: i file non cambiano mentre il server gira.
const caricati = new Map<string, Voce[]>();
function appello(nome: string): Voce[] {
  if (!caricati.has(nome)) caricati.set(nome, caricaAppello(nome));
  return caricati.get(nome)!;
}

export function appelloValido(nome: unknown): nome is (typeof APPELLI)[number] {
  return typeof nome === "string" && (APPELLI as readonly string[]).includes(nome);
}

/** Com'è etichettato un appello per lo studente. */
export function etichettaAppello(nome: string): string {
  return nome === "appello1" ? "1º appello, novembre 2025" : "2º appello, dicembre 2025";
}

export type Prova = {
  appello: string;
  etichetta: string;
  domande: OpenDayQuestion[];
  sezioni: { indice: number; subject: string; short: string; domande: number; minuti: number }[];
};

/** Sorteggia uno dei due appelli e restituisce la prova intera. */
export function pescaProva(): Prova {
  const nome = APPELLI[Math.floor(Math.random() * APPELLI.length)];
  return provaDi(nome);
}

export function provaDi(nome: string): Prova {
  const voci = appello(nome);
  const domande = voci.map((v) => v.domanda);

  return {
    appello: nome,
    etichetta: etichettaAppello(nome),
    domande,
    sezioni: MATERIE.map((m, i) => ({
      indice: i,
      subject: m.subject,
      short: m.short,
      domande: domande.filter((d) => d.sezione === i).length,
      minuti: MINUTI_PER_PROVA,
    })),
  };
}

export type RispostaData = {
  questionId: string;
  /** Scelta multipla: l'id dell'opzione. */
  optionId?: string | null;
  /** Completamento: quello che lo studente ha scritto. */
  testo?: string | null;
};

export type EsitoProva = {
  subject: string;
  short: string;
  domande: number;
  giuste: number;
  sbagliate: number;
  bianche: number;
  punti: number;
};

export type Esito = {
  appello: string;
  etichetta: string;
  giuste: number;
  sbagliate: number;
  bianche: number;
  punti: number;
  /** Una riga per prova: all'esame vero ogni materia fa voto a sé. */
  prove: EsitoProva[];
};

/**
 * Corregge sul server. Le risposte giuste non vengono mai mandate al browser:
 * la prova è gratis, non per questo si regala la chiave a chi apre gli
 * strumenti per sviluppatori.
 *
 * Si corregge quello che è arrivato, non quello che ci si aspettava: una prova
 * lasciata a metà produce comunque un esito, con tutto il resto in bianco.
 */
export function correggi(nomeAppello: string, risposte: RispostaData[]): Esito {
  const voci = appello(nomeAppello);
  const date = new Map(risposte.map((r) => [r.questionId, r]));

  const prove: EsitoProva[] = MATERIE.map((m) => ({
    subject: m.subject,
    short: m.short,
    domande: 0,
    giuste: 0,
    sbagliate: 0,
    bianche: 0,
    punti: 0,
  }));

  for (const voce of voci) {
    const prova = prove[voce.domanda.sezione];
    prova.domande += 1;

    const data = date.get(voce.domanda.id);
    let esito: "giusta" | "sbagliata" | "bianca";

    if (voce.domanda.completamento) {
      const testo = data?.testo?.trim() ?? "";
      esito = testo === "" ? "bianca" : isCompletionCorrect(testo, voce.accettate) ? "giusta" : "sbagliata";
    } else {
      const scelta = data?.optionId ?? null;
      esito = !scelta ? "bianca" : scelta === voce.corretta ? "giusta" : "sbagliata";
    }

    if (esito === "giusta") {
      prova.giuste += 1;
      prova.punti += PUNTI.giusta;
    } else if (esito === "sbagliata") {
      prova.sbagliate += 1;
      prova.punti += PUNTI.sbagliata;
    } else {
      prova.bianche += 1;
    }
  }

  for (const p of prove) p.punti = Math.round(p.punti * 100) / 100;

  return {
    appello: nomeAppello,
    etichetta: etichettaAppello(nomeAppello),
    giuste: prove.reduce((n, p) => n + p.giuste, 0),
    sbagliate: prove.reduce((n, p) => n + p.sbagliate, 0),
    bianche: prove.reduce((n, p) => n + p.bianche, 0),
    punti: Math.round(prove.reduce((n, p) => n + p.punti, 0) * 100) / 100,
    prove,
  };
}
