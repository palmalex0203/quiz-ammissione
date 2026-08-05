import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { startAttempt } from "./actions";

export default async function StudentDashboardPage() {
  const session = await requireStudent();
  const studentId = session.user.id;

  const tests = await prisma.test.findMany({
    where: {
      isPublished: true,
      OR: [{ assignments: { none: {} } }, { assignments: { some: { studentId } } }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      questions: { select: { id: true } },
      attempts: { where: { studentId }, orderBy: { startedAt: "desc" } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Ciao, {session.user.name}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Ecco i test disponibili da svolgere.</p>
      </div>

      <div className="flex flex-col gap-3">
        {tests.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nessun test disponibile al momento.
          </p>
        )}
        {tests.map((test) => {
          const inProgress = test.attempts.find((a) => a.status === "IN_PROGRESS");
          const submitted = test.attempts.filter((a) => a.status === "SUBMITTED");
          const lastSubmitted = submitted[0];
          const attemptsUsed = test.attempts.length;
          const remaining = test.maxAttempts != null ? test.maxAttempts - attemptsUsed : null;
          const canAttempt = remaining === null || remaining > 0;

          return (
            <div
              key={test.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{test.title}</p>
                {test.description && (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{test.description}</p>
                )}
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {test.questions.length} domande
                  {test.timeLimitMinutes ? ` · ${test.timeLimitMinutes} min` : ""}
                  {test.maxAttempts != null ? ` · ${attemptsUsed}/${test.maxAttempts} tentativi` : ""}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {lastSubmitted && (
                  <Link
                    href={`/student/tests/${test.id}/result/${lastSubmitted.id}`}
                    className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Ultimo risultato
                  </Link>
                )}

                {inProgress ? (
                  <form action={startAttempt}>
                    <input type="hidden" name="testId" value={test.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                    >
                      Continua
                    </button>
                  </form>
                ) : canAttempt ? (
                  <form action={startAttempt}>
                    <input type="hidden" name="testId" value={test.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                    >
                      {attemptsUsed > 0 ? "Rifai il test" : "Inizia test"}
                    </button>
                  </form>
                ) : (
                  <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">
                    Tentativi esauriti
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
