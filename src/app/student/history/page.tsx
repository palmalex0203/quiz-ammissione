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
        <h1 className="page-title">I miei progressi</h1>
        <p className="text-sm text-muted">
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
            <div className="card p-5">
              <p className="text-sm text-muted">Test completati</p>
              <p className="mt-1 font-display text-4xl font-bold tabular-nums">
                {attempts.length}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-muted">Punteggio medio</p>
              <p className="mt-1 font-display text-4xl font-bold tabular-nums">
                {avgPercentage}%
              </p>
            </div>
          </div>

          {weakest && (
            <div className="flex flex-col gap-3 rounded-3xl border border-brand/25 bg-brand-tint p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-xl">
                  🎯
                </div>
                <div>
                  <p className="text-sm font-semibold">
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
                  className="btn btn-brand w-full shrink-0 sm:w-auto"
                >
                  Allenati ora
                </SubmitButton>
              </form>
            </div>
          )}

          {subjectRows.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="section-title">
                Risposte corrette per materia
              </h2>
              <div className="flex flex-col gap-4 card p-5">
                {subjectRows.map((row) => (
                  <div key={row.subject} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{row.subject}</span>
                      <span className="shrink-0 text-xs text-muted">
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
            <h2 className="section-title">
              Test svolti
            </h2>
            <div className="flex flex-col gap-3">
              {attempts.map((attempt) => (
                <Link
                  key={attempt.id}
                  href={`/student/tests/${attempt.testId}/result/${attempt.id}`}
                  className="flex items-center justify-between gap-3 card card-link p-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {attempt.test.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
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
