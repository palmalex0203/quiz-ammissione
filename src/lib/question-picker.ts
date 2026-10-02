import { prisma } from "@/lib/prisma";
import { topicQuotas } from "@/lib/topics";
import { typeQuotas, type TrackId } from "@/lib/tracks";

/*
 * Pescare le domande di una prova dalla banca dati.
 *
 * Dove il programma ufficiale assegna un peso a ogni argomento (Semestre filtro) la
 * prova lo rispetta: tante domande di meccanica dei fluidi quante ne ha l'esame
 * vero, non quante ne escono a caso. Dove i pesi non ci sono (Professioni Sanitarie)
 * si pesca uniformemente dalla materia, come prima.
 *
 * Lo stesso vale per il tipo di domanda: se il percorso dice che una prova ha 15
 * domande a scelta multipla e 16 a completamento, il sorteggio rispetta anche quel
 * conto, non solo il totale. Le due quote vengono soddisfatte insieme, argomento per
 * argomento, scegliendo ogni volta il tipo che ha ancora più posti liberi.
 *
 * Tutto in una sola query: su un database remoto ogni andata e ritorno costa più
 * del lavoro che fa, e qui servono fino a cinque materie insieme.
 */

// Quante domande per argomento si portano a casa dalla query. Il massimo che una
// quota può chiedere è una ventina; il resto è scorta per i rattoppi, quando un
// argomento è troppo povero e le sue domande vanno prese altrove.
const CANDIDATE_PER_ARGOMENTO = 60;

type Riga = { id: string; subject: string; topic: string | null; type: string };

export type Blocco = { subject: string; count: number };

/**
 * Gli id delle domande di una prova, già nell'ordine dei blocchi richiesti.
 *
 * Se un argomento non ha abbastanza domande la prova non fallisce: si prende quello
 * che c'è e si completa con altre domande della stessa materia. Fallisce solo se la
 * materia nel suo complesso non ne ha abbastanza, perché a quel punto la prova
 * sarebbe più corta di quella vera e lo studente deve saperlo.
 */
export async function pickQuestionIds(
  trackId: TrackId,
  blocchi: Blocco[],
  etichettaPercorso: string
): Promise<string[]> {
  const materie = blocchi.map((b) => b.subject);

  const righe = await prisma.$queryRaw<Riga[]>`
    SELECT id, subject, topic, type FROM (
      SELECT q.id, q.subject, q.topic, q.type::text AS type,
        ROW_NUMBER() OVER (PARTITION BY q.subject, COALESCE(q.topic, '') ORDER BY RANDOM()) AS rn
      FROM "Question" q JOIN "Test" t ON q."testId" = t.id
      WHERE t.kind = 'POOL' AND t.track = ${trackId} AND q.subject = ANY(${materie})
    ) pescate
    WHERE rn <= ${CANDIDATE_PER_ARGOMENTO}
  `;

  const perMateria = new Map<string, Riga[]>();
  for (const r of righe) {
    const lista = perMateria.get(r.subject) ?? [];
    lista.push(r);
    perMateria.set(r.subject, lista);
  }

  const scelte: string[] = [];
  for (const blocco of blocchi) {
    const disponibili = perMateria.get(blocco.subject) ?? [];
    if (disponibili.length < blocco.count) {
      throw new Error(
        `La banca dati di ${etichettaPercorso} non ha ancora abbastanza domande di "${blocco.subject}": ` +
          `ne servono ${blocco.count}, ce ne sono ${disponibili.length}.`
      );
    }
    scelte.push(...scegliPerMateria(trackId, blocco, disponibili));
  }

  return scelte;
}

function scegliPerMateria(trackId: TrackId, blocco: Blocco, disponibili: Riga[]): string[] {
  const quote = topicQuotas(trackId, blocco.subject, blocco.count);
  // Quante ne servono per tipo. Il conto è di tutta la prova, non del singolo
  // argomento, e viene consumato man mano che si pesca.
  const restaPerTipo = new Map<string, number>(typeQuotas(trackId, blocco.count));

  // Nessun peso per questa materia: sorteggio uniforme, come si è sempre fatto.
  if (quote.size === 0) {
    return prendi(disponibili, blocco.count, restaPerTipo).map((r) => r.id);
  }

  const perArgomento = new Map<string, Riga[]>();
  for (const r of disponibili) {
    if (!r.topic) continue;
    const lista = perArgomento.get(r.topic) ?? [];
    lista.push(r);
    perArgomento.set(r.topic, lista);
  }

  const prese: Riga[] = [];
  for (const [topic, quanta] of quote) {
    prese.push(...prendi(perArgomento.get(topic) ?? [], quanta, restaPerTipo));
  }

  // Rattoppo: gli argomenti poveri lasciano dei buchi, che si riempiono con le
  // domande avanzate della stessa materia. Meglio una prova della lunghezza giusta
  // un po' sbilanciata che una prova corta.
  if (prese.length < blocco.count) {
    const gia = new Set(prese.map((r) => r.id));
    prese.push(
      ...prendi(
        disponibili.filter((r) => !gia.has(r.id)),
        blocco.count - prese.length,
        restaPerTipo
      )
    );
  }

  return prese.slice(0, blocco.count).map((r) => r.id);
}

/**
 * Prende `quante` domande da `candidati`, già in ordine casuale, cercando di
 * rispettare i posti ancora liberi per tipo (`resta`, che viene aggiornata).
 *
 * A ogni giro sceglie il tipo che ha più posti scoperti fra quelli presenti qui:
 * così la prova si riempie in modo uniforme invece di esaurire un tipo nei primi
 * argomenti. Se nessun tipo richiesto è disponibile prende la prima domanda che
 * c'è: meglio una prova completa che una corta.
 */
function prendi(candidati: Riga[], quante: number, resta: Map<string, number>): Riga[] {
  if (quante <= 0) return [];
  if (resta.size === 0) return candidati.slice(0, quante);

  const liberi = [...candidati];
  const scelte: Riga[] = [];

  while (scelte.length < quante && liberi.length > 0) {
    const presenti = new Set(liberi.map((r) => r.type));
    let migliore: string | null = null;
    for (const [tipo, posti] of resta) {
      if (posti <= 0 || !presenti.has(tipo)) continue;
      if (migliore === null || posti > (resta.get(migliore) ?? 0)) migliore = tipo;
    }

    const i = migliore === null ? 0 : liberi.findIndex((r) => r.type === migliore);
    const [presa] = liberi.splice(i, 1);
    scelte.push(presa);

    const posti = resta.get(presa.type);
    if (posti !== undefined) resta.set(presa.type, posti - 1);
  }

  return scelte;
}
