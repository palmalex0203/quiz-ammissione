import Link from "next/link";
import { requireStudentTrack } from "@/lib/track-session";
import { EmptyState } from "@/components/EmptyState";
import {
  durata,
  lezioneDaVenire,
  lezioneDiOggi,
  lezioneFinita,
  lezioniPubblicate,
  quandoLezione,
  urlDirettaValido,
  type LezionePubblicata,
} from "@/lib/lezioni";
import { aspettaRegistrazione } from "@/lib/registrazioni";
import { AttendiRegistrazione } from "@/components/AttendiRegistrazione";
import { topicLabel } from "@/lib/topics";
import { iconaMateria } from "@/lib/appunti-materie";

/*
 * Le lezioni del percorso: prima la diretta, poi le registrazioni.
 *
 * La pagina è divisa in due perché le due cose si cercano in momenti diversi.
 * La diretta ha un'ora: chi apre questa pagina il giorno della lezione sta
 * cercando il pulsante per entrare, e deve trovarlo per primo e grande, senza
 * scorrere un elenco. Le registrazioni invece si cercano a freddo, giorni dopo,
 * e allora quello che serve è la materia: "rivediamo la lezione di biologia".
 *
 * Per questo le registrazioni sono raggruppate per materia, come gli appunti,
 * mentre prima erano un unico elenco in ordine di data. Con tre lezioni era
 * uguale; con trenta, l'ordine di data vuol dire scorrere fino a trovarla.
 *
 * L'elenco arriva dalla cache delle lezioni: aprire la sezione non interroga il
 * database.
 */

