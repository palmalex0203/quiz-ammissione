import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStudentTrack } from "@/lib/track-session";
import { EmptyState } from "@/components/EmptyState";
import { SubmitButton } from "@/components/SubmitButton";
import { ProgressRing } from "@/components/ProgressRing";
import { StudentTestCard } from "@/components/StudentTestCard";
import { poolCounts } from "@/lib/question-pool";
import { topicsOf, MIN_TOPIC_QUESTIONS } from "@/lib/topics";
import { paperOf, type Track } from "@/lib/tracks";
import { generateSubjectPractice, generateTopicPractice } from "@/app/student/dashboard/actions";

const SIMULAZIONI = "simulazioni";

/*
 * Esercitati è una griglia di riquadri: uno per materia del percorso aperto e uno
 * per le simulazioni svolte in classe. Toccandone uno (?materia=...) si aprono gli
 * argomenti della materia, per allenarsi con domande pescate a caso, e le
 * esercitazioni preparate dal docente.
 */
export default async function StudentPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string }>;
}) {
  const { materia } = await searchParams;
  const { session, track } = await requireStudentTrack();
  const studentId = session.user.id;

  const [pool, appunti, subjectTotals, tests] = await Promise.all([
    poolCounts(track.id),
    prisma.topicNote.findMany({
      where: { track: track.id, isPublished: true },
      select: { topic: true },
    }),
    prisma.attemptSubjectStat.groupBy({
      by: ["subject"],
      where: { attempt: { studentId, status: "SUBMITTED", test: { track: track.id } } },
      _sum: { correct: true, total: true },
    }),
    prisma.test.findMany({
      where: {
        isPublished: true,
        track: track.id,
        kind: { in: ["SIMULAZIONE", "ESERCITAZIONE"] },
        OR: [{ assignments: { none: {} } }, { assignments: { some: { studentId } } }],
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        kind: true,
        folder: true,
        timeLimitMinutes: true,
        maxAttempts: true,
        _count: { select: { questions: true } },
        attempts: { where: { studentId }, orderBy: { startedAt: "desc" }, select: { id: true, status: true } },
      },
    }),
  ]);

  const conAppunto = new Set(appunti.map((a) => a.topic));

  const subjectPct = new Map(
    subjectTotals
      .filter((s) => (s._sum.total ?? 0) > 0)
      .map((s) => [s.subject, Math.round(((s._sum.correct ?? 0) / (s._sum.total ?? 1)) * 100)])
  );

  // Ordine naturale dei titoli: "Simulazione 2" prima di "Simulazione 10".
  const byTitle = (a: { title: string }, b: { title: string }) =>
    a.title.localeCompare(b.title, "it", { numeric: true });
  tests.sort(byTitle);
  const simulazioni = tests.filter((t) => t.kind === "SIMULAZIONE");
  const esercitazioniByFolder = new Map<string, typeof tests>();
  for (const t of tests.filter((t) => t.kind === "ESERCITAZIONE")) {
    const key = t.folder ?? "Altro";
    esercitazioniByFolder.set(key, [...(esercitazioniByFolder.get(key) ?? []), t]);
  }

  const subjectNames = track.subjects.map((s) => s.name);
  const abbastanzaDomande = (code: string) => (pool.byTopic.get(code) ?? 0) >= MIN_TOPIC_QUESTIONS;
  const topicsWithQuestions = (subject: string) =>
    topicsOf(track.id, subject).filter((t) => abbastanzaDomande(t.code) || conAppunto.has(t.code));

  // Alle materie del percorso si aggiungono le cartelle di esercitazioni del docente
  // che non corrispondono a una materia (per esempio "Cultura generale").
  const tiles = [
    ...subjectNames,
    ...[...esercitazioniByFolder.keys()].filter((f) => !subjectNames.includes(f)),
  ];

  if (materia === SIMULAZIONI) {
    // Le simulazioni con una cartella (per esempio "Prove ufficiali") restano
    // raggruppate: è l'archivio delle prove già somministrate.
    const groups = new Map<string, typeof simulazioni>();
    for (const t of simulazioni) {
      const key = t.folder ?? "Simulazioni in classe";
      groups.set(key, [...(groups.get(key) ?? []), t]);
    }

    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <div>
          <h1 className="page-title">Simulazioni in classe</h1>
          <p className="mt-1 text-sm text-muted">
            Le simulazioni complete di {track.label} preparate dal docente, le stesse svolte a lezione.
          </p>
        </div>
        {simulazioni.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Nessuna simulazione per ora"
            description="Il docente non ne ha ancora pubblicate per questo percorso."
          />
        ) : (
          [...groups.entries()].map(([folder, list]) => (
            <section key={folder} className="flex flex-col gap-3">
              {groups.size > 1 && <h2 className="section-title">{folder}</h2>}
              <div className="flex flex-col gap-3">
                {list.map((t) => (
                  <StudentTestCard key={t.id} test={t} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    );
  }

  if (materia && tiles.includes(materia)) {
    const topics = topicsWithQuestions(materia);
    const esercitazioni = esercitazioniByFolder.get(materia) ?? [];
    const paper = paperOf(track, materia);
    const available = pool.bySubject.get(materia) ?? 0;
    const practiceSize = paper?.questions ?? track.practiceSizes[materia];
    const canPractice = practiceSize != null && available >= practiceSize;

    // Risultati per argomento, calcolati solo per la materia aperta.
    const stats = new Map<string, { correct: number; total: number }>();
    if (topics.length > 0) {
      const answers = await prisma.answerRecord.findMany({
        where: {
          attempt: { studentId, status: "SUBMITTED" },
          question: { topic: { in: topics.map((t) => t.code) } },
        },
        select: { isCorrect: true, question: { select: { topic: true } } },
      });
      for (const a of answers) {
        const topic = a.question.topic!;
        const s = stats.get(topic) ?? { correct: 0, total: 0 };
        s.total += 1;
        if (a.isCorrect) s.correct += 1;
        stats.set(topic, s);
      }
    }

    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <ProgressRing value={subjectPct.get(materia) ?? null} size={60} />
            <div>
              <h1 className="page-title">{materia}</h1>
              <p className="mt-1 text-sm text-muted">
                {subjectPct.has(materia)
                  ? "Percentuale di risposte corrette nei test svolti."
                  : "Non hai ancora risposto a domande di questa materia."}
              </p>
            </div>
          </div>
          {canPractice && (
            <form action={generateSubjectPractice}>
              <input type="hidden" name="subject" value={materia} />
              <SubmitButton pendingText="Preparo la prova…" className="btn btn-brand w-full sm:w-auto">
                {paper
                  ? `Prova ufficiale · ${paper.questions} domande · ${paper.minutes} min`
                  : `Tutta la materia · ${practiceSize} domande`}
              </SubmitButton>
            </form>
          )}
        </div>

        {topics.length > 0 && (
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="section-title">Argomenti</h2>
              <p className="text-sm text-muted">
                Domande pescate a caso dalla banca dati: ogni allenamento è diverso. Dove c&apos;è
                &ldquo;Ripassa&rdquo; trovi anche l&apos;appunto dell&apos;argomento.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {topics.map((topic) => {
                const stat = stats.get(topic.code);
                const pct = stat && stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : null;
                return (
                  <div
                    key={topic.code}
                    className="card card-link flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{topic.label}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {abbastanzaDomande(topic.code)
                          ? `${pool.byTopic.get(topic.code)} domande disponibili`
                          : "Nessuna domanda per ora"}
                        {pct != null && ` · ${stat!.correct} giuste su ${stat!.total} già svolte`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {pct != null && (
                        <span
                          className={`pill ${
                            pct >= 70
                              ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
                              : pct >= 50
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                                : "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
                          }`}
                        >
                          {pct}%
                        </span>
                      )}
                      {conAppunto.has(topic.code) && (
                        <Link href={`/student/appunti/${topic.code}`} className="btn btn-sm btn-soft">
                          Ripassa
                        </Link>
                      )}
                      {abbastanzaDomande(topic.code) && (
                        <form action={generateTopicPractice}>
                          <input type="hidden" name="topic" value={topic.code} />
                          <SubmitButton pendingText="Preparo…" className="btn btn-sm btn-ink">
                            Allenati
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {esercitazioni.length > 0 && (
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="section-title">Esercitazioni del docente</h2>
              <p className="text-sm text-muted">Sempre le stesse domande: utili per verificare i progressi.</p>
            </div>
            <div className="flex flex-col gap-2">
              {esercitazioni.map((t) => (
                <StudentTestCard key={t.id} test={t} />
              ))}
            </div>
          </section>
        )}

        {topics.length === 0 && esercitazioni.length === 0 && !canPractice && (
          <PoolInPreparazione track={track} subject={materia} />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Esercitati</h1>
        <p className="mt-1 text-sm text-muted">
          {track.label} · scegli una materia per vedere gli argomenti e le esercitazioni.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Link
          href={`/student/practice?materia=${SIMULAZIONI}`}
          className="col-span-2 flex flex-row-reverse items-center justify-between gap-4 rounded-[1.25rem] bg-brand p-5 text-white transition-transform hover:-translate-y-0.5 sm:col-span-3"
        >
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-xl">
            📋
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-tight">Simulazioni in classe</p>
            <p className="mt-1 text-xs text-white/85">
              {simulazioni.length} {simulazioni.length === 1 ? "simulazione" : "simulazioni"} ·{" "}
              {simulazioni.filter((t) => t.attempts.some((a) => a.status === "SUBMITTED")).length} svolte
            </p>
          </div>
        </Link>

        {tiles.map((subject) => {
          const topicCount = topicsWithQuestions(subject).length;
          const eserc = esercitazioniByFolder.get(subject)?.length ?? 0;
          const available = pool.bySubject.get(subject) ?? 0;
          const details = [
            topicCount > 0 ? `${topicCount} argomenti` : null,
            eserc > 0 ? `${eserc} ${eserc === 1 ? "esercitazione" : "esercitazioni"}` : null,
          ].filter(Boolean);
          return (
            <Link
              key={subject}
              href={`/student/practice?materia=${encodeURIComponent(subject)}`}
              className="card card-link flex flex-col justify-between gap-6 p-5 transition-transform hover:-translate-y-0.5"
            >
              <ProgressRing value={subjectPct.get(subject) ?? null} size={48} />
              <div>
                <p className="font-display text-lg font-bold leading-tight">{subject}</p>
                <p className="mt-1 text-xs text-muted">
                  {details.length > 0
                    ? details.join(" · ")
                    : available > 0
                      ? `${available} domande disponibili`
                      : "In preparazione"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function PoolInPreparazione({ track, subject }: { track: Track; subject: string }) {
  return (
    <EmptyState
      icon="🧪"
      title="Banca dati in preparazione"
      description={`Le domande di ${subject} per ${track.label} non sono ancora caricate. Appena ci saranno, qui troverai gli argomenti e la prova di materia.`}
    />
  );
}

function BackLink() {
  return (
    <Link href="/student/practice" className="self-start text-sm font-medium text-muted hover:text-brand-strong">
      &larr; Tutte le materie
    </Link>
  );
}
