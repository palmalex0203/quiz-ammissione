import { requireStudentTrack } from "@/lib/track-session";
import { EmptyState } from "@/components/EmptyState";
import { publishedNotes } from "@/lib/notes";
import { topicLabel, topicsOf } from "@/lib/topics";
import { MaterieAppunti, type MateriaAppunti } from "./MaterieAppunti";

/*
 * La sezione "Appunti": gli appunti di ripasso pubblicati per il percorso
 * scelto, un riquadro per materia.
 *
 * Fino a qui agli appunti si arrivava solo dalla scheda di un argomento in
 * "Esercitati", cioè dovendo già sapere cosa si voleva ripassare. Da qui invece
 * si vede tutto quello che c'è, che è il modo in cui uno studente cerca il
 * ripasso quando non ha ancora deciso da dove cominciare.
 *
 * L'elenco arriva dalla cache degli appunti: aprirlo non interroga il database.
 */

/** Un'icona per materia. Il nome deve combaciare con quello in src/lib/tracks.ts. */
const ICONE: Record<string, string> = {
  Biologia: "🧬",
  "Chimica e propedeutica biochimica": "⚗️",
  Chimica: "⚗️",
  Fisica: "🔭",
  "Fisica e Matematica": "📐",
  Logica: "🧩",
  "Comprensione del testo": "📖",
};

export default async function StudentAppuntiPage() {
  const { track } = await requireStudentTrack();
  const note = await publishedNotes(track.id);

  // Le materie nell'ordine del percorso, non in ordine alfabetico: è l'ordine
  // in cui lo studente le incontra ovunque nel sito.
  const materie: MateriaAppunti[] = track.subjects.map((m) => ({
    nome: m.name,
    icona: ICONE[m.name] ?? "📘",
    totale: topicsOf(track.id, m.name).length,
    voci: note
      .filter((n) => n.subject === m.name)
      .map((n) => ({ topic: n.topic, titolo: topicLabel(n.topic) ?? n.title })),
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
              } su ${argomenti}. In fondo a ogni appunto puoi allenarti subito su quello che hai letto.`}
        </p>
      </div>

      {pronti === 0 ? (
        <EmptyState
          icon="📚"
          title="Gli appunti stanno arrivando"
          description="Qui troverai il ripasso di ogni argomento del programma. Intanto puoi allenarti da Esercitati."
        />
      ) : (
        <MaterieAppunti materie={materie} />
      )}
    </div>
  );
}
