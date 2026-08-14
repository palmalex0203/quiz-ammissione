import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { startAttempt, generateRandomSimulation } from "./actions";

type TestRow = Awaited<ReturnType<typeof loadTests>>[number];

async function loadTests(studentId: string) {
  return prisma.test.findMany({
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
}

export default async function StudentDashboardPage() {
  const session = await requireStudent();
  const studentId = session.user.id;

  const tests = await loadTests(studentId);

  const simulazioni = tests.filter((t) => t.kind === "SIMULAZIONE");
  const generate = tests.filter((t) => t.kind === "GENERATA");
  const esercitazioni = tests.filter((t) => t.kind === "ESERCITAZIONE");

  const folders = new Map<string, TestRow[]>();
  for (const t of esercitazioni) {
    const key = t.folder ?? "Altro";
    const list = folders.get(key) ?? [];
    list.push(t);
    folders.set(key, list);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Ciao, {session.user.name}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Ecco i test disponibili da svolgere.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 shadow-sm dark:border-orange-500/20 dark:from-orange-500/5 dark:to-transparent sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xl dark:bg-orange-500/20">
            🎲
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Genera una simulazione casuale
            </p>
            <p className="mt-0.5 max-w-md text-xs text-zinc-600 dark:text-zinc-400">
              60 domande pescate a caso dal database, con la stessa struttura delle simulazioni
              ufficiali (Comprensione, Logica, Biologia, Chimica, Fisica e Matematica) e 100 minuti
              di tempo.
            </p>
          </div>
        </div>
        <form action={generateRandomSimulation}>
          <button
            type="submit"
            className="w-full shrink-0 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 sm:w-auto dark:bg-orange-500 dark:hover:bg-orange-400"
          >
            Genera e inizia
          </button>
        </form>
      </div>

      {tests.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Nessun test disponibile al momento.</p>
      )}

      {generate.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Le tue simulazioni generate
          </h2>
          <div className="flex flex-col gap-3">
            {generate.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        </section>
      )}

      {simulazioni.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Simulazioni ufficiali
          </h2>
          <div className="flex flex-col gap-3">
            {simulazioni.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        </section>
      )}

      {folders.size > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Esercitazioni per materia
          </h2>
          <div className="flex flex-col gap-3">
            {[...folders.entries()].map(([folder, folderTests]) => (
              <details
                key={folder}
                className="group rounded-2xl border border-zinc-200 bg-white shadow-sm open:pb-2 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
                      {folder.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{folder}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {folderTests.length} esercitazioni
                      </p>
                    </div>
                  </div>
                  <span className="text-zinc-400 transition-transform group-open:rotate-180 dark:text-zinc-600">
                    ▾
                  </span>
                </summary>
                <div className="flex flex-col gap-2 px-3 pb-1">
                  {folderTests.map((test) => (
                    <TestCard key={test.id} test={test} compact />
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TestCard({ test, compact }: { test: TestRow; compact?: boolean }) {
  const inProgress = test.attempts.find((a) => a.status === "IN_PROGRESS");
  const submitted = test.attempts.filter((a) => a.status === "SUBMITTED");
  const lastSubmitted = submitted[0];
  const attemptsUsed = test.attempts.length;
  const remaining = test.maxAttempts != null ? test.maxAttempts - attemptsUsed : null;
  const canAttempt = remaining === null || remaining > 0;

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-orange-200 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-orange-500/30 sm:flex-row sm:items-center sm:justify-between ${
        compact ? "border-zinc-100 shadow-none dark:border-zinc-900" : ""
      }`}
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
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400"
            >
              Continua
            </button>
          </form>
        ) : canAttempt ? (
          <form action={startAttempt}>
            <input type="hidden" name="testId" value={test.id} />
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
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
}
