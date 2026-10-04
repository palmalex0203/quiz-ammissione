import { paperOf, type Track } from "@/lib/tracks";

/*
 * Le sezioni di una prova.
 *
 * All'esame del semestre filtro non si svolgono 93 domande in un colpo solo: sono
 * tre prove separate, una per materia, 31 domande in 45 minuti ciascuna, e quando
 * una è consegnata non si torna indietro. La simulazione completa qui dentro è un
 * test unico, e senza queste sezioni lo studente si troverebbe davanti tutte e tre
 * le materie insieme con un cronometro solo: un esercizio diverso da quello vero.
 *
 * Una sezione è un blocco di domande consecutive della stessa materia. Dove il
 * percorso non descrive prove separate (Professioni Sanitarie) o dove il test ha
 * una materia sola, la sezione è una e tutto si comporta come prima.
 */

export type DomandaDiSezione = { id: string; subject: string };

export type Sezione = {
  indice: number;
  subject: string;
  // Quanto dura la sezione. null = nessun cronometro.
  minutes: number | null;
  domande: string[];
  // Posizione della prima domanda nel test, per numerarle come sul fascicolo.
  prima: number;
};

/**
 * Le sezioni di un test, nell'ordine in cui vanno svolte.
 *
 * `timeLimitMinutes` è quello del test: vale per la sezione unica, mentre quando le
 * sezioni sono più d'una ciascuna prende il tempo della prova ufficiale della sua
 * materia, perché è quello il vincolo vero.
 */
export function sezioniDi(
  track: Track,
  questions: DomandaDiSezione[],
  timeLimitMinutes: number | null
): Sezione[] {
  const unica = (): Sezione[] => [
    {
      indice: 0,
      subject: questions[0]?.subject ?? "",
      minutes: timeLimitMinutes,
      domande: questions.map((q) => q.id),
      prima: 0,
    },
  ];

  if (questions.length === 0) return [];
  if (track.papers.length === 0) return unica();

  // Blocchi di domande consecutive della stessa materia.
  const blocchi: { subject: string; domande: string[]; prima: number }[] = [];
  questions.forEach((q, i) => {
    const ultimo = blocchi[blocchi.length - 1];
    if (ultimo && ultimo.subject === q.subject) ultimo.domande.push(q.id);
    else blocchi.push({ subject: q.subject, domande: [q.id], prima: i });
  });

  if (blocchi.length <= 1) return unica();

  return blocchi.map((b, indice) => ({
    indice,
    subject: b.subject,
    minutes: paperOf(track, b.subject)?.minutes ?? null,
    domande: b.domande,
    prima: b.prima,
  }));
}

/** La sezione aperta adesso, tenendo conto di indici fuori scala. */
export function sezioneAperta(sezioni: Sezione[], indice: number): Sezione | undefined {
  if (sezioni.length === 0) return undefined;
  return sezioni[Math.min(Math.max(indice, 0), sezioni.length - 1)];
}

/** Da quando corre il cronometro della sezione aperta. */
export function inizioSezione(attempt: {
  startedAt: Date;
  sezione: number;
  sezioneIniziataIl: Date | null;
}): Date {
  // La prima sezione comincia con il tentativo; le successive quando è stata
  // consegnata quella prima. Se il campo manca (tentativi aperti prima che le
  // sezioni esistessero) si ricade sull'inizio del tentativo.
  return attempt.sezione === 0 ? attempt.startedAt : (attempt.sezioneIniziataIl ?? attempt.startedAt);
}
