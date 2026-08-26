import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";
import { EmptyState } from "@/components/EmptyState";

export default async function TestResultsPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const session = await requireTeacher();

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });

  if (!test || test.createdById !== session.user.id) {
    notFound();
  }

  const attempts = await prisma.attempt.findMany({
    where: { testId, status: "SUBMITTED" },
    orderBy: { submittedAt: "desc" },
    include: {
      student: true,
      answers: true,
    },
  });

  const avgPercentage =
    attempts.length > 0
      ? Math.round(
          attempts.reduce(
            (sum, a) => sum + (a.maxScore && a.maxScore > 0 ? ((a.score ?? 0) / a.maxScore) * 100 : 0),
            0
          ) / attempts.length
        )
      : 0;

  const answersByQuestion = new Map<string, { correct: number; total: number }>();
  const answersBySubject = new Map<string, { correct: number; total: number }>();
  for (const attempt of attempts) {
    for (const answer of attempt.answers) {
      const qStat = answersByQuestion.get(answer.questionId) ?? { correct: 0, total: 0 };
      qStat.total += 1;
      if (answer.isCorrect) qStat.correct += 1;
      answersByQuestion.set(answer.questionId, qStat);
    }
  }
  for (const question of test.questions) {
    const stat = answersByQuestion.get(question.id);
    if (!stat) continue;
    const subjectStat = answersBySubject.get(question.subject) ?? { correct: 0, total: 0 };
    subjectStat.correct += stat.correct;
    subjectStat.total += stat.total;
    answersBySubject.set(question.subject, subjectStat);
  }

  const questionRows = test.questions
    .map((q) => ({ question: q, stat: answersByQuestion.get(q.id) ?? { correct: 0, total: 0 } }))
    .filter((r) => r.stat.total > 0)
    .sort((a, b) => a.stat.correct / a.stat.total - b.stat.correct / b.stat.total);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/teacher/results"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          &larr; Tutti i risultati
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{test.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Tentativi completati</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{attempts.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Media punteggio</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{avgPercentage}%</p>
        </div>
      </div>

      {answersBySubject.size > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-50">Andamento per materia</h2>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <ul className="flex flex-col gap-2">
              {[...answersBySubject.entries()].map(([subject, stat]) => {
                const pct = Math.round((stat.correct / stat.total) * 100);
                return (
                  <li key={subject} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">{subject}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {stat.correct}/{stat.total} corrette ({pct}%)
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {questionRows.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Domande più sbagliate
          </h2>
          <div className="flex flex-col gap-2">
            {questionRows.map(({ question, stat }) => {
              const pct = Math.round((stat.correct / stat.total) * 100);
              return (
                <div
                  key={question.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{question.subject}</p>
                  <p className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">{question.text}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {stat.correct}/{stat.total} risposte corrette ({pct}%)
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-50">Tentativi</h2>
        <div className="flex flex-col gap-2">
          {attempts.length === 0 && (
            <EmptyState icon="📊" title="Nessun tentativo ancora" description="Quando uno studente svolgerà questo test, apparirà qui." />
          )}
          {attempts.map((attempt) => {
            const percentage =
              attempt.maxScore && attempt.maxScore > 0
                ? Math.round(((attempt.score ?? 0) / attempt.maxScore) * 100)
                : 0;
            return (
              <Link
                key={attempt.id}
                href={`/teacher/results/attempt/${attempt.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{attempt.student.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {attempt.submittedAt?.toLocaleString("it-IT")}
                  </p>
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {attempt.score} / {attempt.maxScore} &middot; {percentage}%
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
