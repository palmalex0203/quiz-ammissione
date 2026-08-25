"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { gradeAttempt } from "@/lib/grading";

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

  const [questions, existingAnswers] = await Promise.all([
    prisma.question.findMany({
      where: { testId: attempt.testId },
      include: { options: { select: { id: true, isCorrect: true } } },
    }),
    prisma.answerRecord.findMany({ where: { attemptId: attempt.id } }),
  ]);

  const { score, maxScore, results } = gradeAttempt(
    questions.map((q) => ({ id: q.id, options: q.options })),
    existingAnswers.map((a) => ({ questionId: a.questionId, selectedOptionId: a.selectedOptionId }))
  );

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
  ]);

  redirect(`/student/tests/${attempt.testId}/result/${attempt.id}`);
}
