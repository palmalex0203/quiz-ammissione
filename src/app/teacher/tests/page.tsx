import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";
import { EmptyState } from "@/components/EmptyState";
import { deleteTest, togglePublish } from "./actions";

type TestRow = Awaited<ReturnType<typeof loadTests>>[number];

async function loadTests(teacherId: string) {
  return prisma.test.findMany({
    where: { createdById: teacherId, kind: { in: ["SIMULAZIONE", "ESERCITAZIONE"] } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, attempts: true } } },
  });
}

export default async function TestsPage() {
  const session = await requireTeacher();
  const tests = await loadTests(session.user.id);

  const simulazioni = tests.filter((t) => t.kind !== "ESERCITAZIONE");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Test</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {tests.length} test totali &middot; {simulazioni.length} simulazioni &middot; {esercitazioni.length} esercitazioni
          </p>
        </div>
        <Link
          href="/teacher/tests/new"
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400"
        >
          + Nuovo test
        </Link>
      </div>

      {tests.length === 0 && (
        <EmptyState
          icon="🗂️"
          title="Nessun test creato ancora"
          description="Crea il tuo primo test con il pulsante qui sopra."
        />
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
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-orange-200 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-orange-500/30 ${
        compact ? "border-zinc-100 shadow-none dark:border-zinc-900" : ""
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          <Link
            href={`/teacher/tests/${test.id}/edit`}
            className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
          >
            {test.title}
          </Link>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              test.isPublished
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {test.isPublished ? "Pubblicato" : "Bozza"}
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {test._count.questions} domande &middot; {test._count.attempts} tentativi
        </p>
      </div>
      <div className="flex items-center gap-3">
        <form action={togglePublish}>
          <input type="hidden" name="testId" value={test.id} />
          <button
            type="submit"
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {test.isPublished ? "Rendi bozza" : "Pubblica"}
          </button>
        </form>
        <Link
          href={`/teacher/tests/${test.id}/edit`}
          className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Modifica
        </Link>
        <form action={deleteTest}>
          <input type="hidden" name="testId" value={test.id} />
          <button
            type="submit"
            className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Elimina
          </button>
        </form>
      </div>
    </div>
  );
}
