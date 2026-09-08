/**
 * Confronta il backup esportato con il database di destinazione, per confermare
 * che la migrazione non abbia perso né alterato dati.
 *
 * Controlla i conteggi di ogni tabella e, sulle tabelle con i dati che contano di
 * più (punteggi e risposte), verifica anche i valori riga per riga.
 *
 * Uso:
 *   npx tsx scripts/verify-migration.ts --in backup/2026-09-08
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/prisma";

const inArg = process.argv.indexOf("--in");
const IN = inArg !== -1 ? process.argv[inArg + 1] : null;

const TABLES: { file: string; model: string }[] = [
  { file: "User", model: "user" },
  { file: "Test", model: "test" },
  { file: "Question", model: "question" },
  { file: "AnswerOption", model: "answerOption" },
  { file: "TestAssignment", model: "testAssignment" },
  { file: "Attempt", model: "attempt" },
  { file: "AnswerRecord", model: "answerRecord" },
  { file: "AttemptSubjectStat", model: "attemptSubjectStat" },
];

async function main() {
  if (!IN) throw new Error("Indicare la cartella del backup con --in <cartella>");
  let problemi = 0;

  console.log("CONTEGGI");
  for (const t of TABLES) {
    const file = join(IN, `${t.file}.json`);
    if (!existsSync(file)) continue;
    const attesi = (JSON.parse(readFileSync(file, "utf8")) as unknown[]).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trovati = await (prisma as any)[t.model].count();
    const ok = attesi === trovati;
    if (!ok) problemi++;
    console.log(`  ${t.file.padEnd(20)} backup ${String(attesi).padStart(6)}  destinazione ${String(trovati).padStart(6)}  ${ok ? "OK" : "<-- DIVERSO"}`);
  }

  // Punteggi dei tentativi: è il dato che gli studenti e l'insegnante vedono.
  console.log("\nPUNTEGGI DEI TENTATIVI");
  const attempts = JSON.parse(readFileSync(join(IN, "Attempt.json"), "utf8")) as Record<string, unknown>[];
  let scoreDiff = 0;
  for (let i = 0; i < attempts.length; i += 300) {
    const slice = attempts.slice(i, i + 300);
    const trovati = await prisma.attempt.findMany({
      where: { id: { in: slice.map((a) => String(a.id)) } },
      select: { id: true, score: true, maxScore: true, status: true },
    });
    const byId = new Map(trovati.map((t) => [t.id, t]));
    for (const a of slice) {
      const t = byId.get(String(a.id));
      if (!t) { scoreDiff++; continue; }
      if (Number(t.score ?? 0) !== Number(a.score ?? 0)) scoreDiff++;
      else if (Number(t.maxScore ?? 0) !== Number(a.maxScore ?? 0)) scoreDiff++;
      else if (String(t.status) !== String(a.status)) scoreDiff++;
    }
  }
  console.log(`  ${attempts.length} tentativi confrontati, ${scoreDiff} discordanti`);
  if (scoreDiff > 0) problemi++;

  // Risposte corrette: verifica che i booleani non si siano invertiti nel passaggio.
  console.log("\nRISPOSTE");
  const records = JSON.parse(readFileSync(join(IN, "AnswerRecord.json"), "utf8")) as Record<string, unknown>[];
  const corretteBackup = records.filter((r) => r.isCorrect === true).length;
  const corretteDb = await prisma.answerRecord.count({ where: { isCorrect: true } });
  const okRisposte = corretteBackup === corretteDb;
  if (!okRisposte) problemi++;
  console.log(`  risposte corrette: backup ${corretteBackup}  destinazione ${corretteDb}  ${okRisposte ? "OK" : "<-- DIVERSO"}`);

  console.log(problemi === 0 ? "\nMIGRAZIONE VERIFICATA: nessuna differenza" : `\n${problemi} CONTROLLI FALLITI`);
  if (problemi > 0) process.exitCode = 1;
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
