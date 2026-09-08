/**
 * Popola AttemptSubjectStat per i tentativi già consegnati prima che il calcolo
 * fosse introdotto alla consegna.
 *
 * Legge le risposte un tentativo alla volta (non tutte insieme) per non superare
 * i limiti di parametri di SQLite e per non pesare in un colpo solo sul database.
 *
 * Uso:  npx tsx scripts/backfill-subject-stats.ts
 *       DOTENV_CONFIG_PATH=.env.production.local npx tsx scripts/backfill-subject-stats.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const attempts = await prisma.attempt.findMany({
    where: { status: "SUBMITTED", subjectStats: { none: {} } },
    select: { id: true },
  });
  console.log(`Tentativi da elaborare: ${attempts.length}`);
  if (attempts.length === 0) return;

  let done = 0;
  for (const attempt of attempts) {
    const rows = await prisma.$queryRaw<{ subject: string; correct: number; total: number }[]>`
      SELECT q.subject as subject,
             SUM(CASE WHEN r."isCorrect" THEN 1 ELSE 0 END) as correct,
             COUNT(*) as total
      FROM "AnswerRecord" r
      JOIN "Question" q ON r."questionId" = q.id
      WHERE r."attemptId" = ${attempt.id}
      GROUP BY q.subject
    `;
    if (rows.length > 0) {
      await prisma.attemptSubjectStat.createMany({
        data: rows.map((r) => ({
          attemptId: attempt.id,
          subject: r.subject,
          correct: Number(r.correct),
          total: Number(r.total),
        })),
      });
    }
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${attempts.length}`);
  }
  console.log(`\nFatto: ${done} tentativi elaborati.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
