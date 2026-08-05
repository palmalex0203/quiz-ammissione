import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";

export default async function StudentResultsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const session = await requireTeacher();

  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student || student.role !== "STUDENT") {
    notFound();
  }

  const attempts = await prisma.attempt.findMany({
    where: { studentId, status: "SUBMITTED", test: { createdById: session.user.id } },
    orderBy: { submittedAt: "desc" },
    include: {
      test: true,
      answers: { include: { question: { select: { subject: true } } } },
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

  const subjectStats = new Map<string, { correct: number; total: number }>();
  for (const attempt of attempts) {
    for (const answer of attempt.answers) {
      const subject = answer.question.subject;
      const stat = subjectStats.get(subject) ?? { correct: 0, total: 0 };
      stat.total += 1;
      if (answer.isCorrect) stat.correct += 1;
      subjectStats.set(subject, stat);
    }
  }
  const subjectRows = [...subjectStats.entries()].sort(
    (a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/teacher/results"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          &larr; Tutti i risultati
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{student.name}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{student.email}</p>
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

      {subjectRows.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-50">Andamento per materia</h2>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <ul className="flex flex-col gap-2">
              {subjectRows.map(([subject, stat]) => {
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

      <div>
        <h2 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-50">Storico tentativi</h2>
        <div className="flex flex-col gap-2">
          {attempts.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Nessun tentativo ancora.</p>
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
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{attempt.test.title}</p>
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
