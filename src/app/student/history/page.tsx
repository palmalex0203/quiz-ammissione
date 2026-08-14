import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";

export default async function StudentHistoryPage() {
  const session = await requireStudent();

  const attempts = await prisma.attempt.findMany({
    where: { studentId: session.user.id, status: "SUBMITTED" },
    orderBy: { submittedAt: "desc" },
    include: { test: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Storico</h1>

      <div className="flex flex-col gap-3">
        {attempts.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Nessun test svolto ancora.</p>
        )}
        {attempts.map((attempt) => {
          const percentage =
            attempt.maxScore && attempt.maxScore > 0
              ? Math.round(((attempt.score ?? 0) / attempt.maxScore) * 100)
              : 0;
          return (
            <Link
              key={attempt.id}
              href={`/student/tests/${attempt.testId}/result/${attempt.id}`}
              className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-orange-200 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-orange-500/30"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{attempt.test.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {attempt.submittedAt?.toLocaleString("it-IT")}
                </p>
              </div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {attempt.score} / {attempt.maxScore} &middot; {percentage}%
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
