"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { gradeAttempt } from "@/lib/grading";
import { trackOf } from "@/lib/tracks";

async function getOwnedInProgressAttempt(attemptId: string, studentId: string) {
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.studentId !== studentId || attempt.status !== "IN_PROGRESS") {
    throw new Error("Tentativo non valido.");
  }
  return attempt;
}

export async function saveAnswer(attemptId: string, questionId: string, selectedOptionId: string) {
  const session = await requireStudent();
  const attempt = await getOwnedInProgressAttempt(attemptId, session.user.id);

  await prisma.answerRecord.upsert({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
    update: { selectedOptionId },
    create: { attemptId: attempt.id, questionId, selectedOptionId },
  });
}

export async function clearAnswer(attemptId: string, questionId: string) {
  const session = await requireStudent();
  const attempt = await getOwnedInProgressAttempt(attemptId, session.user.id);

  await prisma.answerRecord.deleteMany({
    where: { attemptId: attempt.id, questionId },
  });
}

export async function submitAttempt(attemptId: string) {
  const session = await requireStudent();
  const attempt = await getOwnedInProgressAttempt(attemptId, session.user.id);

  const [test, questions, existingAnswers] = await Promise.all([
    prisma.test.findUnique({ where: { id: attempt.testId }, select: { track: true } }),
    prisma.question.findMany({
      where: { testId: attempt.testId },
      include: { options: { select: { id: true, isCorrect: true } } },
    }),
    prisma.answerRecord.findMany({ where: { attemptId: attempt.id } }),
  ]);

  // Ogni percorso ha il suo punteggio: quello del test, non quello aperto adesso.
  const { score, maxScore, results } = gradeAttempt(
    questions.map((q) => ({ id: q.id, options: q.options })),
    existingAnswers.map((a) => ({ questionId: a.questionId, selectedOptionId: a.selectedOptionId })),
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
        update: { selectedOptionId: r.selectedOptionId, isCorrect: r.isCorrect },
        create: {
          attemptId: attempt.id,
          questionId: r.questionId,
          selectedOptionId: r.selectedOptionId,
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

  redirect(`/student/tests/${attempt.testId}/result/${attempt.id}`);
}
