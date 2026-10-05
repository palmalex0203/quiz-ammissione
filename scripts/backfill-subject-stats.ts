/**
 * Ricalcola AttemptSubjectStat dalle risposte già registrate.
 *
 * Serve due volte: per i tentativi consegnati prima che il riepilogo per materia
 * esistesse, e per quelli consegnati prima che si contassero anche le risposte
 * date (colonna "answered", senza la quale non si distingue una risposta
 * sbagliata da una lasciata in bianco e il voto della prova non si ricalcola).
 *
 * Legge le risposte un tentativo alla volta, non tutte insieme, per non pesare
 * sul database in un colpo solo. È ripetibile: riscrive le righe con gli stessi
 * valori se non è cambiato niente.
 *
 * Uso:  npx tsx scripts/backfill-subject-stats.ts
 *       DOTENV_CONFIG_PATH=.env.production.local npx tsx scripts/backfill-subject-stats.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

type Riga = { subject: string; correct: number; answered: number; total: number };

async function main() {
  // Tutti i tentativi consegnati: quelli senza riepilogo lo ricevono adesso,
  // quelli che ce l'hanno si aggiornano con le risposte date.
  const attempts = await prisma.attempt.findMany({
    where: { status: "SUBMITTED" },
    select: { id: true },
  });
  console.log(`Tentativi da elaborare: ${attempts.length}`);
  if (attempts.length === 0) return;

  let done = 0;
  let scritte = 0;
  for (const attempt of attempts) {
    // Una risposta è "data" se lo studente ha scelto un'opzione o, nelle domande
    // a completamento, se ha scritto qualcosa che non sia solo spazi: la stessa
    // regola di rispostaData() in src/lib/completion.ts.
    const rows = await prisma.$queryRaw<Riga[]>`
      SELECT q.subject AS subject,
             SUM(CASE WHEN r."isCorrect" THEN 1 ELSE 0 END) AS correct,
             SUM(CASE
                   WHEN q.type = 'COMPLETAMENTO'
                     THEN CASE WHEN COALESCE(TRIM(r."typedAnswer"), '') <> '' THEN 1 ELSE 0 END
                   ELSE CASE WHEN r."selectedOptionId" IS NOT NULL THEN 1 ELSE 0 END
                 END) AS answered,
             COUNT(*) AS total
      FROM "AnswerRecord" r
      JOIN "Question" q ON r."questionId" = q.id
      WHERE r."attemptId" = ${attempt.id}
      GROUP BY q.subject
    `;
    for (const r of rows) {
      await prisma.attemptSubjectStat.upsert({
        where: { attemptId_subject: { attemptId: attempt.id, subject: r.subject } },
        update: { correct: Number(r.correct), answered: Number(r.answered), total: Number(r.total) },
        create: {
          attemptId: attempt.id,
          subject: r.subject,
          correct: Number(r.correct),
          answered: Number(r.answered),
          total: Number(r.total),
        },
      });
      scritte++;
    }
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${attempts.length}`);
  }
  console.log(`\nFatto: ${done} tentativi, ${scritte} righe per materia.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
