import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStudentTrack } from "@/lib/track-session";
import { EmptyState } from "@/components/EmptyState";
import { SubmitButton } from "@/components/SubmitButton";
import { startAttempt } from "@/app/student/dashboard/actions";
import {
  KIND_UFFICIALE,
  etichettaAppello,
  pdfUrl,
  proveUfficialiOf,
  type ProvaUfficiale,
} from "@/lib/prove-ufficiali";

export const metadata = { title: "Prove ufficiali anni precedenti" };

/*
 * L'archivio delle prove d'esame già somministrate: i fascicoli del Ministero,
 * scaricabili come sono, e la stessa prova da svolgere col tempo vero dell'esame.
 * L'anagrafica sta in src/lib/prove-ufficiali.ts, le domande nel database.
 */
export default async function ProveUfficialiPage() {
  const { session, track } = await requireStudentTrack();
  const prove = proveUfficialiOf(track.id);

  const tests =
    prove.length === 0
      ? []
      : await prisma.test.findMany({
          where: {
            kind: KIND_UFFICIALE,
            track: track.id,
            isPublished: true,
            title: { in: prove.map((p) => p.title) },
          },
          select: {
            id: true,
            title: true,
            timeLimitMinutes: true,
            _count: { select: { questions: true } },
            attempts: {
              where: { studentId: session.user.id },
              orderBy: { startedAt: "desc" },
              select: { id: true, status: true },
            },
          },
        });

  const perTitolo = new Map(tests.map((t) => [t.title, t]));

  // Un gruppo per appello, nell'ordine in cui le prove sono elencate.
  const gruppi = new Map<string, ProvaUfficiale[]>();
  for (const p of prove) {
    const key = etichettaAppello(p);
    gruppi.set(key, [...(gruppi.get(key) ?? []), p]);
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/student/practice" className="self-start text-sm font-medium text-muted hover:text-brand-strong">
        &larr; Esercitati
      </Link>

      <div>
        <h1 className="page-title">Prove ufficiali anni precedenti</h1>
        <p className="mt-1 text-sm text-muted">
          I fascicoli d&apos;esame già somministrati dal Ministero per {track.label}. Puoi scaricarli come
          sono o svolgerli qui con il tempo vero della prova.
        </p>
      </div>

      {prove.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title="Nessuna prova ufficiale per questo percorso"
          description="Qui compariranno i fascicoli d'esame degli appelli passati, appena saranno disponibili."
        />
      ) : (
        <>
          <div className="rounded-[1.25rem] border border-brand/25 bg-brand-tint px-5 py-4 text-sm text-muted">
            <p>
              <strong className="font-semibold text-foreground">Attenzione alle correzioni.</strong> Il
              Ministero pubblica i fascicoli ma non le risposte corrette: quelle usate qui sono state
              ricavate e attendono la validazione del docente. Se una correzione ti sembra sbagliata,
              segnalala.
            </p>
          </div>

          {[...gruppi.entries()].map(([appello, lista]) => (
            <section key={appello} className="flex flex-col gap-3">
              <h2 className="section-title">{appello}</h2>
              <div className="flex flex-col gap-3">
                {lista.map((prova) => (
                  <ProvaCard key={prova.slug} prova={prova} test={perTitolo.get(prova.title)} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

type TestDiProva = {
  id: string;
  timeLimitMinutes: number | null;
  _count: { questions: number };
  attempts: { id: string; status: "IN_PROGRESS" | "SUBMITTED" }[];
};

function ProvaCard({ prova, test }: { prova: ProvaUfficiale; test?: TestDiProva }) {
  const inCorso = test?.attempts.find((a) => a.status === "IN_PROGRESS");
  const ultimaSvolta = test?.attempts.find((a) => a.status === "SUBMITTED");

  return (
    <div className="card flex flex-col gap-3 px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{prova.subject}</p>
            {inCorso && <span className="pill pill-brand">In corso</span>}
            {!inCorso && ultimaSvolta && (
              <span className="pill bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">Svolta</span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            {test ? `${test._count.questions} domande` : `${prova.questions} domande`} ·{" "}
            {test?.timeLimitMinutes ?? prova.minutes} min · 15 a scelta multipla e 16 a completamento
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <a
            href={pdfUrl(prova)}
            target="_blank"
            rel="noopener"
            className="text-xs font-semibold text-muted hover:text-brand-strong"
          >
            Fascicolo PDF
          </a>
          {ultimaSvolta && test && (
            <Link
              href={`/student/tests/${test.id}/result/${ultimaSvolta.id}`}
              className="text-xs font-semibold text-muted hover:text-brand-strong"
            >
              Ultimo risultato
            </Link>
          )}
          {test ? (
            <form action={startAttempt}>
              <input type="hidden" name="testId" value={test.id} />
              <SubmitButton pendingText="Avvio la prova…" className="btn btn-sm btn-ink">
                {inCorso ? "Continua" : ultimaSvolta ? "Rifai" : "Svolgi la prova"}
              </SubmitButton>
            </form>
          ) : (
            <span className="text-xs font-medium text-muted">Solo fascicolo</span>
          )}
        </div>
      </div>

      {prova.nota && <p className="text-xs text-muted">{prova.nota}</p>}
    </div>
  );
}
