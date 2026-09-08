/**
 * Importa nel database corrente (Postgres) i file JSON prodotti da export-database.ts.
 *
 * Le tabelle vengono riempite nell'ordine delle dipendenze, così le chiavi esterne
 * sono sempre soddisfatte. È ripetibile: senza --force si rifiuta di partire se il
 * database contiene già dati, per non creare duplicati.
 *
 * Uso:
 *   npx tsx scripts/import-database.ts --in backup/2026-09-08
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/prisma";

const inArg = process.argv.indexOf("--in");
const IN = inArg !== -1 ? process.argv[inArg + 1] : null;
const FORCE = process.argv.includes("--force");
const CHUNK = 500;

// Nome del file JSON -> modello del client Prisma, nell'ordine delle dipendenze.
const TABLES: { file: string; model: string; date?: string[] }[] = [
  { file: "User", model: "user", date: ["createdAt"] },
  { file: "Test", model: "test", date: ["createdAt", "updatedAt"] },
  { file: "Question", model: "question" },
  { file: "AnswerOption", model: "answerOption" },
  { file: "TestAssignment", model: "testAssignment", date: ["assignedAt"] },
  { file: "Attempt", model: "attempt", date: ["startedAt", "submittedAt"] },
  { file: "AnswerRecord", model: "answerRecord" },
  { file: "AttemptSubjectStat", model: "attemptSubjectStat" },
];

async function main() {
  if (!IN) throw new Error("Indicare la cartella del backup con --in <cartella>");

  const utentiPresenti = await prisma.user.count();
  if (utentiPresenti > 0 && !FORCE) {
    throw new Error(
      `Il database di destinazione contiene già ${utentiPresenti} utenti. ` +
        "Svuotarlo prima, oppure rilanciare con --force se si è certi."
    );
  }

  for (const t of TABLES) {
    const file = join(IN, `${t.file}.json`);
    if (!existsSync(file)) {
      console.log(`  ${t.file}: nessun file, salto`);
      continue;
    }

    const rows = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>[];
    if (rows.length === 0) {
      console.log(`  ${t.file}: 0 righe`);
      continue;
    }

    // Le date sono state esportate come stringhe ISO e vanno ricostruite.
    for (const row of rows) {
      for (const f of t.date ?? []) {
        if (typeof row[f] === "string") row[f] = new Date(row[f] as string);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = (prisma as any)[t.model];
    let done = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      await model.createMany({ data: slice, skipDuplicates: true });
      done += slice.length;
    }
    console.log(`  ${t.file}: ${done} righe importate`);
  }

  console.log("\nImportazione completata. Verificare con scripts/verify-migration.ts");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
