import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { questionCountOf, questionCountSelect } from "@/lib/test-questions";
import { requireTeacher } from "@/lib/permissions";
import { EmptyState } from "@/components/EmptyState";
import { ALL_TRACKS, trackOf, type Track } from "@/lib/tracks";
import { togglePublish } from "./actions";
import { DeleteTestButton } from "./DeleteTestButton";

type TestRow = Awaited<ReturnType<typeof loadTests>>[number];

async function loadTests(teacherId: string, cerca?: string) {
  return prisma.test.findMany({
    where: {
      createdById: teacherId,
      kind: { in: ["SIMULAZIONE", "ESERCITAZIONE"] },
      ...(cerca ? { title: { contains: cerca, mode: "insensitive" as const } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { ...questionCountSelect, attempts: true } } },
  });
}

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireTeacher();
  const { q } = await searchParams;
  const cerca = q?.trim() || undefined;
  const tests = await loadTests(session.user.id, cerca);

  // I test sono divisi per percorso: sono due programmi diversi, con banche dati e
  // punteggi diversi, e vanno letti separatamente.
  const byTrack = ALL_TRACKS.map((track) => ({
    track,
    tests: tests.filter((t) => trackOf(t.track).id === track.id),
  })).filter((group) => group.tests.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Test</h1>
          <p className="text-sm text-muted">
            {/* Col dettaglio di un percorso solo si ripeteva due volte lo stesso
              * numero: si mostra soltanto quando i percorsi sono davvero due. */}
            {cerca
              ? `${tests.length} ${tests.length === 1 ? "test trovato" : "test trovati"} per «${cerca}»`
              : byTrack.length > 1
                ? `${tests.length} test · ${byTrack.map((g) => `${g.tests.length} ${g.track.label}`).join(" · ")}`
                : `${tests.length} test`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Una casella di ricerca: con decine di righe tutte uguali, trovarne
            * una voleva dire scorrere l'elenco intero. */}
          <form method="GET" className="flex items-center gap-2">
            <label htmlFor="cerca" className="sr-only">
              Cerca fra i test
            </label>
            <input
              id="cerca"
              type="search"
              name="q"
              defaultValue={cerca ?? ""}
              placeholder="Cerca un test…"
              className="field w-44 sm:w-56"
            />
            <button type="submit" className="btn btn-sm btn-soft">
              Cerca
            </button>
          </form>
          <Link href="/teacher/tests/new" className="btn btn-brand">
            + Nuovo test
          </Link>
        </div>
      </div>

      {tests.length === 0 && (
        <EmptyState
          icon="🗂️"
          title={cerca ? `Nessun test per «${cerca}»` : "Nessun test creato ancora"}
          description={
            cerca
              ? "Prova con un'altra parola, oppure svuota la ricerca per rivederli tutti."
              : "Crea il tuo primo test con il pulsante qui sopra."
          }
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
                className="group card open:pb-2"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand-soft font-display text-sm font-bold text-brand-strong">
                      {folder.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{folder}</p>
                      <p className="text-xs text-muted">{folderTests.length} esercitazioni</p>
                    </div>
                  </div>
                  <span className="text-muted transition-transform group-open:rotate-180">
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
                : "bg-line text-foreground"
            }`}
          >
            {test.isPublished ? "Pubblicato" : "Bozza"}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          {questionCountOf(test._count)} domande &middot; {test._count.attempts} tentativi
        </p>
      </div>
      {/* px/py anche sui comandi di solo testo: senza, sul telefono restavano
        * bersagli alti 16px a pochi pixel l'uno dall'altro. */}
      <div className="flex flex-wrap items-center gap-1">
        <form action={togglePublish}>
          <input type="hidden" name="testId" value={test.id} />
          <button
            type="submit"
            className="btn btn-sm font-semibold text-muted hover:bg-brand-tint hover:text-brand-strong"
          >
            {test.isPublished ? "Rendi bozza" : "Pubblica"}
          </button>
        </form>
        <Link
          href={`/teacher/tests/${test.id}/edit`}
          className="btn btn-sm font-semibold text-muted hover:bg-brand-tint hover:text-brand-strong"
        >
          Modifica
        </Link>
        <DeleteTestButton testId={test.id} title={test.title} attempts={test._count.attempts} />
      </div>
    </div>
  );
}
