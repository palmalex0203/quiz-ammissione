/**
 * Copia di sicurezza completa del database Postgres in file JSON, una tabella per
 * file. Serve prima di qualsiasi operazione che cancella dati: i file finiscono in
 * backup/, che è escluso da git perché contiene dati personali degli studenti.
 *
 * Uso:
 *   npx tsx scripts/backup-postgres.ts [--out backup/2026-09-25]
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/prisma";

const outArg = process.argv.indexOf("--out");
const OUT =
  outArg !== -1 ? process.argv[outArg + 1] : `backup/${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`;

async function main() {
  mkdirSync(OUT, { recursive: true });

  const tabelle: [string, () => Promise<unknown[]>][] = [
    ["User", () => prisma.user.findMany()],
    ["Test", () => prisma.test.findMany()],
    ["Question", () => prisma.question.findMany()],
    ["AnswerOption", () => prisma.answerOption.findMany()],
    ["TestAssignment", () => prisma.testAssignment.findMany()],
    ["Attempt", () => prisma.attempt.findMany()],
    ["AttemptSubjectStat", () => prisma.attemptSubjectStat.findMany()],
    ["AnswerRecord", () => prisma.answerRecord.findMany()],
  ];

  const riepilogo: Record<string, number> = {};
  for (const [nome, leggi] of tabelle) {
    const righe = await leggi();
    writeFileSync(join(OUT, `${nome}.json`), JSON.stringify(righe, null, 2), "utf-8");
    riepilogo[nome] = righe.length;
    console.log(`${nome}: ${righe.length} righe`);
  }

  writeFileSync(
    join(OUT, "riepilogo.json"),
    JSON.stringify({ creato: new Date().toISOString(), righe: riepilogo }, null, 2),
    "utf-8"
  );
  console.log(`\nCopia completata in ${OUT}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
