import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";
import type { Prisma } from "@/generated/prisma/client";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; testId?: string; from?: string; to?: string }>;
}) {
  const session = await requireTeacher();
  const params = await searchParams;

  const [students, tests] = await Promise.all([
    prisma.user.findMany({ where: { role: "STUDENT" }, orderBy: { name: "asc" } }),
    prisma.test.findMany({ where: { createdById: session.user.id }, orderBy: { title: "asc" } }),
  ]);

  const where: Prisma.AttemptWhereInput = {
    status: "SUBMITTED",
    test: { createdById: session.user.id },
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Risultati</h1>

      <form
        method="GET"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Studente</label>
          <select
            name="studentId"
            defaultValue={params.studentId ?? ""}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Test</label>
          <select
            name="testId"
            defaultValue={params.testId ?? ""}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Da</label>
          <input
            type="date"
            name="from"
            defaultValue={params.from ?? ""}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">A</label>
          <input
            type="date"
            name="to"
            defaultValue={params.to ?? ""}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400"
        >
          Filtra
        </button>
        {(params.studentId || params.testId || params.from || params.to) && (
          <Link
            href="/teacher/results"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Azzera filtri
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
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
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  Nessun tentativo trovato.
                </td>
              </tr>
            )}
            {attempts.map((attempt) => {
              const percentage =
                attempt.maxScore && attempt.maxScore > 0
                  ? Math.round(((attempt.score ?? 0) / attempt.maxScore) * 100)
                  : 0;
              return (
                <tr key={attempt.id} className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-900">
                  <td className="px-4 py-3">
                    <Link
                      href={`/teacher/results/student/${attempt.studentId}`}
                      className="text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {attempt.student.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/teacher/results/test/${attempt.testId}`}
                      className="text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {attempt.test.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/teacher/results/attempt/${attempt.id}`} className="hover:underline">
                      {attempt.score} / {attempt.maxScore} ({percentage}%)
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {attempt.submittedAt?.toLocaleString("it-IT")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
