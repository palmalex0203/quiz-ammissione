import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";

export default async function TeacherAttemptDetailPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const session = await requireTeacher();

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      test: true,
      student: true,
      answers: {
        include: { question: { include: { options: { orderBy: { order: "asc" } } } } },
      },
    },
  });

  if (!attempt || attempt.test.createdById !== session.user.id || attempt.status !== "SUBMITTED") {
    notFound();
  }

  const percentage =
    attempt.maxScore && attempt.maxScore > 0 ? Math.round(((attempt.score ?? 0) / attempt.maxScore) * 100) : 0;
  const sortedAnswers = [...attempt.answers].sort((a, b) => a.question.order - b.question.order);
  const correctCount = sortedAnswers.filter((a) => a.isCorrect).length;
  const omittedCount = sortedAnswers.filter((a) => !a.selectedOptionId).length;
  const incorrectCount = sortedAnswers.length - correctCount - omittedCount;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/teacher/results"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          &larr; Tutti i risultati
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{attempt.test.title}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {attempt.student.name} &middot; {attempt.submittedAt?.toLocaleString("it-IT")}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          {attempt.score} / {attempt.maxScore}
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {percentage}% &middot; {correctCount} corrette, {incorrectCount} errate, {omittedCount} omesse su{" "}
          {sortedAnswers.length}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {sortedAnswers.map((answer, index) => {
          const correctOption = answer.question.options.find((o) => o.isCorrect);
          const wasOmitted = !answer.selectedOptionId;
          return (
            <div
              key={answer.id}
              className={`rounded-xl border p-5 ${
                answer.isCorrect
                  ? "border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/20"
                  : wasOmitted
                    ? "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40"
                    : "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/20"
              }`}
            >
              <p className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <span>
                  Domanda {index + 1} &middot; {answer.question.subject}
                </span>
                <span
                  className={
                    answer.isCorrect
                      ? "text-green-700 dark:text-green-400"
                      : wasOmitted
                        ? "text-zinc-500 dark:text-zinc-400"
                        : "text-red-700 dark:text-red-400"
                  }
                >
                  {answer.isCorrect ? "+1,5" : wasOmitted ? "0" : "−0,4"}
                </span>
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {answer.question.text}
              </p>
              <ul className="mt-2 flex flex-col gap-0.5">
                {answer.question.options.map((option) => {
                  const wasSelected = option.id === answer.selectedOptionId;
                  return (
                    <li
                      key={option.id}
                      className={`text-xs ${
                        option.isCorrect
                          ? "font-medium text-green-700 dark:text-green-400"
                          : wasSelected
                            ? "font-medium text-red-700 dark:text-red-400"
                            : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {option.isCorrect ? "✓ " : wasSelected ? "✗ " : "— "}
                      {option.text}
                      {wasSelected && " (risposta data)"}
                    </li>
                  );
                })}
              </ul>
              {!answer.isCorrect && correctOption && (
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                  Risposta corretta: <span className="font-medium">{correctOption.text}</span>
                </p>
              )}
              {!answer.selectedOptionId && (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Nessuna risposta data.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
