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

export type LezionePubblicata = {
  id: string;
  titolo: string;
  descrizione: string | null;
  subject: string | null;
  topic: string | null;
  /** ISO: la cache non conserva gli oggetti Date. */
  data: string;
  durataMinuti: number | null;
  fornitore: string;
  videoId: string;
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
