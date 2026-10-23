import type { Metadata } from "next";
import { provaIngresso, TOTALE } from "@/lib/prova-ingresso";
import ProvaIngressoPagina from "./ProvaIngresso";

/*
 * Pagina pubblica: non chiama auth() e non deve chiamarlo. Il test si fa il
 * primo giorno di corso, quando gli studenti un account non ce l'hanno ancora —
 * ed è il motivo per cui le sue scritture finiscono su ProvaIngresso e non su
 * Attempt.
 *
 * Le risposte giuste non arrivano qui: provaIngresso() restituisce solo i testi,
 * e la correzione sta nell'azione sul server.
 */
export const metadata: Metadata = {
  title: "Test di valutazione iniziale — Semestre filtro",
  description:
    "45 domande per capire da dove si parte prima della prima lezione: chimica, fisica e biologia, un'ora in tutto.",
  robots: { index: false, follow: false },
};

export default function ProvaIngressoPage() {
  return <ProvaIngressoPagina prova={provaIngresso()} totale={TOTALE} />;
}
