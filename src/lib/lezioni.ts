import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { TrackId } from "@/lib/tracks";

/*
 * Le lezioni registrate.
 *
 * Il filmato sta su YouTube o Vimeo e da noi sta la scheda: un'ora di lezione
 * sono centinaia di megabyte, e servirla a cento studenti si paga a peso. Loro
 * hanno banda e lettore, noi abbiamo l'organizzazione — e soprattutto il legame
 * con l'argomento del programma.
 *
 * Come gli appunti, le lezioni cambiano di rado e vengono aperte da tutti: si
 * leggono dalla cache, che si svuota quando l'insegnante pubblica o modifica.
 * Vedi src/lib/notes.ts per la stessa ragione spiegata per esteso.
 */
export const LEZIONI_TAG = "lezioni";

const UN_ORA = 60 * 60;

export const FORNITORI = ["youtube", "vimeo"] as const;
export type Fornitore = (typeof FORNITORI)[number];

export function isFornitore(v: unknown): v is Fornitore {
  return typeof v === "string" && (FORNITORI as readonly string[]).includes(v);
}

/**
 * L'indirizzo del lettore da mettere nell'iframe.
 *
 * Si costruisce qui da fornitore e identificativo, invece di salvare
 * l'indirizzo intero nel database: così in pagina non può finire niente che non
 * sia uno dei due fornitori previsti, nemmeno per un errore di battitura o per
 * un copia e incolla sbagliato.
 *
 * Di YouTube si usa il dominio senza cookie: non scrive niente sul browser
 * finché il filmato non parte, che su un sito con studenti minorenni è la scelta
 * che evita una riga in più nell'informativa.
 */
export function urlLettore(fornitore: string, videoId: string): string | null {
  const id = videoId.trim();
  if (!/^[A-Za-z0-9_-]{5,40}$/.test(id)) return null;

  if (fornitore === "youtube") return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  if (fornitore === "vimeo") return `https://player.vimeo.com/video/${id}`;
  return null;
}

/**
 * Ricava fornitore e identificativo da un indirizzo incollato così com'è.
 * Serve allo script di caricamento: a chi inserisce le lezioni si chiede di
 * incollare il link del video, non di sapere cos'è un "video id".
 */
export function leggiVideo(url: string): { fornitore: Fornitore; videoId: string } | null {
  const t = url.trim();

  const youtube =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{5,40})/.exec(t);
  if (youtube) return { fornitore: "youtube", videoId: youtube[1] };

  const vimeo = /vimeo\.com\/(?:video\/)?(\d{5,20})/.exec(t);
  if (vimeo) return { fornitore: "vimeo", videoId: vimeo[1] };

  return null;
}

/**
 * I luoghi da cui accettiamo l'indirizzo di una diretta.
 *
 * Un elenco chiuso e non un controllo generico su "è un https": qui dentro
 * finisce un indirizzo scritto a mano, e la pagina lo trasforma in un pulsante
 * che gli studenti premono fidandosi di noi. Un refuso, o un copia e incolla
 * dal posto sbagliato, non deve poter mandare una classe su un sito qualunque.
 */
const SEDI_DIRETTA = [
  "teams.microsoft.com",
  "teams.live.com",
  "teams.microsoft.us",
  "meet.google.com",
  "zoom.us",
];

/** L'indirizzo della diretta, se è uno di quelli che accettiamo. Altrimenti null. */
export function urlDirettaValido(url: string | null | undefined): string | null {
  if (!url) return null;
  let indirizzo: URL;
  try {
    indirizzo = new URL(url.trim());
  } catch {
    return null;
  }
  if (indirizzo.protocol !== "https:") return null;

  const host = indirizzo.hostname.toLowerCase();
  // Il sottodominio va bene (eu01.zoom.us), il suffisso appiccicato no
  // (teams.microsoft.com.truffa.example): da qui il punto davanti.
  const ammesso = SEDI_DIRETTA.some((sede) => host === sede || host.endsWith(`.${sede}`));
  return ammesso ? indirizzo.toString() : null;
}

export type LezionePubblicata = {
  id: string;
  titolo: string;
  descrizione: string | null;
  subject: string | null;
  topic: string | null;
  /** ISO: la cache non conserva gli oggetti Date. */
  data: string;
  durataMinuti: number | null;
  /** Registrata: il filmato. Nulli se la lezione è in diretta. */
  fornitore: string | null;
  videoId: string | null;
  /** In diretta: l'indirizzo della riunione. Nullo se la lezione è registrata. */
  urlDiretta: string | null;
  /** In diretta e finita: il link alla registrazione, quando è pronta. */
  urlRegistrazione: string | null;
};