/** Una riga dell'elenco: icona, titolo, quando, freccia. */
function RigaLezione({ lezione }: { lezione: LezionePubblicata }) {
  const inDiretta = urlDirettaValido(lezione.urlDiretta) !== null;
  const quanto = durata(lezione.durataMinuti);

  // Su una diretta finita lo stato è l'informazione utile: il video c'è o sta
  // arrivando. Su una lezione registrata non c'è niente da dire.
  const stato = !inDiretta
    ? null
    : lezione.urlRegistrazione
      ? "Registrazione"
      : lezioneFinita(lezione)
        ? "Registrazione in arrivo"
        : "In diretta";

  return (
    <li>
      <Link href={`/student/lezioni/${lezione.id}`} className="card card-link flex items-start gap-4 p-5">
        <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-xl">
          {inDiretta && !lezione.urlRegistrazione
            ? "🔴"
            : lezione.subject
              ? iconaMateria(lezione.subject)
              : "🎥"}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-display text-base font-bold leading-snug tracking-tight text-balance sm:text-lg">
            {lezione.titolo}
          </span>
          {stato && <span className="pill pill-brand mt-1.5">{stato}</span>}
          <span className="mt-1 block text-xs text-muted">
            {quandoLezione(lezione.data, inDiretta)}
            {quanto && <> · {quanto}</>}
            {lezione.topic && <> · {topicLabel(lezione.topic) ?? lezione.topic}</>}
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
}

export default async function StudentLezioniPage() {
  const { track } = await requireStudentTrack();
  const lezioni = await lezioniPubblicate(track.id);

  const conDiretta = lezioni.filter((l) => urlDirettaValido(l.urlDiretta) !== null);

  // La diretta di oggi: quella che ancora non è finita. Finita, scende fra le
  // registrazioni insieme alle altre — il pulsante per entrare non serve più.
  const oggi = conDiretta
    .filter((l) => lezioneDiOggi(l.data) && !lezioneFinita(l))
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  // Le prossime: senza questo elenco una lezione già pubblicata ma non ancora
  // tenuta non comparirebbe da nessuna parte.
  const prossime = conDiretta
    .filter((l) => !lezioneDiOggi(l.data) && lezioneDaVenire(l))
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  const inAlto = new Set([...oggi, ...prossime].map((l) => l.id));
  const registrate = lezioni.filter((l) => !inAlto.has(l.id));

  // Le materie nell'ordine del percorso, non in ordine alfabetico: è l'ordine
  // in cui lo studente le incontra ovunque nel sito. Una lezione senza materia,
  // o di una materia che non è di questo percorso, finisce in fondo.
  const noti = new Set(track.subjects.map((m) => m.name));
  const gruppi = [
    ...track.subjects.map((m) => ({
      chiave: m.name,
      nome: m.short,
      icona: iconaMateria(m.name),
      lezioni: registrate.filter((l) => l.subject === m.name),
    })),
    {
      chiave: "altre",
      nome: "Altre lezioni",
      icona: "🎥",
      lezioni: registrate.filter((l) => !l.subject || !noti.has(l.subject)),
    },
  ].filter((g) => g.lezioni.length > 0);

  // Le dirette finite che aspettano ancora il video: la pagina chiede al server
  // se sono pronte, e si ricarica da sola quando una arriva.
  const inAttesa = lezioni.filter((l) => aspettaRegistrazione(l)).map((l) => l.id);

  const sottotitolo =
    lezioni.length === 0
      ? `Le lezioni di ${track.label}: ancora nessuna pubblicata.`
      : oggi.length > 0
        ? "Oggi c'è lezione: il pulsante qui sotto porta in aula."
        : registrate.length === 0
          ? `Le lezioni di ${track.label}. Le registrazioni compaiono qui dopo la lezione.`
          : `Le lezioni di ${track.label}. Le registrazioni puoi riguardarle quante volte vuoi.`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Lezioni</h1>
        <p className="mt-1 text-sm text-muted">{sottotitolo}</p>
      </div>

      {inAttesa.length > 0 && <AttendiRegistrazione lezioni={inAttesa} />}

      {/* La diretta di oggi. Il pulsante apre direttamente la riunione: il
          giorno della lezione, passare da una scheda intermedia è un ostacolo e
          niente più. La scheda resta raggiungibile dal link sotto. */}
      {oggi.map((l) => {
        const indirizzo = urlDirettaValido(l.urlDiretta)!;
        const quanto = durata(l.durataMinuti);
        const ora = new Date(l.data).toLocaleTimeString("it-IT", {
          timeZone: "Europe/Rome",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div key={l.id} className="card border-brand/40 bg-brand-tint p-6 sm:p-8">
            <p className="pill pill-brand">Oggi in diretta</p>
            <p className="mt-3 font-display text-xl font-bold leading-snug tracking-tight text-balance sm:text-2xl">
              {l.titolo}
            </p>
            <p className="mt-1 text-sm text-muted">
              Ore {ora}
              {quanto && <> · {quanto}</>}
              {l.subject && <> · {l.subject}</>}
            </p>

            <a
              href={indirizzo}
              target="_blank"
              rel="noreferrer"
              className="btn btn-brand mt-5 w-full py-4 text-base sm:w-auto sm:px-8"
            >
              Entra nella diretta
            </a>

            <p className="mt-3 text-xs text-muted">
              Si apre in una finestra nuova. Se è ancora presto, la sala si apre qualche minuto prima
              dell&apos;orario.{" "}
              <Link href={`/student/lezioni/${l.id}`} className="font-medium underline">
                Apri la scheda
              </Link>
            </p>
          </div>
        );
      })}

      {prossime.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">{prossime.length === 1 ? "La prossima lezione" : "Le prossime lezioni"}</h2>
          <ul className="flex flex-col gap-3">
            {prossime.map((l) => (
              <RigaLezione key={l.id} lezione={l} />
            ))}
          </ul>
        </section>
      )}

      {lezioni.length === 0 ? (
        <EmptyState
          icon="🎥"
          title="Le lezioni stanno arrivando"
          description="Qui troverai le registrazioni delle lezioni in diretta, da riguardare quando vuoi. Intanto puoi allenarti da Esercitati."
        />
      ) : (
        gruppi.map((g) => (
          <section key={g.chiave} className="flex flex-col gap-3">
            <h2 className="section-title flex items-center gap-2">
              <span aria-hidden>{g.icona}</span>
              {g.nome}
            </h2>
            <ul className="flex flex-col gap-3">
              {g.lezioni.map((l) => (
                <RigaLezione key={l.id} lezione={l} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
