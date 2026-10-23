import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherTrack } from "@/lib/track-docente";
import type { Prisma } from "@/generated/prisma/client";
import { EmptyState } from "@/components/EmptyState";
import { formatScore } from "@/lib/tracks";
import { titoloTest } from "@/lib/titoli";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; testId?: string; from?: string; to?: string }>;
}) {
  const { trackId, track } = await requireTeacherTrack();
  const params = await searchParams;

  // Tutto filtrato sul corso aperto: gli studenti da scegliere, i test da
  // scegliere e le consegne. Le medie per materia che questa pagina calcola
  // non reggerebbero una mescolanza — le materie dei due corsi sono diverse,
  // e lo sono anche i punteggi con cui si misurano.
  const [students, tests] = await Promise.all([
    prisma.user.findMany({ where: { role: "STUDENT", track: trackId }, orderBy: { name: "asc" } }),
    prisma.test.findMany({
      // Anche le prove ufficiali: i tentativi comparivano già nell'elenco, ma senza
      // di loro il filtro per test non permetteva di isolarli.
      // Di chiunque li abbia creati: un risultato è dello studente, non
      // dell'insegnante che ha preparato la prova.
      where: {
        track: trackId,
        kind: { in: ["SIMULAZIONE", "ESERCITAZIONE", "UFFICIALE"] },
      },
      orderBy: { title: "asc" },
    }),
  ]);

  const where: Prisma.AttemptWhereInput = {
    status: "SUBMITTED",
    test: { track: trackId },
  };
  if (params.studentId) where.studentId = params.studentId;
  if (params.testId) where.testId = params.testId;
  if (params.from || params.to) {
    where.submittedAt = {
      ...(params.from ? { gte: new Date(params.from) } : {}),
      ...(params.to ? { lte: new Date(`${params.to}T23:59:59`) } : {}),
    };
  }

  const attempts = await prisma.attempt.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    include: { student: true, test: true },
  });

  // I riepiloghi per materia si leggono dalle statistiche precalcolate alla consegna:
  // caricare tutte le risposte significava esaminare decine di migliaia di righe a
  // ogni apertura della pagina, ed è ciò che ha esaurito la quota del database.
  const statsByAttempt = new Map<string, { subject: string; correct: number; total: number }[]>();
  for (let i = 0; i < attempts.length; i += 300) {
    const chunk = attempts.slice(i, i + 300).map((a) => a.id);
    const stats = await prisma.attemptSubjectStat.findMany({
      where: { attemptId: { in: chunk } },
      select: { attemptId: true, subject: true, correct: true, total: true },
    });
    for (const s of stats) {
      const list = statsByAttempt.get(s.attemptId) ?? [];
      list.push({ subject: s.subject, correct: s.correct, total: s.total });
      statsByAttempt.set(s.attemptId, list);
    }
  }

  function percentageOf(a: (typeof attempts)[number]) {
    return a.maxScore && a.maxScore > 0 ? ((a.score ?? 0) / a.maxScore) * 100 : 0;
  }

  // Riepilogo per studente: tentativi, media, materia più debole - ordinato dal
  // rendimento più basso, così l'insegnante vede subito chi ha più bisogno di aiuto.
  type StudentSummary = {
    studentId: string;
    studentName: string;
    attemptCount: number;
    avgPercentage: number;
    weakestSubject: string | null;
  };
  const byStudent = new Map<string, typeof attempts>();
  for (const a of attempts) {
    const list = byStudent.get(a.studentId) ?? [];
    list.push(a);
    byStudent.set(a.studentId, list);
  }
  const studentSummaries: StudentSummary[] = [...byStudent.entries()].map(([studentId, studentAttempts]) => {
    const subjectStats = new Map<string, { correct: number; total: number }>();
    for (const a of studentAttempts) {
      for (const s of statsByAttempt.get(a.id) ?? []) {
        const stat = subjectStats.get(s.subject) ?? { correct: 0, total: 0 };
        stat.total += s.total;
        stat.correct += s.correct;
        subjectStats.set(s.subject, stat);
      }
    }
    const weakest = [...subjectStats.entries()].sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)[0];
    return {
      studentId,
      studentName: studentAttempts[0].student.name,
      attemptCount: studentAttempts.length,
      avgPercentage: Math.round(
        studentAttempts.reduce((sum, a) => sum + percentageOf(a), 0) / studentAttempts.length
      ),
      weakestSubject: weakest ? weakest[0] : null,
    };
  });
  studentSummaries.sort((a, b) => a.avgPercentage - b.avgPercentage);

  // Andamento per materia su tutta la classe (nel filtro corrente) - ordinato dalla
  // materia più debole, per individuare a colpo d'occhio le lacune diffuse.
  const classSubjectStats = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    for (const s of statsByAttempt.get(a.id) ?? []) {
      const stat = classSubjectStats.get(s.subject) ?? { correct: 0, total: 0 };
      stat.total += s.total;
      stat.correct += s.correct;
      classSubjectStats.set(s.subject, stat);
    }
  }
  const classSubjectRows = [...classSubjectStats.entries()].sort(
    (a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <h1 className="page-title">Risultati</h1>
          <p className="mt-1 text-sm text-muted">{track.label}</p>
        </div>
        {/* Il test d'ingresso non è fra questi: lo fa chi un account non ce l'ha
            ancora, quindi non produce tentativi. Ma è qui che lo si viene a cercare. */}
        <Link
          href="/teacher/prova-ingresso"
          className="text-sm font-medium text-brand-strong hover:underline"
        >
          Test di valutazione iniziale →
        </Link>
      </div>

      <form
        method="GET"
        className="flex flex-wrap items-end gap-3 card p-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="f-studente" className="text-xs font-medium text-muted">Studente</label>
          <select
            id="f-studente"
            name="studentId"
            defaultValue={params.studentId ?? ""}
            className="field"
          >
            <option value="">Tutti</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="f-test" className="text-xs font-medium text-muted">Test</label>
          <select
            id="f-test"
            name="testId"
            defaultValue={params.testId ?? ""}
            className="field"
          >
            <option value="">Tutti</option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="f-da" className="text-xs font-medium text-muted">Da</label>
          <input
            type="date"
            id="f-da"
            name="from"
            defaultValue={params.from ?? ""}
            className="field"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="f-a" className="text-xs font-medium text-muted">A</label>
          <input
            type="date"
            id="f-a"
            name="to"
            defaultValue={params.to ?? ""}
            className="field"
          />
        </div>
        <button
          type="submit"
          className="btn btn-brand"
        >
          Filtra
        </button>
        {(params.studentId || params.testId || params.from || params.to) && (
          <Link
            href="/teacher/results"
            className="text-xs text-muted hover:text-foreground"
          >
            Azzera filtri
          </Link>
        )}
      </form>

      {studentSummaries.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">
            Panoramica per studente
          </h2>
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Studente</th>
                  <th className="px-4 py-3 font-medium">Tentativi</th>
                  <th className="px-4 py-3 font-medium">Media</th>
                  <th className="px-4 py-3 font-medium">Materia più debole</th>
                </tr>
              </thead>
              <tbody>
                {studentSummaries.map((s) => (
                  <tr key={s.studentId} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/teacher/results/student/${s.studentId}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {s.studentName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{s.attemptCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.avgPercentage < 50
                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                            : s.avgPercentage < 70
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        }`}
                      >
                        {s.avgPercentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{s.weakestSubject ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {classSubjectRows.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">
            Andamento per materia (tutta la classe)
          </h2>
          <div className="card p-4">
            <ul className="flex flex-col gap-2.5">
              {classSubjectRows.map(([subject, stat]) => {
                const pct = Math.round((stat.correct / stat.total) * 100);
                // Il nome della materia sopra la barra, non in una colonna fissa da
                // 12rem: "Chimica e propedeutica biochimica" veniva tagliato mentre
                // a destra restava mezza riga di barra vuota.
                return (
                  <li key={subject} className="flex flex-col gap-1 text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-foreground">{subject}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {stat.correct}/{stat.total} corrette &middot; {pct}%
                      </span>
                    </div>
                    <span className="h-2 overflow-hidden rounded-full bg-line">
                      <span
                        className="block h-full rounded-full bg-brand"
                        style={{ width: `${Math.max(pct, 1)}%` }}
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="section-title">
          Tutti i tentativi
        </h2>
        <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Studente</th>
              <th className="px-4 py-3 font-medium">Test</th>
              <th className="px-4 py-3 font-medium">Punteggio</th>
              <th className="px-4 py-3 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {attempts.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3">
                  <EmptyState icon="📊" title="Nessun tentativo trovato" description="Prova a cambiare i filtri qui sopra." bare />
                </td>
              </tr>
            )}
            {attempts.map((attempt) => {
              const percentage =
                attempt.maxScore && attempt.maxScore > 0
                  ? Math.round(((attempt.score ?? 0) / attempt.maxScore) * 100)
                  : 0;
              return (
                <tr key={attempt.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/teacher/results/student/${attempt.studentId}`}
                      className="text-foreground hover:underline"
                    >
                      {attempt.student.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/teacher/results/test/${attempt.testId}`}
                      className="text-foreground hover:underline"
                    >
                      {titoloTest(attempt.test.title).nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/teacher/results/attempt/${attempt.id}`} className="hover:underline">
                      {formatScore(attempt.score)} / {formatScore(attempt.maxScore)} ({percentage}%)
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {attempt.submittedAt?.toLocaleString("it-IT")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  );
}
