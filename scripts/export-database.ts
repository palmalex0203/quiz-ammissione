/**
 * Esporta l'intero database Turso/SQLite in file JSON, per travasarlo su Postgres.
 *
 * Usa direttamente il client libsql e non il client Prisma dell'applicazione: dopo
 * il passaggio a Postgres quel client parla un altro dialetto e non potrebbe più
 * leggere l'origine.
 *
 * I valori vengono normalizzati qui (0/1 -> true/false, date -> ISO) così il file
 * JSON è già nel formato che si aspetta l'importazione, ed è anche leggibile.
 *
 * Uso:
 *   npx tsx scripts/export-database.ts --out backup/2026-09-08
 */
import { createClient } from "@libsql/client";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const outArg = process.argv.indexOf("--out");
const OUT = outArg !== -1 ? process.argv[outArg + 1] : `backup/${new Date().toISOString().slice(0, 10)}`;
const envArg = process.argv.indexOf("--env");
const ENV_FILE = envArg !== -1 ? process.argv[envArg + 1] : ".env.production.local";
const CHUNK = 2000;

// Colonne booleane e temporali di ogni tabella: SQLite le conserva come 0/1 e come
// numeri o stringhe, e senza questa mappa arriverebbero su Postgres del tipo sbagliato.
const TABLES: { name: string; bool?: string[]; date?: string[] }[] = [
  { name: "User", date: ["createdAt"] },
  { name: "Test", bool: ["isPublished", "shuffleQuestions", "isGenerated"], date: ["createdAt", "updatedAt"] },
  { name: "Question" },
  { name: "AnswerOption", bool: ["isCorrect"] },
  { name: "TestAssignment", date: ["assignedAt"] },
  { name: "Attempt", date: ["startedAt", "submittedAt"] },
  { name: "AnswerRecord", bool: ["isCorrect"] },
  { name: "AttemptSubjectStat" },
];

function readEnv(file: string): Record<string, string> {
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      })
  );
}

function toIso(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  // SQLite conserva le date come millisecondi o come testo, a seconda di come sono state scritte.
  const d = typeof v === "number" ? new Date(v) : new Date(String(v));
  if (Number.isNaN(d.getTime())) throw new Error(`Data non interpretabile: ${String(v)}`);
  return d.toISOString();
}

async function main() {
  const env = readEnv(ENV_FILE);
  const client = createClient({ url: env.DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });
  mkdirSync(OUT, { recursive: true });
  const riepilogo: Record<string, number> = {};

  for (const table of TABLES) {
    const rows: Record<string, unknown>[] = [];
    let offset = 0;

    for (;;) {
      const res = await client.execute({
        sql: `SELECT * FROM "${table.name}" ORDER BY id LIMIT ? OFFSET ?`,
        args: [CHUNK, offset],
      });
      if (res.rows.length === 0) break;

      for (const raw of res.rows) {
        const row: Record<string, unknown> = { ...(raw as unknown as Record<string, unknown>) };
        for (const f of table.bool ?? []) if (row[f] !== null && row[f] !== undefined) row[f] = Boolean(row[f]);
        for (const f of table.date ?? []) row[f] = toIso(row[f]);
        rows.push(row);
      }

      offset += res.rows.length;
      if (res.rows.length < CHUNK) break;
    }

    writeFileSync(join(OUT, `${table.name}.json`), JSON.stringify(rows), "utf8");
    riepilogo[table.name] = rows.length;
    console.log(`  ${table.name}: ${rows.length} righe`);
  }

  writeFileSync(join(OUT, "_riepilogo.json"), JSON.stringify(riepilogo, null, 1), "utf8");
  console.log(`\nEsportazione completata in ${OUT}`);
  console.log("Conservare questa cartella: è il backup completo prima della migrazione.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
