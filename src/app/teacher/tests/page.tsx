import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";
import { EmptyState } from "@/components/EmptyState";
import { ALL_TRACKS, trackOf, type Track } from "@/lib/tracks";
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

  // I test sono divisi per percorso: sono due programmi diversi, con banche dati e
  // punteggi diversi, e vanno letti separatamente.
  const byTrack = ALL_TRACKS.map((track) => ({
    track,
    tests: tests.filter((t) => trackOf(t.track).id === track.id),
  })).filter((group) => group.tests.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Test</h1>
          <p className="text-sm text-muted">
            {tests.length} test totali &middot;{" "}
            {byTrack.map((g) => `${g.tests.length} ${g.track.label}`).join(" · ") || "nessun percorso attivo"}
          </p>
        </div>
        <Link href="/teacher/tests/new" className="btn btn-brand">
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

      {byTrack.map(({ track, tests: trackTests }) => (
        <TrackSection key={track.id} track={track} tests={trackTests} showTrackName={byTrack.length > 1} />
      ))}
    </div>
  );
}

function TrackSection({
  track,
  tests,
  showTrackName,
}: {
  track: Track;
  tests: TestRow[];
  showTrackName: boolean;
}) {
  const simulazioni = tests.filter((t) => t.kind !== "ESERCITAZIONE");
  const esercitazioni = tests.filter((t) => t.kind === "ESERCITAZIONE");

  const folders = new Map<string, TestRow[]>();
  for (const t of esercitazioni) {
    const key = t.folder ?? "Altro";
    folders.set(key, [...(folders.get(key) ?? []), t]);
  }

  return (
    <section className="flex flex-col gap-4">
      {showTrackName && (
        <div className="flex items-baseline gap-2 border-b border-line pb-2">
          <h2 className="font-display text-xl font-bold tracking-tight">{track.label}</h2>
          <span className="text-xs text-muted">{track.tagline}</span>
        </div>
      )}

      {simulazioni.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="section-title">Simulazioni</h3>
          <div className="flex flex-col gap-3">
            {simulazioni.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        </div>
      )}

      {folders.size > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="section-title">Esercitazioni per materia</h3>
          <div className="flex flex-col gap-3">
            {[...folders.entries()].map(([folder, folderTests]) => (
              <details
                key={folder}
                className="group rounded-2xl border border-zinc-200 bg-white shadow-sm open:pb-2 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand-soft font-display text-sm font-bold text-brand-strong">
                      {folder.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{folder}</p>
                      <p className="text-xs text-muted">{folderTests.length} esercitazioni</p>
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
        </div>
      )}
    </section>
  );
}

function TestCard({ test, compact }: { test: TestRow; compact?: boolean }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 card card-link p-5 ${
        compact ? "rounded-2xl border-line" : ""
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          <Link
            href={`/teacher/tests/${test.id}/edit`}
            className="text-sm font-semibold hover:text-brand-strong"
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
        <p className="mt-1 text-xs text-muted">
          {test._count.questions} domande &middot; {test._count.attempts} tentativi
        </p>
      </div>
      <div className="flex items-center gap-3">
        <form action={togglePublish}>
          <input type="hidden" name="testId" value={test.id} />
          <button type="submit" className="text-xs font-semibold text-muted hover:text-brand-strong">
            {test.isPublished ? "Rendi bozza" : "Pubblica"}
          </button>
        </form>
        <Link
          href={`/teacher/tests/${test.id}/edit`}
          className="text-xs font-semibold text-muted hover:text-brand-strong"
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
