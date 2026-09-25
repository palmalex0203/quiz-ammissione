import { prisma } from "@/lib/prisma";
import type { TrackId } from "@/lib/tracks";

/*
 * Ripasso errori: le domande a cui lo studente ha risposto male e non ha ancora
 * rimesso a posto.
 *
 * Ogni test generato conserva una copia delle domande, quindi la stessa domanda
 * esiste in più esemplari con id diversi: si riconosce dal testo. Di ogni domanda
 * conta solo l'ultima risposta data — appena la indovina, esce dall'elenco.
 * Le domande lasciate in bianco non sono errori e restano fuori.
 */

// Quante domande al massimo entrano in un ripasso: abbastanza per una sessione
// breve, senza trasformarlo in una simulazione.
export const REVIEW_SIZE = 20;

// Una sola riga in risposta: il conteggio si calcola nel database.
export async function wrongAnswerCount(studentId: string, trackId: TrackId): Promise<number> {
  const rows = await prisma.$queryRaw<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM (
      SELECT DISTINCT ON (q.text) ar."isCorrect" AS corretta, ar."selectedOptionId" AS scelta
      FROM "AnswerRecord" ar
      JOIN "Attempt" a ON ar."attemptId" = a.id
      JOIN "Question" q ON ar."questionId" = q.id
      JOIN "Test" t ON q."testId" = t.id
      WHERE a."studentId" = ${studentId} AND a.status = 'SUBMITTED' AND t.track = ${trackId}
      ORDER BY q.text, a."submittedAt" DESC
    ) ultima
    WHERE corretta = false AND scelta IS NOT NULL
  `;
  return rows[0]?.n ?? 0;
}

// Gli id delle domande da ripassare, dall'errore più recente al più vecchio.
export async function wrongQuestionIds(
  studentId: string,
  trackId: TrackId,
  limit = REVIEW_SIZE
): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM (
      SELECT DISTINCT ON (q.text)
        q.id AS id, ar."isCorrect" AS corretta, ar."selectedOptionId" AS scelta, a."submittedAt" AS quando
      FROM "AnswerRecord" ar
      JOIN "Attempt" a ON ar."attemptId" = a.id
      JOIN "Question" q ON ar."questionId" = q.id
      JOIN "Test" t ON q."testId" = t.id
      WHERE a."studentId" = ${studentId} AND a.status = 'SUBMITTED' AND t.track = ${trackId}
      ORDER BY q.text, a."submittedAt" DESC
    ) ultima
    WHERE corretta = false AND scelta IS NOT NULL
    ORDER BY quando DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => r.id);
}
