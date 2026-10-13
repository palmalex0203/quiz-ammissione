import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";
import { formatScore } from "@/lib/tracks";
import { titoloTest } from "@/lib/titoli";

export default async function TeacherDashboardPage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const [studentCount, testCount, attemptCount, ultime] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.test.count({ where: { createdById: teacherId } }),
    prisma.attempt.count({ where: { status: "SUBMITTED", test: { createdById: teacherId } } }),
    /*
     * Le ultime consegne: aprendo la dashboard la prima domanda è "chi ha fatto
     * cosa", e la pagina rispondeva con tre totali e mezzo schermo vuoto.
     * Otto righe con una sola query ordinata, non un ricalcolo.
     */
    prisma.attempt.findMany({
      where: { status: "SUBMITTED", test: { createdById: teacherId } },
      orderBy: { submittedAt: "desc" },
      take: 8,
      select: {
        id: true,
        score: true,
        maxScore: true,
        submittedAt: true,
        student: { select: { name: true } },
        test: { select: { title: true } },
      },
    }),
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
        <StatCard label="Prove consegnate" value={attemptCount} icon="✅" />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="section-title">Ultime consegne</h2>
          <Link href="/teacher/results" className="text-sm font-medium text-brand-strong hover:underline">
            Tutti i risultati
          </Link>
        </div>
        {ultime.length === 0 ? (
          <EmptyState
            icon="📊"
            title="Nessuna prova consegnata"
            description="Qui vedrai le ultime prove che gli studenti consegnano, dalla più recente."
          />
        ) : (
          <div className="card divide-y divide-line">
            {ultime.map((a) => {
              const pct =
                a.maxScore && a.maxScore > 0 ? Math.round(((a.score ?? 0) / a.maxScore) * 100) : 0;
              return (
                <Link
                  key={a.id}
                  href={`/teacher/results/attempt/${a.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-brand-tint"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{a.student.name}</p>
                    <p className="truncate text-xs text-muted">
                      {titoloTest(a.test.title).nome} · {a.submittedAt?.toLocaleString("it-IT")}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {formatScore(a.score)} / {formatScore(a.maxScore)}
                    <span className="text-muted"> · {pct}%</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    // .card invece dei colori fissi: con bg-white/dark:bg-zinc-950 in tema scuro
    // il riquadro spariva nel fondo (1,01:1), restava solo il filo del bordo.
    <div className="card flex items-center gap-4 p-5">
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
