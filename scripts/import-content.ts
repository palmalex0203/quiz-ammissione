/**
 * Ricostruisce i contenuti della piattaforma nel database corrente, a partire dal
 * file prodotto da export-content.ts.
 *
 * Crea l'account insegnante se manca (da TEACHER_EMAIL / TEACHER_PASSWORD / TEACHER_NAME)
 * e ricrea test, domande e opzioni. Gli account studente NON vengono toccati:
 * si creano separatamente con scripts/create-students.ts.
 *
 * Salta i test già presenti con lo stesso titolo, così è ripetibile senza duplicare.
 *
 * Uso:
 *   npx tsx scripts/import-content.ts --in backup/contenuti.json
 *   ... --replace     sostituisce i test omonimi invece di saltarli
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const arg = (name: string, fallback: string | null = null) => {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : fallback;
};
const IN = arg("--in", "backup/contenuti.json")!;
const REPLACE = process.argv.includes("--replace");

type Opzione = { text: string; isCorrect: boolean; order: number };
type Domanda = {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  subject: string;
  topic: string | null;
  text: string;
  order: number;
  points: number;
  options: Opzione[];
};
type TestEsportato = {
  title: string;
  description: string | null;
  kind: string;
  folder: string | null;
  isPublished: boolean;
  shuffleQuestions: boolean;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  questions: Domanda[];
};

async function teacherId(): Promise<string> {
  const esistente = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  if (esistente) return esistente.id;

  const email = process.env.TEACHER_EMAIL;
  const password = process.env.TEACHER_PASSWORD;
  if (!email || !password) {
    throw new Error("Nessun insegnante nel database: impostare TEACHER_EMAIL e TEACHER_PASSWORD.");
  }
  const creato = await prisma.user.create({
    data: {
      name: process.env.TEACHER_NAME ?? "Insegnante",
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "TEACHER",
    },
  });
  console.log(`Account insegnante creato: ${email}`);
  return creato.id;
}

async function main() {
  const dati = JSON.parse(readFileSync(IN, "utf8")) as { tests: TestEsportato[] };
  const createdById = await teacherId();

  let creati = 0;
  let saltati = 0;
  let totDomande = 0;

  for (const t of dati.tests) {
    const esistente = await prisma.test.findFirst({ where: { title: t.title, kind: t.kind } });
    if (esistente) {
      if (!REPLACE) {
        saltati++;
        continue;
      }
      // La cancellazione a cascata rimuove domande e opzioni collegate.
      await prisma.test.delete({ where: { id: esistente.id } });
    }

    const test = await prisma.test.create({
      data: {
        title: t.title,
        description: t.description,
        kind: t.kind,
        folder: t.folder,
        isPublished: t.isPublished,
        shuffleQuestions: t.shuffleQuestions,
        timeLimitMinutes: t.timeLimitMinutes,
        maxAttempts: t.maxAttempts,
        createdById,
      },
    });

    // Inserimento in blocco: una create annidata per 60 domande e 300 opzioni
    // emetterebbe centinaia di INSERT separate.
    const idDomande = t.questions.map(() => crypto.randomUUID());
    await prisma.question.createMany({
      data: t.questions.map((q, i) => ({
        id: idDomande[i],
        testId: test.id,
        type: q.type,
        subject: q.subject,
        topic: q.topic,
        text: q.text,
        order: q.order,
        points: q.points,
      })),
    });
    await prisma.answerOption.createMany({
      data: t.questions.flatMap((q, i) =>
        q.options.map((o) => ({
          id: crypto.randomUUID(),
          questionId: idDomande[i],
          text: o.text,
          isCorrect: o.isCorrect,
          order: o.order,
        }))
      ),
    });

    creati++;
    totDomande += t.questions.length;
    console.log(`  ${String(t.questions.length).padStart(5)} domande  [${t.kind}] ${t.title}`);
  }

  console.log(`\nCreati ${creati} test (${totDomande} domande)${saltati ? `, ${saltati} già presenti e saltati` : ""}.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
