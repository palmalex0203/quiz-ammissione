import Link from "next/link";
import { requireStudentTrack } from "@/lib/track-session";
import { EmptyState } from "@/components/EmptyState";
import { durata, lezioniPubblicate } from "@/lib/lezioni";
import { topicLabel } from "@/lib/topics";
import { iconaMateria } from "@/lib/appunti-materie";

/*
 * Le lezioni registrate del percorso, dalla più recente.
 *
 * Non sono raggruppate per materia come gli appunti: una lezione è un evento
 * con una data, e quello che uno cerca è "quella di martedì" o "l'ultima".
 * Il legame con la materia e con l'argomento c'è lo stesso, scritto sulla
 * scheda, e serve soprattutto nell'altro verso — dall'appunto alla lezione.
 */
export default async function StudentLezioniPage() {
  const { track } = await requireStudentTrack();
  const lezioni = await lezioniPubblicate(track.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Lezioni</h1>
        <p className="mt-1 text-sm text-muted">
          {lezioni.length === 0
            ? `Le lezioni registrate di ${track.label}: ancora nessuna pubblicata.`
            : `Le lezioni registrate di ${track.label}. Puoi riguardarle quante volte vuoi.`}
        </p>
      </div>

      {lezioni.length === 0 ? (
        <EmptyState
          icon="🎥"
          title="Le lezioni stanno arrivando"
          description="Qui troverai le registrazioni delle lezioni in diretta, da riguardare quando vuoi. Intanto puoi allenarti da Esercitati."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {lezioni.map((l) => {
            const quanto = durata(l.durataMinuti);
            return (
              <li key={l.id}>
                <Link href={`/student/lezioni/${l.id}`} className="card card-link flex items-start gap-4 p-5">
                  <span
                    aria-hidden
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-xl"
                  >
                    {l.subject ? iconaMateria(l.subject) : "🎥"}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-base font-bold leading-snug tracking-tight text-balance sm:text-lg">
                      {l.titolo}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {new Date(l.data).toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {quanto && <> · {quanto}</>}
                      {l.topic && <> · {topicLabel(l.topic) ?? l.topic}</>}
                    </span>
                  </span>

                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className="mt-1 h-5 w-5 shrink-0 text-muted"
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
