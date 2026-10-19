import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { questionCountOf, questionCountSelect } from "@/lib/test-questions";
import { requireTeacherTrack } from "@/lib/track-docente";
import { EmptyState } from "@/components/EmptyState";
import { togglePublish } from "./actions";
import { DeleteTestButton } from "./DeleteTestButton";

type TestRow = Awaited<ReturnType<typeof loadTests>>[number];

/*
 * I test del percorso, di chiunque li abbia fatti.
 *
 * Prima si vedevano solo i propri. Con un insegnante solo la differenza non
 * si notava; con tre, ognuno apriva la pagina e la trovava vuota — mentre gli
 * studenti svolgevano test che esistevano da mesi. Questi test sono della
 * scuola, non di chi ha premuto «nuovo»: l'autore si scrive accanto, e basta.
 *
 * Le prove ufficiali ci sono: gli studenti le hanno sempre viste, da qui
 * erano invisibili. Restano fuori invece POOL — che non è un test ma il
 * contenitore della banca domande — e GENERATA, le esercitazioni che il
 * sistema crea su richiesta di un singolo studente: sono migliaia in
 * potenza, durano una sessione e si leggono dai Risultati.
 */
const TIPI_IN_ELENCO = ["UFFICIALE", "SIMULAZIONE", "ESERCITAZIONE"];

async function loadTests(trackId: string, cerca?: string) {
  return prisma.test.findMany({
    where: {
      track: trackId,
      kind: { in: TIPI_IN_ELENCO },
      ...(cerca ? { title: { contains: cerca, mode: "insensitive" as const } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { ...questionCountSelect, attempts: true } },
    },
  });
}

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { session, trackId, track } = await requireTeacherTrack();
  const { q } = await searchParams;
  const cerca = q?.trim() || undefined;

  // Solo i test del corso aperto: sono due programmi diversi, con banche
  // dati e punteggi diversi, e si leggono separatamente. Il filtro è nella
  // query e non qui, così la ricerca cerca dentro il corso giusto.
  const tests = await loadTests(trackId, cerca);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Test</h1>
          <p className="mt-1 text-sm text-muted">
            {cerca
              ? `${tests.length} ${tests.length === 1 ? "test trovato" : "test trovati"} per «${cerca}» in ${track.label}`
              : `${track.label} · ${tests.length} ${tests.length === 1 ? "test" : "test"}`}
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

      {tests.length > 0 && <TrackSection tests={tests} ioSono={session.user.id} />}
    </div>
  );
}

function TrackSection({ tests, ioSono }: { tests: TestRow[]; ioSono: string }) {
  const ufficiali = tests.filter((t) => t.kind === "UFFICIALE");
  const esercitazioni = tests.filter((t) => t.kind === "ESERCITAZIONE");
  const simulazioni = tests.filter((t) => t.kind !== "ESERCITAZIONE" && t.kind !== "UFFICIALE");

  const folders = new Map<string, TestRow[]>();
  for (const t of esercitazioni) {
    const key = t.folder ?? "Altro";
    folders.set(key, [...(folders.get(key) ?? []), t]);
  }

  return (
    <section className="flex flex-col gap-6">
      {ufficiali.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="section-title">Prove ufficiali</h3>
          <p className="-mt-2 text-sm text-muted">
            Gli appelli veri degli anni scorsi. Gli studenti li hanno sempre visti; da qui erano
            invisibili.
          </p>
          <div className="flex flex-col gap-3">
            {ufficiali.map((test) => (
              <TestCard key={test.id} test={test} ioSono={ioSono} />
            ))}
          </div>
        </div>
      )}

      {simulazioni.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="section-title">Simulazioni</h3>
          <div className="flex flex-col gap-3">
            {simulazioni.map((test) => (
              <TestCard key={test.id} test={test} ioSono={ioSono} />
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
                    <TestCard key={test.id} test={test} ioSono={ioSono} compact />
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

function TestCard({
  test,
  ioSono,
  compact,
}: {
  test: TestRow;
  ioSono: string;
  compact?: boolean;
}) {
  // L'autore si scrive solo quando non sei tu: su una pagina dove quasi tutto
  // è tuo, «creato da me» ripetuto trenta volte è rumore.
  const altrui = test.createdBy.id !== ioSono ? test.createdBy.name : null;

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
          {altrui && <> &middot; di {altrui}</>}
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
        <DeleteTestButton
          testId={test.id}
          title={test.title}
          attempts={test._count.attempts}
          autore={altrui}
        />
      </div>
    </div>
  );
}
