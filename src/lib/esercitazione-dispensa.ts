import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { TrackId } from "@/lib/tracks";

/*
 * L'esercitazione che appartiene a una singola dispensa.
 *
 * Le dispense del docente finiscono con una ventina di domande di
 * autovalutazione. Lasciarle nel testo vuol dire che lo studente legge la
 * domanda e, due righe sotto, vede la risposta: non si mette alla prova, si
 * convince di aver capito. Le stesse domande, somministrate una alla volta e
 * corrette alla fine, misurano davvero.
 *
 * Il legame fra dispensa ed esercitazione è il campo `topic` delle domande, che
 * porta il codice intero della dispensa ("SF-BIO-01-L01") invece del solo
 * argomento ("SF-BIO-01"). Non serve una colonna nuova, e non sporca i conteggi
 * della banca dati, che contano soltanto le domande del test POOL (vedi
 * src/lib/question-pool.ts).
 */

export const ESERCITAZIONI_TAG = "esercitazioni-dispensa";

const CINQUE_MINUTI = 5 * 60;

export type EsercitazioneDispensa = { id: string; titolo: string; domande: number };

export const esercitazioneDellaDispensa = unstable_cache(
  async (trackId: TrackId, codiceDispensa: string): Promise<EsercitazioneDispensa | null> => {
    const test = await prisma.test.findFirst({
      where: {
        track: trackId,
        kind: "ESERCITAZIONE",
        isPublished: true,
        questions: { some: { topic: codiceDispensa } },
      },
      select: { id: true, title: true, _count: { select: { questions: true } } },
      orderBy: { createdAt: "asc" },
    });

    return test ? { id: test.id, titolo: test.title, domande: test._count.questions } : null;
  },
  ["esercitazione-della-dispensa"],
  { tags: [ESERCITAZIONI_TAG], revalidate: CINQUE_MINUTI }
);
