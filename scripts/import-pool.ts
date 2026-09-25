// Importa un set di domande come "banca dati" nascosta, usata esclusivamente dal generatore
// di simulazioni casuali (kind = "POOL", isPublished = false). Non è mai visibile né
// assegnabile come test: né nella lista test dell'insegnante, né nella dashboard studente.
//
// Formato JSON atteso: un array di domande
//   [{ subject, topic?, text, options: [{text, isCorrect}] }, ...]
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
import { DEFAULT_TRACK, isTrackId, TRACKS, TRACK_IDS } from "../src/lib/tracks";

type ImportedOption = { text: string; isCorrect: boolean };
type ImportedQuestion = { subject: string; topic?: string | null; text: string; options: ImportedOption[] };

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
    if (q.options.length < 2) throw new Error(`Domanda con meno di 2 opzioni: ${q.text.slice(0, 60)}`);
    const correctCount = q.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new Error(`Domanda con ${correctCount} risposte corrette (attesa 1): ${q.text.slice(0, 60)}`);
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
          type: "MULTIPLE_CHOICE",
          subject: q.subject,
          topic: q.topic ?? null,
          text: q.text,
          order: i + 1,
          options: {
            create: q.options.map((o, j) => ({ text: o.text, isCorrect: o.isCorrect, order: j + 1 })),
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
