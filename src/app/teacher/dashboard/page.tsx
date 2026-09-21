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
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-muted">Panoramica della tua scuola.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Studenti" value={studentCount} icon="👥" />
        <StatCard label="Test creati" value={testCount} icon="📝" />
        <StatCard label="Tentativi completati" value={attemptCount} icon="✅" />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-xl">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-0.5 font-display text-4xl font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
