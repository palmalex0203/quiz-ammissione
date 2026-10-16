import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DOMANDE_PER_PROVA, MINUTI_PER_PROVA, pescaProva, TOTALE } from "@/lib/openday";
import { datiMancanti, EVENTO } from "@/lib/open-day-evento";
import OpenDay from "./OpenDay";

// Pagina pubblica: non chiama auth() e non deve chiamarlo. È l'unica zona del
// sito raggiungibile senza account, ed è il motivo per cui le sue scritture
// finiscono su Lead e non su User.
export const metadata: Metadata = {
  title: EVENTO.titolo,
  description: `${EVENTO.data}, ore ${EVENTO.ora}: ${EVENTO.durata} in diretta sul semestre filtro. E la simulazione gratuita di una prova ufficiale dell'anno scorso.`,
};

// L'appello si sorteggia a ogni visita, quindi niente cache statica.
export const dynamic = "force-dynamic";

export default function OpenDayPage() {
  const mancano = datiMancanti();

  /*
   * Finché mancano i dati obbligatori la pagina non esiste: in locale si apre
   * con APRI_OPEN_DAY=1, ovunque altro risponde 404.
   *
   * Questa pagina è pubblica e raccoglie nome, telefono ed email di studenti,
   * in buona parte minorenni. Mandarla online con l'informativa incompleta —
   * senza un indirizzo a cui esercitare i diritti sui dati — non è una svista
   * da poco, ed è esattamente il genere di cosa che scappa quando si spinge su
   * main per tutt'altro motivo, visto che da lì il deploy parte da solo. Un
   * avviso giallo non ferma niente: un 404 sì.
   */
  if (mancano.length > 0 && process.env.APRI_OPEN_DAY !== "1") notFound();

  const prova = pescaProva();

  return (
    <main className="app-shell flex-1">
      {mancano.length > 0 && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
          Anteprima locale: manca {mancano.join(", manca ")}. Online questa pagina risponde 404.
        </div>
      )}

      {/* Chi arriva da un annuncio non ci conosce: senza il marchio non sa di chi
          è la pagina a cui sta per lasciare nome, email e telefono, e qui il
          riconoscimento vale quanto la prova. Il file è 422x141, quindi anche a
          288 px di larghezza resta nitido sugli schermi a densità doppia. */}
      <header className="mx-auto flex max-w-2xl items-center px-4 pb-2 pt-8 sm:pt-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/profor-logo.png"
          alt="Profor — Ente di Formazione"
          width={422}
          height={141}
          className="h-16 w-auto sm:h-24"
        />
      </header>

      <OpenDay
        prova={prova}
        esame={{
          domandePerProva: DOMANDE_PER_PROVA,
          minutiPerProva: MINUTI_PER_PROVA,
          totale: TOTALE,
        }}
        evento={{
          titolo: EVENTO.titolo,
          titoloGrande: EVENTO.titoloGrande,
          slogan: EVENTO.slogan,
          data: EVENTO.data,
          dataBreve: EVENTO.dataBreve,
          ora: EVENTO.ora,
          durata: EVENTO.durata,
          piattaforma: EVENTO.diretta.piattaforma,
          url: EVENTO.diretta.url,
          postiTotali: EVENTO.postiTotali,
          titolare: EVENTO.privacy.titolare,
          emailPrivacy: EVENTO.privacy.email,
          urlInformativa: EVENTO.privacy.urlInformativa,
        }}
      />
    </main>
  );
}
