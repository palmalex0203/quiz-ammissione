import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { seededShuffle } from "@/lib/shuffle";
import { TakeTestForm } from "./TakeTestForm";

export default async function TakeTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const session = await requireStudent();

  const attempt = await prisma.attempt.findFirst({
    where: { testId, studentId: session.user.id, status: "IN_PROGRESS" },
  });

  if (!attempt) {
    redirect("/student/dashboard");
  }

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" }, select: { id: true, text: true } } },
      },
    },
  });

  if (!test) notFound();

  const existingAnswers = await prisma.answerRecord.findMany({ where: { attemptId: attempt.id } });
  const initialAnswers = Object.fromEntries(
    existingAnswers
      .filter((a) => a.selectedOptionId)
      .map((a) => [a.questionId, a.selectedOptionId as string])
  );

  const questions = test.shuffleQuestions ? seededShuffle(test.questions, attempt.id) : test.questions;

  return (
    <TakeTestForm
      testTitle={test.title}
      attemptId={attempt.id}
      timeLimitMinutes={test.timeLimitMinutes}
      startedAt={attempt.startedAt.toISOString()}
      questions={questions.map((q) => ({
        id: q.id,
        subject: q.subject,
        text: q.text,
        options: q.options,
      }))}
      initialAnswers={initialAnswers}
    />
  );
}
