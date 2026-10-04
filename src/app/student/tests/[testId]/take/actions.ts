"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { gradeAttempt } from "@/lib/grading";
import { trackOf } from "@/lib/tracks";
import { testQuestions } from "@/lib/test-questions";
import { sezioneAperta, sezioniDi } from "@/lib/test-sections";
import { COMPLETION_MAX_LENGTH } from "@/lib/completion";

async function getOwnedInProgressAttempt(attemptId: string, studentId: string) {
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.studentId !== studentId || attempt.status !== "IN_PROGRESS") {
    throw new Error("Tentativo non valido.");
  }
  return attempt;
}

/**
 * Le domande su cui il tentativo può ancora scrivere: quelle della sezione aperta.
 *
 * Restituisce null quando il test non è diviso in sezioni, cioè nella grande
 * maggioranza dei casi: lì non c'è niente da limitare e si evita il lavoro.
 */
async function domandeScrivibili(attempt: {
  testId: string;
  sezione: number;
}): Promise<Set<string> | null> {
  const [test, questions] = await Promise.all([
    prisma.test.findUnique({ where: { id: attempt.testId }, select: { track: true, timeLimitMinutes: true } }),
    testQuestions(attempt.testId),
  ]);
  const sezioni = sezioniDi(trackOf(test?.track), questions, test?.timeLimitMinutes ?? null);
  if (sezioni.length <= 1) return null;
  return new Set(sezioneAperta(sezioni, attempt.sezione)?.domande ?? []);
}

/**
 * Una risposta cambiata. Nelle domande a scelta multipla porta l'opzione scelta,
 * in quelle a completamento il testo scritto; con tutti e due a null la risposta
 * è stata tolta.
 */
export type AnswerChange = {
  questionId: string;
  selectedOptionId: string | null;
  typedAnswer: string | null;
};

/**
 * Salva un gruppo di risposte in un colpo solo.
 *
 * Prima ogni tocco era una chiamata al server a sé: una simulazione da 60 domande
 * ne faceva una sessantina, e con trenta studenti diventano ~1.800 risvegli del
 * database, che è quello che il piano fattura. Il browser adesso accumula le
 * risposte per qualche secondo e le manda insieme; qui diventano due istruzioni
 * SQL al massimo, dentro una transazione.
 *
 * L'ordine conta: prima si cancellano le risposte tolte, poi si scrivono quelle
 * date, altrimenti una domanda prima tolta e poi rifatta nello stesso gruppo
 * verrebbe cancellata dopo essere stata scritta.
 */
export async function saveAnswers(attemptId: string, changes: AnswerChange[]): Promise<void> {
  if (changes.length === 0) return;

  const session = await requireStudent();
  const attempt = await getOwnedInProgressAttempt(attemptId, session.user.id);

  // Una materia consegnata non si tocca più. Le risposte che arrivano in ritardo
  // per una sezione chiusa — una ritrasmissione della coda, una scheda rimasta
  // aperta — si lasciano cadere in silenzio invece di far fallire il salvataggio
  // delle altre: per il browser sarebbe un errore da ritentare all'infinito.
  const scrivibili = await domandeScrivibili(attempt);
  if (scrivibili) {
    changes = changes.filter((c) => scrivibili.has(c.questionId));
    if (changes.length === 0) return;
  }

  const vuota = (c: AnswerChange) =>
    c.selectedOptionId == null && (c.typedAnswer == null || c.typedAnswer.trim() === "");

  const tolte = changes.filter(vuota).map((c) => c.questionId);
  const date = changes.filter((c) => !vuota(c));

  const istruzioni = [];

  if (tolte.length > 0) {
    istruzioni.push(
      prisma.answerRecord.deleteMany({ where: { attemptId: attempt.id, questionId: { in: tolte } } })
    );
  }

  if (date.length > 0) {
    // Una sola INSERT per tutte le risposte del gruppo: unnest trasforma gli
    // elenchi in righe, e ON CONFLICT aggiorna quelle già presenti.
    const ids = date.map(() => crypto.randomUUID());
    const domande = date.map((c) => c.questionId);
    const opzioni = date.map((c) => c.selectedOptionId);
    const scritte = date.map((c) => (c.typedAnswer == null ? null : c.typedAnswer.slice(0, COMPLETION_MAX_LENGTH)));
    istruzioni.push(
      prisma.$executeRaw`
        INSERT INTO "AnswerRecord" ("id", "attemptId", "questionId", "selectedOptionId", "typedAnswer")
        SELECT nuova.id, ${attempt.id}, nuova."questionId", nuova."selectedOptionId", nuova."typedAnswer"
        FROM unnest(${ids}::text[], ${domande}::text[], ${opzioni}::text[], ${scritte}::text[])
          AS nuova(id, "questionId", "selectedOptionId", "typedAnswer")
        ON CONFLICT ("attemptId", "questionId")
        DO UPDATE SET "selectedOptionId" = EXCLUDED."selectedOptionId",
                      "typedAnswer" = EXCLUDED."typedAnswer"
      `
    );
  }

  await prisma.$transaction(istruzioni);
}

