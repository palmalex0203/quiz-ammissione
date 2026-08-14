// Importa un test da un file JSON nel database (locale o di produzione, a seconda
// delle variabili d'ambiente caricate quando si esegue lo script).
//
// Formato JSON atteso: un array di domande
// [{ subject: string, text: string, options: [{ text: string, isCorrect: boolean }] }, ...]
//
// Uso: npx tsx scripts/import-test.ts <percorso-questions.json> "<Titolo del test>" ["<descrizione>"] ["<kind>"] ["<folder>"]
// kind: SIMULAZIONE (default) o ESERCITAZIONE. folder: etichetta di raggruppamento (es. "Chimica").
import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";

type ImportedOption = { text: string; isCorrect: boolean };
type ImportedQuestion = {
  subject: string;
  text: string;
  type?: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  options: ImportedOption[];
};

async function main() {
  const [jsonPath, title, description, kind, folder] = process.argv.slice(2);
  if (!jsonPath || !title) {
    console.error('Uso: npx tsx scripts/import-test.ts <percorso-questions.json> "<Titolo del test>" ["<descrizione>"]');
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

  const test = await prisma.test.create({
    data: {
      title,
      description: description ?? null,
      createdById: teacher.id,
      isPublished: true,
      kind: kind ?? "SIMULAZIONE",
      folder: folder ?? null,
      questions: {
        create: questions.map((q, i) => ({
          type: q.type ?? "MULTIPLE_CHOICE",
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

  console.log(`Test creato: "${test.title}" (${questions.length} domande) — id ${test.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
