// Importa un set di domande come "banca dati" nascosta, usata esclusivamente dal generatore
// di simulazioni casuali (kind = "POOL", isPublished = false). Non è mai visibile né
// assegnabile come test: né nella lista test dell'insegnante, né nella dashboard studente.
//
// Formato JSON atteso: un array di domande [{ subject, text, options: [{text, isCorrect}] }, ...]
//
// Uso: npx tsx scripts/import-pool.ts <percorso-questions.json> "<Titolo interno>"
import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";

type ImportedOption = { text: string; isCorrect: boolean };
type ImportedQuestion = { subject: string; text: string; options: ImportedOption[] };

async function main() {
  const [jsonPath, title] = process.argv.slice(2);
  if (!jsonPath || !title) {
    console.error('Uso: npx tsx scripts/import-pool.ts <percorso-questions.json> "<Titolo interno>"');
    process.exit(1);
  }

  const questions: ImportedQuestion[] = JSON.parse(readFileSync(jsonPath, "utf-8"));

  for (const q of questions) {
    if (q.options.length < 2) throw new Error(`Domanda con meno di 2 opzioni: ${q.text.slice(0, 60)}`);
    const correctCount = q.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new Error(`Domanda con ${correctCount} risposte corrette (attesa 1): ${q.text.slice(0, 60)}`);
    }
  }

  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  if (!teacher) throw new Error("Nessun account insegnante trovato nel database.");

  // Se esiste già una banca con lo stesso titolo, la sostituiamo interamente
  // (cascade elimina domande e opzioni collegate).
  const existing = await prisma.test.findFirst({ where: { title, kind: "POOL" } });
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
      questions: {
        create: questions.map((q, i) => ({
          type: "MULTIPLE_CHOICE",
          subject: q.subject,
          text: q.text,
          order: i + 1,
          options: {
            create: q.options.map((o, j) => ({ text: o.text, isCorrect: o.isCorrect, order: j + 1 })),
          },
        })),
      },
    },
  });

  console.log(`Banca creata: "${test.title}" (${questions.length} domande) — id ${test.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
