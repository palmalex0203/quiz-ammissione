import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { SubmitButton } from "@/components/SubmitButton";
import { ProgressRing } from "@/components/ProgressRing";
import { isPracticeable, PRACTICE_SIZES } from "@/lib/subjects";
import { startAttempt, generateRandomSimulation, generateSubjectPractice } from "./actions";

// Materie mostrate negli anelli della pagina iniziale, nell'ordine del test ufficiale.
const RING_SUBJECTS: { subject: string; short: string }[] = [
  { subject: "Comprensione del testo", short: "Comprensione" },
  { subject: "Logica", short: "Logica" },
  { subject: "Biologia", short: "Biologia" },
  { subject: "Chimica", short: "Chimica" },
  { subject: "Fisica e Matematica", short: "Fisica e Mat." },
];

/*
 * La pagina iniziale mostra solo ciò che serve adesso: generare una simulazione,
 * l'andamento per materia, i test lasciati a metà, l'ultimo risultato e la materia
 * su cui allenarsi. Simulazioni in classe ed esercitazioni stanno in "Esercitati",
 * lo storico completo in "I miei progressi".
 */
export default async function StudentDashboardPage() {
  const session = await requireStudent();
  const studentId = session.user.id;

  const [subjectTotals, inProgress, lastAttempt] = await Promise.all([
    // Statistiche per materia già calcolate alla consegna: poche righe per studente.
    prisma.attemptSubjectStat.groupBy({
      by: ["subject"],
      where: { attempt: { studentId, status: "SUBMITTED" } },
      _sum: { correct: true, total: true },
    }),
    prisma.attempt.findMany({
      where: { studentId, status: "IN_PROGRESS" },
      orderBy: { startedAt: "desc" },
      take: 3,
      select: {
        id: true,
        startedAt: true,
        _count: { select: { answers: { where: { selectedOptionId: { not: null } } } } },
        test: { select: { id: true, title: true, _count: { select: { questions: true } } } },
      },
    }),
    prisma.attempt.findFirst({
      where: { studentId, status: "SUBMITTED" },
      orderBy: { submittedAt: "desc" },
      select: { id: true, score: true, maxScore: true, submittedAt: true, test: { select: { id: true, title: true } } },
    }),
  ]);

  const subjectStats = subjectTotals
    .filter((s) => (s._sum.total ?? 0) > 0)
    .map((s) => ({
      subject: s.subject,
      total: s._sum.total ?? 0,
      pct: Math.round(((s._sum.correct ?? 0) / (s._sum.total ?? 1)) * 100),
    }));
  const subjectPct = new Map(subjectStats.map((s) => [s.subject, s.pct]));

  // Si consiglia una materia solo con abbastanza risposte perché la percentuale conti.
  const weakest = subjectStats
    .filter((s) => isPracticeable(s.subject) && s.total >= 5)
    .sort((a, b) => a.pct - b.pct)[0];

  const firstName = (session.user.name ?? "").split(" ")[0];
  const lastPct =
    lastAttempt?.maxScore && lastAttempt.maxScore > 0
      ? Math.round(((lastAttempt.score ?? 0) / lastAttempt.maxScore) * 100)
      : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="page-title">Ciao, {firstName}</h1>
        <p className="mt-1 text-sm text-muted">Ogni simulazione è diversa: più ne fai, più ti avvicini al test vero.</p>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl bg-brand p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-xl font-bold tracking-tight">Nuova simulazione casuale</p>
          <p className="mt-1 max-w-md text-sm text-white/90">
            60 domande pescate a caso dalla banca dati, con la struttura del test ufficiale e 100 minuti di
            tempo.
          </p>
        </div>
        <form action={generateRandomSimulation}>
          <SubmitButton pendingText="Genero la simulazione…" className="btn btn-on-brand w-full sm:w-auto">
            Genera e inizia
          </SubmitButton>
        </form>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="section-title">Come stai andando</h2>
          <Link href="/student/history" className="text-sm font-medium text-brand-strong hover:underline">
            Tutti i progressi
          </Link>
        </div>
        {subjectPct.size === 0 ? (
          <p className="card px-5 py-4 text-sm text-muted">
            Completa il primo test e qui vedrai la percentuale di risposte corrette per ogni materia.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {RING_SUBJECTS.map(({ subject, short }) => (
              <Link
                key={subject}
                href={`/student/practice?materia=${encodeURIComponent(subject)}`}
                className="card card-link flex flex-col items-center gap-2 px-2 py-3 text-center"
              >
                <ProgressRing value={subjectPct.get(subject) ?? null} />
                <span className="text-xs font-medium text-muted">{short}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {inProgress.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">Da riprendere</h2>
          <div className="flex flex-col gap-2">
            {inProgress.map((a) => (
              <div key={a.id} className="card flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{a.test.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {a._count.answers} di {a.test._count.questions} risposte date
                  </p>
                </div>
                <form action={startAttempt}>
                  <input type="hidden" name="testId" value={a.test.id} />
                  <SubmitButton pendingText="Apro il test…" className="btn btn-sm btn-brand">
                    Continua
                  </SubmitButton>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {(lastAttempt || weakest) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {lastAttempt && (
            <Link
              href={`/student/tests/${lastAttempt.test.id}/result/${lastAttempt.id}`}
              className="card card-link flex items-center gap-4 p-5"
            >
              <ProgressRing value={lastPct} size={60} />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Ultimo test</p>
                <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">
                  {lastAttempt.score}
                  <span className="text-base text-muted"> / {lastAttempt.maxScore}</span>
                </p>
                <p className="truncate text-xs text-muted">{lastAttempt.test.title} · vedi la correzione</p>
              </div>
            </Link>
          )}
          {weakest && (
            <div className="flex flex-col justify-between gap-3 rounded-[1.25rem] border border-brand/25 bg-brand-tint p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-strong">Da rafforzare</p>
                <p className="mt-0.5 font-display text-xl font-bold">{weakest.subject}</p>
                <p className="text-xs text-muted">
                  Sei al {weakest.pct}% di risposte corrette: allenati con {PRACTICE_SIZES[weakest.subject]} domande.
                </p>
              </div>
              <form action={generateSubjectPractice}>
                <input type="hidden" name="subject" value={weakest.subject} />
                <SubmitButton pendingText="Preparo l'esercitazione…" className="btn btn-sm btn-brand">
                  Allenati ora
                </SubmitButton>
              </form>
            </div>
          )}
        </div>
      )}

      <Link
        href="/student/practice?materia=simulazioni"
        className="card card-link flex items-center justify-between gap-3 px-5 py-4"
      >
        <div>
          <p className="text-sm font-semibold">Simulazioni in classe ed esercitazioni</p>
          <p className="text-xs text-muted">Le trovi in Esercitati, divise per materia.</p>
        </div>
        <span aria-hidden="true" className="text-lg text-brand-strong">
          →
        </span>
      </Link>
    </div>
  );
}
