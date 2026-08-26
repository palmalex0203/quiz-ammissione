import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { EmptyState } from "@/components/EmptyState";
import { TOPICS_BY_SUBJECT, MIN_TOPIC_QUESTIONS } from "@/lib/topics";
import { PRACTICE_SIZES } from "@/lib/subjects";
import { generateSubjectPractice, generateTopicPractice } from "@/app/student/dashboard/actions";

export default async function StudentPracticePage() {
  const session = await requireStudent();

  // Quante domande ha ogni argomento nella banca dati: gli argomenti troppo scarni
  // non vengono proposti, quelli sotto la misura standard daranno un test più corto.
  const poolRows = await prisma.$queryRaw<{ topic: string; n: bigint }[]>`
    SELECT q.topic as topic, COUNT(*) as n
    FROM "Question" q JOIN "Test" t ON q."testId" = t.id
    WHERE t.kind = 'POOL' AND q.topic IS NOT NULL
    GROUP BY q.topic
  `;
  const poolCount = new Map(poolRows.map((r) => [r.topic, Number(r.n)]));

  // Risultati dello studente per argomento, su tutte le domande già incontrate.
  const answers = await prisma.answerRecord.findMany({
    where: { attempt: { studentId: session.user.id, status: "SUBMITTED" } },
    select: { isCorrect: true, question: { select: { topic: true } } },
  });
  const stats = new Map<string, { correct: number; total: number }>();
  for (const a of answers) {
    const topic = a.question.topic;
    if (!topic) continue;
    const s = stats.get(topic) ?? { correct: 0, total: 0 };
    s.total += 1;
    if (a.isCorrect) s.correct += 1;
    stats.set(topic, s);
  }

  const subjects = Object.entries(TOPICS_BY_SUBJECT)
    .map(([subject, topics]) => ({
      subject,
      topics: topics.filter((t) => (poolCount.get(t.code) ?? 0) >= MIN_TOPIC_QUESTIONS),
    }))
    .filter((s) => s.topics.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Esercitati</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Scegli una materia intera o un singolo argomento di programma: le domande vengono pescate
          a caso dalla banca dati, quindi l&apos;esercitazione è sempre diversa.
        </p>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="Nessun argomento disponibile"
          description="La banca dati non contiene ancora abbastanza domande per creare esercitazioni mirate."
        />
      ) : (
        subjects.map(({ subject, topics }) => (
          <section key={subject} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {subject}
              </h2>
              {PRACTICE_SIZES[subject] && (
                <form action={generateSubjectPractice}>
                  <input type="hidden" name="subject" value={subject} />
                  <button
                    type="submit"
                    className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-500/25 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
                  >
                    Tutta la materia ({PRACTICE_SIZES[subject]} domande)
                  </button>
                </form>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {topics.map((topic) => {
                const stat = stats.get(topic.code);
                const pct = stat && stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : null;
                const available = poolCount.get(topic.code) ?? 0;
                return (
                  <div
                    key={topic.code}
                    className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-orange-200 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-orange-500/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {topic.label}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {available} domande disponibili
                        {pct != null && ` · sei al ${pct}% su ${stat!.total} già svolte`}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {pct != null && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            pct >= 70
                              ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                              : pct >= 50
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                                : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                          }`}
                        >
                          {pct}%
                        </span>
                      )}
                      <form action={generateTopicPractice}>
                        <input type="hidden" name="topic" value={topic.code} />
                        <button
                          type="submit"
                          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                        >
                          Allenati
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
