import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";
import { deleteTest, togglePublish } from "./actions";

export default async function TestsPage() {
  const session = await requireTeacher();

  const tests = await prisma.test.findMany({
    where: { createdById: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, attempts: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Test</h1>
        <Link
          href="/teacher/tests/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Nuovo test
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {tests.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Nessun test creato ancora.</p>
        )}
        {tests.map((test) => (
          <div
            key={test.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
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
        ))}
      </div>
    </div>
  );
}
