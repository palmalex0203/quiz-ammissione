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

// La banca dati cambia solo quando l'insegnante importa domande, mentre queste
// cifre servono a ogni pagina di ogni studente: si tengono da parte per qualche
// minuto invece di ricontare ogni volta.
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<TrackId, { at: number; counts: PoolCounts }>();

export async function poolCounts(trackId: TrackId): Promise<PoolCounts> {
  const cached = cache.get(trackId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.counts;

  const counts = await countPool(trackId);
  cache.set(trackId, { at: Date.now(), counts });
  return counts;
}

async function countPool(trackId: TrackId): Promise<PoolCounts> {
  const rows = await prisma.$queryRaw<{ subject: string; topic: string | null; n: number }[]>`
    SELECT q.subject AS subject, q.topic AS topic, COUNT(*)::int AS n
    FROM "Question" q JOIN "Test" t ON q."testId" = t.id
    WHERE t.kind = 'POOL' AND t.track = ${trackId}
    GROUP BY q.subject, q.topic
  `;

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
