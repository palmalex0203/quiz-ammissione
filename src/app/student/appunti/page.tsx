import Link from "next/link";
import { requireStudentTrack } from "@/lib/track-session";
import { EmptyState } from "@/components/EmptyState";
import { publishedNotes } from "@/lib/notes";
import { topicsOf } from "@/lib/topics";
import { iconaMateria, percorsoMateria } from "@/lib/appunti-materie";

/*
 * La sezione "Appunti": una piastrella per materia, nell'ordine del percorso.
 * Si sceglie la materia e si passa alla schermata con i suoi argomenti.
 *
 * Fino a qui agli appunti si arrivava solo dalla scheda di un argomento in
 * "Esercitati", cioè dovendo già sapere cosa si voleva ripassare. Da qui invece
 * si vede tutto quello che c'è, che è il modo in cui uno studente cerca il
 * ripasso quando non ha ancora deciso da dove cominciare.
 *
 * L'elenco arriva dalla cache degli appunti: aprire la sezione non interroga il
 * database.
 */
export default async function StudentAppuntiPage() {
  const { track } = await requireStudentTrack();
  const note = await publishedNotes(track.id);

  // Le materie nell'ordine del percorso, non in ordine alfabetico: è l'ordine
  // in cui lo studente le incontra ovunque nel sito.
  const materie = track.subjects.map((m) => ({
    nome: m.name,
    breve: m.short,
    icona: iconaMateria(m.name),
    totale: topicsOf(track.id, m.name).length,
    pronti: note.filter((n) => n.subject === m.name).length,
  }));

  const pronti = note.length;
  const argomenti = materie.reduce((n, m) => n + m.totale, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Appunti</h1>
        <p className="mt-1 text-sm text-muted">
          {pronti === 0
            ? `Il ripasso di ${track.label}: ancora nessun argomento pubblicato.`
            : `Il ripasso di ${track.label}: ${pronti} ${
                pronti === 1 ? "argomento" : "argomenti"
              } su ${argomenti}. Scegli la materia.`}
        </p>
      </div>

      {pronti === 0 ? (
        <EmptyState
          icon="📚"
          title="Gli appunti stanno arrivando"
          description="Qui troverai il ripasso di ogni argomento del programma. Intanto puoi allenarti da Esercitati."
        />
      ) : (
        /* Tre per riga: con le tre materie del semestre filtro stanno tutte in
           una riga sola, anche sul telefono. I percorsi con più materie vanno a
           capo da soli. */
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {materie.map((m) => {
            const vuota = m.pronti === 0;
            const contenuto = (
              <>
                <span aria-hidden className="text-3xl sm:text-4xl">
                  {m.icona}
                </span>
                <span className="font-display text-sm font-bold leading-tight tracking-tight text-balance sm:text-base">
                  {m.breve}
                </span>
                <span className="text-xs text-muted tabular-nums">
                  {vuota ? "in arrivo" : `${m.pronti} su ${m.totale}`}
                </span>
              </>
            );

            return vuota ? (
              <div
                key={m.nome}
                className="card flex aspect-square flex-col items-center justify-center gap-1.5 p-3 text-center opacity-55"
              >
                {contenuto}
              </div>
            ) : (
              <Link
                key={m.nome}
                href={percorsoMateria(m.nome)}
                className="card card-link flex aspect-square flex-col items-center justify-center gap-1.5 p-3 text-center"
              >
                {contenuto}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
