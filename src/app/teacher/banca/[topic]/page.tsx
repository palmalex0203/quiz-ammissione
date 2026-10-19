import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/EmptyState";
import { requireTeacherTrack } from "@/lib/track-docente";
import { etichettaTipo } from "@/lib/completion";
import { isKnownTopic, topicLabel, topicSubject, topicTrack } from "@/lib/topics";
import { NuovaDomanda } from "./NuovaDomanda";

/*
 * Le domande di un argomento, così come sono scritte nella banca.
 *
 * Fino a qui l'insegnante poteva sapere *quante* domande ci sono su un
 * argomento, ma non leggerne una: per vederle bisognava aprire il database.
 * Ed è la cosa che serve più spesso — prima di spiegare, per sapere come viene
 * chiesto; dopo un'esercitazione andata male, per capire su cosa hanno
 * sbagliato; e quando uno studente contesta una risposta.
 *
 * La risposta giusta è in chiaro, segnata in verde. Questa pagina sta dietro
 * il login dell'insegnante: è l'unico posto dell'applicazione dove le
 * soluzioni si vedono tutte insieme senza aver svolto niente.
 */
export default async function BancaArgomentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { topic } = await params;
  const { q } = await searchParams;
  const cerca = q?.trim() || undefined;
  const { trackId, track } = await requireTeacherTrack();

  // Un argomento dell'altro percorso non si apre da qui: si cambia percorso.
  if (!isKnownTopic(topic) || topicTrack(topic) !== trackId) notFound();

  const materia = topicSubject(topic);

  const domande = await prisma.question.findMany({
    where: {
      topic,
      test: { kind: "POOL", track: trackId },
      ...(cerca ? { text: { contains: cerca, mode: "insensitive" as const } } : {}),
    },
    orderBy: [{ subject: "asc" }, { order: "asc" }],
    select: {
      id: true,
      type: true,
      text: true,
      subject: true,
      options: { orderBy: { order: "asc" }, select: { id: true, text: true, isCorrect: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/teacher/banca" className="text-sm font-medium text-muted hover:text-brand-strong">
          &larr; Banca domande
        </Link>
        <h1 className="page-title mt-2">{topicLabel(topic) ?? topic}</h1>
        <p className="mt-1 text-sm text-muted">
          {track.label}
          {materia && ` · ${materia}`} · {topic} ·{" "}
          {cerca
            ? `${domande.length} ${domande.length === 1 ? "domanda trovata" : "domande trovate"} per «${cerca}»`
            : `${domande.length} ${domande.length === 1 ? "domanda" : "domande"}`}
        </p>
      </div>

      {/* Settanta domande su un argomento sono tante da scorrere: cercare una
          parola è il modo in cui si ritrova quella che si aveva in mente. */}
      <form method="GET" className="card flex flex-wrap items-end gap-2 p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor="cerca" className="text-xs font-medium text-muted">
            Cerca nel testo delle domande
          </label>
          <input
            id="cerca"
            type="search"
            name="q"
            defaultValue={cerca ?? ""}
            placeholder="es. mitocondrio"
            className="field w-full"
          />
        </div>
        <button type="submit" className="btn btn-brand">
          Cerca
        </button>
        {cerca && (
          <Link href={`/teacher/banca/${topic}`} className="btn btn-sm btn-soft">
            Azzera
          </Link>
        )}
      </form>

      <NuovaDomanda topic={topic} argomento={topicLabel(topic) ?? topic} />

      {domande.length === 0 ? (
        <EmptyState
          icon="🔍"
          title={cerca ? `Nessuna domanda per «${cerca}»` : "Nessuna domanda su questo argomento"}
          description={
            cerca
              ? "Prova con un'altra parola, oppure azzera la ricerca."
              : "Finché la banca è vuota su questo argomento, lo studente non può allenarcisi."
          }
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {domande.map((d, i) => (
            <li key={d.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill bg-line tabular-nums">{i + 1}</span>
                <span className="pill pill-brand">{etichettaTipo(d.type)}</span>
                {d.subject !== materia && <span className="pill bg-line">{d.subject}</span>}
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{d.text}</p>

              {d.options.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {d.options.map((o) => (
                    <li
                      key={o.id}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        o.isCorrect
                          ? "bg-green-100 font-semibold text-green-900 dark:bg-green-900/40 dark:text-green-200"
                          : "bg-brand-tint"
                      }`}
                    >
                      {o.isCorrect && (
                        <span aria-hidden className="mr-1.5">
                          ✓
                        </span>
                      )}
                      <span className={o.isCorrect ? "" : "text-muted"}>{o.text}</span>
                    </li>
                  ))}
                </ul>
              )}

              {d.options.length === 0 && (
                <p className="mt-3 text-sm text-muted">
                  Nessuna risposta registrata per questa domanda: così com&apos;è non si può
                  correggere.
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      {materia && domande.length > 0 && (
        <p className="text-sm text-muted">
          <Link href="/teacher/banca" className="underline hover:text-brand-strong">
            Torna alla banca
          </Link>{" "}
          per gli altri argomenti di {materia}.
        </p>
      )}
    </div>
  );
}
