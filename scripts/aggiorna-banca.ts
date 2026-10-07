/**
 * Riscrive i testi di una banca dati esistente senza cancellarla.
 *
 * import-pool.ts sostituisce la banca: cancella il test POOL e, a cascata, le
 * domande, le opzioni, i riferimenti dei test generati e **le risposte già date
 * dagli studenti**. Va bene per una banca nuova, non per correggere una banca su
 * cui qualcuno ha già svolto un test: di un tentativo consegnato resterebbe il
 * punteggio ma non la correzione domanda per domanda.
 *
 * Qui invece ogni riga resta dov'è e cambia solo il contenuto: le domande si
 * appaiano per posizione (il campo `order`, cioè l'ordine nel file), e lo stesso
 * vale per le alternative. Gli id non cambiano, quindi i test generati continuano
 * a puntare alle stesse domande e le risposte registrate restano valide.
 *
 * Il file deve avere lo stesso numero di domande, nello stesso ordine, dello
 * stesso tipo: serve a correggere i testi, non a cambiare la composizione della
 * banca. Se la composizione cambia, la banca è un'altra cosa e si usa import-pool.
 *
 * Come l'importatore, mescola le alternative delle domande a scelta multipla.
 *
 * Uso:  npx tsx scripts/aggiorna-banca.ts <file.json> "<Titolo della banca>" [PERCORSO]
 *       ... --prova    mostra che cosa cambierebbe senza scrivere
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";
import { isKnownTopic } from "../src/lib/topics";
import { COMPLETION_MAX_LENGTH } from "../src/lib/completion";
import { DEFAULT_TRACK, isTrackId, TRACKS, TRACK_IDS } from "../src/lib/tracks";
import { randomShuffle } from "../src/lib/shuffle";

type ImportedOption = { text: string; isCorrect: boolean };
type ImportedQuestion = {
  subject: string;
  topic?: string | null;
  type?: "MULTIPLE_CHOICE" | "COMPLETAMENTO";
  text: string;
  options: ImportedOption[];
};

const PROVA = process.argv.includes("--prova");

async function main() {
  const [jsonPath, title, trackArg] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!jsonPath || !title) {
    console.error(
      'Uso: npx tsx scripts/aggiorna-banca.ts <file.json> "<Titolo della banca>" [' +
        TRACK_IDS.join(" | ") +
        "] [--prova]"
    );
    process.exit(1);
  }
  const track = isTrackId(trackArg) ? trackArg : DEFAULT_TRACK;
  const materie = new Set(TRACKS[track].subjects.map((s) => s.name));

  const nuove: ImportedQuestion[] = JSON.parse(readFileSync(jsonPath, "utf-8"));
  for (const q of nuove) {
    if (!materie.has(q.subject)) throw new Error(`Materia "${q.subject}" non prevista da ${TRACKS[track].label}.`);
    if (q.topic && !isKnownTopic(q.topic)) throw new Error(`Argomento sconosciuto "${q.topic}".`);
    const corrette = q.options.filter((o) => o.isCorrect);
    if (q.type === "COMPLETAMENTO") {
      if (corrette.length === 0) throw new Error(`Completamento senza risposte accettate: ${q.text.slice(0, 60)}`);
      const lunga = corrette.find((o) => o.text.trim().length > COMPLETION_MAX_LENGTH);
      if (lunga) throw new Error(`Risposta di ${lunga.text.trim().length} caratteri: "${lunga.text}"`);
    } else if (corrette.length !== 1) {
      throw new Error(`Domanda con ${corrette.length} risposte corrette: ${q.text.slice(0, 60)}`);
    }
  }

  const test = await prisma.test.findFirst({
    where: { title, kind: "POOL", track },
    select: {
      id: true,
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, type: true, text: true, options: { select: { id: true }, orderBy: { order: "asc" } } },
      },
    },
  });
  if (!test) throw new Error(`Nessuna banca "${title}" per ${TRACKS[track].label}.`);

  if (test.questions.length !== nuove.length) {
    throw new Error(
      `La banca ha ${test.questions.length} domande, il file ne ha ${nuove.length}: ` +
        "la composizione è cambiata, serve import-pool.ts."
    );
  }
  for (const [i, q] of nuove.entries()) {
    const tipo = q.type ?? "MULTIPLE_CHOICE";
    if (test.questions[i].type !== tipo) {
      throw new Error(`Domanda ${i + 1}: nel file è ${tipo}, nella banca è ${test.questions[i].type}.`);
    }
  }

  let cambiate = 0;
  let opzioniAggiunte = 0;
  let opzioniTolte = 0;

  for (const [i, q] of nuove.entries()) {
    const vecchia = test.questions[i];
    const tipo = q.type ?? "MULTIPLE_CHOICE";
    const opzioni = tipo === "COMPLETAMENTO" ? q.options : randomShuffle(q.options);
    if (vecchia.text === q.text && opzioni.length === vecchia.options.length) {
      // Il testo non cambia, ma le alternative potrebbero: si riscrivono comunque.
    }
    if (PROVA) {
      if (vecchia.text !== q.text) cambiate++;
      continue;
    }

    await prisma.$transaction([
      prisma.question.update({
        where: { id: vecchia.id },
        data: { text: q.text, subject: q.subject, topic: q.topic ?? null },
      }),
      // Le alternative si riscrivono al loro posto: cancellarle staccherebbe la
      // risposta dello studente dall'opzione che aveva scelto.
      ...opzioni.slice(0, vecchia.options.length).map((o, j) =>
        prisma.answerOption.update({
          where: { id: vecchia.options[j].id },
          data: { text: o.text, isCorrect: o.isCorrect, order: j + 1 },
        })
      ),
      ...opzioni.slice(vecchia.options.length).map((o, j) =>
        prisma.answerOption.create({
          data: {
            questionId: vecchia.id,
            text: o.text,
            isCorrect: o.isCorrect,
            order: vecchia.options.length + j + 1,
          },
        })
      ),
      ...(opzioni.length < vecchia.options.length
        ? [prisma.answerOption.deleteMany({ where: { id: { in: vecchia.options.slice(opzioni.length).map((o) => o.id) } } })]
        : []),
    ]);

    if (vecchia.text !== q.text) cambiate++;
    opzioniAggiunte += Math.max(0, opzioni.length - vecchia.options.length);
    opzioniTolte += Math.max(0, vecchia.options.length - opzioni.length);
  }

  const risposte = await prisma.answerRecord.count({ where: { question: { testId: test.id } } });
  console.log(
    `${PROVA ? "Prova a vuoto — " : ""}"${title}": ${nuove.length} domande, ${cambiate} con testo nuovo` +
      (opzioniAggiunte ? `, ${opzioniAggiunte} alternative aggiunte` : "") +
      (opzioniTolte ? `, ${opzioniTolte} alternative tolte` : "") +
      `. Risposte degli studenti conservate: ${risposte}.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
