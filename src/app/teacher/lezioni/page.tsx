import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/EmptyState";
import { requireTeacherTrack } from "@/lib/track-docente";
import { FUSO, durata, lezioneFinita, urlDirettaValido } from "@/lib/lezioni";
import { aspettaRegistrazione, registrazioniAttive } from "@/lib/registrazioni";
import { AttendiRegistrazione } from "@/components/AttendiRegistrazione";
import { TOPICS_BY_TRACK, topicLabel } from "@/lib/topics";
import { cambiaPubblicazioneLezione } from "./actions";
import { NuovaLezione } from "./NuovaLezione";
import { EliminaLezione } from "./EliminaLezione";

/*
 * Le lezioni del corso aperto, dalla più recente.
 *
 * Fino a ieri si caricavano solo da terminale: le poteva mettere una persona
 * sola, dal suo computer. Una diretta però si pubblica il giorno stesso, e chi
 * la tiene non apre un terminale — da qui si fa tutto.
 *
 * Bozze e pubblicate stanno nello stesso elenco, con la differenza scritta in
 * chiaro: una lezione che non si vede e una che vede tutta la classe non
 * possono somigliarsi.
 */
export default async function TeacherLezioniPage() {
  const { trackId, track } = await requireTeacherTrack();

  const lezioni = await prisma.lezione.findMany({
    where: { track: trackId },
    orderBy: { data: "desc" },
    select: {
      id: true,
      titolo: true,
      descrizione: true,
      subject: true,
      topic: true,
      data: true,
      durataMinuti: true,
      fornitore: true,
      urlDiretta: true,
      urlRegistrazione: true,
      isPublished: true,
    },
  });

  // Gli argomenti del percorso, raggruppati per materia: sono le voci dei due
  // menu a tendina del modulo, quello della materia e quello dell'argomento.
  // Si possono contraddire, e per questo nell'azione l'argomento ha la
  // precedenza: la materia la si chiede perché quasi nessuna lezione sta su un
  // solo argomento, e senza materia non si può dividere l'elenco per materia.
  const gruppi = Object.entries(TOPICS_BY_TRACK[trackId]).map(([materia, argomenti]) => ({
    materia,
    argomenti: argomenti.map((a) => ({ code: a.code, label: a.label })),
  }));

  const pubblicate = lezioni.filter((l) => l.isPublished).length;
  const inAttesa = lezioni.filter((l) => l.isPublished && aspettaRegistrazione(l)).map((l) => l.id);
  const automatico = registrazioniAttive();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Lezioni</h1>
        <p className="mt-1 text-sm text-muted">
          {track.label} ·{" "}
          {lezioni.length === 0
            ? "ancora nessuna lezione."
            : `${lezioni.length} in tutto, ${pubblicate} ${pubblicate === 1 ? "pubblicata" : "pubblicate"} e ${lezioni.length - pubblicate} in bozza.`}{" "}
          Gli studenti vedono solo quelle pubblicate.
        </p>
      </div>

      <NuovaLezione gruppi={gruppi} />
      {inAttesa.length > 0 && <AttendiRegistrazione lezioni={inAttesa} />}

      {lezioni.length === 0 ? (
        <EmptyState
          icon="🎥"
          title={`Nessuna lezione su ${track.label}`}
          description="Aggiungi la prima qui sopra: una diretta su Teams, Meet o Zoom, oppure una registrazione su YouTube o Vimeo."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {lezioni.map((l) => {
            const inDiretta = urlDirettaValido(l.urlDiretta) !== null;
            const quanto = durata(l.durataMinuti);

            return (
              <li key={l.id} className="card flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span aria-hidden>{inDiretta ? "🔴" : "🎥"}</span>
                    <span className="font-semibold">{l.titolo}</span>
                    <span
                      className={`pill ${
                        l.isPublished
                          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-line text-foreground"
                      }`}
                    >
                      {l.isPublished ? "Pubblicata" : "Bozza"}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-muted">
                    {inDiretta ? "In diretta" : `Registrata su ${l.fornitore ?? "—"}`}
                    {" · "}
                    {l.data.toLocaleString("it-IT", {
                      timeZone: FUSO,
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {quanto && ` · ${quanto}`}
                  </p>

                  {inDiretta && lezioneFinita(l) && (
                    <p className="mt-0.5 text-xs text-muted">
                      {l.urlRegistrazione ? (
                        <a href={l.urlRegistrazione} target="_blank" rel="noreferrer" className="font-medium text-brand-strong hover:underline">
                          🎥 Registrazione pronta
                        </a>
                      ) : automatico ? (
                        "⏳ Registrazione in arrivo: il sito la aggancia da solo appena Teams l'ha pronta."
                      ) : (
                        "Registrazione automatica non ancora collegata a Microsoft."
                      )}
                    </p>
                  )}

                  {l.topic && (
                    <p className="mt-0.5 text-xs text-muted">
                      {l.subject && `${l.subject} · `}
                      {topicLabel(l.topic) ?? l.topic}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {/* Il docente entra dalla stessa riunione degli studenti. Resta
                      anche a lezione finita, più discreto: una lezione può sforare. */}
                  {inDiretta && (
                    <a
                      href={urlDirettaValido(l.urlDiretta)!}
                      target="_blank"
                      rel="noreferrer"
                      className={`btn btn-sm ${lezioneFinita(l) ? "btn-soft" : "btn-brand"}`}
                    >
                      Entra nella diretta
                    </a>
                  )}
                  <form action={cambiaPubblicazioneLezione}>
                    <input type="hidden" name="id" value={l.id} />
                    <button type="submit" className={`btn btn-sm ${l.isPublished ? "btn-soft" : "btn-brand"}`}>
                      {l.isPublished ? "Nascondi" : "Pubblica"}
                    </button>
                  </form>
                  <EliminaLezione id={l.id} titolo={l.titolo} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