export async function submitAttempt(attemptId: string) {
  const session = await requireStudent();
  const attempt = await getOwnedInProgressAttempt(attemptId, session.user.id);
  await consegnaTentativo(attempt);
  redirect(`/student/tests/${attempt.testId}/result/${attempt.id}`);
}

/**
 * Chiude una sezione della prova.
 *
 * Se è l'ultima il tentativo viene consegnato e corretto; altrimenti si apre la
 * sezione successiva e il suo cronometro riparte da adesso. In entrambi i casi si
 * esce con un redirect, che costringe la pagina a rileggere lo stato dal server:
 * è lui a decidere quale materia è aperta, non il browser.
 */
export async function consegnaSezione(attemptId: string) {
  const session = await requireStudent();
  const attempt = await getOwnedInProgressAttempt(attemptId, session.user.id);

  const [test, questions] = await Promise.all([
    prisma.test.findUnique({ where: { id: attempt.testId }, select: { track: true, timeLimitMinutes: true } }),
    testQuestions(attempt.testId),
  ]);
  const sezioni = sezioniDi(trackOf(test?.track), questions, test?.timeLimitMinutes ?? null);

  if (attempt.sezione >= sezioni.length - 1) {
    await consegnaTentativo(attempt);
    redirect(`/student/tests/${attempt.testId}/result/${attempt.id}`);
  }

  await prisma.attempt.update({
    where: { id: attempt.id },
    data: { sezione: attempt.sezione + 1, sezioneIniziataIl: new Date() },
  });
  redirect(`/student/tests/${attempt.testId}/take`);
}

async function consegnaTentativo(attempt: { id: string; testId: string }) {
  const [test, questions, existingAnswers] = await Promise.all([
    prisma.test.findUnique({ where: { id: attempt.testId }, select: { track: true } }),
    testQuestions(attempt.testId),
    prisma.answerRecord.findMany({ where: { attemptId: attempt.id } }),
  ]);

  // Ogni percorso ha il suo punteggio: quello del test, non quello aperto adesso.
  const { score, maxScore, results } = gradeAttempt(
    questions.map((q) => ({ id: q.id, type: q.type, options: q.options })),
    existingAnswers.map((a) => ({
      questionId: a.questionId,
      selectedOptionId: a.selectedOptionId,
      typedAnswer: a.typedAnswer,
    })),
    trackOf(test?.track).scoring
  );

  // Riepilogo per materia calcolato qui, una volta sola: le pagine di analisi
  // leggeranno queste poche righe invece di riesaminare tutte le risposte.
  const subjectOf = new Map(questions.map((q) => [q.id, q.subject]));
  const perSubject = new Map<string, { correct: number; total: number }>();
  for (const r of results) {
    const subject = subjectOf.get(r.questionId);
    if (!subject) continue;
    const stat = perSubject.get(subject) ?? { correct: 0, total: 0 };
    stat.total += 1;
    if (r.isCorrect) stat.correct += 1;
    perSubject.set(subject, stat);
  }

  await prisma.$transaction([
    ...results.map((r) =>
      prisma.answerRecord.upsert({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: r.questionId } },
        update: { selectedOptionId: r.selectedOptionId, typedAnswer: r.typedAnswer, isCorrect: r.isCorrect },
        create: {
          attemptId: attempt.id,
          questionId: r.questionId,
          selectedOptionId: r.selectedOptionId,
          typedAnswer: r.typedAnswer,
          isCorrect: r.isCorrect,
        },
      })
    ),
    prisma.attempt.update({
      where: { id: attempt.id },
      data: { status: "SUBMITTED", submittedAt: new Date(), score, maxScore },
    }),
    // Un tentativo può essere riconsegnato solo una volta, ma la cancellazione
    // preventiva rende l'operazione ripetibile senza creare duplicati.
    prisma.attemptSubjectStat.deleteMany({ where: { attemptId: attempt.id } }),
    prisma.attemptSubjectStat.createMany({
      data: [...perSubject.entries()].map(([subject, s]) => ({
        attemptId: attempt.id,
        subject,
        correct: s.correct,
        total: s.total,
      })),
    }),
  ]);
}
