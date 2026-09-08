import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { EmptyState } from "@/components/EmptyState";
import { SubmitButton } from "@/components/SubmitButton";
import { isPracticeable, PRACTICE_SIZES } from "@/lib/subjects";
import { generateSubjectPractice } from "@/app/student/dashboard/actions";

export default async function StudentHistoryPage() {
  const session = await requireStudent();

  const attempts = await prisma.attempt.findMany({
    where: { studentId: session.user.id, status: "SUBMITTED" },
    orderBy: { submittedAt: "desc" },
    include: { test: true },
  });

  // Statistiche per materia precalcolate alla consegna: poche righe invece di tutte
  // le risposte di tutti i test svolti.
  const stats = await prisma.attemptSubjectStat.findMany({
    where: { attemptId: { in: attempts.map((a) => a.id) } },
    select: { subject: true, correct: true, total: true },
  });

  function percentageOf(a: (typeof attempts)[number]) {
    return a.maxScore && a.maxScore > 0 ? ((a.score ?? 0) / a.maxScore) * 100 : 0;
  }

  const avgPercentage =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + percentageOf(a), 0) / attempts.length)
      : 0;

  // Percentuale di risposte corrette per materia su tutte le domande incontrate finora.
  const subjectStats = new Map<string, { correct: number; total: number }>();
  for (const s of stats) {
    const stat = subjectStats.get(s.subject) ?? { correct: 0, total: 0 };
    stat.total += s.total;
    stat.correct += s.correct;
    subjectStats.set(s.subject, stat);
  }
  const subjectRows = [...subjectStats.entries()]
    .map(([subject, stat]) => ({ subject, ...stat, pct: Math.round((stat.correct / stat.total) * 100) }))
    .sort((a, b) => a.pct - b.pct);

  // Si consiglia solo una materia su cui è davvero possibile allenarsi, e solo con
  // abbastanza domande alle spalle perché la percentuale voglia dire qualcosa.
  const weakest = subjectRows.find((r) => isPracticeable(r.subject) && r.total >= 5);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">I miei progressi</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Come stai andando materia per materia, e tutti i test che hai svolto.
        </p>
      </div>

      {attempts.length === 0 ? (
        <EmptyState
          icon="📄"
          title="Nessun test svolto ancora"
          description="Appena completerai il primo test troverai qui il punteggio e l'analisi per materia."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Test completati</p>
              <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
                {attempts.length}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Punteggio medio</p>
              <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
                {avgPercentage}%
              </p>
            </div>
          </div>

          {weakest && (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/25 dark:bg-amber-500/5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl dark:bg-amber-500/20">
                  🎯
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Materia da rafforzare: {weakest.subject}
                  </p>
                  <p className="mt-0.5 max-w-md text-xs text-zinc-600 dark:text-zinc-400">
                    Qui sei al {weakest.pct}% di risposte corrette, il tuo risultato più basso.
                    Allenati con {PRACTICE_SIZES[weakest.subject]} domande solo su questa materia.
                  </p>
                </div>
              </div>
              <form action={generateSubjectPractice}>
                <input type="hidden" name="subject" value={weakest.subject} />
                <SubmitButton
                  pendingText="Preparo l'esercitazione…"
                  className="w-full shrink-0 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 sm:w-auto dark:bg-amber-500 dark:hover:bg-amber-400"
                >
                  Allenati ora
                </SubmitButton>
              </form>
            </div>
          )}

          {subjectRows.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Risposte corrette per materia
              </h2>
              <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                {subjectRows.map((row) => (
                  <div key={row.subject} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{row.subject}</span>
                      <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                        {row.correct}/{row.total} corrette &middot; {row.pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full ${
                          row.pct >= 70
                            ? "bg-green-500"
                            : row.pct >= 50
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${Math.max(row.pct, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Test svolti
            </h2>
            <div className="flex flex-col gap-3">
              {attempts.map((attempt) => (
                <Link
                  key={attempt.id}
                  href={`/student/tests/${attempt.testId}/result/${attempt.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-orange-200 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-orange-500/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {attempt.test.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {attempt.submittedAt?.toLocaleString("it-IT")}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {attempt.score} / {attempt.maxScore} &middot; {Math.round(percentageOf(attempt))}%
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
