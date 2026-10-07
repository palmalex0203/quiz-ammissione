// Importa un set di domande come "banca dati" nascosta, usata esclusivamente dal generatore
// di simulazioni casuali (kind = "POOL", isPublished = false). Non è mai visibile né
// assegnabile come test: né nella lista test dell'insegnante, né nella dashboard studente.
//
// Formato JSON atteso: un array di domande
//   [{ subject, topic?, text, options: [{text, isCorrect}] }, ...]
// Per una domanda a completamento (lo studente scrive la risposta invece di
// sceglierla) si aggiunge "type": "COMPLETAMENTO" e si elencano in "options" le
// risposte accettate, tutte con isCorrect: true — la prima è quella mostrata
// nella correzione:
//   { subject, topic?, type: "COMPLETAMENTO", text,
//     options: [{ text: "topoisomerasi", isCorrect: true }] }
// "topic" è il codice di argomento (B3, C7, M5, ...): se presente, la domanda compare
// subito anche nelle esercitazioni per argomento, senza passare da classify-topics.
//
// Il percorso (PROFESSIONI_SANITARIE, il predefinito, oppure SEMESTRE_FILTRO) decide
// in quale banca dati finiscono le domande: le due non si mescolano mai.
//
// Uso: npx tsx scripts/import-pool.ts <percorso-questions.json> "<Titolo interno>" [PERCORSO]
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
  // Assente = scelta multipla, che è quello che sono quasi tutte.
  type?: "MULTIPLE_CHOICE" | "COMPLETAMENTO";
  text: string;
  options: ImportedOption[];
};

// Sostituire una banca su cui qualcuno ha già risposto cancella le sue risposte:
// si fa solo dicendolo esplicitamente.
const FORZA = process.argv.includes("--forza");

function ordinaOpzioni(q: ImportedQuestion): ImportedOption[] {
  return q.type === "COMPLETAMENTO" ? q.options : randomShuffle(q.options);
}

async function main() {
  const [jsonPath, title, trackArg] = process.argv.slice(2);
  if (!jsonPath || !title) {
    console.error(
      'Uso: npx tsx scripts/import-pool.ts <percorso-questions.json> "<Titolo interno>" [' +
        TRACK_IDS.join(" | ") +
        "]"
    );
    process.exit(1);
  }
  if (trackArg && !isTrackId(trackArg)) {
    console.error(`Percorso sconosciuto "${trackArg}". Valori ammessi: ${TRACK_IDS.join(", ")}`);
    process.exit(1);
  }
  const track = isTrackId(trackArg) ? trackArg : DEFAULT_TRACK;
  const knownSubjects = new Set(TRACKS[track].subjects.map((s) => s.name));

  const questions: ImportedQuestion[] = JSON.parse(readFileSync(jsonPath, "utf-8"));

  for (const q of questions) {
    if (q.type === "COMPLETAMENTO") {
      // Qui le "opzioni" non sono alternative: sono le risposte ammesse, e valgono
      // tutte. Ne basta una, ma devono stare nelle caselle del modulo vero.
      const ammesse = q.options.filter((o) => o.isCorrect);
      if (ammesse.length === 0) {
        throw new Error(`Domanda a completamento senza risposte accettate: ${q.text.slice(0, 60)}`);
      }
      const troppoLunga = ammesse.find((o) => o.text.trim().length > COMPLETION_MAX_LENGTH);
      if (troppoLunga) {
        throw new Error(
          `Risposta accettata di ${troppoLunga.text.trim().length} caratteri (massimo ${COMPLETION_MAX_LENGTH}): "${troppoLunga.text}"`
        );
      }
    } else {
      if (q.options.length < 2) throw new Error(`Domanda con meno di 2 opzioni: ${q.text.slice(0, 60)}`);
      const correctCount = q.options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        throw new Error(`Domanda con ${correctCount} risposte corrette (attesa 1): ${q.text.slice(0, 60)}`);
      }
    }
    if (q.topic && !isKnownTopic(q.topic)) {
      throw new Error(`Argomento sconosciuto "${q.topic}": ${q.text.slice(0, 60)}`);
    }
    if (!knownSubjects.has(q.subject)) {
      throw new Error(
        `Materia "${q.subject}" non prevista dal percorso ${TRACKS[track].label}: ${q.text.slice(0, 60)}`
      );
    }
  }

  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  if (!teacher) throw new Error("Nessun account insegnante trovato nel database.");

  // Se esiste già una banca con lo stesso titolo, la sostituiamo interamente
  // (cascade elimina domande e opzioni collegate).
  const existing = await prisma.test.findFirst({ where: { title, kind: "POOL", track } });
  if (existing) {
    // Le domande della banca sono le stesse che i test generati richiamano: se le
    // si cancella, spariscono anche le risposte già date dagli studenti, e di un
    // tentativo consegnato resta il punteggio ma non la correzione. È successo il
    // 2026-10-07 a tre simulazioni del semestre filtro. Perciò qui si conta prima.
    const risposte = await prisma.answerRecord.count({
      where: { question: { testId: existing.id } },
    });
    if (risposte > 0 && !FORZA) {
      console.error(
        `La banca "${title}" ha ${risposte} risposte già date dagli studenti: sostituirla le cancella,\n` +
          "e i tentativi consegnati perderebbero la correzione domanda per domanda.\n" +
          "Per cambiare i testi senza perdere niente usa scripts/aggiorna-banca.ts, che riscrive le domande\n" +
          "esistenti al loro posto. Se vuoi davvero sostituire la banca, rilancia con --forza."
      );
      process.exit(1);
    }
    if (risposte > 0) {
      console.log(`Attenzione: sto cancellando anche ${risposte} risposte già date dagli studenti.`);
    }
    await prisma.test.delete({ where: { id: existing.id } });
    console.log(`Banca precedente "${title}" rimossa, la ricreo con i nuovi contenuti.`);
  }

  const test = await prisma.test.create({
    data: {
      title,
      description: "Banca dati interna per il generatore di simulazioni casuali. Non assegnabile.",
      createdById: teacher.id,
      isPublished: false,
      kind: "POOL",
      track,
      questions: {
        create: questions.map((q, i) => ({
          type: q.type ?? "MULTIPLE_CHOICE",
          subject: q.subject,
          topic: q.topic ?? null,
          text: q.text,
          order: i + 1,
          options: {
            // Le alternative si mescolano qui, una volta per sempre. Nei file la
            // risposta giusta è scritta per prima, perché così si rilegge: se
            // finisse nel database in quell'ordine sarebbe sempre la A, e la
            // prova si potrebbe superare senza leggere le domande. Le risposte
            // accettate di una domanda a completamento non si toccano: la prima
            // è quella che compare nella correzione.
            create: ordinaOpzioni(q).map((o, j) => ({
              text: o.text,
              isCorrect: o.isCorrect,
              order: j + 1,
            })),
          },
        })),
      },
    },
  });

  console.log(`Banca creata per ${TRACKS[track].label}: "${test.title}" (${questions.length} domande) — id ${test.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
