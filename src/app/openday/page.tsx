import type { Metadata } from "next";
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
  const domande = pescaProva();
  const mancano = datiMancanti();

  return (
    <main className="app-shell flex-1">
      {mancano.length > 0 && (
        <div className="bg-amber-100 text-amber-950 text-sm px-4 py-2 text-center dark:bg-amber-950 dark:text-amber-100">
          Pagina non ancora pubblicabile: manca {mancano.join(", manca ")}.
        </div>
      )}

      {/* Chi arriva da un annuncio non ci conosce: senza il marchio non sa di chi
          è la pagina a cui sta per lasciare nome, email e telefono. Resta in alto
          per tutto il percorso, discreto, perché il protagonista è la prova. */}
      <header className="mx-auto flex max-w-2xl items-center px-4 pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/profor-logo.png" alt="Profor — Ente di Formazione" className="h-8 w-auto" />
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
