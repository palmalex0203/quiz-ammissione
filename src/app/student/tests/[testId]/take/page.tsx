import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { seededShuffle } from "@/lib/shuffle";
import { testQuestions } from "@/lib/test-questions";
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

  const [test, domande, existingAnswers] = await Promise.all([
    prisma.test.findUnique({ where: { id: testId } }),
    testQuestions(testId),
    prisma.answerRecord.findMany({ where: { attemptId: attempt.id } }),
  ]);

  if (!test) notFound();
  const initialAnswers = Object.fromEntries(
    existingAnswers
      .filter((a) => a.selectedOptionId)
      .map((a) => [a.questionId, a.selectedOptionId as string])
  );

  const questions = test.shuffleQuestions ? seededShuffle(domande, attempt.id) : domande;

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
        // Al browser non si manda quale opzione è giusta.
        options: q.options.map((o) => ({ id: o.id, text: o.text })),
      }))}
      initialAnswers={initialAnswers}
    />
  );
}
