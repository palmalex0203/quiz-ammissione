import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { renderMarkdown } from "@/lib/markdown";
import type { TrackId } from "@/lib/tracks";

/*
 * Gli appunti pubblicati, tenuti da parte fra una richiesta e l'altra.
 *
 * Un appunto cambia solo quando l'insegnante lo modifica o lo pubblica, mentre
 * viene aperto da tutti gli studenti: rileggerlo dal database a ogni apertura
 * tiene sveglio il database per niente, e il piano lo fattura a tempo di
 * accensione. Qui la lettura e la conversione del markdown in HTML avvengono una
 * volta sola; le aperture successive non toccano il database, che così può
 * restare spento mentre gli studenti leggono.
 *
 * La cache viene svuotata a mano dalle azioni dell'insegnante (revalidateTag su
 * NOTES_TAG), quindi una modifica si vede subito: il tempo di scadenza è solo una
 * rete di sicurezza.
 *
 * Nota: si usa unstable_cache e non la direttiva "use cache" perché quest'ultima
 * richiede cacheComponents in next.config.ts, cioè un altro modello di rendering
 * per tutta l'app. Vedi node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md
 */
export const NOTES_TAG = "appunti";

const UN_ORA = 60 * 60;

export type PublishedNote = {
  topic: string;
  track: string;
  subject: string;
  title: string;
  /** Corpo già convertito in HTML: la conversione è la parte costosa. */
  html: string;
  /** ISO: la cache non conserva gli oggetti Date. */
  updatedAt: string;
};

/**
 * L'appunto pubblicato di un argomento, o null se non esiste o è ancora una
 * bozza. Le bozze non entrano in cache: l'insegnante le legge dalle sue pagine,
 * che interrogano il database direttamente.
 */
export const publishedNote = unstable_cache(
  async (topic: string): Promise<PublishedNote | null> => {
    const nota = await prisma.topicNote.findUnique({
      where: { topic },
      select: {
        topic: true,
        track: true,
        subject: true,
        title: true,
        body: true,
        isPublished: true,
        updatedAt: true,
      },
    });

    if (!nota || !nota.isPublished) return null;

    return {
      topic: nota.topic,
      track: nota.track,
      subject: nota.subject,
      title: nota.title,
      html: renderMarkdown(nota.body),
      updatedAt: nota.updatedAt.toISOString(),
    };
  },
  ["appunto-pubblicato"],
  { tags: [NOTES_TAG], revalidate: UN_ORA }
);

/**
 * I codici degli argomenti che hanno un appunto pubblicato in questo percorso:
 * servono a "Esercitati" per mostrare il collegamento "Ripassa".
 */
export const publishedNoteTopics = unstable_cache(
  async (trackId: TrackId): Promise<string[]> => {
    const righe = await prisma.topicNote.findMany({
      where: { track: trackId, isPublished: true },
      select: { topic: true },
    });
    return righe.map((r) => r.topic);
  },
  ["appunti-pubblicati-elenco"],
  { tags: [NOTES_TAG], revalidate: UN_ORA }
);
