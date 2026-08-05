import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export default async function TeacherDashboardPage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const [studentCount, testCount, attemptCount] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.test.count({ where: { createdById: teacherId } }),
    prisma.attempt.count({ where: { status: "SUBMITTED", test: { createdById: teacherId } } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Studenti" value={studentCount} />
        <StatCard label="Test creati" value={testCount} />
        <StatCard label="Tentativi completati" value={attemptCount} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}
