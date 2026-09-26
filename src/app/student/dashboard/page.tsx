import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { questionCountOf, questionCountSelect } from "@/lib/test-questions";
import { requireStudentTrack } from "@/lib/track-session";
import { SubmitButton } from "@/components/SubmitButton";
import { ProgressRing } from "@/components/ProgressRing";
import { ExamFormat } from "@/components/ExamFormat";
import { InstallHint } from "@/components/InstallHint";
import { poolCounts } from "@/lib/question-pool";
import { wrongAnswerCount, REVIEW_SIZE } from "@/lib/review";
import { isPracticeable, simulationSize } from "@/lib/tracks";
import {
  startAttempt,
  generateRandomSimulation,
  generateSubjectPractice,
  generateErrorReview,
} from "./actions";

/*
 * La pagina di pratica: in alto le due cose che si fanno più spesso (la simulazione
 * completa e l'allenamento per argomento), poi le altre modalità, il formato della
 * prova e l'andamento per materia. Lo storico completo sta in "I miei progressi".
 */
export default async function StudentDashboardPage() {
  const { session, track } = await requireStudentTrack();
  const studentId = session.user.id;

  const [subjectTotals, inProgress, lastAttempt, simulazioniCount, erroriCount, pool] = await Promise.all([
    // Statistiche per materia già calcolate alla consegna: poche righe per studente.
    prisma.attemptSubjectStat.groupBy({
      by: ["subject"],
      where: { attempt: { studentId, status: "SUBMITTED", test: { track: track.id } } },
      _sum: { correct: true, total: true },
    }),
    prisma.attempt.findMany({
      where: { studentId, status: "IN_PROGRESS", test: { track: track.id } },
      orderBy: { startedAt: "desc" },
      take: 3,
      select: {
        id: true,
        _count: { select: { answers: { where: { selectedOptionId: { not: null } } } } },
        test: { select: { id: true, title: true, _count: { select: questionCountSelect } } },
      },
    }),
    prisma.attempt.findFirst({
      where: { studentId, status: "SUBMITTED", test: { track: track.id } },
      orderBy: { submittedAt: "desc" },
      select: { id: true, score: true, maxScore: true, test: { select: { id: true, title: true } } },
    }),
    prisma.test.count({
      where: {
        isPublished: true,
        track: track.id,
        kind: "SIMULAZIONE",
        OR: [{ assignments: { none: {} } }, { assignments: { some: { studentId } } }],
      },
    }),
    wrongAnswerCount(studentId, track.id),
    poolCounts(track.id),
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
    .filter((s) => isPracticeable(track, s.subject) && (pool.bySubject.get(s.subject) ?? 0) > 0 && s.total >= 5)
    .sort((a, b) => a.pct - b.pct)[0];

  // La simulazione si può generare solo se la banca dati del percorso ha abbastanza
  // domande in ogni materia prevista dalla prova.
  const canSimulate = track.simulation.blocks.every((b) => (pool.bySubject.get(b.subject) ?? 0) >= b.count);
  const hasTopics = pool.total > 0;

  const firstName = (session.user.name ?? "").split(" ")[0];
  const lastPct =
    lastAttempt?.maxScore && lastAttempt.maxScore > 0
      ? Math.round(((lastAttempt.score ?? 0) / lastAttempt.maxScore) * 100)
      : null;
  const resume = inProgress[0];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="page-title">Ciao, {firstName}</h1>
        <p className="mt-1 text-sm text-muted">
          Stai preparando <span className="font-semibold text-foreground">{track.label}</span>: {track.tagline}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col justify-between gap-5 rounded-3xl bg-brand p-6 text-white">
          <div>
            <p className="font-display text-2xl font-bold leading-tight tracking-tight">
              Simulazione
              <br />
              {track.label}
            </p>
            <p className="mt-2 text-sm text-white/90">
              {canSimulate
                ? track.simulation.description
                : `La banca dati è ancora in preparazione: appena ci saranno le domande potrai generare la simulazione da qui.`}
            </p>
          </div>
          {canSimulate ? (
            <form action={generateRandomSimulation}>
              <SubmitButton pendingText="Genero la simulazione…" className="btn btn-on-brand w-full sm:w-auto">
                Genera e inizia →
              </SubmitButton>
            </form>
          ) : (
            <span className="pill self-start bg-white/20 text-white">In preparazione</span>
          )}
        </section>

        <section className="flex flex-col justify-between gap-5 rounded-3xl bg-ink p-6 text-on-ink">
          <div>
            <p className="font-display text-2xl font-bold leading-tight tracking-tight">
              Allenati
              <br />
              per argomento
            </p>
            <p className="mt-2 text-sm opacity-75">
              Scegli la materia e l&apos;argomento: le domande cambiano ogni volta, così non impari le risposte a
              memoria.
            </p>
          </div>
          <Link href="/student/practice" className="btn btn-brand self-start">
            Scegli materia →
          </Link>
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="section-title">Altre modalità</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/student/practice?materia=simulazioni"
            className="card card-link flex flex-col gap-1 p-5"
          >
            <span aria-hidden="true" className="text-xl">
              📋
            </span>
            <p className="mt-1 text-sm font-semibold">Simulazioni in classe</p>
            <p className="text-xs text-muted">
              {simulazioniCount === 0
                ? "Nessuna per ora"
                : `${simulazioniCount} ${simulazioniCount === 1 ? "prova" : "prove"} del docente`}
            </p>
          </Link>

          <div className="card flex flex-col gap-1 p-5">
            <span aria-hidden="true" className="text-xl">
              ↺
            </span>
            <p className="mt-1 text-sm font-semibold">Ripasso errori</p>
            {erroriCount > 0 ? (
              <>
                <p className="text-xs text-muted">
                  {erroriCount} {erroriCount === 1 ? "domanda sbagliata" : "domande sbagliate"} da recuperare
                </p>
                <form action={generateErrorReview} className="mt-2">
                  <SubmitButton pendingText="Preparo il ripasso…" className="btn btn-sm btn-soft">
                    Riprova{erroriCount > REVIEW_SIZE ? ` le ultime ${REVIEW_SIZE}` : ""}
                  </SubmitButton>
                </form>
              </>
            ) : (
              <p className="text-xs text-muted">Nessun errore da recuperare</p>
            )}
          </div>

          <div className="card flex flex-col gap-1 p-5">
            <span aria-hidden="true" className="text-xl">
              ⏳
            </span>
            <p className="mt-1 text-sm font-semibold">Da riprendere</p>
            {resume ? (
              <>
                <p className="truncate text-xs text-muted">
                  {resume.test.title} · {resume._count.answers} di {questionCountOf(resume.test._count)} risposte
                </p>
                <form action={startAttempt} className="mt-2">
                  <input type="hidden" name="testId" value={resume.test.id} />
                  <SubmitButton pendingText="Apro il test…" className="btn btn-sm btn-soft">
                    Continua
                  </SubmitButton>
                </form>
              </>
            ) : (
              <p className="text-xs text-muted">Nessun test lasciato a metà</p>
            )}
          </div>

          {lastAttempt ? (
            <Link
              href={`/student/tests/${lastAttempt.test.id}/result/${lastAttempt.id}`}
              className="card card-link flex items-center gap-4 p-5"
            >
              <ProgressRing value={lastPct} size={52} />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Ultimo risultato</p>
                <p className="font-display text-lg font-bold tabular-nums">
                  {lastAttempt.score}
                  <span className="text-sm text-muted"> / {lastAttempt.maxScore}</span>
                </p>
                <p className="truncate text-xs text-muted">vedi la correzione</p>
              </div>
            </Link>
          ) : (
            <div className="card flex flex-col gap-1 p-5">
              <span aria-hidden="true" className="text-xl">
                🎯
              </span>
              <p className="mt-1 text-sm font-semibold">Ultimo risultato</p>
              <p className="text-xs text-muted">
                {hasTopics ? "Completa il primo test" : "Appena la banca dati sarà pronta"}
              </p>
            </div>
          )}
        </div>
      </section>

      <ExamFormat track={track} />

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
          <div className={`grid gap-2 ${track.subjects.length > 3 ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-3"}`}>
            {track.subjects.map(({ name, short }) => (
              <Link
                key={name}
                href={`/student/practice?materia=${encodeURIComponent(name)}`}
                className="card card-link flex flex-col items-center gap-2 px-2 py-3 text-center"
              >
                <ProgressRing value={subjectPct.get(name) ?? null} />
                <span className="text-xs font-medium text-muted">{short}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {weakest && (
        <div className="flex flex-col justify-between gap-3 rounded-3xl border border-brand/25 bg-brand-tint p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-strong">Da rafforzare</p>
            <p className="mt-0.5 font-display text-xl font-bold">{weakest.subject}</p>
            <p className="text-xs text-muted">
              Sei al {weakest.pct}% di risposte corrette: allenati solo su questa materia.
            </p>
          </div>
          <form action={generateSubjectPractice}>
            <input type="hidden" name="subject" value={weakest.subject} />
            <SubmitButton pendingText="Preparo l'esercitazione…" className="btn btn-brand w-full sm:w-auto">
              Allenati ora
            </SubmitButton>
          </form>
        </div>
      )}

      <InstallHint />

      <p className="text-center text-xs text-muted">
        {simulationSize(track)} domande nella prova completa · {track.simulation.minutes} minuti
      </p>
    </div>
  );
}
