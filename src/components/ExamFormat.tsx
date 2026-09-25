import { formatPoints, simulationSize, subjectShort, type Track } from "@/lib/tracks";

/**
 * Com'è fatta la prova del percorso: le materie con il loro peso e il punteggio.
 * Serve anche quando la banca dati è ancora vuota, perché è la prima cosa che uno
 * studente deve avere chiara.
 */
export function ExamFormat({ track }: { track: Track }) {
  // Dove l'esame è diviso in prove separate (semestre filtro) si mostrano quelle,
  // con i minuti di ciascuna; altrove il peso delle materie nella prova unica.
  const rows =
    track.papers.length > 0
      ? track.papers.map((p) => ({
          subject: p.subject,
          primary: `${p.questions} domande`,
          secondary: `${p.minutes} minuti`,
        }))
      : track.simulation.blocks.map((b) => ({
          subject: b.subject,
          primary: `${b.count} domande`,
          secondary: null,
        }));

  return (
    <section className="card flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="section-title">Com&apos;è fatta la prova</h2>
        <p className="text-xs text-muted">
          {simulationSize(track)} domande · {track.simulation.minutes} minuti in tutto
        </p>
      </div>

      <ol className="grid gap-2 sm:grid-cols-3">
        {rows.map((row, i) => (
          <li key={row.subject} className="flex items-center gap-3 rounded-2xl bg-brand-tint px-3 py-2.5">
            {track.papers.length > 0 && (
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-xs font-bold text-brand-strong"
              >
                {i + 1}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{subjectShort(track, row.subject)}</p>
              <p className="text-xs text-muted">
                {row.primary}
                {row.secondary && ` · ${row.secondary}`}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <p className="text-xs text-muted">
        Punteggio: {formatPoints(track.scoring.correct)} risposta corretta ·{" "}
        {formatPoints(track.scoring.incorrect)} errata · 0 non data.
      </p>
    </section>
  );
}
