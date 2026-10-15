import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudentTrack } from "@/lib/track-session";
import { SubmitButton } from "@/components/SubmitButton";
import { publishedNote } from "@/lib/notes";
import { topicLabel, MIN_TOPIC_QUESTIONS } from "@/lib/topics";
import { poolCounts } from "@/lib/question-pool";
import { percorsoMateria } from "@/lib/appunti-materie";
import { generateTopicPractice } from "@/app/student/dashboard/actions";

/*
 * L'appunto di ripasso di un argomento. In fondo c'è il pulsante per allenarsi
 * subito sullo stesso argomento: leggere e poi provare è il motivo per cui questa
 * pagina sta dentro l'app invece che in un file a parte.
 *
 * Il testo arriva dalla cache degli appunti (lib/notes.ts), già convertito in
 * HTML: aprire un appunto non interroga il database.
 */
export default async function StudentNotePage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const { track } = await requireStudentTrack();

  const [nota, pool] = await Promise.all([publishedNote(topic), poolCounts(track.id)]);

  // Una bozza, o un appunto di un altro percorso, per lo studente non esiste.
  if (!nota || nota.track !== track.id) notFound();

  const domande = pool.byTopic.get(topic) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={percorsoMateria(nota.subject)} className="text-sm font-medium text-muted hover:text-brand-strong">
          &larr; {nota.subject}
        </Link>
        <h1 className="page-title mt-2">{topicLabel(nota.topic) ?? nota.title}</h1>
        <p className="mt-1 text-sm text-muted">
          Appunto di ripasso · {nota.subject} · aggiornato il{" "}
          {new Date(nota.updatedAt).toLocaleDateString("it-IT")}
        </p>
      </div>

      {/* Su schermo largo l'indice sta di fianco e resta fermo mentre si
          scorre; sotto i 1024px diventa un riquadro richiudibile in cima, che
          è l'unico posto dove non ruba spazio al testo. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:items-start lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          {nota.indice.length > 1 && (
            <details className="card p-4 lg:hidden">
              <summary className="cursor-pointer list-none text-sm font-semibold">
                Indice · {nota.indice.length} capitoli
              </summary>
              <ol className="mt-3 flex flex-col gap-1 border-t border-line pt-3">
                {nota.indice.map((v) => (
                  <li key={v.id}>
                    <a href={`#${v.id}`} className="block py-1.5 text-sm text-muted hover:text-brand-strong">
                      {v.titolo}
                    </a>
                  </li>
                ))}
              </ol>
            </details>
          )}

          <article className="card prose p-6 sm:p-8" dangerouslySetInnerHTML={{ __html: nota.html }} />

          {domande >= MIN_TOPIC_QUESTIONS && (
            <div className="flex flex-col justify-between gap-3 rounded-3xl bg-brand p-6 text-white sm:flex-row sm:items-center">
              <div>
                <p className="font-display text-lg font-bold">Ora provaci</p>
                <p className="mt-0.5 text-sm text-white/90">
                  {domande} domande su questo argomento, pescate a caso: il modo più rapido per capire se è entrato.
                </p>
              </div>
              <form action={generateTopicPractice}>
                <input type="hidden" name="topic" value={nota.topic} />
                <SubmitButton pendingText="Preparo l'esercitazione…" className="btn btn-on-brand w-full sm:w-auto">
                  Allenati su questo argomento
                </SubmitButton>
              </form>
            </div>
          )}
        </div>

        {nota.indice.length > 1 && (
          <nav aria-label="Indice dell'appunto" className="hidden lg:sticky lg:top-6 lg:block">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted">Indice</p>
            <ol className="mt-2 flex max-h-[calc(100vh-6rem)] flex-col gap-0.5 overflow-y-auto">
              {nota.indice.map((v) => (
                <li key={v.id}>
                  <a
                    href={`#${v.id}`}
                    className="block rounded-lg px-3 py-1.5 text-sm leading-snug text-muted transition-colors hover:bg-brand-tint hover:text-brand-strong"
                  >
                    {v.titolo}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </div>
  );
}
