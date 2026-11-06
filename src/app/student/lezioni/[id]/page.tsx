import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudentTrack } from "@/lib/track-session";
import { durata, lezioneFinita, lezioniPubblicate, quandoLezione, urlDirettaValido, urlLettore } from "@/lib/lezioni";
import { urlRegistrazioneValido } from "@/lib/registrazioni";
import { AttendiRegistrazione } from "@/components/AttendiRegistrazione";
import { publishedNoteTopics } from "@/lib/notes";
import { topicLabel } from "@/lib/topics";
import { EVENTO } from "@/lib/open-day-evento";

const PIATTAFORMA_DIRETTA = EVENTO.diretta.piattaforma;

/*
 * Una lezione registrata.
 *
 * Il lettore è un iframe, e il suo indirizzo lo costruisce `urlLettore` da
 * fornitore e identificativo: nel database non c'è nessun indirizzo da
 * incollare in pagina, quindi non può finirci dentro niente che non sia
 * YouTube o Vimeo.
 *
 * La lezione si cerca fra quelle **pubblicate del percorso dello studente**,
 * non per id nel database: così una bozza, o una lezione dell'altro percorso,
 * non si apre nemmeno conoscendone l'indirizzo. E la lettura passa dalla cache,
 * quindi aprire una lezione non interroga il database.
 */
export default async function StudentLezionePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { track } = await requireStudentTrack();

  const lezioni = await lezioniPubblicate(track.id);
  const lezione = lezioni.find((l) => l.id === id);
  if (!lezione) notFound();

  // Registrata o in diretta: o c'è un lettore da incorporare, o c'è un
  // indirizzo a cui mandare. Se non c'è nessuno dei due la scheda non ha
  // niente da mostrare, e vale come inesistente.
  const diretta = urlDirettaValido(lezione.urlDiretta);
  const lettore =
    lezione.fornitore && lezione.videoId ? urlLettore(lezione.fornitore, lezione.videoId) : null;
  if (!lettore && !diretta) notFound();

  // Una diretta ha tre momenti: prima e durante c'è il pulsante per entrare;
  // finita, si aspetta la registrazione; poi c'è il pulsante per guardarla.
  const registrazione = urlRegistrazioneValido(lezione.urlRegistrazione);
  const finita = diretta !== null && lezioneFinita(lezione);

  const quanto = durata(lezione.durataMinuti);
  const appunto = lezione.topic ? (await publishedNoteTopics(track.id))[lezione.topic] : undefined;
  const conAppunto = appunto !== undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/student/lezioni" className="text-sm font-medium text-muted hover:text-brand-strong">
          &larr; Lezioni
        </Link>
        <h1 className="page-title mt-2">{lezione.titolo}</h1>
        <p className="mt-1 text-sm text-muted">
          {quandoLezione(lezione.data, diretta !== null)}
          {quanto && <> · {quanto}</>}
          {lezione.subject && <> · {lezione.subject}</>}
        </p>
      </div>

      {/* 16:9: il riquadro tiene le proporzioni a ogni larghezza, così il
          lettore non salta mentre la pagina si carica. */}
      {lettore && (
        <div className="overflow-hidden rounded-3xl border border-line bg-black">
          <iframe
            src={lettore}
            title={lezione.titolo}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}

      {/* La diretta non si incorpora: Teams rifiuta di farsi mettere in un
          iframe e rimanda comunque all'app. Quindi non si finge un lettore —
          si dice dove si va e ci si va. */}
      {diretta && registrazione && (
        <div className="card border-brand/40 bg-brand-tint p-6 sm:p-8">
          <p className="pill pill-brand">Registrazione</p>
          <p className="mt-3 font-display text-xl font-bold tracking-tight">
            La registrazione della lezione è pronta
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Il pulsante apre il video in una finestra nuova. Puoi riguardarlo quante volte vuoi.
          </p>
          <a
            href={registrazione}
            target="_blank"
            rel="noreferrer"
            className="btn btn-brand mt-5 w-full py-3.5 text-base sm:w-auto"
          >
            Guarda la registrazione
          </a>
        </div>
      )}

      {diretta && !registrazione && finita && (
        <div className="card p-6 sm:p-8">
          <AttendiRegistrazione lezioni={[lezione.id]} />
          <p className="pill">Lezione terminata</p>
          <p className="mt-3 font-display text-xl font-bold tracking-tight">
            La registrazione arriva a breve
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Appena Teams l&apos;ha pronta compare qui, di solito entro un&apos;ora dalla fine. Non serve
            ricaricare: questa pagina si aggiorna da sola.
          </p>
        </div>
      )}

      {diretta && !registrazione && !finita && (
        <div className="card border-brand/40 bg-brand-tint p-6 sm:p-8">
          <p className="pill pill-brand">In diretta</p>
          <p className="mt-3 font-display text-xl font-bold tracking-tight">
            La lezione si tiene su {PIATTAFORMA_DIRETTA}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Il pulsante apre la riunione in una finestra nuova, nell&apos;app o nel browser.
          </p>
          <a
            href={diretta}
            target="_blank"
            rel="noreferrer"
            className="btn btn-brand mt-5 w-full py-3.5 text-base sm:w-auto"
          >
            Entra nella diretta
          </a>
          <p className="mt-3 text-xs text-muted">
            Se è ancora presto, la sala si apre qualche minuto prima dell&apos;orario.
          </p>
        </div>
      )}

      {lezione.descrizione && (
        <div className="card p-6">
          <p className="whitespace-pre-line text-sm leading-relaxed">{lezione.descrizione}</p>
        </div>
      )}

      {lezione.topic && (
        <div className="card flex flex-col justify-between gap-3 border-brand/40 p-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="section-title">{topicLabel(lezione.topic) ?? lezione.topic}</p>
            <p className="mt-0.5 text-sm text-muted">
              {conAppunto
                ? "C'è anche l'appunto di ripasso su questo argomento."
                : "L'argomento di questa lezione nel programma."}
            </p>
          </div>
          {conAppunto && (
            <Link href={`/student/appunti/${appunto}`} className="btn btn-soft shrink-0">
              Vai all&apos;appunto
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
