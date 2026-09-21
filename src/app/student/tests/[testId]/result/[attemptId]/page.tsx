import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { ProgressRing } from "@/components/ProgressRing";

export default async function AttemptResultPage({
  params,
}: {
  params: Promise<{ testId: string; attemptId: string }>;
}) {
  const { testId, attemptId } = await params;
  const session = await requireStudent();

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      test: true,
      answers: {
        include: {
          question: { include: { options: { orderBy: { order: "asc" } } } },
        },
      },
    },
  });

  if (
    !attempt ||
    attempt.studentId !== session.user.id ||
    attempt.testId !== testId ||
    attempt.status !== "SUBMITTED"
  ) {
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
        <Link href="/student/dashboard" className="text-sm font-medium text-muted hover:text-brand-strong">
          &larr; I miei test
        </Link>
        <h1 className="page-title mt-2">{attempt.test.title}</h1>
      </div>

      <div className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <ProgressRing value={percentage} size={92} />
        <div className="flex flex-col gap-3">
          <p className="font-display text-4xl font-bold tracking-tight tabular-nums">
            {attempt.score}
            <span className="text-xl text-muted"> / {attempt.maxScore}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="pill bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300">
              {correctCount} corrette · +1,5
            </span>
            <span className="pill bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300">
              {incorrectCount} errate · −0,4
            </span>
            <span className="pill bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {omittedCount} senza risposta · 0
            </span>
          </div>
        </div>
      </div>

      <h2 className="section-title">Correzione domanda per domanda</h2>

      <div className="flex flex-col gap-3">
        {sortedAnswers.map((answer, index) => {
          const wasOmitted = !answer.selectedOptionId;
          const status = answer.isCorrect ? "correct" : wasOmitted ? "omitted" : "wrong";
          return (
            <div
              key={answer.id}
              className={`rounded-3xl border p-5 ${
                status === "correct"
                  ? "border-green-200 bg-green-50/70 dark:border-green-900/60 dark:bg-green-950/20"
                  : status === "wrong"
                    ? "border-red-200 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/20"
                    : "border-line bg-card"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-muted">
                  {index + 1} · {answer.question.subject}
                </span>
                <span
                  className={`pill ${
                    status === "correct"
                      ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
                      : status === "wrong"
                        ? "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {status === "correct" ? "Corretta +1,5" : status === "wrong" ? "Errata −0,4" : "Senza risposta 0"}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-relaxed">{answer.question.text}</p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {answer.question.options.map((option, optionIndex) => {
                  const wasSelected = option.id === answer.selectedOptionId;
                  return (
                    <li
                      key={option.id}
                      className={`flex items-start gap-2.5 text-sm ${
                        option.isCorrect
                          ? "font-semibold text-green-800 dark:text-green-300"
                          : wasSelected
                            ? "font-semibold text-red-800 dark:text-red-300"
                            : "text-muted"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                          option.isCorrect
                            ? "bg-green-600 text-white"
                            : wasSelected
                              ? "bg-red-600 text-white"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="pt-0.5">
                        {option.text}
                        {option.isCorrect && <span className="sr-only"> (risposta corretta)</span>}
                        {wasSelected && <span className="font-normal"> — la tua risposta</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