/** Le lezioni pubblicate di un percorso, dalla più recente. */
export const lezioniPubblicate = unstable_cache(
  async (trackId: TrackId): Promise<LezionePubblicata[]> => {
    const righe = await prisma.lezione.findMany({
      where: { track: trackId, isPublished: true },
      orderBy: { data: "desc" },
      select: {
        id: true,
        titolo: true,
        descrizione: true,
        subject: true,
        topic: true,
        data: true,
        durataMinuti: true,
        fornitore: true,
        videoId: true,
        urlDiretta: true,
        urlRegistrazione: true,
      },
    });

    return righe.map((r) => ({ ...r, data: r.data.toISOString() }));
  },
  ["lezioni-pubblicate"],
  { tags: [LEZIONI_TAG], revalidate: UN_ORA }
);

/**
 * Le lezioni pubblicate su un argomento. È il collegamento che rende la sezione
 * diversa da una playlist: dall'appunto si arriva alla lezione che lo spiega.
 */
export const lezioniDiArgomento = unstable_cache(
  async (trackId: TrackId, topic: string): Promise<LezionePubblicata[]> => {
    const righe = await prisma.lezione.findMany({
      where: { track: trackId, topic, isPublished: true },
      orderBy: { data: "desc" },
      select: {
        id: true,
        titolo: true,
        descrizione: true,
        subject: true,
        topic: true,
        data: true,
        durataMinuti: true,
        fornitore: true,
        videoId: true,
        urlDiretta: true,
        urlRegistrazione: true,
      },
    });

    return righe.map((r) => ({ ...r, data: r.data.toISOString() }));
  },
  ["lezioni-di-argomento"],
  { tags: [LEZIONI_TAG], revalidate: UN_ORA }
);

/** Quanto dura, scritto come lo direbbe una persona: "1 h 35 min". */
export function durata(minuti: number | null): string | null {
  if (!minuti || minuti <= 0) return null;
  const h = Math.floor(minuti / 60);
  const m = minuti % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

/** Senza durata indicata, una lezione si considera di due ore. */
const DURATA_PREDEFINITA = 120;

/** Quando finisce una lezione: inizio più durata. */
export function fineLezione(l: { data: string | Date; durataMinuti: number | null }): Date {
  const inizio = new Date(l.data).getTime();
  const minuti = l.durataMinuti && l.durataMinuti > 0 ? l.durataMinuti : DURATA_PREDEFINITA;
  return new Date(inizio + minuti * 60_000);
}

/** Il fuso delle lezioni: le date si leggono e si scrivono all'ora italiana. */
export const FUSO = "Europe/Rome";

/** Di quanti minuti Roma è avanti rispetto a UTC in quell'istante (60 o 120). */
function scartoRoma(istante: Date): number {
  const parti = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: FUSO,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(istante)
      .map((p) => [p.type, p.value])
  );
  const comeUtc = Date.UTC(+parti.year, +parti.month - 1, +parti.day, +parti.hour, +parti.minute);
  return Math.round((comeUtc - istante.getTime()) / 60_000);
}

/**
 * Data e ora scritte nel modulo ("2026-11-05T16:00") lette come ora italiana.
 *
 * `new Date("2026-11-05T16:00")` usa il fuso del server, che su Vercel è UTC:
 * la lezione delle 16 finiva salvata alle 17 italiane. Qui il fuso è esplicito.
 */
export function oraItaliana(campo: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(campo);
  if (!m) return null;
  const comeUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const prima = new Date(comeUtc - scartoRoma(new Date(comeUtc)) * 60_000);
  // Vicino al cambio dell'ora lo scarto giusto è quello dell'istante trovato.
  return new Date(comeUtc - scartoRoma(prima) * 60_000);
}

/** Se la lezione è già finita adesso. */
export function lezioneFinita(l: { data: string | Date; durataMinuti: number | null }): boolean {
  return fineLezione(l).getTime() <= Date.now();
}

/**
 * La data di una lezione come la legge uno studente, all'ora italiana. Per una
 * diretta anche l'orario: a quella si partecipa a un'ora precisa.
 */
export function quandoLezione(data: string | Date, conOra: boolean): string {
  const d = new Date(data);
  const giorno = d.toLocaleDateString("it-IT", { timeZone: FUSO, day: "numeric", month: "long", year: "numeric" });
  if (!conOra) return giorno;
  const ora = d.toLocaleTimeString("it-IT", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" });
  return `${giorno}, ore ${ora}`;
}
