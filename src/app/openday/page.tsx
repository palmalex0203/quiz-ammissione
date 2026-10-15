import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MINUTI, pescaProva, TOTALE } from "@/lib/openday";
import { datiMancanti, EVENTO } from "@/lib/open-day-evento";
import Simulazione from "./Simulazione";

// Pagina pubblica: non chiama auth() e non deve chiamarlo. È l'unica zona del
// sito raggiungibile senza account, ed è il motivo per cui le sue scritture
// finiscono su Lead e non su User.
export const metadata: Metadata = {
  title: "Simulazione gratuita — Semestre filtro",
  description: `Dodici domande vere dei due appelli 2025/2026, corrette subito. Poi la diretta del ${EVENTO.dataBreve} alle ${EVENTO.ora}.`,
};

// Le domande si sorteggiano a ogni visita, quindi niente cache statica.
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

  const domande = pescaProva();

  return (
    <main className="app-shell flex-1">
      {mancano.length > 0 && (
        <div className="bg-amber-100 text-amber-950 text-sm px-4 py-2 text-center dark:bg-amber-950 dark:text-amber-100">
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

      <Simulazione
        domande={domande}
        minuti={MINUTI}
        totale={TOTALE}
        evento={{
          data: EVENTO.data,
          dataBreve: EVENTO.dataBreve,
          ora: EVENTO.ora,
          piattaforma: EVENTO.diretta.piattaforma,
          url: EVENTO.diretta.url,
          postiTotali: EVENTO.postiTotali,
          titolare: EVENTO.privacy.titolare,
          urlInformativa: EVENTO.privacy.urlInformativa,
        }}
      />
    </main>
  );
}
