import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";
import { TrendChart } from "./TrendChart";

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

  const GENERATED_FOLDER_KEY = "__generated__";

  function percentageOf(a: (typeof attempts)[number]) {
    return a.maxScore && a.maxScore > 0 ? ((a.score ?? 0) / a.maxScore) * 100 : 0;
  }

  const avgPercentage =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + percentageOf(a), 0) / attempts.length)
      : 0;

  // Andamento per materia: percentuale di risposte corrette su tutte le domande incontrate
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
  const weakestSubject = subjectRows[0];
  const strongestSubject = subjectRows.length > 0 ? subjectRows[subjectRows.length - 1] : undefined;

  // Cartella per test: raggruppa i tentativi per test, mantenendo l'ordine di ultima attività
  type TestFolder = {
    testId: string;
    testTitle: string;
    attempts: typeof attempts;
  };
  const folders: TestFolder[] = [];
  const folderIndex = new Map<string, TestFolder>();
  for (const attempt of attempts) {
    const key = attempt.test.isGenerated ? GENERATED_FOLDER_KEY : attempt.testId;
    let folder = folderIndex.get(key);
    if (!folder) {
      folder = {
        testId: key,
        testTitle: attempt.test.isGenerated ? "Simulazioni casuali generate" : attempt.test.title,
        attempts: [],
      };
      folderIndex.set(key, folder);
      folders.push(folder);
    }
    folder.attempts.push(attempt);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/teacher/students"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          &larr; Studenti
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{student.name}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{student.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Tentativi completati</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{attempts.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Andamento medio</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{avgPercentage}%</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Test svolti</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{folders.length}</p>
        </div>
      </div>

      {attempts.length >= 2 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">Andamento nel tempo</h2>
          <TrendChart
            points={[...attempts]
              .filter((a) => a.submittedAt)
              .sort((a, b) => a.submittedAt!.getTime() - b.submittedAt!.getTime())
              .map((a) => ({
                date: a.submittedAt!.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }),
                percentage: Math.round(percentageOf(a)),
              }))}
          />
        </div>
      )}

      {(strongestSubject || weakestSubject) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {strongestSubject && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/60 dark:bg-green-950/20">
              <p className="text-xs font-medium uppercase tracking-wide text-green-700 dark:text-green-400">
                Punto di forza
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{strongestSubject[0]}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {Math.round((strongestSubject[1].correct / strongestSubject[1].total) * 100)}% di risposte
                corrette
              </p>
            </div>
          )}
          {weakestSubject && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Da rafforzare
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{weakestSubject[0]}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {Math.round((weakestSubject[1].correct / weakestSubject[1].total) * 100)}% di risposte corrette
              </p>
            </div>
          )}
        </div>
      )}

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
        <h2 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-50">Risultati per test</h2>
        <div className="flex flex-col gap-4">
          {folders.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Nessun tentativo ancora.</p>
          )}
          {folders.map((folder) => {
            const folderAvg = Math.round(
              folder.attempts.reduce((sum, a) => sum + percentageOf(a), 0) / folder.attempts.length
            );
            const folderBest = Math.round(Math.max(...folder.attempts.map(percentageOf)));
            return (
              <div
                key={folder.testId}
                className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-5 py-3 dark:border-zinc-900">
                  {folder.testId === GENERATED_FOLDER_KEY ? (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      🎲 {folder.testTitle}
                    </span>
                  ) : (
                    <Link
                      href={`/teacher/results/test/${folder.testId}`}
                      className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {folder.testTitle}
                    </Link>
                  )}
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {folder.attempts.length} tentativi &middot; media {folderAvg}% &middot; migliore {folderBest}%
                  </p>
                </div>
                <div className="flex flex-col">
                  {folder.attempts.map((attempt) => {
                    const percentage = Math.round(percentageOf(attempt));
                    return (
                      <Link
                        key={attempt.id}
                        href={`/teacher/results/attempt/${attempt.id}`}
                        className="flex items-center justify-between px-5 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {attempt.submittedAt?.toLocaleString("it-IT")}
                        </span>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {attempt.score} / {attempt.maxScore} &middot; {percentage}%
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
