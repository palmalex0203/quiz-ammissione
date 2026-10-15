import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudentTrack } from "@/lib/track-session";
import { publishedNotes } from "@/lib/notes";
import { topicLabel, topicsOf } from "@/lib/topics";
import { iconaMateria } from "@/lib/appunti-materie";

/*
 * Gli argomenti di una materia, uno per riga.
 *
 * Sta su una pagina sua e non dentro l'elenco delle materie: con il programma
 * completo le tre materie del semestre filtro fanno 21 argomenti, e aprirli
 * tutti nella stessa schermata vorrebbe dire scorrere per trovare il proprio.
 *
 * Sotto il nome dell'argomento non si scrive niente: numero di parole e data
 * non aiutano a scegliere cosa ripassare, e sporcano una lista che deve essere
 * letta a colpo d'occhio.
 */
export default async function AppuntiMateriaPage({
  params,
}: {
  params: Promise<{ materia: string }>;
}) {
  const { materia } = await params;
  const nome = decodeURIComponent(materia);
  const { track } = await requireStudentTrack();

  // Una materia che non appartiene al percorso scelto, per lo studente non
  // esiste: evita che cambiando l'indirizzo a mano si veda l'altro percorso.
  const delPercorso = track.subjects.find((m) => m.name === nome);
  if (!delPercorso) notFound();

  const note = await publishedNotes(track.id);
  const voci = note.filter((n) => n.subject === nome);
  if (voci.length === 0) notFound();

  const totale = topicsOf(track.id, nome).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/student/appunti" className="text-sm font-medium text-muted hover:text-brand-strong">
          &larr; Appunti
        </Link>

        <div className="mt-3 flex items-center gap-3">
          <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-2xl">
            {iconaMateria(nome)}
          </span>
          <div className="min-w-0">
            <h1 className="page-title">{nome}</h1>
            <p className="text-sm text-muted">
              {voci.length} {voci.length === 1 ? "argomento" : "argomenti"} su {totale}
            </p>
          </div>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {voci.map((n) => (
          <li key={n.topic}>
            <Link
              href={`/student/appunti/${n.topic}`}
              className="card card-link flex items-center justify-between gap-4 px-5 py-6"
            >
              <span className="font-display text-base font-bold leading-snug tracking-tight text-balance sm:text-lg">
                {topicLabel(n.topic) ?? n.title}
              </span>
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                className="h-5 w-5 shrink-0 text-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7.5 5 12.5 10 7.5 15" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
