import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { TrackId } from "@/lib/tracks";

/*
 * Quante domande ha la banca dati di un percorso, divise per materia e per
 * argomento. Una sola query per pagina: le esercitazioni casuali e i riquadri di
 * "Esercitati" hanno bisogno degli stessi numeri.
 */
export type PoolCounts = {
  bySubject: Map<string, number>;
  byTopic: Map<string, number>;
  total: number;
};

export const POOL_TAG = "banca-domande";

// La banca dati cambia solo quando l'insegnante importa domande, mentre queste
// cifre servono a ogni pagina di ogni studente: si tengono da parte invece di
// ricontare ogni volta. La cache di Next è condivisa fra le richieste e sopravvive
// al riavvio della funzione, dove una variabile di modulo ripartirebbe vuota
// costringendo il database ad accendersi per ricontare.
const CINQUE_MINUTI = 5 * 60;

// Le Map non si possono conservare in cache: si tiene da parte il risultato della
// query, e le Map si ricostruiscono a ogni richiesta (costa niente).
const countRows = unstable_cache(
  async (trackId: TrackId) => {
    return prisma.$queryRaw<{ subject: string; topic: string | null; n: number }[]>`
      SELECT q.subject AS subject, q.topic AS topic, COUNT(*)::int AS n
      FROM "Question" q JOIN "Test" t ON q."testId" = t.id
      WHERE t.kind = 'POOL' AND t.track = ${trackId}
      GROUP BY q.subject, q.topic
    `;
  },
  ["conteggio-banca-domande"],
  { tags: [POOL_TAG], revalidate: CINQUE_MINUTI }
);

export async function poolCounts(trackId: TrackId): Promise<PoolCounts> {
  const rows = await countRows(trackId);

  const bySubject = new Map<string, number>();
  const byTopic = new Map<string, number>();
  let total = 0;
  for (const row of rows) {
    bySubject.set(row.subject, (bySubject.get(row.subject) ?? 0) + row.n);
    if (row.topic) byTopic.set(row.topic, (byTopic.get(row.topic) ?? 0) + row.n);
    total += row.n;
  }

  return { bySubject, byTopic, total };
}
