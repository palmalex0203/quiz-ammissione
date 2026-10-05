import { paperOf, type Track } from "@/lib/tracks";

/*
 * Dal punteggio grezzo al voto d'esame.
 *
 * Nel semestre filtro ogni prova è un esame a sé e fa un voto a sé: tre prove,
 * tre voti, e sommarli non vuol dire niente. Le regole stanno nelle linee guida
 * MUR di ottobre 2025 (content/semestre-filtro/linee-guida-mur-2025.pdf, pag. 2):
 *
 *   «Le prove d'esame sono valutate in trentesimi, oltre alla lode a cui è
 *   attribuito il valore di un punto. Ai fini della determinazione del voto
 *   d'esame [...] i punteggi conseguiti in ciascuna prova si arrotondano
 *   all'unità più prossima solo qualora lo/la studente abbia superato l'esame
 *   conseguendo un punteggio uguale o superiore a diciotto su trenta (18/30).
 *   Sotto il 18, il voto non viene arrotondato e nessun punteggio è valido per
 *   la promozione all'esame.»
 *
 * Gli esempi di arrotondamento del documento: 17,8 = 17,8; 18,3 = 18; 18,5 = 19;
 * 19,4 = 19; 19,5 = 20. Cioè mezzo punto va verso l'alto, ed è quello che fa
 * Math.round. Le 31 domande valgono al massimo 31 punti: 30 più il punto della
 * lode.
 */

export type VotoProva = {
  /** Il punteggio grezzo, con i decimali. */
  punti: number;
  superata: boolean;
  lode: boolean;
  /** Come si scrive il voto: "24/30", "30 e lode", "17,8/30". */
  etichetta: string;
};

/** Il voto di una prova, o null se il percorso non si valuta in trentesimi. */
export function votoProva(punti: number, track: Track): VotoProva | null {
  const esame = track.esame;
  if (!esame) return null;

  const superata = punti >= esame.sufficienza;
  const arrotondato = Math.round(punti);
  const lode = esame.lode && superata && arrotondato > esame.scala;

  const etichetta = lode
    ? `${esame.scala} e lode`
    : superata
      ? `${Math.min(arrotondato, esame.scala)}/${esame.scala}`
      : `${formatPunti(punti)}/${esame.scala}`;

  return { punti, superata, lode, etichetta };
}

/** "17,8", "22", "−3,1": i punti come si scrivono in italiano. */
export function formatPunti(punti: number): string {
  return punti.toLocaleString("it-IT", { maximumFractionDigits: 2 }).replace("-", "−");
}

/**
 * Un voto in trentesimi si dà solo a una prova intera, cioè lunga quanto quella
 * vera: 31 domande.
 *
 * Un'esercitazione da quindici domande vale al massimo quindici punti, quindi il
 * diciotto è fuori portata: scriverle accanto «3,9/30, non superata» direbbe una
 * cosa falsa su un allenamento andato come doveva andare. Lì si mostrano i punti
 * e la percentuale, come si è sempre fatto.
 */
export function provaIntera(track: Track, subject: string, domande: number): boolean {
  const prova = paperOf(track, subject);
  return prova !== undefined && domande === prova.questions;
}

/** I punti grezzi di una prova: le corrette valgono, le errate tolgono. */
function punti(corrette: number, errate: number, track: Track): number {
  // Arrotondato al centesimo: 0,1 per volta in virgola mobile fa 2,9000000000000004.
  return (
    Math.round((corrette * track.scoring.correct + errate * track.scoring.incorrect) * 100) / 100
  );
}

/**
 * Il voto di una prova a partire dal riepilogo per materia salvato alla consegna.
 *
 * Lo storico non rilegge tutte le risposte di tutti i tentativi: gli bastano le
 * poche righe di AttemptSubjectStat, dove `answered` conta le risposte date. Le
 * errate sono quelle date e non corrette — ed è l'unico motivo per cui quel
 * numero viene salvato.
 */
export function votoDaRiepilogo(
  stat: { subject: string; correct: number; answered: number; total: number },
  track: Track
): VotoProva | null {
  if (!provaIntera(track, stat.subject, stat.total)) return null;
  const errate = Math.max(0, stat.answered - stat.correct);
  return votoProva(punti(stat.correct, errate, track), track);
}

export type RisultatoProva = {
  subject: string;
  corrette: number;
  errate: number;
  omesse: number;
  punti: number;
  voto: VotoProva | null;
};

/**
 * Il conto di ogni prova, materia per materia.
 *
 * Le risposte arrivano già nell'ordine del test, così le prove escono nell'ordine
 * in cui sono state svolte. `data` distingue una risposta sbagliata (−0,1) da una
 * lasciata in bianco (0), che è la differenza su cui si gioca la tattica d'esame.
 */
export function risultatiPerProva(
  risposte: { subject: string; corretta: boolean; data: boolean }[],
  track: Track
): RisultatoProva[] {
  const per = new Map<string, RisultatoProva>();

  for (const r of risposte) {
    const prova =
      per.get(r.subject) ??
      { subject: r.subject, corrette: 0, errate: 0, omesse: 0, punti: 0, voto: null };
    if (r.corretta) prova.corrette += 1;
    else if (r.data) prova.errate += 1;
    else prova.omesse += 1;
    per.set(r.subject, prova);
  }

  for (const prova of per.values()) {
    prova.punti = punti(prova.corrette, prova.errate, track);
    const domande = prova.corrette + prova.errate + prova.omesse;
    prova.voto = provaIntera(track, prova.subject, domande) ? votoProva(prova.punti, track) : null;
  }

  return [...per.values()];
}
