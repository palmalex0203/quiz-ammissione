import Link from "next/link";
import { requireStudentTrack } from "@/lib/track-session";
import { EmptyState } from "@/components/EmptyState";
import { publishedNotes } from "@/lib/notes";
import { topicLabel, topicsOf } from "@/lib/topics";
import { poolCounts } from "@/lib/question-pool";

/*
 * La sezione "Appunti": gli appunti di ripasso pubblicati per il percorso scelto,
 * raggruppati per materia.
 *
 * Fino a qui agli appunti si arrivava solo dalla scheda di un argomento in
 * "Esercitati", cioè dovendo già sapere cosa si voleva ripassare. Da qui invece
 * si vede tutto quello che c'è, che è il modo in cui uno studente cerca il
 * ripasso quando non ha ancora deciso da dove cominciare.
 *
 * L'elenco arriva dalla cache degli appunti: aprirlo non interroga il database.
 */
export default async function StudentAppuntiPage() {
  const { track } = await requireStudentTrack();
  const [note, pool] = await Promise.all([publishedNotes(track.id), poolCounts(track.id)]);

  // Quanti argomenti ha in tutto il percorso: serve a dire onestamente quanta
  // parte del programma è già coperta, invece di far sembrare che sia tutto qui.
  const argomenti = track.subjects.reduce((n, m) => n + topicsOf(track.id, m.name).length, 0);

  // Le materie nell'ordine del percorso, non in ordine alfabetico: è l'ordine in
  // cui lo studente le incontra ovunque nel sito.
  const perMateria = track.subjects
    .map((m) => ({ materia: m, elenco: note.filter((n) => n.subject === m.name) }))
    .filter((x) => x.elenco.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="page-title">Appunti</h1>
        <p className="mt-1 text-sm text-muted">
          {note.length === 0
            ? `Il ripasso di ${track.label}: ancora nessun argomento pubblicato.`
            : `Il ripasso di ${track.label}: ${note.length} ${
                note.length === 1 ? "argomento" : "argomenti"
              } su ${argomenti}. In fondo a ogni appunto puoi allenarti subito su quello che hai letto.`}
        </p>
      </div>

      {note.length === 0 ? (
        <EmptyState
          icon="📚"
          title="Gli appunti stanno arrivando"
          description="Qui troverai il ripasso di ogni argomento del programma. Intanto puoi allenarti da Esercitati."
        />
      ) : (
        perMateria.map(({ materia, elenco }) => (
          <section key={materia.name} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
              <h2 className="section-title">{materia.name}</h2>
              <span className="text-xs text-muted">
                {elenco.length} su {topicsOf(track.id, materia.name).length}
              </span>
            </div>

            <ul className="flex flex-col gap-2">
              {elenco.map((n) => {
                const domande = pool.byTopic.get(n.topic) ?? 0;
                return (
                  <li key={n.topic}>
                    <Link href={`/student/appunti/${n.topic}`} className="card card-link block p-5">
                      <p className="font-semibold leading-snug">{topicLabel(n.topic) ?? n.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {n.parole.toLocaleString("it-IT")} parole
                        {domande > 0 && <> · {domande} domande su questo argomento</>} · aggiornato il{" "}
                        {new Date(n.updatedAt).toLocaleDateString("it-IT")}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
